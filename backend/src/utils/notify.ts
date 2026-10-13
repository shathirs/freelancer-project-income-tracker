import { Notification } from '../models/notification.model.js';
import { User } from '../models/user.model.js';

type NotificationType = 'project' | 'payment' | 'client' | 'marketing';

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
): Promise<void> {
  const user = await User.findById(userId);
  if (!user) {
    return;
  }

  const preferences = user.notifications;
  const allowed =
    (type === 'project' && (preferences?.projectUpdates ?? true)) ||
    (type === 'payment' && (preferences?.paymentReceived ?? true)) ||
    (type === 'client' && (preferences?.clientMessages ?? true)) ||
    (type === 'marketing' && (preferences?.marketing ?? false));

  if (!allowed) {
    return;
  }

  await Notification.create({ user: userId, type, title, message, read: false });
}
