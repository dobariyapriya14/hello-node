import { Request, Response } from 'express';
import User from '../models/user';
import Otp from '../models/otp';
import RefreshToken from '../models/token';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

interface AuthRequest extends Request {
  user?: any;
}

// Signup controller
export const signup = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.json({ message: "Signup successful", userId: newUser._id });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Login controller
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }); 
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const accessToken = jwt.sign({ id: user._id }, "SECRET_KEY", {
      expiresIn: "15m",
    });

    const refreshToken = jwt.sign({ id: user._id }, "REFRESH_SECRET_KEY", {
      expiresIn: "7d",
    });

    await RefreshToken.create({ token: refreshToken });

    res.json({
      accessToken,
      refreshToken,
      user: { id: user._id, name: user.name, email: user.email },
    });

  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Get User Details
export const getUserDetails = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Refresh Token controller
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(401).json({ message: "Refresh token is required" });
    }

    const storedToken = await RefreshToken.findOne({ token });
    if (!storedToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    jwt.verify(token, "REFRESH_SECRET_KEY", (err: any, user: any) => {
      if (err) {
        return res.status(403).json({ message: "Invalid refresh token" });
      }

      const newAccessToken = jwt.sign({ id: user.id }, "SECRET_KEY", {
        expiresIn: "15m",
      });

      res.json({ accessToken: newAccessToken });
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Logout controller
export const logout = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    await RefreshToken.deleteOne({ token });

    res.json({ message: "Logout successful" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Send OTP controller
export const sendOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins

    // Upsert OTP in DB
    await Otp.findOneAndUpdate(
      { email },
      { otp, expiresAt },
      { upsert: true, new: true }
    );

    // Send email via Nodemailer using Ethereal account
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const info = await transporter.sendMail({
      from: '"Hello Node App" <no-reply@hellonode.com>',
      to: email,
      subject: "Your OTP for Authentication",
      text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
      html: `<b>Your OTP is ${otp}</b><br/>It is valid for 5 minutes.`,
    });

    console.log(`Sending OTP ${otp} to ${email}`);
    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

    res.json({ message: "OTP sent successfully! Check terminal for preview URL.", otp });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Verify OTP controller (Login with OTP)
export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const otpData = await Otp.findOne({ email });
    if (!otpData) {
      return res.status(400).json({ message: "No OTP requested for this email" });
    }

    if (Date.now() > otpData.expiresAt) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    if (otpData.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Clear OTP after successful verification
    await Otp.deleteOne({ email });

    // Check if user exists to perform Login with OTP
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found with this email" });
    }

    const accessToken = jwt.sign({ id: user._id }, "SECRET_KEY", {
      expiresIn: "15m",
    });

    const refreshToken = jwt.sign({ id: user._id }, "REFRESH_SECRET_KEY", {
      expiresIn: "7d",
    });

    await RefreshToken.create({ token: refreshToken });

    res.json({
      message: "Login successful with OTP",
      accessToken,
      refreshToken,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
