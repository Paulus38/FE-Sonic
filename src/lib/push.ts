import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { apiRequest } from './api';

/** Request notification permission + register FCM token with BE. Native only, no-op on web. */
export async function registerPushNotifications() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    let perm = await PushNotifications.checkPermissions();
    if (perm.receive === 'prompt') {
      perm = await PushNotifications.requestPermissions();
    }
    if (perm.receive !== 'granted') return;

    await PushNotifications.addListener('registration', (token) => {
      void apiRequest('/api/v1/users/me/push-token', {
        method: 'POST',
        body: JSON.stringify({ token: token.value }),
      }).catch(() => {
        // Non-fatal — user just won't receive push until next successful register.
      });
    });
    PushNotifications.addListener('registrationError', (err) => {
      console.warn('Push registration error', err);
    });

    await PushNotifications.register();
  } catch (err) {
    console.warn('Push notifications unavailable', err);
  }
}
