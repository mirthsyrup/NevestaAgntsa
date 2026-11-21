import content from './church-content.json';

export type Sermon = {
  id: string;
  title: string;
  date: string;
  speaker: string;
  description: string;
  videoUrl: string;
  audioUrl?: string;
};

export type ChurchEvent = {
  id: string;
  day: string;
  title: string;
  start: Date;
  end: Date;
  location?: string;
  description?: string;
  kind: 'service' | 'group' | 'study' | 'prayer' | 'event';
};

type DatedEvent = { id: string; title: string; startsAt: string; endsAt?: string; location?: string; description?: string };

export const church = content.church;
export const sermons: Sermon[] = content.sermons;
export const churchTimeZone = 'Europe/Moscow';
export const sundayTitle = 'Воскресное служение';
const hour = 3_600_000;
const datedEvents: readonly DatedEvent[] = content.events;
const dateKey = new Intl.DateTimeFormat('en-CA', {
  timeZone: churchTimeZone, year: 'numeric', month: '2-digit', day: '2-digit',
});

export function churchDay(date = new Date()) {
  const parts = dateKey.formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((entry) => entry.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function dateForDay(day: string) {
  return new Date(`${day}T12:00:00Z`);
}

export function shiftDay(day: string, offset: number) {
  const date = dateForDay(day);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

export function shiftMonth(day: string, offset: number) {
  const date = dateForDay(day);
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + offset);
  return date.toISOString().slice(0, 10);
}

export function monthCells(month: string) {
  const first = shiftMonth(month, 0);
  const offset = (dateForDay(first).getUTCDay() + 6) % 7;
  const count = dateForDay(shiftDay(shiftMonth(first, 1), -1)).getUTCDate();
  return Array.from({ length: Math.ceil((offset + count) / 7) * 7 }, (_, index) => shiftDay(first, index - offset));
}

export function dayLabel(day: string, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' }) {
  return dateForDay(day).toLocaleDateString('ru-RU', { ...options, timeZone: 'UTC' });
}

export function timeLabel(date: Date) {
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: churchTimeZone });
}

export function upperFirst(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function eventsOn(day: string): ChurchEvent[] {
  const date = dateForDay(day);
  const weekday = date.getUTCDay();
  const summer = [5, 6, 7].includes(date.getUTCMonth());
  const regular = content.schedule.filter((item) => item.weekday === weekday).map<ChurchEvent>((item) => {
    const time = summer && item.summerTime ? item.summerTime : item.time;
    const start = new Date(`${day}T${time}:00+03:00`);
    const kind = item.id === 'sunday' ? 'service' : weekday === 2 ? 'group' : weekday === 4 ? 'study' : 'prayer';
    return { id: `${day}-${item.id}`, day, title: item.title, start, end: new Date(start.getTime() + hour), location: item.location, kind };
  });
  const special = datedEvents.filter((item) => churchDay(new Date(item.startsAt)) === day).map<ChurchEvent>((item) => {
    const start = new Date(item.startsAt);
    const end = item.endsAt ? new Date(item.endsAt) : new Date(start.getTime() + hour);
    return { ...item, id: `${day}-${item.id}`, day, start, end, kind: 'event' };
  });
  return [...regular, ...special].sort((a, b) => a.start.getTime() - b.start.getTime());
}

export function upcomingEvents(now = new Date()) {
  const today = churchDay(now);
  return Array.from({ length: 14 }, (_, index) => shiftDay(today, index))
    .flatMap(eventsOn).filter((event) => event.start >= now);
}

export function eventById(id: string) {
  const day = id.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? eventsOn(day).find((event) => event.id === id) : undefined;
}
