import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, Header, StatusBadge } from "@/components/ui";
import { QuickNav } from "@/components/QuickNav";
import { api, Wallet as WalletT } from "@/lib/api";
import { colors, radius } from "@/lib/theme";
import { inr } from "@core/format";

export default function Wallet() {
  const [w, setW] = useState<WalletT | null>(null);
  useEffect(() => {
    api.wallet().then(setW).catch(() => {});
  }, []);

  return (
    <View style={styles.screen}>
      <Header title="Earnings" />
      {!w ? (
        <ActivityIndicator color={colors.ink} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 12 }}>
          <View style={styles.hero}>
            <Text style={styles.heroLabel}>Total earned</Text>
            <Text style={styles.heroValue}>{inr(w.earned)}</Text>
            <Text style={styles.heroSub}>across {w.deliveries} deliver{w.deliveries === 1 ? "y" : "ies"} · after 2% fee</Text>
          </View>

          {w.pending > 0 && (
            <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={styles.clock}><Ionicons name="time-outline" size={20} color={colors.ink} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{inr(w.pending)} in escrow</Text>
                <Text style={styles.muted}>Releases as you complete deliveries</Text>
              </View>
            </Card>
          )}

          {w.upcoming.length > 0 && (
            <>
              <Text style={styles.section}>In progress</Text>
              {w.upcoming.map((u) => (
                <Card key={u.id} style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                  <View style={styles.amt}><Text style={styles.amtText}>{inr(u.amount)}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle} numberOfLines={1}>{u.fromCity} → {u.toCity}</Text>
                  </View>
                  <StatusBadge status={u.status} />
                </Card>
              ))}
            </>
          )}

          <Text style={styles.section}>Payouts</Text>
          {w.payouts.length === 0 ? (
            <Card><Text style={styles.muted}>No payouts yet.</Text></Card>
          ) : (
            w.payouts.map((p) => (
              <Card key={p.id} style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                <View style={styles.check}><Ionicons name="checkmark" size={18} color={colors.success} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle} numberOfLines={1}>{p.fromCity} → {p.toCity}</Text>
                  <Text style={styles.muted}>{p.at}</Text>
                </View>
                <Text style={styles.payout}>+{inr(p.amount)}</Text>
              </Card>
            ))
          )}
        </ScrollView>
      )}
      <QuickNav />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  hero: { backgroundColor: colors.ink, borderRadius: radius.xl, padding: 20 },
  heroLabel: { color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: "600" },
  heroValue: { color: colors.brand, fontSize: 40, fontWeight: "900", marginTop: 2 },
  heroSub: { color: "rgba(255,255,255,0.6)", fontSize: 13, marginTop: 2 },
  clock: { height: 40, width: 40, borderRadius: radius.md, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" },
  check: { height: 40, width: 40, borderRadius: 20, backgroundColor: colors.successSoft, alignItems: "center", justifyContent: "center", marginRight: 12 },
  amt: { height: 40, minWidth: 48, paddingHorizontal: 6, borderRadius: radius.md, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center", marginRight: 12 },
  amtText: { fontWeight: "800", color: colors.ink, fontSize: 13 },
  section: { marginTop: 12, fontSize: 13, fontWeight: "800", color: colors.muted, textTransform: "uppercase" },
  rowTitle: { fontWeight: "800", color: colors.ink },
  muted: { color: colors.muted, fontSize: 13 },
  payout: { fontWeight: "900", color: colors.success },
});
