import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Lora_500Medium } from '@expo-google-fonts/lora/500Medium';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView, initialWindowMetrics } from 'react-native-safe-area-context';
import { MiniPlayer, useSermonAudio } from './src/audio';
import { ChurchEvent, Sermon, church, churchDay, eventById, upcomingEvents } from './src/content';
import { EventDetails, Info, Reminders, SermonDetails, Sheet, infoTitle } from './src/details';
import { addToCalendar, getReminders, observeReminderTaps, removeReminder, setReminder } from './src/device';
import { CalendarScreen, Donations, Home, InfoPage, More, SermonList } from './src/screens';
import { CrossMark, Icon, IconButton, IconName, color, style } from './src/ui';

type Tab = 'home' | 'sermons' | 'calendar' | 'donations' | 'more';
type Panel = { kind: 'event'; event: ChurchEvent } | { kind: 'sermon'; sermon: Sermon }
  | { kind: 'reminders' } | { kind: 'info'; page: InfoPage };
type SavedData = { favorites: string[]; notes: Record<string, string> };

const tabs: { id: Tab; label: string; accessibilityLabel?: string; icon: IconName }[] = [
  { id: 'home', label: 'Главная', icon: 'home' },
  { id: 'sermons', label: 'Проповеди', icon: 'mic' },
  { id: 'calendar', label: 'Календарь', icon: 'calendar' },
  { id: 'donations', label: 'Поддержать', accessibilityLabel: 'Пожертвования', icon: 'heart' },
  { id: 'more', label: 'Ещё', icon: 'more' },
];
const storageKey = 'nevesta-agntsa:personal:v1';
const emptyData: SavedData = { favorites: [], notes: {} };

export default function App() {
  const [fontsLoaded, fontError] = useFonts({ Lora: Lora_500Medium });
  return <SafeAreaProvider initialMetrics={initialWindowMetrics} style={sty.frame}>
    <StatusBar style="dark" />
    {(fontsLoaded || fontError) && <ChurchApp />}
  </SafeAreaProvider>;
}

function ChurchApp() {
  const [tab, setTab] = useState<Tab>('home');
  const [now, setNow] = useState(() => new Date());
  const [selected, setSelected] = useState(churchDay);
  const [panel, setPanel] = useState<Panel>();
  const [personal, setPersonal] = useState(emptyData);
  const [ready, setReady] = useState(false);
  const [reminderIds, setReminderIds] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string }>();
  const persisted = useRef(emptyData);
  const writes = useRef(Promise.resolve());
  const announce = useCallback((message: string) => setToast({ message }), []);
  const audio = useSermonAudio(announce);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(storageKey).then((stored) => {
      if (!mounted || !stored) return;
      const value = JSON.parse(stored) as Partial<SavedData>;
      const data = {
        favorites: Array.isArray(value.favorites) ? value.favorites.filter((id) => typeof id === 'string') : [],
        notes: Object.fromEntries(Object.entries(value.notes ?? {}).filter(([, note]) => typeof note === 'string')),
      };
      persisted.current = data;
      setPersonal(data);
    }).catch(() => { if (mounted) announce('Не удалось открыть сохранённые заметки и избранное.'); })
      .finally(() => { if (mounted) setReady(true); });
    return () => { mounted = false; };
  }, [announce]);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(undefined), 4300);
    return () => clearTimeout(timeout);
  }, [toast]);

  const refreshReminders = useCallback(async () => {
    try { setReminderIds(await getReminders()); }
    catch { announce('Не удалось загрузить напоминания.'); }
  }, [announce]);

  useEffect(() => {
    void refreshReminders();
    const state = AppState.addEventListener('change', (next) => {
      if (next !== 'active') return;
      setNow(new Date());
      void refreshReminders();
    });
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => { state.remove(); clearInterval(interval); };
  }, [refreshReminders]);

  useEffect(() => observeReminderTaps((id) => {
    const event = eventById(id);
    if (!event) return;
    setSelected(event.day);
    setTab('calendar');
    setPanel({ kind: 'event', event });
  }), []);

  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (tab === 'home') return false;
      setTab('home');
      return true;
    });
    return () => handler.remove();
  }, [tab]);

  function updatePersonal(update: (before: SavedData) => SavedData, message?: string) {
    if (!ready) return;
    const data = update(persisted.current);
    persisted.current = data;
    setPersonal(data);
    writes.current = writes.current.then(async () => {
      try {
        await AsyncStorage.setItem(storageKey, JSON.stringify(data));
        if (message) announce(message);
      } catch { announce('Не удалось сохранить данные на этом устройстве.'); }
    });
  }

  function toggleFavorite(id: string) {
    updatePersonal((before) => ({ ...before, favorites: before.favorites.includes(id)
      ? before.favorites.filter((entry) => entry !== id) : [...before.favorites, id] }));
  }

  function saveNote(id: string, note: string) {
    updatePersonal((before) => {
      const notes = { ...before.notes };
      if (note) notes[id] = note;
      else delete notes[id];
      return { ...before, notes };
    }, note ? 'Заметка сохранена' : 'Заметка удалена');
  }

  function openLink(url: string) {
    void Linking.openURL(url).catch(() => announce('Не удалось открыть ссылку.'));
  }

  function showPanel(next: Panel) { setToast(undefined); setPanel(next); }
  function selectEvent(event: ChurchEvent) { showPanel({ kind: 'event', event }); }
  function selectSermon(sermon: Sermon) { showPanel({ kind: 'sermon', sermon }); }
  function close() { setPanel(undefined); setToast(undefined); }
  function openCalendar() { close(); setSelected(churchDay()); setTab('calendar'); }

  async function exportEvent(event: ChurchEvent) {
    try {
      const message = await addToCalendar(event);
      if (message) announce(message);
    } catch { announce('Не удалось открыть календарь телефона.'); }
  }

  async function changeReminder(event: ChurchEvent) {
    try {
      const remove = reminderIds.includes(event.id);
      if (remove) await removeReminder(event.id);
      else await setReminder(event);
      await refreshReminders();
      announce(remove ? 'Напоминание выключено' : 'Напоминание включено');
    } catch (error) { announce(error instanceof Error ? error.message : 'Не удалось изменить напоминание.'); }
  }

  const upcomingReminders = reminderIds.map(eventById).filter((event): event is ChurchEvent => !!event && event.start > now)
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  return <SafeAreaView style={sty.shell} edges={['top', 'bottom', 'left', 'right']}>
    <View style={sty.header}>
      <CrossMark />
      <View style={sty.brand}>
        <Text style={sty.brandName}>{church.name}</Text>
        <Text style={sty.brandCity}>{church.city}</Text>
      </View>
      <IconButton icon="bell" label="Напоминания" badge={upcomingReminders.length > 0} onPress={() => showPanel({ kind: 'reminders' })} />
    </View>

    <ScrollView key={tab} style={sty.main} showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled" contentContainerStyle={sty.content}>
      {tab === 'home' && <Home now={now} selectEvent={selectEvent} selectSermon={selectSermon}
        openCalendar={openCalendar} openSermons={() => setTab('sermons')} />}
      {tab === 'sermons' && <SermonList favorites={personal.favorites} toggleFavorite={toggleFavorite} selectSermon={selectSermon} openLink={openLink} />}
      {tab === 'calendar' && <CalendarScreen selected={selected} setSelected={setSelected} today={churchDay(now)} selectEvent={selectEvent} />}
      {tab === 'donations' && <Donations openLink={openLink} />}
      {tab === 'more' && <More openLink={openLink} openInfo={(page) => showPanel({ kind: 'info', page })} />}
    </ScrollView>

    {toast && !panel && <Text accessibilityLiveRegion="polite" style={sty.toast}>{toast.message}</Text>}
    <MiniPlayer audio={audio} open={selectSermon} />
    <View accessibilityRole="tablist" style={sty.nav}>
      {tabs.map(({ id, label, accessibilityLabel, icon }) => {
        const active = tab === id;
        return <Pressable key={id} accessibilityLabel={accessibilityLabel ?? label} accessibilityRole="tab" accessibilityState={{ selected: active }}
          onPress={() => setTab(id)} style={({ pressed }) => [sty.navTab, pressed && style.pressed]}>
          <View style={[sty.navIcon, active && sty.navIconActive]}><Icon name={icon} size={21} tint={active ? color.gold : color.muted} /></View>
          <Text style={[sty.navText, active && sty.navTextActive]} numberOfLines={1} maxFontSizeMultiplier={1.2}>{label}</Text>
        </Pressable>;
      })}
    </View>

    {panel?.kind === 'event' && <Sheet title={panel.event.title} close={close} message={toast?.message}>
      <EventDetails key={panel.event.id} event={panel.event} now={now} reminded={reminderIds.includes(panel.event.id)}
        changeReminder={() => changeReminder(panel.event)} calendar={() => exportEvent(panel.event)} openLink={openLink} />
    </Sheet>}
    {panel?.kind === 'sermon' && <Sheet title={panel.sermon.title} close={close} message={toast?.message}>
      <SermonDetails key={panel.sermon.id} sermon={panel.sermon} note={personal.notes[panel.sermon.id] ?? ''}
        saved={personal.favorites.includes(panel.sermon.id)} favorite={() => toggleFavorite(panel.sermon.id)}
        saveNote={(note) => saveNote(panel.sermon.id, note)} ready={ready} openLink={openLink}
        play={() => { void audio.play(panel.sermon); close(); }} />
    </Sheet>}
    {panel?.kind === 'reminders' && <Sheet title="Напоминания" close={close} message={toast?.message}>
      <Reminders events={upcomingReminders} selectEvent={selectEvent} openCalendar={openCalendar} />
    </Sheet>}
    {panel?.kind === 'info' && <Sheet title={infoTitle[panel.page]} close={close} message={toast?.message}>
      <Info page={panel.page} group={upcomingEvents(now).find((event) => event.kind === 'group')} selectEvent={selectEvent}
        openLink={openLink} openSettings={() => { void Linking.openSettings().catch(() => announce('Не удалось открыть настройки телефона.')); }} />
    </Sheet>}
  </SafeAreaView>;
}

const sty = StyleSheet.create({
  frame: { flex: 1, backgroundColor: '#E9E1D8' },
  shell: { flex: 1, width: '100%', maxWidth: 680, alignSelf: 'center', backgroundColor: color.paper },
  header: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 18, minHeight: 69, backgroundColor: color.paper },
  brand: { flex: 1, gap: 1 },
  brandName: { fontSize: 21, lineHeight: 27, fontFamily: 'Lora', color: color.ink },
  brandCity: { fontSize: 14, lineHeight: 19, color: color.muted },
  main: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 6, paddingBottom: 22 },
  nav: { flexDirection: 'row', alignItems: 'stretch', borderTopWidth: 1, borderColor: color.line, backgroundColor: color.card, paddingHorizontal: 6 },
  navTab: { flex: 1, minHeight: 63, alignItems: 'center', justifyContent: 'center', paddingVertical: 5, gap: 3 },
  navIcon: { width: 43, height: 29, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  navIconActive: { backgroundColor: color.goldLight },
  navText: { color: color.muted, fontSize: 11, lineHeight: 15, fontWeight: '500' },
  navTextActive: { color: color.gold, fontWeight: '700' },
  toast: { fontSize: 15, lineHeight: 20, color: color.white, backgroundColor: color.plum, padding: 12, textAlign: 'center' },
});
