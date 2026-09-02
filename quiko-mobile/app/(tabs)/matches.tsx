import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Bell, Card, StatusBadge } from "@/components/ui";
import { api, MatchSummary } from "@/lib/api";
import { colors, radius } from "@/lib/theme";
import { inr } from "@core/format";

export default function Matches() {
  const router = useRouter();
  const [rows, setRows] = useState<MatchSummary[] | null>(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api.matches().then(setRows).catch(() => setRows([]));
    api.unreadCount().then(setUnread).catch(() => {});
  }, []);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.head}>
        <View>
          <Text style={styles.h1}>Matches</Text>
          <Text style={styles.sub}>Packages you're sending & carrying.</Text>
        </View>
        <Bell count={unread} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8 }}>
        {rows === null ? (
          <ActivityIndicator color={colors.ink} style={{ marginTop: 20 }} />
        ) : rows.length === 0 ? (
          <Card style={{ alignItems: "center" }}>
            <Text style={{ color: colors.muted }}>No matches yet.</Text>
          </Card>
        ) : (
          rows.map((m) => (
            <Pressable key={m.id} onPress={() => router.push(`/match/${m.id}`)}>
              <Card style={{ marginBottom: 10, flexDirection: "row", alignItems: "center" }}>
                <View style={styles.icon}>
                  <Ionicons name={m.role === "sender" ? "airplane-outline" : "cube-outline"} size={20} color={colors.ink} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.route} numberOfLines={1}>{m.fromCity} → {m.toCity}</Text>
                  <Text style={styles.meta}>
                    {m.role === "sender" ? "Carried by" : "Sender"} {m.counterpartName} · {inr(m.price)}
                  </Text>
                </View>
                <StatusBadge status={m.status} />
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  head: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 4 },
  h1: { fontSize: 24, fontWeight: "900", color: colors.ink },
  sub: { fontSize: 14, color: colors.muted },
  icon: { height: 44, width: 44, borderRadius: radius.md, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center", marginRight: 12 },
  route: { fontWeight: "800", color: colors.ink },
  meta: { fontSize: 13, color: colors.muted, marginTop: 2 },
});
