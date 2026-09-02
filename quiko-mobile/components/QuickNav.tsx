import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";

// A persistent bottom menu for the pushed (non-tab) screens, so the user can
// jump straight to any section instead of pressing back repeatedly. Mirrors the
// real Tabs bar in app/(tabs)/_layout.tsx.
const ITEMS = [
  { href: "/(tabs)/home" as const, icon: "home-outline" as const, label: "Home" },
  { href: "/(tabs)/matches" as const, icon: "sparkles-outline" as const, label: "Matches" },
  { href: "/(tabs)/send" as const, icon: "add-circle" as const, label: "Send", fab: true },
  { href: "/(tabs)/profile" as const, icon: "person-outline" as const, label: "Profile" },
];

export function QuickNav() {
  const router = useRouter();
  return (
    <SafeAreaView edges={["bottom"]} style={styles.wrap}>
      <View style={styles.bar}>
        {ITEMS.map((it) => (
          <Pressable key={it.href} onPress={() => router.navigate(it.href)} style={styles.item}>
            <Ionicons
              name={it.icon}
              size={it.fab ? 32 : 24}
              color={it.fab ? colors.brand : colors.muted}
            />
            {!it.fab && <Text style={styles.label}>{it.label}</Text>}
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: "auto", backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.line },
  bar: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingTop: 6, paddingBottom: 2 },
  item: { alignItems: "center", justifyContent: "center", gap: 2, minWidth: 56 },
  label: { fontSize: 11, fontWeight: "600", color: colors.muted },
});
