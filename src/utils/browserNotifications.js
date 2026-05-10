/** Client-side Web Notifications (no service worker). Requires user permission. */

import { playNotificationSound } from './notificationSound.js';

const ICON = '/vite.svg';

export function notificationsSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission() {
  if (!notificationsSupported()) return 'denied';
  return Notification.permission;
}

/**
 * @returns {'granted' | 'denied' | 'default'}
 */
export async function requestNotificationPermission() {
  if (!notificationsSupported()) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

/**
 * Show a system notification if permission is granted.
 * Sound plays independently of Notification permission — use opts.sound === false to silence.
 * @param {string} title
 * @param {{ body?: string; tag?: string; sound?: 'new-order' | 'order-status' | boolean }} [opts]
 */
export function showNotification(title, opts = {}) {
  const { body, tag, sound = true } = opts;

  if (sound !== false) {
    const kind = sound === true ? 'order-status' : sound;
    void playNotificationSound(kind);
  }

  if (!notificationsSupported() || Notification.permission !== 'granted') return;
  try {
    new Notification(title, {
      body: body || undefined,
      tag: tag || 'genz-default',
      icon: ICON,
      lang: 'en',
    });
  } catch {
    // Safari / secure context quirks
  }
}
