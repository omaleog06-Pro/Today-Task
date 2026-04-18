// Today Task - Service Worker for background push notifications

const CACHE_NAME = 'today-task-v1';

// Install
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Store scheduled reminders in memory (repopulated from main thread)
let scheduledReminders = [];
let checkInterval = null;

// Listen for messages from the main app
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  if (type === 'SCHEDULE_REMINDERS') {
    scheduledReminders = payload || [];
    startChecking();
  }

  if (type === 'CLEAR_REMINDER') {
    scheduledReminders = scheduledReminders.filter(r => r.id !== payload.id);
  }

  if (type === 'CLEAR_ALL') {
    scheduledReminders = [];
  }
});

function startChecking() {
  if (checkInterval) clearInterval(checkInterval);
  checkInterval = setInterval(checkReminders, 15000); // Check every 15s
  checkReminders(); // Immediate check
}

function checkReminders() {
  const now = Date.now();
  const toNotify = [];

  scheduledReminders = scheduledReminders.filter((reminder) => {
    const taskTime = new Date(reminder.datetime).getTime();
    const diff = (taskTime - now) / 60000; // minutes

    // Fire if within 1 min or up to 5 min past due
    if (diff <= 1 && diff > -5) {
      toNotify.push(reminder);
      return false; // Remove after notifying
    }

    // Remove if too old (>5 min past)
    if (diff <= -5) return false;

    return true; // Keep for future
  });

  toNotify.forEach((reminder) => {
    showNotification(reminder);
  });

  // Stop checking if no more reminders
  if (scheduledReminders.length === 0 && checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
}

function showNotification(reminder) {
  const notifType = reminder.notification_type || 'both';

  if (notifType === 'none') return;

  // Always show push notification for SW (alarm sound handled by main thread)
  if (notifType === 'notification' || notifType === 'both' || notifType === 'alarm') {
    self.registration.showNotification('Today Task', {
      body: reminder.title,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `task-${reminder.id}`,
      renotify: true,
      vibrate: [200, 100, 200],
      data: { taskId: reminder.id, url: '/' },
      actions: [
        { action: 'complete', title: 'Completar' },
        { action: 'dismiss', title: 'Cerrar' }
      ]
    }).catch(() => {});
  }

  // Notify all clients about the alarm so they can play sound
  self.clients.matchAll({ type: 'window' }).then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'REMINDER_FIRED',
        payload: { id: reminder.id, title: reminder.title, notification_type: notifType }
      });
    });
  });
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const taskId = event.notification.data?.taskId;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing window or open new one
      const client = clients.find(c => c.visibilityState === 'visible') || clients[0];

      if (client) {
        client.focus();
        if (action === 'complete' && taskId) {
          client.postMessage({ type: 'COMPLETE_TASK', payload: { id: taskId } });
        }
      } else {
        self.clients.openWindow('/');
      }
    })
  );
});

// Handle push events (for future server-side push)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Today Task', {
      body: data.body || 'Tienes un recordatorio',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [200, 100, 200],
      data: data.data || {}
    })
  );
});
