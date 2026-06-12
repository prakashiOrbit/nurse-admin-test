import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { navigate } from '../navigation/navigationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createNurseNoteAPI } from '../services/authService';
import i18n from '../i18n';

export const requestUserPermission = async () => {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Authorization status:', authStatus);
  }

  await notifee.createChannel({
    id: 'nurse_default',
    name: 'NurseApp',
    importance: AndroidImportance.HIGH,
  });
};

export const getFCMToken = async () => {
  const token = await messaging().getToken();
  console.log('FCM Token:', token);
  return token;
};

let notificationSetupPromise: Promise<void> | null = null;

export const setupNotifications = async () => {
  if (!notificationSetupPromise) {
    notificationSetupPromise = (async () => {
      await requestUserPermission();
      await getFCMToken();
      await notificationListener();
      await notifee.requestPermission();
    })()
    .catch(err => {
      // Reset on failure so retry is possible
      notificationSetupPromise = null;
      throw err;
    });
  }

  return notificationSetupPromise;
};

const displayNotification = async (
  remoteMessage: FirebaseMessagingTypes.RemoteMessage,
) => {
  const { data } = remoteMessage;
  // console.log('Displaying notification with data:', data);
  const rawTitle = data?.title;
  const rawBody = data?.body;
  const title = typeof rawTitle === 'string' ? rawTitle.trim() : undefined;

  const body = typeof rawBody === 'string' ? rawBody.trim() : undefined;

  // Skip blank notifications
  if (!title && !body) {
    console.log('Skipping blank notification');
    return;
  }

  await notifee.displayNotification({
    title: title || i18n.t('notifications.title'),
    body: body || '',
    data: data || {},

    android: {
      channelId: 'nurse_default',
      pressAction: {
        id: 'default',
      },
      color: '#4CAE51',
      smallIcon: 'ic_stat_notification', // optional, use your app icon
      // largeIcon: 'ic_launcher',
      actions: [
        {
          title: i18n.t('notifications.view_details'),
          pressAction: { id: 'view_details', launchActivity: 'default' },
        },
        { title: i18n.t('notifications.mark_as_read'), pressAction: { id: 'mark_as_read' } },
        {
          title: i18n.t('notifications.send_instructions'),
          pressAction: { id: 'send_instructions', launchActivity: 'default' },
        },
      ],
    },
  });
};

export const notificationListener = async () => {
  messaging().onMessage(async remoteMessage => {
    console.log('FCM Message in foreground:', remoteMessage);
    await displayNotification(remoteMessage);
  });

  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Message handled in the background!', remoteMessage);
    await displayNotification(remoteMessage);
  });

  notifee.onForegroundEvent(async ({ type, detail }) => {
    if (type !== EventType.PRESS && type !== EventType.ACTION_PRESS) return;

    const actionId = detail.pressAction?.id ?? 'default';
    console.log('Notification data onForegroundEvent:', detail);

    // We don't have Notification Id and Time in Notification. uncomment if backend provides those.
    // await handleNotificationAcknowledge(notificationData, actionId);

    if (actionId === 'mark_as_read') {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;

      await createNurseNoteAPI({
        objectId: userId,
        objectType: 'NURSE',
        noteType: 'push notification action button',
        note: `action: mark as read`,
      });
    }

    if (actionId === 'view_details' || actionId === 'default') {
      navigate('Dashboard');
    }

    if (actionId === 'send_instructions') {
      navigate('Dashboard');
    }
  });

  const initialNotification = await notifee.getInitialNotification();
  if (initialNotification?.pressAction?.id) {
    const actionId = initialNotification.pressAction.id;

    // We don't have Notification Id and Time in Notification. uncomment if backend provides those.
    //await handleNotificationAcknowledge(data, actionId);
    if (actionId === 'view_details') {
      navigate('Dashboard');
    } else if (actionId === 'send_instructions') {
      navigate('Dashboard');
    }
  }
};

notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type !== EventType.PRESS && type !== EventType.ACTION_PRESS) return;

  const actionId = detail.pressAction?.id ?? 'default';

  // We don't have Notification Id and Time in Notification. uncomment if backend provides those.
  // if (data?.id) {
  //   await acknowledgeNotification(data.id.toString());
  // }

  if (actionId === 'mark_as_read') {
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) return;

    await createNurseNoteAPI({
      objectId: userId,
      objectType: 'NURSE',
      noteType: 'push notification action button',
      note: `action: mark as read`,
    });
  }
});
