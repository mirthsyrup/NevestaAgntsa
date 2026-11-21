import { ReactNode, useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChurchEvent, Sermon, church, dayLabel, timeLabel, upperFirst } from './content';
import { supportsReminders } from './device';
import { EventRow, InfoPage } from './screens';
import { ActionRow, Button, Empty, Icon, IconButton, Serif, color, images, style, surface } from './ui';

export function Sheet({ title, close, children, message }: { title: string; close: () => void; children: ReactNode; message?: string }) {
  return <Modal visible transparent animationType="fade" onRequestClose={close} statusBarTranslucent>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={sty.overlay}>
      <Pressable accessible={false} tabIndex={-1} style={StyleSheet.absoluteFill} onPress={close} />
      <SafeAreaView accessibilityViewIsModal edges={['bottom']} style={sty.sheet}>
        <View style={sty.grip} accessible={false} />
        <View style={sty.heading}>
          <Serif style={sty.title}>{title}</Serif>
          <IconButton label="Закрыть" icon="close" surface="plain" onPress={close} />
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={sty.scroll}>
          {children}
        </ScrollView>
        {!!message && <Text accessibilityLiveRegion="polite" style={sty.message}>{message}</Text>}
      </SafeAreaView>
    </KeyboardAvoidingView>
  </Modal>;
}

export function EventDetails({ event, now, reminded, changeReminder, calendar, openLink }: {
  event: ChurchEvent; now: Date; reminded: boolean; changeReminder: () => Promise<void>;
  calendar: () => Promise<void>; openLink: (url: string) => void;
}) {
  const [pending, setPending] = useState(false);
  const location = event.kind === 'service' ? church.address : event.location;

  async function run(action: () => Promise<void>) {
    if (pending) return;
    setPending(true);
    try { await action(); } finally { setPending(false); }
  }

  return <>
    <View style={sty.infoCard}>
      <View style={sty.inline}><Icon name="calendar" size={19} tint={color.gold} />
        <Text style={style.rowLabel}>{upperFirst(dayLabel(event.day, { weekday: 'long', day: 'numeric', month: 'long' }))}</Text>
      </View>
      <View style={sty.inline}><Icon name="clock" size={19} tint={color.gold} />
        <Text style={style.body}>{timeLabel(event.start)} · время Чебоксар</Text>
      </View>
      {!!location && <View style={sty.inline}><Icon name="pin" size={19} tint={color.gold} /><Text style={style.body}>{location}</Text></View>}
    </View>
    {!!event.description && <Text style={style.body}>{event.description}</Text>}
    {event.kind === 'service' && <Button label="Построить маршрут" variant="primary" icon="pin" onPress={() => openLink(church.mapUrl)} />}
    {event.kind === 'group' && <Button label="Уточнить место встречи" variant="secondary" icon="phone" onPress={() => openLink(`tel:${church.phone}`)} />}
    <Button label="Добавить в календарь телефона" variant="secondary" icon="calendar" disabled={pending} onPress={() => { void run(calendar); }} />
    {supportsReminders && (reminded || event.start > now) && <Button
      label={reminded ? 'Выключить напоминание' : 'Напомнить о событии'} icon={reminded ? 'check' : 'bell'} variant="secondary" disabled={pending}
      onPress={() => { void run(changeReminder); }} />}
  </>;
}

export function SermonDetails({ sermon, saved, favorite, note, saveNote, openLink, play, ready }: {
  sermon: Sermon; saved: boolean; favorite: () => void; note: string; saveNote: (note: string) => void;
  openLink: (url: string) => void; play: () => void; ready: boolean;
}) {
  const [draft, setDraft] = useState<string | undefined>(undefined);
  const value = draft ?? note;
  return <>
    <Text style={style.meta}>{dayLabel(sermon.date, { day: 'numeric', month: 'long', year: 'numeric' })}{sermon.speaker ? ` · ${sermon.speaker}` : ''}</Text>
    <Text style={style.body}>{sermon.description}</Text>
    {sermon.audioUrl && <Button label="Слушать аудио" icon="headphones" onPress={play} />}
    <Button label="Смотреть на Rutube" icon="play" variant={sermon.audioUrl ? 'secondary' : 'primary'} onPress={() => openLink(sermon.videoUrl)} />
    <Button label={saved ? 'Убрать из избранного' : 'В избранное'} icon={saved ? 'check' : 'bookmark'} variant="secondary" disabled={!ready} onPress={favorite} />
    <View style={sty.note}>
      <Text style={style.rowLabel}>Моя заметка</Text>
      <TextInput value={value} onChangeText={setDraft} style={sty.noteInput} multiline maxLength={4000}
        placeholder="Запишите, что хотите запомнить" placeholderTextColor={color.muted} accessibilityLabel="Моя заметка" />
      {value !== note && <Button label="Сохранить заметку" icon="check" disabled={!ready} variant="secondary" onPress={() => {
        saveNote(value.trim());
        setDraft(undefined);
      }} />}
    </View>
  </>;
}

export function Reminders({ events, selectEvent, openCalendar }: {
  events: ChurchEvent[]; selectEvent: (event: ChurchEvent) => void; openCalendar: () => void;
}) {
  return <>
    {events.length ? events.map((event) => <EventRow key={event.id} event={event} onSelect={selectEvent} />)
      : <Empty icon="bell" title="Напоминаний пока нет" text={supportsReminders
        ? 'Откройте событие и нажмите «Напомнить о событии».' : 'Добавьте событие в календарь телефона, чтобы получить напоминание.'} />}
    <Button label="Открыть календарь" icon="calendar" variant="secondary" onPress={openCalendar} />
  </>;
}

export const infoTitle: Record<InfoPage, string> = { about: 'О церкви', groups: 'Домашние группы', settings: 'Настройки' };

export function Info({ page, group, selectEvent, openLink, openSettings }: {
  page: InfoPage; group?: ChurchEvent; selectEvent: (event: ChurchEvent) => void;
  openLink: (url: string) => void; openSettings: () => void;
}) {
  if (page === 'about') return <>
    <Image source={images.community} style={sty.aboutImage} accessibilityLabel="Крест в церкви «Невеста Агнца»" />
    <Text style={style.body}>«Невеста Агнца» — христианская церковь в Чебоксарах. Мы делимся вестью об Иисусе Христе и поддерживаем людей, оказавшихся в трудной ситуации.</Text>
    <Button label="Сайт церкви" icon="globe" variant="secondary" onPress={() => openLink(church.site)} />
  </>;
  if (page === 'groups') return <>
    {group && <>
      <Text style={style.body}>Ближайшая встреча {dayLabel(group.day)} в {timeLabel(group.start)}. Место встречи уточняйте у церкви.</Text>
      <Button label="Открыть событие" icon="calendar" variant="secondary" onPress={() => selectEvent(group)} />
    </>}
    <Button label="Позвонить в церковь" icon="phone" onPress={() => openLink(`tel:${church.phone}`)} />
  </>;
  return <>
    <Text style={style.body}>Избранное и заметки хранятся на этом устройстве.</Text>
    {supportsReminders && <View style={sty.actionCard}>
      <ActionRow label="Уведомления телефона" icon="bell" onPress={openSettings} />
    </View>}
    <View style={sty.actionCard}><ActionRow label="Политика конфиденциальности церкви" icon="file" external onPress={() => openLink(church.privacy)} /></View>
  </>;
}

const sty = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', backgroundColor: '#221B2DB0' },
  sheet: { backgroundColor: color.paper, borderTopLeftRadius: 25, borderTopRightRadius: 25, width: '100%', maxWidth: 680, maxHeight: '88%', flexShrink: 1 },
  grip: { width: 35, height: 4, borderRadius: 4, backgroundColor: '#D4C9C7', marginTop: 9, alignSelf: 'center' },
  heading: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 7, paddingBottom: 5, gap: 8 },
  title: { flex: 1, fontSize: 25, lineHeight: 33 },
  scroll: { padding: 18, paddingTop: 9, paddingBottom: 26, gap: 12 },
  infoCard: { ...surface, padding: 14, gap: 12 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  note: { gap: 9, paddingTop: 6 },
  noteInput: { ...surface, minHeight: 95, padding: 12, fontSize: 16, color: color.ink, textAlignVertical: 'top' },
  aboutImage: { width: '100%', height: 190, borderRadius: 16 },
  actionCard: { ...surface, overflow: 'hidden' },
  message: { fontSize: 15, lineHeight: 21, color: color.white, backgroundColor: color.plum, padding: 12, textAlign: 'center' },
});
