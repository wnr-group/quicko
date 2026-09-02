import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card, Header } from "@/components/ui";
import { QuickNav } from "@/components/QuickNav";
import { api, Kyc } from "@/lib/api";
import { colors, radius } from "@/lib/theme";

const ID_TYPES = [
  { value: "aadhaar", label: "Aadhaar" },
  { value: "pan", label: "PAN" },
  { value: "passport", label: "Passport" },
  { value: "driving_license", label: "Driving licence" },
];

export default function Verify() {
  const [kyc, setKyc] = useState<Kyc | undefined>(undefined); // undefined = loading
  const [idType, setIdType] = useState("aadhaar");
  const [idNumber, setIdNumber] = useState("");
  const [legalName, setLegalName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.kyc().then(setKyc).catch(() => setKyc(null));
  }, []);

  async function submit() {
    setError(null);
    if (idNumber.trim().length < 4 || legalName.trim().length < 2) {
      setError("Enter a valid ID number and the name on your ID.");
      return;
    }
    setBusy(true);
    try {
      const r = await api.submitKyc({ idType, idNumber, legalName });
      if (r.ok) setKyc({ status: "pending", notes: null });
    } finally {
      setBusy(false);
    }
  }

  const status = kyc?.status ?? null;

  return (
    <View style={styles.screen}>
      <Header title="Verify your identity" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 12 }}>
        <Text style={styles.intro}>
          Verifying your identity earns a trusted badge and higher limits. It reassures the people you send with or carry for.
        </Text>

        {status === "verified" && <Banner tone="ok" icon="shield-checkmark" title="Identity verified">You have a trusted badge.</Banner>}
        {status === "pending" && <Banner tone="wait" icon="time-outline" title="Under review">We're checking your document — we'll notify you when it's done.</Banner>}

        {(status === null || status === "rejected") && (
          <>
            {status === "rejected" && <Banner tone="bad" icon="close-circle-outline" title="Previous attempt rejected">{kyc?.notes ?? "Please re-check and submit again."}</Banner>}

            <Card>
              <Text style={styles.label}>ID type</Text>
              <View style={styles.grid}>
                {ID_TYPES.map((t) => (
                  <Text
                    key={t.value}
                    onPress={() => setIdType(t.value)}
                    style={[styles.chip, idType === t.value ? styles.chipOn : styles.chipOff]}
                  >
                    {t.label}
                  </Text>
                ))}
              </View>
            </Card>

            <Card>
              <Text style={styles.label}>ID number</Text>
              <TextInput value={idNumber} onChangeText={setIdNumber} placeholder="Number on your document" style={styles.input} autoCapitalize="characters" />
            </Card>
            <Card>
              <Text style={styles.label}>Name on ID</Text>
              <TextInput value={legalName} onChangeText={setLegalName} placeholder="Full name as printed" style={styles.input} />
            </Card>

            {error && <Text style={styles.error}>{error}</Text>}
            <Button title="Submit for verification" loading={busy} onPress={submit} />
            <Text style={styles.fine}>Your ID is used only to verify your identity. In this build, submissions are reviewed manually.</Text>
          </>
        )}
      </ScrollView>
      <QuickNav />
    </View>
  );
}

function Banner({ tone, icon, title, children }: {
  tone: "ok" | "wait" | "bad"; icon: keyof typeof Ionicons.glyphMap; title: string; children: React.ReactNode;
}) {
  const bg = tone === "ok" ? colors.successSoft : tone === "bad" ? colors.errorSoft : colors.brandSoft;
  const fg = tone === "ok" ? colors.success : tone === "bad" ? colors.error : colors.ink;
  return (
    <View style={[styles.banner, { backgroundColor: bg }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Ionicons name={icon} size={22} color={fg} />
        <Text style={[styles.bannerTitle, { color: fg }]}>{title}</Text>
      </View>
      <Text style={styles.bannerBody}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  intro: { color: colors.inkSoft, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: "800", color: colors.muted, textTransform: "uppercase", marginBottom: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { width: "47%", textAlign: "center", borderRadius: radius.md, paddingVertical: 12, fontWeight: "700", overflow: "hidden", borderWidth: 1 },
  chipOn: { backgroundColor: colors.ink, color: colors.white, borderColor: colors.ink },
  chipOff: { backgroundColor: colors.white, color: colors.ink, borderColor: colors.line },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, backgroundColor: colors.white },
  error: { color: colors.error, fontWeight: "600" },
  fine: { color: colors.muted, fontSize: 12, textAlign: "center" },
  banner: { borderRadius: radius.xl, padding: 18 },
  bannerTitle: { fontSize: 17, fontWeight: "900" },
  bannerBody: { marginTop: 8, color: colors.inkSoft, lineHeight: 20 },
});
