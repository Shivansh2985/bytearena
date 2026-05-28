import webpush from 'web-push';
import { prisma } from '@bytearena/database';
import { getRedisClient } from '../lib/redis';

// Configure web-push conditionally
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:admin@bytearena.dev',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
} else {
  console.warn('⚠️ VAPID keys not configured. Web push notifications will be disabled.');
}

export async function sendNotification(userId: string, title: string, message: string) {
  try {
    // 1. Save to DB
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
      }
    });

    const redisClient = getRedisClient();
    // 2. Publish to Redis for realtime Socket.IO delivery
    await redisClient.publish('user:notifications', JSON.stringify({
      userId,
      notification
    }));

    // 3. Send Web Push to all user's subscriptions
    if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
      const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId }
      });

      const payload = JSON.stringify({
        title,
        body: message,
        icon: '/icon-192x192.png' // Ensure you have this icon in public/
      });

      const pushPromises = subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification({
            endpoint: sub.endpoint,
            keys: {
              auth: sub.auth,
              p256dh: sub.p256dh
            }
          }, payload);
        } catch (error: any) {
          // If subscription is invalid/expired (410), delete it
          if (error.statusCode === 410 || error.statusCode === 404) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } });
          } else {
            console.error('Web push error:', error);
          }
        }
      });

      await Promise.all(pushPromises);
    }
    
    return notification;
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}
