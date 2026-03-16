import { Request, Response } from 'express';
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
}

import { users, refreshTokens, otps, persist } from '../db';

interface AuthRequest extends Request {
  user?: any;
}

// Signup controller
export const signup = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    const existing = users.find((u: User) => u.email === email);
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    users.push({
      id: Date.now(),
      name,
      email,
      password: hashedPassword,
    });
    persist();

    res.json({ message: "Signup successful" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Login controller
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = users.find((u: User) => u.email === email);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const accessToken = jwt.sign({ id: user.id }, "SECRET_KEY", {
      expiresIn: "15m",
    });

    const refreshToken = jwt.sign({ id: user.id }, "REFRESH_SECRET_KEY", {
      expiresIn: "7d",
    });

    refreshTokens.push(refreshToken);
    persist();

    res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email },
    });

  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Get User Details
export const getUserDetails = async (req: AuthRequest, res: Response) => {
  try {
    const user = users.find((u: User) => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Refresh Token controller
export const refreshToken = (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    return res.status(401).json({ message: "Refresh token is required" });
  }

  if (!refreshTokens.includes(token)) {
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
};

// Logout controller
export const logout = (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: "Refresh token is required" });
  }

  const index = refreshTokens.indexOf(token);
  if (index !== -1) {
    refreshTokens.splice(index, 1); // remove the token
    persist();
  }

  res.json({ message: "Logout successful" });
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

    // Save/Update OTP
    const existingOtpIndex = otps.findIndex((o: any) => o.email === email);
    if (existingOtpIndex !== -1) {
      otps[existingOtpIndex] = { email, otp, expiresAt };
    } else {
      otps.push({ email, otp, expiresAt });
    }
    persist();

    // Send email via Nodemailer using Ethereal account
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });

    const info = await transporter.sendMail({
      from: '"Hello Node App" <no-reply@hellonode.com>', // sender address
      to: email, // list of receivers
      subject: "Your OTP for Authentication", // Subject line
      text: `Your OTP is \${otp}. It is valid for 5 minutes.`, // plain text body
      html: `<b>Your OTP is \${otp}</b><br/>It is valid for 5 minutes.`, // html body
    });

    console.log(`Sending OTP \${otp} to \${email}`);
    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

    res.json({ message: "OTP sent successfully! Check terminal for preview URL.", otp });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Verify OTP controller
export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const otpData = otps.find((o: any) => o.email === email);
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
    const index = otps.indexOf(otpData);
    otps.splice(index, 1);
    persist();

    res.json({ message: "OTP verified successfully!!" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
