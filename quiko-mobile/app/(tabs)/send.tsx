import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card } from "@/components/ui";
import { LocationSheet, PickedLocation } from "@/components/LocationSheet";
import { api, ExploreTrip } from "@/lib/api";
import { colors, radius } from "@/lib/theme";
// Shared formatting from the web app's core/.
import { dateShort, time12, transportLabel } from "@core/format";

export default function Send() {
  const router = useRouter();
  const [from, setFrom] = useState<PickedLocation | null>(null);
  const [to, setTo] = useState<PickedLocation | null>(null);
  const [sheet, setSheet] = useState<"from" | "to" | null>(null);
  const [trips, setTrips] = useState<ExploreTrip[] | null>(null);
  const [loading, setLoading] = useState(false);

  const ready = !!from && !!to;

  async function explore() {
    if (!ready) return;
    setLoading(true);
    try {
      setTrips(await api.exploreTrips({ fromLat: from!.lat, fromLng: from!.lng, toLat: to!.lat, toLng: to!.lng }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <Text style={styles.h1}>Send a package</Text>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8 }}>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <FieldRow badge="A" ink icon="location-outline" label="Pickup"
            value={from?.label} placeholder="Set pickup on map" onPress={() => setSheet("from")} />
          <View style={styles.divider} />
          <FieldRow badge="B" icon="flag-outline" label="Destination"
            value={to?.label} placeholder="Set destination on map" onPress={() => setSheet("to")} />
        </Card>

        <View style={{ height: 14 }} />
        <Button title="Explore travellers" onPress={explore} loading={loading} disabled={!ready} />

        {trips && (
          <>
            <Text style={styles.section}>
              {trips.length} traveller{trips.length === 1 ? "" : "s"} on your route
            </Text>
            {trips.map((t) => {
              const tp = transportLabel(t.transport);
              return (
                <Pressable
                  key={t.id}
                  onPress={() =>
                    router.push({
                      pathname: "/explore-details",
                      params: {
                        from: from?.label, fromLat: String(from?.lat), fromLng: String(from?.lng),
                        to: to?.label, toLat: String(to?.lat), toLng: String(to?.lng),
                        tripId: t.id, name: t.travelerName,
                      },
                    })
                  }
                >
                  <Card style={{ marginBottom: 10, flexDirection: "row", alignItems: "center" }}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{t.travelerName.slice(0, 1)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>{t.travelerName}</Text>
                      <Text style={styles.meta}>
                        {dateShort(t.travelDate)} · {time12(t.departTime)} → {time12(t.arriveTime)}
                      </Text>
                    </View>
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>{tp.label}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                  </Card>
                </Pressable>
              );
            })}

            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/explore-details",
                  params: {
                    from: from?.label, fromLat: String(from?.lat), fromLng: String(from?.lng),
                    to: to?.label, toLat: String(to?.lat), toLng: String(to?.lng),
                  },
                })
              }
              style={styles.notify}
            >
              <Text style={styles.notifyTitle}>Can't find a match?</Text>
              <Text style={styles.notifySub}>Leave it here & we'll notify you when one appears</Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      {sheet && (
        <LocationSheet
          title={sheet === "from" ? "Set pickup" : "Set destination"}
          initial={sheet === "to" ? to ?? from : from}
          onConfirm={(loc) => {
            if (sheet === "from") setFrom(loc);
            else setTo(loc);
            setSheet(null);
          }}
          onClose={() => setSheet(null)}
        />
      )}
    </SafeAreaView>
  );
}

function FieldRow({
  badge, ink, icon, label, value, placeholder, onPress,
}: {
  badge: string; ink?: boolean; icon: keyof typeof Ionicons.glyphMap; label: string;
  value?: string; placeholder: string; onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={[styles.badge, { backgroundColor: ink ? colors.ink : colors.brand }]}>
        <Text style={[styles.badgeText, { color: ink ? colors.white : colors.ink }]}>{badge}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Ionicons name={icon} size={12} color={colors.muted} />
          <Text style={styles.rowLabel}>{label}</Text>
        </View>
        <Text style={[styles.rowValue, { color: value ? colors.ink : colors.muted }]} numberOfLines={1}>
          {value ?? placeholder}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  h1: { fontSize: 24, fontWeight: "900", color: colors.ink, paddingHorizontal: 20, paddingTop: 4 },
  divider: { height: 1, backgroundColor: colors.line, marginLeft: 44 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 14 },
  badge: { height: 24, width: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  badgeText: { fontSize: 11, fontWeight: "800" },
  rowLabel: { fontSize: 11, fontWeight: "800", color: colors.muted, textTransform: "uppercase" },
  rowValue: { fontSize: 15, fontWeight: "600", marginTop: 2 },
  section: { marginTop: 24, marginBottom: 10, fontSize: 13, fontWeight: "800", color: colors.muted, textTransform: "uppercase" },
  avatar: { height: 44, width: 44, borderRadius: 22, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center", marginRight: 12 },
  avatarText: { color: colors.brand, fontWeight: "800" },
  name: { fontWeight: "800", color: colors.ink },
  meta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  tag: { backgroundColor: colors.brandSoft, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, marginRight: 6 },
  tagText: { fontSize: 12, fontWeight: "700", color: colors.ink },
  notify: { marginTop: 8, backgroundColor: colors.ink, borderRadius: radius.lg, padding: 16, alignItems: "center" },
  notifyTitle: { color: colors.white, fontWeight: "700", fontSize: 15 },
  notifySub: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 },
});
