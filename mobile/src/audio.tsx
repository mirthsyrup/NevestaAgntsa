import { useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import Slider from '@react-native-community/slider';
import { Sermon, church } from './content';
import { Icon, IconButton, color, style } from './ui';

export function useSermonAudio(onError: (message: string) => void) {
  const player = useAudioPlayer(null, { updateInterval: 400 });
  const status = useAudioPlayerStatus(player);
  const [sermon, setSermon] = useState<Sermon>();
  const request = useRef(0);
  const current = useRef<Sermon | undefined>(undefined);

  async function play(next: Sermon) {
    if (!next.audioUrl) return;
    const id = ++request.current;
    try {
      if (Platform.OS !== 'web') {
        await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix' });
      }
      if (id !== request.current) return;
      if (current.current?.id !== next.id) {
        player.pause();
        player.replace({ uri: next.audioUrl });
        current.current = next;
        setSermon(next);
      } else if (status.didJustFinish || (status.duration > 0 && status.currentTime >= status.duration - 0.1)) {
        await player.seekTo(0);
      }
      if (id !== request.current) return;
      player.play();
      player.setActiveForLockScreen(true, { title: next.title, artist: next.speaker || church.name }, {
        showSeekBackward: true, showSeekForward: true,
      });
    } catch {
      if (id === request.current) onError('Не удалось запустить аудио. Попробуйте ещё раз.');
    }
  }

  function close() {
    ++request.current;
    player.pause();
    player.clearLockScreenControls();
    player.replace(null);
    current.current = undefined;
    setSermon(undefined);
  }

  return {
    sermon, status, play, close,
    toggle: () => { if (status.playing) player.pause(); else if (sermon) void play(sermon); },
    seek: (value: number) => { void player.seekTo(value).catch(() => onError('Не удалось перемотать запись.')); },
  };
}

const timer = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

export function MiniPlayer({ audio, open }: { audio: ReturnType<typeof useSermonAudio>; open: (sermon: Sermon) => void }) {
  const { sermon, status } = audio;
  if (!sermon) return null;
  const duration = Number.isFinite(status.duration) ? status.duration : 0;
  return <View style={sty.container}>
    <View style={sty.row}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Открыть проповедь ${sermon.title}`} style={sty.title} onPress={() => open(sermon)}>
        <View style={style.tileIcon}><Icon name="headphones" size={20} tint={color.gold} /></View>
        <View style={sty.copy}>
          <Text style={style.rowLabel} numberOfLines={1}>{sermon.title}</Text>
          <Text style={style.meta} numberOfLines={1}>{status.error ? 'Запись недоступна' : status.isBuffering ? 'Загрузка…' : sermon.speaker || 'Аудио'}</Text>
        </View>
      </Pressable>
      <IconButton icon={status.playing ? 'pause' : 'play'} surface="plain" label={status.playing ? 'Пауза' : 'Воспроизвести'} onPress={audio.toggle} />
      <IconButton icon="close" surface="plain" label="Закрыть плеер" onPress={audio.close} />
    </View>
    {duration > 0 && <View style={sty.progress}>
      <Text style={sty.time}>{timer(status.currentTime)}</Text>
      <Slider style={sty.slider} accessibilityLabel="Позиция в записи" minimumValue={0} maximumValue={duration}
        value={status.currentTime} onSlidingComplete={audio.seek} minimumTrackTintColor={color.gold} maximumTrackTintColor={color.line} thumbTintColor={color.plum} />
      <Text style={sty.time}>{timer(duration)}</Text>
    </View>}
  </View>;
}

const sty = StyleSheet.create({
  container: { borderTopWidth: 1, borderColor: color.line, backgroundColor: color.card, paddingHorizontal: 12, paddingVertical: 7 },
  row: { flexDirection: 'row', alignItems: 'center' },
  title: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10, minHeight: 44 },
  copy: { flex: 1 },
  progress: { flexDirection: 'row', alignItems: 'center' },
  time: { fontSize: 13, fontVariant: ['tabular-nums'], color: color.muted, minWidth: 36, textAlign: 'center' },
  slider: { flex: 1, height: 32 },
});
