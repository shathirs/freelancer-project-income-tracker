import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.middleware.js';
import { Notification } from '../models/notification.model.js';

export async function listNotifications(req: AuthRequest, res: Response): Promise<void> {
  const notifications = await Notification.find({ user: req.userId }).sort({ createdAt: -1 });
  res.json({ notifications });
}

export async function markNotificationRead(req: AuthRequest, res: Response): Promise<void> {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params['id'], user: req.userId },
    { read: true },
    { new: true },
  );

  if (!notification) {
    res.status(404).json({ message: 'Notification not found' });
    return;
  }

  res.json({ notification });
}

export async function markAllNotificationsRead(req: AuthRequest, res: Response): Promise<void> {
  await Notification.updateMany({ user: req.userId, read: false }, { read: true });
  res.json({ message: 'Notifications marked as read' });
}
