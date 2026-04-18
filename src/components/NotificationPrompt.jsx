import { useState, useEffect } from 'react';
import {
  notificationsSupported,
  getNotificationPermission,
  requestNotificationPermission,
} from '../utils/browserNotifications.js';

/**
 * Lets the user enable Web Notifications. Renders nothing if unsupported.
 */
export default function NotificationPrompt({ description }) {
  const [perm, setPerm] = useState(() =>
    notificationsSupported() ? getNotificationPermission() : 'denied'
  );

  useEffect(() => {
    if (!notificationsSupported()) return;
    setPerm(getNotificationPermission());
  }, []);

  if (!notificationsSupported()) return null;

  if (perm === 'granted') {
    return (
      <p className="text-xs font-medium text-emerald-700">
        Browser notifications are enabled for this site.
      </p>
    );
  }

  if (perm === 'denied') {
    return (
      <p className="text-xs text-slate-500">
        Notifications are blocked for this site. To get alerts, allow notifications in your browser settings for this page.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-delivery-200/90 bg-delivery-50/90 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-700">{description}</p>
      <button
        type="button"
        onClick={async () => {
          const next = await requestNotificationPermission();
          setPerm(next);
        }}
        className="btn-primary shrink-0 rounded-lg px-4 py-2 text-sm"
      >
        Enable notifications
      </button>
    </div>
  );
}
