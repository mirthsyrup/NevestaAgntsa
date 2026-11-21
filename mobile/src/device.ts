import { createEventInCalendarAsync } from 'expo-calendar/legacy';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ChurchEvent, church, churchTimeZone, timeLabel } from './content';

const channel = 'church-events';
const reminderPrefix = 'church-event:';
export const supportsReminders = true;

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

export async function addToCalendar(event: ChurchEvent) {
  const result = await createEventInCalendarAsync({
    title: event.title,
    startDate: event.start,
    endDate: event.end,
    timeZone: churchTimeZone,
    location: event.kind === 'service' ? `${church.city}, ${church.address}` : event.location,
    notes: event.description ?? church.name,
  });
  return result.action === 'done' ? 'Событие добавлено в календарь' : undefined;
}

export async function getReminders() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.filter((item) => item.identifier.startsWith(reminderPrefix)).map((item) => item.identifier.slice(reminderPrefix.length));
}

export async function setReminder(event: ChurchEvent) {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(channel, { name: 'События церкви', importance: Notifications.AndroidImportance.DEFAULT });
  }
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted && !(await Notifications.requestPermissionsAsync()).granted) {
    throw new Error('Разрешите уведомления для приложения в настройках телефона.');
  }
  const now = Date.now();
  if (event.start.getTime() <= now + 5_000) throw new Error('Это событие уже начинается или прошло.');
  const date = new Date(Math.max(now + 5_000, event.start.getTime() - 3_600_000));
  await Notifications.scheduleNotificationAsync({
    identifier: reminderPrefix + event.id,
    content: { title: event.title, body: `Начало в ${timeLabel(event.start)}`, data: { eventId: event.id }, sound: true },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: channel },
  });
}

export async function removeReminder(id: string) {
  await Notifications.cancelScheduledNotificationAsync(reminderPrefix + id);
}

export function observeReminderTaps(onTap: (id: string) => void) {
  const handle = (response: Notifications.NotificationResponse | null) => {
    const id = response?.notification.request.content.data?.eventId;
    if (typeof id !== 'string') return;
    onTap(id);
    Notifications.clearLastNotificationResponse();
  };
  handle(Notifications.getLastNotificationResponse());
  const subscription = Notifications.addNotificationResponseReceivedListener(handle);
  return () => subscription.remove();
}
