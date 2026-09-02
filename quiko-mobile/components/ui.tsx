import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadowCard } from "@/lib/theme";

export function Button({
  title, onPress, variant = "brand", disabled, loading,
}: {
  title: string; onPress: () => void; variant?: "brand" | "ink" | "soft"; disabled?: boolean; loading?: boolean;
}) {
  const bg = variant === "brand" ? colors.brand : variant === "soft" ? colors.line : colors.ink;
  const fg = variant === "ink" ? colors.white : colors.ink;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [styles.btn, { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.9 : 1 }]}
    >
      {loading ? <ActivityIndicator color={fg} /> : <Text style={[styles.btnText, { color: fg }]}>{title}</Text>}
    </Pressable>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, shadowCard, style]}>{children}</View>;
}

export function Pill({ text }: { text: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>{text}</Text>
    </View>
  );
}

const STATUS_TONE: Record<string, { bg: string; fg: string }> = {
  active: { bg: colors.brandSoft, fg: colors.ink },
  confirmed: { bg: colors.brandSoft, fg: colors.ink },
  matched: { bg: colors.brandSoft, fg: colors.ink },
  paid: { bg: "#dbeafe", fg: colors.info },
  picked_up: { bg: "#dbeafe", fg: colors.info },
  in_transit: { bg: "#dbeafe", fg: colors.info },
  delivered: { bg: colors.successSoft, fg: colors.success },
  completed: { bg: colors.successSoft, fg: colors.success },
};

export function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONE[status] ?? { bg: colors.line, fg: colors.muted };
  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
      <Text style={[styles.badgeText, { color: tone.fg }]}>{status.replace(/_/g, " ")}</Text>
    </View>
  );
}

// Stack-screen header with a back button and an optional right slot.
export function Header({
  title, right, back = true,
}: {
  title: string; right?: React.ReactNode; back?: boolean;
}) {
  const router = useRouter();
  return (
    <SafeAreaView edges={["top"]} style={styles.headerWrap}>
      <View style={styles.header}>
        {back ? (
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.ink} />
          </Pressable>
        ) : (
          <View style={styles.iconBtn} />
        )}
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <View style={styles.headerRight}>{right}</View>
      </View>
    </SafeAreaView>
  );
}

// Bell with an unread badge, links to notifications.
export function Bell({ count }: { count: number }) {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.push("/notifications")} style={[styles.bell, shadowCard]}>
      <Ionicons name="notifications-outline" size={20} color={colors.ink} />
      {count > 0 && (
        <View style={styles.bellBadge}>
          <Text style={styles.bellBadgeText}>{count > 9 ? "9+" : count}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { height: 54, borderRadius: radius.lg, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  btnText: { fontSize: 16, fontWeight: "700" },
  card: { backgroundColor: colors.white, borderRadius: radius.xl, padding: 16 },
  pill: { backgroundColor: colors.brandSoft, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" },
  pillText: { fontSize: 12, fontWeight: "700", color: colors.ink },
  badge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" },
  badgeText: { fontSize: 11, fontWeight: "800", textTransform: "capitalize" },
  headerWrap: { backgroundColor: colors.canvas },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  iconBtn: { height: 40, width: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "800", color: colors.ink },
  headerRight: { minWidth: 40, alignItems: "flex-end" },
  bell: { height: 44, width: 44, borderRadius: 22, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
  bellBadge: { position: "absolute", top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.error, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  bellBadgeText: { color: colors.white, fontSize: 10, fontWeight: "800" },
});
