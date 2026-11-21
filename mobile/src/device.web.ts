import { ChurchEvent, church } from './content';

export const supportsReminders = false;

const iCalDate = (date: Date) => date.toISOString().replace(/[-:]|\.\d{3}/g, '');
const escape = (text: string) => text.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/[,;]/g, '\\$&');

export async function addToCalendar(event: ChurchEvent) {
  const calendar = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Nevesta Agntsa//Calendar//RU',
    'BEGIN:VEVENT', `UID:${event.id}@nevesta-agntsa`, `DTSTAMP:${iCalDate(new Date())}`,
    `DTSTART:${iCalDate(event.start)}`, `DTEND:${iCalDate(event.end)}`, `SUMMARY:${escape(event.title)}`,
    `LOCATION:${escape(event.kind === 'service' ? `${church.city}, ${church.address}` : event.location ?? '')}`,
    `DESCRIPTION:${escape(event.description ?? church.name)}`,
    'BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY', `DESCRIPTION:${escape(event.title)}`, 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR', '',
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([calendar], { type: 'text/calendar;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${event.day}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
  return 'Откройте скачанное событие в календаре';
}

export async function getReminders(): Promise<string[]> { return []; }
export async function setReminder(_event: ChurchEvent) { throw new Error('Добавьте событие в календарь телефона.'); }
export async function removeReminder(_id: string) { return; }
export function observeReminderTaps(_onTap: (id: string) => void) { return () => {}; }
