import { Request, Response } from 'express';
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
}

import { users, refreshTokens, persist } from '../db';

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
