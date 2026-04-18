// Service Worker registration and communication utilities

let swRegistration = null;

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Workers not supported');
    return null;
  }

  try {
    swRegistration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('Service Worker registered');

    // Request notification permission if not decided
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    return swRegistration;
  } catch (err) {
    console.error('SW registration failed:', err);
    return null;
  }
}

export function sendTasksToSW(tasks) {
  if (!navigator.serviceWorker?.controller) return;

  // Only send tasks with reminders that are pending and in the future (or up to 5 min past)
  const now = Date.now();
  const reminders = tasks
    .filter(t => t.hasReminder && t.datetime && !t.completed && t.notification_type !== 'none')
    .filter(t => {
      const diff = (new Date(t.datetime).getTime() - now) / 60000;
      return diff > -5; // Keep if not too old
    })
    .map(t => ({
      id: t.id,
      title: t.title,
      datetime: t.datetime,
      notification_type: t.notification_type || 'both'
    }));

  navigator.serviceWorker.controller.postMessage({
    type: 'SCHEDULE_REMINDERS',
    payload: reminders
  });
}

export function clearReminderFromSW(taskId) {
  if (!navigator.serviceWorker?.controller) return;
  navigator.serviceWorker.controller.postMessage({
    type: 'CLEAR_REMINDER',
    payload: { id: taskId }
  });
}

export function clearAllRemindersFromSW() {
  if (!navigator.serviceWorker?.controller) return;
  navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_ALL' });
}

export function onSWMessage(callback) {
  if (!('serviceWorker' in navigator)) return () => {};

  const handler = (event) => {
    if (event.data) callback(event.data);
  };

  navigator.serviceWorker.addEventListener('message', handler);
  return () => navigator.serviceWorker.removeEventListener('message', handler);
}

export function getNotificationPermission() {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  return await Notification.requestPermission();
}
