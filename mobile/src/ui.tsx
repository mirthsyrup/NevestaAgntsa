import { ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

export const color = {
  ink: '#292435', muted: '#615A66', paper: '#F8F5EE', card: '#FFFCF7', white: '#FFFFFF',
  line: '#E7DFD3', gold: '#825323', goldLight: '#F1E4D0', plum: '#3A2E46',
  twilight: '#252338', cream: '#FFF8EA', violet: '#EEE8F1',
};

export const images = {
  cross: require('../assets/cross.png'), hero: require('../assets/hero.jpg'), community: require('../assets/community.jpg'),
};

const glyphs = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z M9 21v-7h6v7',
  mic: 'M9 5a3 3 0 0 1 6 0v6a3 3 0 0 1-6 0z M5 11v1a7 7 0 0 0 14 0v-1 M12 19v3 M9 22h6',
  calendar: 'M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z M7 3v4 M17 3v4 M3 10h18 M8 15h1 M12 15h1 M16 15h1',
  heart: 'M20.8 8.7c0 4.6-8.8 9.4-8.8 9.4s-8.8-4.8-8.8-9.4A4.4 4.4 0 0 1 12 8a4.4 4.4 0 0 1 8.8.7z',
  more: 'M4 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M12 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M20 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M4 18a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M12 18a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M20 18a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  bell: 'M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4',
  pin: 'M20 10c0 5-8 11-8 11s-8-6-8-11a8 8 0 1 1 16 0z M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 1 0 0 5z',
  arrow: 'M7 17 17 7 M7 7h10v10',
  right: 'm9 18 6-6-6-6',
  left: 'm15 18-6-6 6-6',
  clock: 'M22 12a10 10 0 1 0-20 0 10 10 0 0 0 20 0z M12 6v6l4 2',
  play: 'M8 5v14l11-7z',
  pause: 'M9 5v14 M15 5v14',
  bookmark: 'M6 4h12v17l-6-4-6 4z',
  search: 'M16 10a6 6 0 1 1-12 0 6 6 0 0 1 12 0z m-1.6 4.4L20 20',
  cross: 'M12 3v18 M6 9h12',
  book: 'M12 6C8 3 5 4 3 4v15c3 0 6 0 9 2 3-2 6-2 9-2V4c-2 0-5-1-9 2z M12 6v15',
  people: 'M16 9a4 4 0 1 0-8 0 4 4 0 0 0 8 0z M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2',
  close: 'm6 6 12 12M18 6 6 18',
  check: 'm5 12 4 4L19 6',
  phone: 'M21 16v3a2 2 0 0 1-2.2 2A18 18 0 0 1 3 5.2 2 2 0 0 1 5 3h3l2 5-2 2a13 13 0 0 0 6 6l2-2z',
  mail: 'M3 5h18v14H3z M3 6l9 7 9-7',
  send: 'm3 10 18-7-7 18-3.5-7.5z M11 13l10-10',
  headphones: 'M3 14v-2a9 9 0 0 1 18 0v2 M3 13h4v7H5a2 2 0 0 1-2-2z M21 13h-4v7h2a2 2 0 0 0 2-2z',
  file: 'M6 3h8l4 4v14H6z M14 3v5h4 M9 12h6 M9 16h6',
  globe: 'M22 12a10 10 0 1 0-20 0 10 10 0 0 0 20 0z M2 12h20 M12 2c5 5 5 15 0 20-5-5-5-15 0-20z',
  plus: 'M12 5v14 M5 12h14',
  minus: 'M5 12h14',
} as const;

export type IconName = keyof typeof glyphs;

export function Icon({ name, size = 22, tint = color.ink, filled = false }: {
  name: IconName; size?: number; tint?: string; filled?: boolean;
}) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
    <Path d={glyphs[name]} fill={filled ? tint : 'none'} stroke={tint} strokeWidth={1.65} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>;
}

export function CrossMark() {
  return <View style={style.crossMark} accessible={false}>
    <Image source={images.cross} style={style.crossImage} resizeMode="contain" />
  </View>;
}

export function Serif({ children, style: extra }: { children: ReactNode; style?: TextStyle }) {
  return <Text accessibilityRole="header" style={[style.serif, extra]}>{children}</Text>;
}

export function Button({ label, icon, onPress, variant = 'primary', disabled = false }: {
  label: string; icon?: IconName; onPress: () => void; variant?: 'primary' | 'secondary' | 'cream'; disabled?: boolean;
}) {
  const tint = variant === 'primary' ? color.white : variant === 'cream' ? color.twilight : color.ink;
  return <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled} accessibilityState={{ disabled }}
    style={({ pressed }) => [style.button, variant === 'primary' ? style.primary : variant === 'cream' ? style.cream : style.secondary,
      (pressed || disabled) && style.pressed]}>
    {icon && <Icon name={icon} size={18} tint={tint} />}
    <Text style={[style.buttonText, { color: tint }]}>{label}</Text>
  </Pressable>;
}

export function IconButton({ label, icon, onPress, active, surface = 'outline', badge = false }: {
  label: string; icon: IconName; onPress: () => void; active?: boolean; surface?: 'outline' | 'plain'; badge?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={active === undefined ? undefined : { selected: active }}
    onPress={onPress} style={({ pressed }) => [style.iconButton, surface === 'outline' && style.outlined, pressed && style.pressed]}>
    <Icon name={icon} size={20} tint={active ? color.gold : color.ink} filled={active === true && icon === 'bookmark'} />
    {badge && <View style={style.badge} />}
  </Pressable>;
}

export function TextButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [style.textButton, pressed && style.pressed]}>
    <Text style={style.textButtonLabel}>{label}</Text>
  </Pressable>;
}

export function ActionRow({ label, description, icon, onPress, external }: {
  label: string; description?: string; icon: IconName; onPress: () => void; external?: boolean;
}) {
  return <Pressable accessibilityRole={external ? 'link' : 'button'} accessibilityLabel={description ? `${label}, ${description}` : label}
    onPress={onPress} style={({ pressed }) => [style.actionRow, pressed && style.pressed]}>
    <View style={style.tileIcon}><Icon name={icon} size={20} tint={color.gold} /></View>
    <View style={style.actionText}>
      <Text style={style.rowLabel}>{label}</Text>
      {!!description && <Text style={style.meta}>{description}</Text>}
    </View>
    <Icon name={external ? 'arrow' : 'right'} size={17} tint={color.muted} />
  </Pressable>;
}

export function Empty({ icon, title, text }: { icon: IconName; title: string; text?: string }) {
  return <View style={style.empty}>
    <View style={style.tileIcon}><Icon name={icon} tint={color.gold} /></View>
    <Text style={style.rowLabel}>{title}</Text>
    {!!text && <Text style={[style.body, { textAlign: 'center' }]}>{text}</Text>}
  </View>;
}

export function LiturgicalMark({ size = 36, tint = color.gold }: { size?: number; tint?: string }) {
  return <Svg width={size} height={size} viewBox="0 0 50 50" accessible={false}>
    <Circle cx="25" cy="25" r="23" stroke={tint} strokeWidth="0.8" fill="none" />
    <Path d="M25 9v32 M14 21h22 M12 13l5 4 M38 13l-5 4 M12 32l5-4 M38 32l-5-4"
      stroke={tint} strokeWidth="1.5" strokeLinecap="round" fill="none" />
  </Svg>;
}

export const surface: ViewStyle = { borderRadius: 19, backgroundColor: color.card, borderWidth: 1, borderColor: color.line };
export const style = StyleSheet.create({
  stack: { gap: 16 },
  serif: { fontFamily: 'Lora', fontSize: 28, lineHeight: 36, color: color.ink },
  body: { fontSize: 16, lineHeight: 24, color: color.muted },
  meta: { fontSize: 14, lineHeight: 20, color: color.muted },
  rowLabel: { fontSize: 16, lineHeight: 22, fontWeight: '600', color: color.ink },
  crossMark: { width: 42, height: 42, borderRadius: 13, backgroundColor: color.twilight, alignItems: 'center', justifyContent: 'center' },
  crossImage: { width: 29, height: 29 },
  button: { minHeight: 48, paddingVertical: 10, paddingHorizontal: 15, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  primary: { backgroundColor: color.plum },
  cream: { backgroundColor: color.cream },
  secondary: { borderWidth: 1, borderColor: color.line, backgroundColor: color.card },
  buttonText: { fontWeight: '600', fontSize: 15, flexShrink: 1, textAlign: 'center' },
  iconButton: { width: 44, minHeight: 44, flexShrink: 0, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  outlined: { borderWidth: 1, borderColor: color.line, backgroundColor: color.card },
  badge: { position: 'absolute', top: 8, right: 9, width: 7, height: 7, borderRadius: 4, backgroundColor: color.gold },
  pressed: { opacity: 0.68 },
  textButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 2, flexShrink: 0 },
  textButtonLabel: { fontSize: 14, color: color.gold, fontWeight: '700' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, minHeight: 65, backgroundColor: color.card },
  tileIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: color.goldLight, alignItems: 'center', justifyContent: 'center' },
  actionText: { flex: 1, gap: 2 },
  empty: { ...surface, alignItems: 'center', padding: 22, gap: 10 },
});
