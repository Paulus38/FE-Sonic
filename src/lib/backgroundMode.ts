import { Capacitor, registerPlugin } from '@capacitor/core';
import { BackgroundMode } from '@anuradev/capacitor-background-mode';

interface RecordingNotificationPlugin {
  render(options: { title: string; text: string; paused: boolean }): Promise<void>;
}

const RecordingNotification = registerPlugin<RecordingNotificationPlugin>(
  'RecordingNotification',
);

/** Keep the app (mic + socket) alive while the user switches to another app. Native only, no-op on web. */
export async function enableBackgroundRecording() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const notif = await BackgroundMode.checkNotificationsPermission();
    if (notif.notifications !== 'granted') {
      await BackgroundMode.requestNotificationsPermission();
    }
    // Without this, aggressive OEM battery managers (ColorOS/Realme UI in
    // particular) can freeze the WebView's JS after the app has sat idle in
    // the background for a while — e.g. while paused — so a later tap on
    // the notification's Tiếp tục/Kết thúc action never reaches the page.
    try {
      const battery = await BackgroundMode.checkBatteryOptimizations();
      if (battery.enabled) {
        await BackgroundMode.requestDisableBatteryOptimizations();
      }
    } catch (err) {
      console.warn('Battery optimization check/request failed', err);
    }
    // Starts the foreground service + notification channel. Content is
    // immediately overridden by RecordingNotificationPlugin below, which
    // renders our own two-action (Tạm dừng/Kết thúc) notification — the
    // plugin's own single-action support isn't enough for that.
    await BackgroundMode.enable({
      title: 'Sonic Scribe',
      text: 'Đang ghi âm…',
      resume: true,
      hidden: false,
      silent: false,
      showWhen: false,
      icon: 'ic_stat_mic',
    });
    await renderRecordingNotification('Đang ghi âm…', false);
  } catch (err) {
    console.warn('Background mode unavailable', err);
  }
}

/** Redraw the "đang ghi âm" notification (elapsed time + pause/stop actions). No-op on web. */
export async function renderRecordingNotification(text: string, paused: boolean) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await RecordingNotification.render({ title: 'Sonic Scribe', text, paused });
  } catch (err) {
    console.warn('Failed to render recording notification', err);
  }
}

export async function disableBackgroundRecording() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await BackgroundMode.disable();
  } catch (err) {
    console.warn('Failed to disable background mode', err);
  }
}
