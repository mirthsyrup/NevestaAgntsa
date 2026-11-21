import { useState } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChurchEvent, Sermon, church, dayLabel, eventsOn, monthCells, sermons, shiftMonth, timeLabel, upperFirst, upcomingEvents } from './content';
import { ActionRow, Button, Empty, Icon, IconButton, IconName, LiturgicalMark, Serif, TextButton, color, images, style, surface } from './ui';

type SelectEvent = (event: ChurchEvent) => void;
type SelectSermon = (sermon: Sermon) => void;
type OpenLink = (url: string) => void;
export type InfoPage = 'about' | 'groups' | 'settings';

const eventIcons: Record<ChurchEvent['kind'], IconName> = {
  service: 'cross', group: 'people', study: 'book', prayer: 'heart', event: 'calendar',
};

export function Home({ now, selectEvent, selectSermon, openCalendar, openSermons }: {
  now: Date; selectEvent: SelectEvent; selectSermon: SelectSermon; openCalendar: () => void; openSermons: () => void;
}) {
  const upcoming = upcomingEvents(now);
  const sunday = upcoming.find((event) => event.kind === 'service');
  const upcomingCards = upcoming.filter((event) => event.id !== sunday?.id).slice(0, 4);
  return <View style={sty.page}>
    {sunday && <ImageBackground source={images.hero} style={sty.hero} imageStyle={sty.heroImage}>
      <LinearGradient colors={['#221C30F5', '#221C30C4', '#221C3038']} start={{ x: 0, y: 0.82 }} end={{ x: 1, y: 0.18 }} style={sty.heroContent}>
        <Text style={sty.heroDate}>{upperFirst(dayLabel(sunday.day))}  ·  {timeLabel(sunday.start)}</Text>
        <Serif style={sty.heroTitle}>Воскресное{'\n'}служение</Serif>
        <View style={sty.heroButton}><Button label="Как прийти" variant="cream" icon="pin" onPress={() => selectEvent(sunday)} /></View>
      </LinearGradient>
    </ImageBackground>}

    <View style={sty.section}>
      <View style={sty.sectionHeading}><Serif style={sty.sectionTitle}>Ближайшие события</Serif><TextButton label="Календарь" onPress={openCalendar} /></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sty.eventStrip}>
        {upcomingCards.map((event) => <Pressable key={event.id} accessibilityRole="button"
          accessibilityLabel={`${event.title}, ${dayLabel(event.day)}, ${timeLabel(event.start)}`} onPress={() => selectEvent(event)}
          style={({ pressed }) => [sty.eventCard, pressed && style.pressed]}>
          <View style={sty.eventCardHeader}>
            <View style={sty.eventSymbol}><Icon name={eventIcons[event.kind]} size={18} tint={color.gold} /></View>
            <Text style={sty.eventDate}>{dayLabel(event.day, { day: 'numeric', month: 'short' })} · {timeLabel(event.start)}</Text>
          </View>
          <Text style={style.rowLabel}>{event.title}</Text>
        </Pressable>)}
      </ScrollView>
    </View>

    <View style={sty.section}>
      <View style={sty.sectionHeading}><Serif style={sty.sectionTitle}>Проповеди</Serif><TextButton label="Все записи" onPress={openSermons} /></View>
      <View style={style.stack}>
        {sermons.slice(0, 2).map((sermon) => <SermonRow key={sermon.id} sermon={sermon} onSelect={selectSermon} />)}
      </View>
    </View>
  </View>;
}

function SermonRow({ sermon, onSelect, saved, onSave }: {
  sermon: Sermon; onSelect: SelectSermon; saved?: boolean; onSave?: (id: string) => void;
}) {
  return <View style={sty.sermonRow}>
    <Pressable accessibilityRole="button" accessibilityLabel={sermon.title} onPress={() => onSelect(sermon)}
      style={({ pressed }) => [sty.sermonLead, pressed && style.pressed]}>
      <ImageBackground source={sermon.id === sermons[0]?.id ? images.hero : images.community} style={sty.sermonImage} imageStyle={sty.sermonImageInner}>
        <View style={sty.playCircle}><Icon name={sermon.audioUrl ? 'headphones' : 'play'} size={16} tint={color.white} filled={!sermon.audioUrl} /></View>
      </ImageBackground>
      <View style={sty.sermonCopy}>
        <Text style={style.rowLabel}>{sermon.title}</Text>
        {!!sermon.speaker && <Text style={style.meta}>{sermon.speaker}</Text>}
        <Text style={sty.dateSmall}>{dayLabel(sermon.date, { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
      </View>
    </Pressable>
    {onSave && <IconButton label={saved ? `Убрать из избранного: ${sermon.title}` : `В избранное: ${sermon.title}`}
      icon="bookmark" surface="plain" active={saved} onPress={() => onSave(sermon.id)} />}
  </View>;
}

export function SermonList({ favorites, toggleFavorite, selectSermon, openLink }: {
  favorites: readonly string[]; toggleFavorite: (id: string) => void; selectSermon: SelectSermon; openLink: OpenLink;
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'saved' | 'audio'>('all');
  const search = query.trim().toLocaleLowerCase('ru-RU');
  const shown = sermons.filter((sermon) => {
    if (filter === 'saved' && !favorites.includes(sermon.id)) return false;
    if (filter === 'audio' && !sermon.audioUrl) return false;
    return `${sermon.title} ${sermon.speaker}`.toLocaleLowerCase('ru-RU').includes(search);
  });
  const rutube = church.socials.find((item) => item.name === 'Rutube');
  const filters = [{ id: 'all', label: 'Все записи' }, { id: 'saved', label: 'Избранное' }, { id: 'audio', label: 'Аудио' }] as const;

  return <View style={sty.page}>
    <Serif style={sty.title}>Проповеди</Serif>
    <View style={sty.search}>
      <Icon name="search" size={20} tint={color.muted} />
      <TextInput value={query} onChangeText={setQuery} placeholder="Название или спикер" placeholderTextColor={color.muted}
        accessibilityLabel="Поиск проповедей" autoCorrect={false} returnKeyType="search" style={sty.searchInput} />
      {!!query && <IconButton surface="plain" icon="close" label="Очистить поиск" onPress={() => setQuery('')} />}
    </View>
    <View accessibilityRole="tablist" style={sty.filters}>
      {filters.map(({ id, label }) => <Pressable key={id} accessibilityRole="tab" accessibilityState={{ selected: filter === id }}
        onPress={() => setFilter(id)} style={[sty.filter, filter === id && sty.filterActive]}>
        <Text style={[sty.filterText, filter === id && sty.filterTextActive]}>{label}</Text>
      </Pressable>)}
    </View>
    <View style={sty.section}>
      {shown.map((sermon) => <SermonRow key={sermon.id} sermon={sermon} onSelect={selectSermon}
        saved={favorites.includes(sermon.id)} onSave={toggleFavorite} />)}
      {!shown.length && (search ? <Empty icon="search" title="Ничего не найдено" text="Попробуйте другое название или имя." />
        : filter === 'saved' ? <Empty icon="bookmark" title="Здесь будет избранное" text="Нажмите на закладку рядом с проповедью." />
          : filter === 'audio' ? <Empty icon="headphones" title="Аудиозаписей пока нет" text="Видео проповедей доступны на Rutube." />
            : <Empty icon="mic" title="Записей пока нет" />)}
    </View>
    {rutube && <Button label="Канал на Rutube" variant="secondary" icon="play" onPress={() => openLink(rutube.url)} />}
  </View>;
}

export function EventRow({ event, onSelect }: { event: ChurchEvent; onSelect: SelectEvent }) {
  return <View style={sty.eventRow}>
    <ActionRow label={event.title} description={`${timeLabel(event.start)}${event.location ? ` · ${event.location}` : ''}`}
      icon={eventIcons[event.kind]} onPress={() => onSelect(event)} />
  </View>;
}

export function CalendarScreen({ selected, setSelected, today, selectEvent }: {
  selected: string; setSelected: (day: string) => void; today: string; selectEvent: SelectEvent;
}) {
  const days = monthCells(selected);
  const selectedEvents = eventsOn(selected);
  const rows = Array.from({ length: days.length / 7 }, (_, row) => days.slice(row * 7, row * 7 + 7));
  return <View style={sty.page}>
    <View style={sty.sectionHeading}><Serif style={sty.title}>Календарь</Serif><TextButton label="Сегодня" onPress={() => setSelected(today)} /></View>
    <View style={sty.calendar}>
      <View style={sty.calendarHeading}>
        <IconButton icon="left" label="Предыдущий месяц" onPress={() => setSelected(shiftMonth(selected, -1))} surface="plain" />
        <Serif style={sty.month}>{upperFirst(dayLabel(selected, { month: 'long', year: 'numeric' }))}</Serif>
        <IconButton icon="right" label="Следующий месяц" onPress={() => setSelected(shiftMonth(selected, 1))} surface="plain" />
      </View>
      <View style={sty.week}>
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((label) => <Text key={label} style={sty.weekday}>{label}</Text>)}
      </View>
      {rows.map((week) => <View key={week[0]} style={sty.week}>
        {week.map((day) => {
          const active = selected === day;
          const inMonth = selected.slice(0, 7) === day.slice(0, 7);
          const hasEvents = eventsOn(day).length > 0;
          return <Pressable key={day} accessibilityRole="button" accessibilityState={{ selected: active }}
            accessibilityLabel={`${dayLabel(day, { day: 'numeric', month: 'long', year: 'numeric' })}${hasEvents ? ', есть события' : ''}`}
            style={sty.dayCell} onPress={() => setSelected(day)}>
            <View style={[sty.dayNumber, active && sty.dayActive, day === today && !active && sty.dayToday]}>
              <Text style={[sty.dayLabel, !inMonth && sty.dayOutside, active && sty.dayTextActive]}>{Number(day.slice(-2))}</Text>
              <View style={[sty.dayDot, { backgroundColor: hasEvents ? (active ? color.cream : color.gold) : 'transparent' }]} />
            </View>
          </Pressable>;
        })}
      </View>)}
    </View>
    <View style={sty.section}>
      <Serif style={sty.sectionTitle}>{upperFirst(dayLabel(selected, { weekday: 'long', day: 'numeric', month: 'long' }))}</Serif>
      {selectedEvents.length ? selectedEvents.map((event) => <EventRow key={event.id} event={event} onSelect={selectEvent} />)
        : <Empty icon="calendar" title="Событий на этот день нет" />}
    </View>
  </View>;
}

export function Donations({ openLink }: { openLink: OpenLink }) {
  return <View style={sty.page}>
    <Serif style={sty.title}>Пожертвования</Serif>
    <View style={sty.donationCard}>
      <LiturgicalMark size={48} tint="#E4C898" />
      <Serif style={sty.donationTitle}>Поддержать церковь</Serif>
      <Text style={sty.donationText}>Пожертвования помогают церкви проводить служения и поддерживать людей, которым нужна помощь.</Text>
      <Button label="Перейти на сайт церкви" icon="heart" variant="cream" onPress={() => openLink(church.donate)} />
    </View>
    <View style={sty.eventRow}><ActionRow label="Публичная оферта" icon="file" external onPress={() => openLink(church.offer)} /></View>
  </View>;
}

export function More({ openLink, openInfo }: { openLink: OpenLink; openInfo: (page: InfoPage) => void }) {
  return <View style={sty.page}>
    <Serif style={sty.title}>Ещё</Serif>
    <View style={sty.contactCard}>
      <Serif style={sty.sectionTitle}>Контакты</Serif>
      <Text style={style.body}>{church.city}, {church.address}</Text>
      <Button label="Построить маршрут" icon="pin" variant="secondary" onPress={() => openLink(church.mapUrl)} />
    </View>
    <View style={sty.actionGroup}>
      <ActionRow label="Позвонить" description={church.phoneFormatted} icon="phone" onPress={() => openLink(`tel:${church.phone}`)} />
      <ActionRow label="Написать на почту" description={church.email} icon="mail" onPress={() => openLink(`mailto:${church.email}`)} />
      {church.socials.filter((item) => item.name !== 'Rutube').map((item) =>
        <ActionRow key={item.name} label={item.name} icon="send" external onPress={() => openLink(item.url)} />)}
    </View>
    <View style={sty.actionGroup}>
      <ActionRow label="О церкви" icon="cross" onPress={() => openInfo('about')} />
      <ActionRow label="Домашние группы" icon="people" onPress={() => openInfo('groups')} />
      <ActionRow label="Настройки" icon="bell" onPress={() => openInfo('settings')} />
      <ActionRow label="Сайт церкви" icon="globe" external onPress={() => openLink(church.site)} />
    </View>
  </View>;
}

const sty = StyleSheet.create({
  page: { gap: 20 },
  section: { gap: 10 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  sectionTitle: { fontSize: 22, lineHeight: 31, flexShrink: 1 },
  title: { fontSize: 34, lineHeight: 44, flexShrink: 1 },
  hero: { minHeight: 230, borderRadius: 22, overflow: 'hidden', backgroundColor: color.twilight },
  heroImage: { borderRadius: 22 },
  heroContent: { flex: 1, padding: 20, minHeight: 242, justifyContent: 'center', alignItems: 'flex-start' },
  heroDate: { fontSize: 15, lineHeight: 21, color: '#FFF5DF', fontWeight: '600' },
  heroTitle: { color: color.cream, fontSize: 35, lineHeight: 43, marginTop: 9 },
  heroButton: { marginTop: 16 },
  eventStrip: { gap: 10, paddingRight: 1 },
  eventCard: { ...surface, width: 193, minHeight: 110, padding: 12, gap: 9 },
  eventCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  eventSymbol: { width: 32, height: 32, borderRadius: 10, backgroundColor: color.goldLight, alignItems: 'center', justifyContent: 'center' },
  eventDate: { fontSize: 14, lineHeight: 19, color: color.gold, fontWeight: '600', flexShrink: 1 },
  sermonRow: { ...surface, flexDirection: 'row', alignItems: 'center', paddingRight: 5 },
  sermonLead: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 13, padding: 10, minHeight: 82 },
  sermonImage: { width: 65, height: 64, borderRadius: 11, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: color.twilight },
  sermonImageInner: { borderRadius: 11, opacity: 0.7 },
  playCircle: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#282236D6' },
  sermonCopy: { gap: 3, flex: 1 },
  dateSmall: { color: color.muted, fontSize: 13, lineHeight: 18 },
  search: { ...surface, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingHorizontal: 13 },
  searchInput: { flex: 1, minHeight: 48, color: color.ink, fontSize: 16 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filter: { ...surface, borderRadius: 50, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  filterActive: { backgroundColor: color.plum, borderColor: color.plum },
  filterText: { fontSize: 14, fontWeight: '600', color: color.ink },
  filterTextActive: { color: color.white },
  calendar: { ...surface, paddingHorizontal: 5, paddingTop: 6, paddingBottom: 8, gap: 2 },
  calendarHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
  month: { fontSize: 19, lineHeight: 26, flex: 1, textAlign: 'center' },
  week: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center', paddingVertical: 8, fontSize: 14, color: color.muted, fontWeight: '600' },
  dayCell: { width: '14.285714%', minHeight: 45, alignItems: 'center', justifyContent: 'center' },
  dayNumber: { width: 39, minHeight: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 11, gap: 2 },
  dayActive: { backgroundColor: color.plum },
  dayToday: { borderWidth: 1, borderColor: color.gold },
  dayLabel: { fontSize: 16, color: color.ink, fontVariant: ['tabular-nums'] },
  dayTextActive: { color: color.white, fontWeight: '700' },
  dayOutside: { color: '#78707C' },
  dayDot: { width: 4, height: 4, borderRadius: 3 },
  eventRow: { ...surface },
  donationCard: { backgroundColor: color.plum, padding: 22, borderRadius: 20, gap: 15, alignItems: 'flex-start' },
  donationTitle: { color: color.cream },
  donationText: { color: '#F6EBEF', fontSize: 16, lineHeight: 24, marginBottom: 4 },
  contactCard: { ...surface, padding: 16, gap: 10 },
  actionGroup: { ...surface, overflow: 'hidden', gap: 1, backgroundColor: color.line },
});
