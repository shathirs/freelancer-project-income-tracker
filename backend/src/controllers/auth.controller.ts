import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import type { AuthRequest } from '../middleware/auth.middleware.js';
import { User } from '../models/user.model.js';
import { signToken } from '../utils/token.js';

function publicUser(user: {
  _id: { toString(): string };
  name: string;
  email: string;
  phone?: string;
  notifications?: {
    projectUpdates?: boolean;
    paymentReceived?: boolean;
    clientMessages?: boolean;
    marketing?: boolean;
  } | null;
  theme?: string;
  language?: string;
}) {
  const notifications = user.notifications ?? {};
  const theme = user.theme === 'dark' || user.theme === 'system' ? user.theme : 'light';

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone ?? '',
    notifications: {
      projectUpdates: notifications.projectUpdates ?? true,
      paymentReceived: notifications.paymentReceived ?? true,
      clientMessages: notifications.clientMessages ?? true,
      marketing: notifications.marketing ?? false,
    },
    theme,
    language: user.language || 'English',
  };
}

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
    user: publicUser(user),
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
    user: publicUser(user),
  });
}

export async function me(req: AuthRequest, res: Response): Promise<void> {
  const user = await User.findById(req.userId);

  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  res.json({ user: publicUser(user) });
}

export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  const { name, email, phone } = req.body as {
    name?: string;
    email?: string;
    phone?: string;
  };

  if (!name?.trim() || !email?.trim()) {
    res.status(400).json({ message: 'Name and email are required' });
    return;
  }

  const taken = await User.findOne({
    email: email.trim().toLowerCase(),
    _id: { $ne: req.userId },
  });
  if (taken) {
    res.status(409).json({ message: 'Email is already registered' });
    return;
  }

  const user = await User.findByIdAndUpdate(
    req.userId,
    { name: name.trim(), email: email.trim().toLowerCase(), phone: phone?.trim() ?? '' },
    { new: true, runValidators: true },
  );
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  res.json({ user: publicUser(user) });
}

export async function changePassword(req: AuthRequest, res: Response): Promise<void> {
  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    res.status(400).json({ message: 'Current password and new password are required' });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ message: 'Password must be at least 6 characters' });
    return;
  }

  const user = await User.findById(req.userId).select('+password');
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  const passwordMatches = await bcrypt.compare(currentPassword, user.password);
  if (!passwordMatches) {
    res.status(400).json({ message: 'Current password is incorrect' });
    return;
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.json({ message: 'Password updated' });
}

export async function updatePreferences(req: AuthRequest, res: Response): Promise<void> {
  const { notifications, theme, language } = req.body as {
    notifications?: {
      projectUpdates?: boolean;
      paymentReceived?: boolean;
      clientMessages?: boolean;
      marketing?: boolean;
    };
    theme?: string;
    language?: string;
  };

  if (
    !notifications ||
    typeof notifications.projectUpdates !== 'boolean' ||
    typeof notifications.paymentReceived !== 'boolean' ||
    typeof notifications.clientMessages !== 'boolean' ||
    typeof notifications.marketing !== 'boolean'
  ) {
    res.status(400).json({ message: 'Notification settings are required' });
    return;
  }

  if (theme !== 'light' && theme !== 'dark' && theme !== 'system') {
    res.status(400).json({ message: 'Theme must be light, dark, or system' });
    return;
  }

  if (!language?.trim()) {
    res.status(400).json({ message: 'Language is required' });
    return;
  }

  const user = await User.findByIdAndUpdate(
    req.userId,
    {
      notifications: {
        projectUpdates: notifications.projectUpdates,
        paymentReceived: notifications.paymentReceived,
        clientMessages: notifications.clientMessages,
        marketing: notifications.marketing,
      },
      theme,
      language: language.trim(),
    },
    { new: true, runValidators: true },
  );
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  res.json({ user: publicUser(user) });
}