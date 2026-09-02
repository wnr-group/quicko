import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card, Header } from "@/components/ui";
import { QuickNav } from "@/components/QuickNav";
import { api } from "@/lib/api";
import { colors, radius } from "@/lib/theme";

export default function ExploreDetails() {
  const router = useRouter();
  const { from, to, fromLat, fromLng, toLat, toLng, tripId, name } = useLocalSearchParams<{
    from?: string; to?: string; fromLat?: string; fromLng?: string; toLat?: string; toLng?: string; tripId?: string; name?: string;
  }>();
  const [weight, setWeight] = useState(1);
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  const descOk = description.trim().length >= 3;

  async function submit() {
    setBusy(true);
    try {
      const res = await api.createPackage({
        fromLabel: String(from ?? "Pickup"),
        fromLat: Number(fromLat), fromLng: Number(fromLng),
        toLabel: String(to ?? "Destination"),
        toLat: Number(toLat), toLng: Number(toLng),
        weightKg: weight,
        description: description.trim(),
        tripId: tripId ? String(tripId) : undefined,
      });
      // Mock jumps to the sample match; real mode returns the new package id.
      router.replace(res && "id" in res && res.id !== "new" ? "/(tabs)/matches" : "/match/m1");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Header title="Add package details" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 12 }}>
        <Card>
          <Text style={styles.route}>{from ?? "Pickup"} → {to ?? "Destination"}</Text>
          {!!name && (
            <View style={styles.reqRow}>
              <Text style={styles.reqText}>Requesting {name}</Text>
            </View>
          )}
        </Card>

        <Card>
          <Text style={styles.label}>Weight</Text>
          <View style={styles.stepper}>
            <Step icon="remove" onPress={() => setWeight((w) => Math.max(1, w - 1))} disabled={weight <= 1} />
            <Text style={styles.weight}>{weight}<Text style={styles.kg}> kg</Text></Text>
            <Step icon="add" onPress={() => setWeight((w) => Math.min(15, w + 1))} disabled={weight >= 15} />
          </View>
        </Card>

        <Card>
          <Text style={styles.label}>What's inside?</Text>
          <TextInput
            value={description} onChangeText={setDescription} multiline
            placeholder="e.g. Documents and a small gift for family"
            style={styles.textarea}
          />
          <Text style={styles.fine}>A short description of the contents. Required so travellers know what they're carrying.</Text>
        </Card>

        <Button
          title={descOk ? (tripId ? `Send request to ${name ?? "traveller"}` : "Post & get notified") : "Describe your package"}
          loading={busy} disabled={!descOk} onPress={submit}
        />
      </ScrollView>
      <QuickNav />
    </View>
  );
}

function Step({ icon, onPress, disabled }: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.step, { opacity: disabled ? 0.3 : 1 }]}>
      <Ionicons name={icon} size={22} color={colors.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  route: { fontSize: 15, fontWeight: "800", color: colors.ink },
  reqRow: { marginTop: 10, backgroundColor: colors.brandSoft, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 8 },
  reqText: { fontWeight: "700", color: colors.ink, fontSize: 13 },
  label: { fontSize: 13, fontWeight: "800", color: colors.muted, textTransform: "uppercase", marginBottom: 10 },
  stepper: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  step: { height: 48, width: 48, borderRadius: 24, backgroundColor: colors.line, alignItems: "center", justifyContent: "center" },
  weight: { fontSize: 30, fontWeight: "900", color: colors.ink },
  kg: { fontSize: 14, color: colors.muted },
  textarea: { minHeight: 80, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 14, fontSize: 15, backgroundColor: colors.white, textAlignVertical: "top" },
  fine: { color: colors.muted, fontSize: 12, marginTop: 8 },
});
