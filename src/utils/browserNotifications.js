/** Client-side Web Notifications (no service worker). Requires user permission. */

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
 * @param {string} title
 * @param {{ body?: string; tag?: string }} [opts]
 */
export function showNotification(title, opts = {}) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return;
  const { body, tag } = opts;
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
