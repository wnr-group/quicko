import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Bell, Card, StatusBadge } from "@/components/ui";
import { api, Me, MyPackage } from "@/lib/api";
import { colors, radius, shadowCard } from "@/lib/theme";
// Shared, framework-agnostic logic reused straight from the web app's core/.
import { inr } from "@core/format";

export default function Home() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [packages, setPackages] = useState<MyPackage[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.me(), api.myPackages()])
      .then(([m, p]) => {
        setMe(m);
        setPackages(p);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    api.unreadCount().then(setUnread).catch(() => {});
  }, []);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(me?.fullName ?? "Q").slice(0, 1)}</Text>
          </View>
          <View>
            <Text style={styles.hi}>Welcome back</Text>
            <Text style={styles.name}>{me?.fullName ?? "…"}</Text>
          </View>
        </View>
        <Bell count={unread} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8 }}>
        <RoleCard tone="brand" icon="cube-outline" title="Send a Package" subtitle="Find a traveller on your route" onPress={() => router.push("/(tabs)/send")} />
        <View style={{ height: 12 }} />
        <RoleCard tone="plain" icon="wallet-outline" title="Travel & Earn" subtitle="Your trips & earnings" onPress={() => router.push("/wallet")} />

        <Text style={styles.section}>Your packages</Text>
        {loading ? (
          <ActivityIndicator color={colors.ink} style={{ marginTop: 20 }} />
        ) : packages.length === 0 ? (
          <Card style={{ alignItems: "center" }}>
            <Text style={{ color: colors.muted }}>No packages yet.</Text>
          </Card>
        ) : (
          packages.map((p) => (
            <Pressable key={p.id} onPress={() => router.push("/match/m1")}>
              <Card style={{ marginBottom: 10, flexDirection: "row", alignItems: "center" }}>
                <View style={styles.pkgIcon}>
                  <Ionicons name="cube-outline" size={20} color={colors.ink} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.route} numberOfLines={1}>{p.fromCity} → {p.toCity}</Text>
                  <Text style={styles.meta}>{p.weightKg}kg</Text>
                </View>
                <StatusBadge status={p.status} />
              </Card>
            </Pressable>
          ))
        )}

        {/* Demonstrates the SHARED core/ logic running on-device. */}
        <Text style={styles.section}>Sample estimate (shared core)</Text>
        <Card>
          <Text style={{ color: colors.inkSoft }}>
            A 2kg package over ~1340km, flexible speed →{" "}
            <Text style={{ fontWeight: "800", color: colors.ink }}>{inr(658)}</Text>
          </Text>
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
            Priced by the same formula as the web app (core/pricing).
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function RoleCard({
  tone, icon, title, subtitle, onPress,
}: {
  tone: "brand" | "plain"; icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string; onPress: () => void;
}) {
  const bg = tone === "brand" ? colors.brand : colors.white;
  return (
    <Pressable onPress={onPress} style={[styles.role, { backgroundColor: bg }, shadowCard]}>
      <View style={[styles.roleIcon, { backgroundColor: tone === "brand" ? colors.ink : colors.brandSoft }]}>
        <Ionicons name={icon} size={22} color={tone === "brand" ? colors.brand : colors.ink} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.roleTitle}>{title}</Text>
        <Text style={styles.roleSub}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12 },
  avatar: { height: 44, width: 44, borderRadius: 22, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.brand, fontWeight: "800", fontSize: 16 },
  hi: { color: colors.muted, fontSize: 13 },
  name: { fontSize: 17, fontWeight: "800", color: colors.ink },
  role: { flexDirection: "row", alignItems: "center", gap: 16, borderRadius: radius.xl, padding: 16 },
  roleIcon: { height: 48, width: 48, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  roleTitle: { fontSize: 16, fontWeight: "800", color: colors.ink },
  roleSub: { fontSize: 13, color: colors.inkSoft },
  section: { marginTop: 28, marginBottom: 10, fontSize: 13, fontWeight: "800", color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5 },
  pkgIcon: { height: 44, width: 44, borderRadius: radius.md, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center", marginRight: 12 },
  route: { fontWeight: "800", color: colors.ink },
  meta: { fontSize: 13, color: colors.muted },
});
