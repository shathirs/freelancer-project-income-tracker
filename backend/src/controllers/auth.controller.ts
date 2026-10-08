import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import type { AuthRequest } from '../middleware/auth.middleware.js';
import { User } from '../models/user.model.js';
import { signToken } from '../utils/token.js';

export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password } = req.body as {
    name?: string;
    email?: string;
    password?: string;
  };

  if (!name || !email || !password) {
    res.status(400).json({ message: 'Name, email, and password are required' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ message: 'Password must be at least 6 characters' });
    return;
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(409).json({ message: 'Email is already registered' });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashedPassword });
  const token = signToken(user._id.toString());

  res.status(201).json({
    token,
    user: { id: user._id, name: user.name, email: user.email },
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required' });
    return;
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    res.status(401).json({ message: 'Invalid email or password' });
    return;
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    res.status(401).json({ message: 'Invalid email or password' });
    return;
  }

  const token = signToken(user._id.toString());

  res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email },
  });
}

export async function me(req: AuthRequest, res: Response): Promise<void> {
  const user = await User.findById(req.userId);

  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  res.json({ user: { id: user._id, name: user.name, email: user.email } });
}