import notifee, { AndroidImportance } from '@notifee/react-native';

export async function requestNotificationPermission() {
  await notifee.requestPermission();
}

export async function displayNotification(title, body) {
  const channelId = await notifee.createChannel({
    id: 'uvah-alerts',
    name: 'Uvah Alerts',
    importance: AndroidImportance.HIGH,
  });

  await notifee.displayNotification({
    title,
    body,
    android: {
      channelId,
      smallIcon: 'ic_launcher', // Optional, defaults to 'ic_launcher'
      pressAction: {
        id: 'default',
      },
    },
  });
}
