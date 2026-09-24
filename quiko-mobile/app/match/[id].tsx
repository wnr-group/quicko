import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card, Header } from "@/components/ui";
import { QuickNav } from "@/components/QuickNav";
import { api, MatchDetail, MatchStatus } from "@/lib/api";
import { colors, radius } from "@/lib/theme";
import { inr } from "@core/format";
import { splitPayment } from "@core/pricing";

const STAGES: { key: MatchStatus; label: string }[] = [
  { key: "confirmed", label: "Matched" },
  { key: "paid", label: "Paid" },
  { key: "picked_up", label: "Picked up" },
  { key: "in_transit", label: "In transit" },
  { key: "delivered", label: "Delivered" },
];
const stageIndex = (s: MatchStatus) => Math.min(STAGES.findIndex((x) => x.key === s), 4);

export default function MatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [m, setM] = useState<MatchDetail | null>(null);
  const [status, setStatus] = useState<MatchStatus>("confirmed");
  const [otp, setOtp] = useState("");
  const [pickupOtp, setPickupOtp] = useState("");
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.match(String(id)).then((d) => {
      setM(d);
      setStatus(d.status);
    }).catch(() => {});
  }, [id]);

  if (!m) {
    return (
      <View style={styles.screen}>
        <Header title="Match" />
        <ActivityIndicator color={colors.ink} style={{ marginTop: 40 }} />
      </View>
    );
  }

  const isSender = m.role === "sender";
  const earn = Math.round(splitPayment(m.price).travelerEarns);
  const reached = stageIndex(status);

  async function act(fn: () => Promise<{ ok: true } | { ok: false; error: string }>, next?: MatchStatus) {
    setError(null);
    setBusy(true);
    try {
      const r = await fn();
      if (!r.ok) setError(r.error);
      else if (next) setStatus(next);
    } catch (e) {
      // The real API signals rejections (wrong OTP, capacity, …) with a non-2xx
      // that req() throws — surface it instead of failing silently.
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Header title={isSender ? "Your package" : "Carrying"} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 12 }}>
        {/* summary */}
        <Card style={{ backgroundColor: colors.brand }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="sparkles" size={20} color={colors.ink} />
            <Text style={styles.matchTitle}>It's a match!</Text>
          </View>
          <Text style={styles.route}>{m.fromCity} → {m.toCity}</Text>
          <Text style={styles.who}>
            {isSender ? `${m.counterpartName} carries it` : `from ${m.counterpartName}`}
          </Text>
          <View style={styles.payRow}>
            <Text style={styles.payLabel}>{isSender ? "You pay" : "You earn"}</Text>
            <Text style={styles.payValue}>{inr(isSender ? m.price : earn)}</Text>
          </View>
        </Card>

        <Button title={`Message ${m.counterpartName}`} variant="ink" onPress={() => router.push(`/chat/${m.id}`)} />

        {/* tracking */}
        {reached >= 1 && (
          <Card>
            <Text style={styles.cardH}>Tracking</Text>
            {STAGES.map((s, i) => (
              <View key={s.key} style={styles.stage}>
                <View style={[styles.dot, { backgroundColor: i <= reached ? colors.ink : colors.line }]}>
                  {i <= reached && <Ionicons name="checkmark" size={12} color={colors.white} />}
                </View>
                <Text style={[styles.stageLabel, { color: i <= reached ? colors.ink : colors.muted }]}>{s.label}</Text>
              </View>
            ))}
          </Card>
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        {/* --- SENDER actions --- */}
        {isSender && status === "confirmed" && (
          <Card>
            <Text style={styles.cardH}>Pay to confirm</Text>
            <Text style={styles.muted}>Your money is held in escrow and released only after delivery.</Text>
            <View style={{ height: 12 }} />
            <Button title={`Pay ${inr(m.price)} securely`} loading={busy} onPress={() => act(() => api.payForMatch(m.id), "paid")} />
          </Card>
        )}
        {isSender && status === "paid" && !!m.pickupOtp && (
          <View style={styles.otpShare}>
            <Text style={styles.otpShareLabel}>Pickup OTP — give this to the traveller at hand-off</Text>
            <Text style={styles.otpShareCode}>{m.pickupOtp}</Text>
            <Text style={styles.otpShareNote}>Only read it out once the package is physically with them.</Text>
          </View>
        )}
        {isSender && (status === "paid" || status === "picked_up" || status === "in_transit") && (
          <>
            <View style={styles.otpShare}>
              <Text style={styles.otpShareLabel}>Delivery OTP — give this to your receiver</Text>
              <Text style={styles.otpShareCode}>{m.otp}</Text>
            </View>
            <Card>
              <Text style={styles.muted}>
                {status === "paid" ? `${m.counterpartName} will collect your package — share the pickup OTP at hand-off.`
                  : status === "picked_up" ? "Picked up — on the way to your receiver."
                  : "In transit. Your receiver gives the OTP to the traveller on hand-off."}
              </Text>
            </Card>
          </>
        )}
        {isSender && status === "delivered" && (
          <Card>
            <Text style={styles.cardH}>Rate {m.counterpartName}</Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable key={n} onPress={() => setStars(n)}>
                  <Ionicons name={n <= stars ? "star" : "star-outline"} size={32} color={colors.brand} />
                </Pressable>
              ))}
            </View>
            <TextInput value={comment} onChangeText={setComment} placeholder="Add a comment (optional)" style={styles.input} />
            <View style={{ height: 10 }} />
            <Button title="Submit rating" loading={busy} onPress={() => act(() => api.rate(m.id, stars, comment), "completed")} />
          </Card>
        )}

        {/* --- TRAVELLER actions --- */}
        {!isSender && status === "confirmed" && (
          <Card><Text style={styles.muted}>Matched! Waiting for {m.counterpartName} to pay into escrow.</Text></Card>
        )}
        {!isSender && status === "paid" && (
          <Card>
            <Text style={styles.cardH}>Confirm pickup</Text>
            <Text style={styles.muted}>
              Payment secured 🔒 — collect it from {m.fromCity}, then enter the pickup OTP {m.counterpartName} gives you.
            </Text>
            <TextInput
              value={pickupOtp} onChangeText={(t) => setPickupOtp(t.replace(/\D/g, "").slice(0, 4))}
              keyboardType="number-pad" placeholder="Pickup OTP"
              style={[styles.input, styles.otpInput]}
            />
            <View style={{ height: 8 }} />
            <Button
              title="Confirm pickup" loading={busy} disabled={pickupOtp.length < 4}
              onPress={() => act(async () => {
                const r = await api.advanceMatch(m.id, "picked_up", pickupOtp);
                if (r.ok) return r;
                return { ok: false as const, error: "error" in r ? r.error : "Incorrect pickup OTP" };
              }, "picked_up")}
            />
          </Card>
        )}
        {!isSender && status === "picked_up" && (
          <Card>
            <Text style={styles.muted}>Got it — mark when you set off.</Text>
            <View style={{ height: 12 }} />
            <Button title="Mark in transit" loading={busy} onPress={() => act(() => api.advanceMatch(m.id, "in_transit"), "in_transit")} />
          </Card>
        )}
        {!isSender && status === "in_transit" && (
          <Card>
            <Text style={styles.cardH}>Confirm delivery</Text>
            <Text style={styles.muted}>Enter the OTP the receiver gives you.</Text>
            <TextInput
              value={otp} onChangeText={(t) => setOtp(t.replace(/\D/g, "").slice(0, 4))}
              keyboardType="number-pad" placeholder="Delivery OTP"
              style={[styles.input, styles.otpInput]}
            />
            <View style={{ height: 8 }} />
            <Button
              title="Confirm delivery" loading={busy} disabled={otp.length < 4}
              onPress={() => act(async () => {
                const r = await api.confirmDelivery(m.id, otp);
                if (r.ok) return r;
                return { ok: false as const, error: "error" in r ? r.error : "Incorrect OTP" };
              }, "delivered")}
            />
          </Card>
        )}

        {(status === "delivered" || status === "completed") && (
          <View style={styles.done}>
            <Ionicons name="checkmark-circle" size={44} color={colors.success} />
            <Text style={styles.doneTitle}>{status === "completed" ? "All done!" : "Delivered!"}</Text>
            <Text style={styles.muted}>
              {isSender ? "Thanks for using Quiko. 📦" : `${inr(earn)} added to your earnings.`}
            </Text>
          </View>
        )}
      </ScrollView>
      <QuickNav />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  matchTitle: { fontSize: 20, fontWeight: "900", color: colors.ink },
  route: { marginTop: 10, fontSize: 16, fontWeight: "800", color: colors.ink },
  who: { color: colors.inkSoft, marginTop: 2 },
  payRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12, borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.12)", paddingTop: 10 },
  payLabel: { color: colors.inkSoft, fontWeight: "600" },
  payValue: { fontWeight: "900", color: colors.ink },
  cardH: { fontSize: 13, fontWeight: "800", color: colors.muted, textTransform: "uppercase", marginBottom: 8 },
  muted: { color: colors.inkSoft, lineHeight: 20 },
  stage: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 },
  dot: { height: 22, width: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  stageLabel: { fontWeight: "700" },
  error: { color: colors.error, fontWeight: "600" },
  otpShare: { backgroundColor: colors.ink, borderRadius: radius.xl, padding: 16, alignItems: "center" },
  otpShareLabel: { color: "rgba(253,220,43,0.7)", fontSize: 12, fontWeight: "600", textTransform: "uppercase", textAlign: "center" },
  otpShareNote: { color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 4, textAlign: "center" },
  otpShareCode: { color: colors.brand, fontSize: 34, fontWeight: "900", letterSpacing: 10, marginTop: 4 },
  stars: { flexDirection: "row", justifyContent: "center", gap: 8, paddingVertical: 6 },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, backgroundColor: colors.white },
  otpInput: { textAlign: "center", fontSize: 26, letterSpacing: 12, fontWeight: "800" },
  hint: { textAlign: "center", color: colors.muted, fontSize: 12, marginTop: 8 },
  done: { alignItems: "center", backgroundColor: colors.successSoft, borderRadius: radius.xl, padding: 24, gap: 6 },
  doneTitle: { fontSize: 18, fontWeight: "900", color: colors.ink },
});
