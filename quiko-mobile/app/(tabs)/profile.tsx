import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card } from "@/components/ui";
import { api, Me } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colors, radius } from "@/lib/theme";
import { formatPhone } from "@core/format";

export default function Profile() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    api.me().then(setMe).catch(() => {});
  }, []);

  async function onSignOut() {
    await signOut();
    router.replace("/(auth)/login");
  }

  const verified = (me?.kycLevel ?? 1) >= 3;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <Text style={styles.h1}>Profile</Text>
      <View style={{ padding: 20, paddingTop: 8, gap: 16 }}>
        <View style={{ alignItems: "center" }}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(me?.fullName ?? "Q").slice(0, 1)}</Text>
          </View>
          <Text style={styles.name}>{me?.fullName ?? "…"}</Text>
          <Text style={styles.phone}>{me ? formatPhone(me.phone) : ""}</Text>
        </View>

        <Pressable onPress={() => router.push("/verify")}>
          <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={[styles.badge, { backgroundColor: verified ? colors.successSoft : colors.brandSoft }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color={verified ? colors.success : colors.ink} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{verified ? "Identity verified" : "Verify your identity"}</Text>
              <Text style={styles.cardSub}>
                {verified ? "You have a trusted badge." : "Add an ID to earn a trusted badge."}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </Card>
        </Pressable>

        <Pressable onPress={() => router.push("/wallet")}>
          <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={[styles.badge, { backgroundColor: colors.brandSoft }]}>
              <Ionicons name="wallet-outline" size={20} color={colors.ink} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Earnings & wallet</Text>
              <Text style={styles.cardSub}>Your payouts and money in escrow.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </Card>
        </Pressable>

        <Button title="Sign out" variant="ink" onPress={onSignOut} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  h1: { fontSize: 24, fontWeight: "900", color: colors.ink, paddingHorizontal: 20, paddingTop: 4 },
  avatar: { height: 88, width: 88, borderRadius: 44, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.brand, fontWeight: "900", fontSize: 34 },
  name: { marginTop: 12, fontSize: 20, fontWeight: "900", color: colors.ink },
  phone: { marginTop: 4, color: colors.muted },
  badge: { height: 44, width: 44, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontWeight: "800", color: colors.ink, fontSize: 15 },
  cardSub: { color: colors.muted, fontSize: 13 },
});
