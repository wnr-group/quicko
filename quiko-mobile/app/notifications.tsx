import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, Header } from "@/components/ui";
import { QuickNav } from "@/components/QuickNav";
import { api, Notif } from "@/lib/api";
import { colors, radius } from "@/lib/theme";

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  paid: "shield-checkmark-outline",
  message: "chatbubble-ellipses-outline",
  trip_match: "airplane-outline",
  package_match: "cube-outline",
  delivered: "checkmark-circle-outline",
  rated: "star-outline",
  kyc: "shield-checkmark-outline",
};

export default function Notifications() {
  const [items, setItems] = useState<Notif[] | null>(null);

  useEffect(() => {
    api.notifications().then(setItems).catch(() => setItems([]));
    api.markNotificationsRead().catch(() => {});
  }, []);

  return (
    <View style={styles.screen}>
      <Header title="Notifications" />
      {!items ? (
        <ActivityIndicator color={colors.ink} style={{ marginTop: 40 }} />
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="notifications-outline" size={28} color={colors.ink} />
          <Text style={styles.emptyTitle}>You're all caught up</Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 8 }}>
          {items.map((n) => (
            <Card key={n.id} style={[styles.item, !n.read && { backgroundColor: colors.brandSoft }]}>
              <View style={styles.icon}>
                <Ionicons name={ICONS[n.type] ?? "notifications-outline"} size={18} color={colors.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={styles.title}>{n.title}</Text>
                  {!n.read && <View style={styles.unread} />}
                </View>
                {!!n.body && <Text style={styles.body}>{n.body}</Text>}
                <Text style={styles.time}>{n.at}</Text>
              </View>
            </Card>
          ))}
        </ScrollView>
      )}
      <QuickNav />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  empty: { alignItems: "center", marginTop: 80, gap: 10 },
  emptyTitle: { fontWeight: "800", color: colors.ink, fontSize: 15 },
  item: { flexDirection: "row", gap: 12, padding: 14 },
  icon: { height: 40, width: 40, borderRadius: 20, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
  title: { fontWeight: "800", color: colors.ink, fontSize: 15, flexShrink: 1 },
  unread: { height: 8, width: 8, borderRadius: 4, backgroundColor: colors.error },
  body: { color: colors.inkSoft, fontSize: 13, marginTop: 2 },
  time: { color: colors.muted, fontSize: 12, marginTop: 4 },
});
