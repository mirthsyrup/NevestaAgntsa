import { readFile, readdir, writeFile } from 'node:fs/promises';
import { parse } from 'yaml';

const site = new URL('../../', import.meta.url);
const { contacts } = await import(new URL('src/data/contacts.ts', site));
const siteConfig = await readFile(new URL('astro.config.mjs', site), 'utf8');
const siteUrl = new URL(
  siteConfig.match(/\bbase:\s*['"]([^'"]+)['"]/)?.[1] ?? '/',
  siteConfig.match(/\bsite:\s*['"]([^'"]+)['"]/)?.[1],
);

async function collection(name) {
  const folder = new URL(`src/content/${name}/`, site);
  const names = (await readdir(folder)).filter((file) => file.endsWith('.md')).sort();
  return Promise.all(names.map(async (file) => {
    const markdown = await readFile(new URL(file, folder), 'utf8');
    const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (!match) throw new Error(`Invalid frontmatter in ${name}/${file}`);
    return { ...parse(match[1]), id: file.slice(0, -3), description: match[2].trim() };
  }));
}

const weekdays = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
const tidy = (text) => text.replace(/[()]/g, '').replace(/\s+/g, ' ').trim();
const schedule = contacts.schedule.flatMap((day) => {
  if (day.isSunday) {
    return [{ id: 'sunday', weekday: 0, title: 'Воскресное служение', time: '10:00', summerTime: '17:00', location: 'Главный зал' }];
  }
  return (day.events ?? [{ name: day.name, time: day.time }])
    .filter((event) => event.name && event.time)
    .map((event) => {
      const weekday = weekdays.indexOf(event.day ?? day.day);
      if (weekday < 0 || !/^([01]\d|2[0-3]):[0-5]\d$/.test(event.time)) throw new Error(`Invalid schedule for ${event.name}`);
      return { id: `${weekday}-${event.time.replace(':', '')}`, weekday, title: tidy(event.name), time: event.time };
    });
});

const audioFile = new URL('./audio-sources.json', import.meta.url);
const audioSources = JSON.parse(await readFile(audioFile, 'utf8'));
const sermons = (await collection('sermons')).map((sermon) => {
  const [day, month, year] = sermon.date.split('.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(`${year}-${month}-${day}`) || !/^[a-f0-9]{32}$/.test(sermon.embedId)) {
    throw new Error(`Invalid date or Rutube ID for ${sermon.id}`);
  }
  const audioUrl = audioSources[sermon.embedId];
  if (audioUrl && (new URL(audioUrl).protocol !== 'https:' || new URL(audioUrl).username || new URL(audioUrl).password)) {
    throw new Error(`An HTTPS audio URL is required for ${sermon.id}`);
  }
  return {
    id: sermon.embedId, title: sermon.title, date: `${year}-${month}-${day}`, speaker: sermon.speaker,
    description: sermon.description, videoUrl: `https://rutube.ru/video/${sermon.embedId}/`, ...(audioUrl ? { audioUrl } : {}),
  };
}).sort((first, second) => second.date.localeCompare(first.date));

const events = (await collection('events')).filter((entry) => entry.startsAt).map((entry) => {
  if (typeof entry.startsAt !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d)?(?:Z|[+-]\d\d:\d\d)$/.test(entry.startsAt) || !Number.isFinite(Date.parse(entry.startsAt))) {
    throw new Error(`A date with year and time zone is required for ${entry.id}`);
  }
  if (entry.endsAt && !(Date.parse(entry.endsAt) > Date.parse(entry.startsAt))) throw new Error(`Invalid end time for ${entry.id}`);
  return { id: entry.id, title: entry.title, location: entry.location, description: entry.description, startsAt: entry.startsAt, endsAt: entry.endsAt };
});

await writeFile(new URL('../src/church-content.json', import.meta.url), JSON.stringify({
  church: {
    name: 'Невеста Агнца', city: 'Чебоксары', address: contacts.address,
    phone: contacts.phone, phoneFormatted: contacts.phoneFormatted, email: contacts.email, mapUrl: contacts.mapUrl,
    socials: contacts.socials.map(({ name, url }) => ({ name, url })),
    site: siteUrl.href, donate: new URL('donate/', siteUrl).href,
    privacy: new URL('privacy_policy.pdf', siteUrl).href, offer: new URL('public_offer.pdf', siteUrl).href,
  },
  schedule, sermons, events,
}, null, 2) + '\n');
