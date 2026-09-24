import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colors, radius } from "@/lib/theme";

export default function Login() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("+919000000001");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendCode() {
    setError(null);
    setLoading(true);
    try {
      await api.sendOtp(phone);
      setStep("otp");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send code");
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    setError(null);
    setLoading(true);
    try {
      const res = await api.verifyOtp(phone, code);
      await signIn(res.token);
      router.replace("/(tabs)/home");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={styles.body}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>Q</Text>
          </View>

          <Text style={styles.title}>{step === "phone" ? "Enter your phone" : "Verify your number"}</Text>
          <Text style={styles.subtitle}>
            {step === "phone" ? "We'll text you a 6-digit code to sign in." : `Enter the code sent to ${phone}`}
          </Text>

          <View style={{ height: 24 }} />

          {step === "phone" ? (
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoFocus
              placeholder="+91 99999 00001"
              style={styles.input}
            />
          ) : (
            <TextInput
              value={code}
              onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))}
              keyboardType="number-pad"
              autoFocus
              placeholder="––––––"
              style={[styles.input, styles.otp]}
            />
          )}

          {error && <Text style={styles.error}>{error}</Text>}

          <View style={{ height: 12 }} />

          {step === "phone" ? (
            <Button title="Send Code" onPress={sendCode} loading={loading} disabled={phone.length < 8} />
          ) : (
            <>
              <Button title="Verify & Continue" onPress={verify} loading={loading} disabled={code.length < 4} />
              <Text onPress={() => setStep("phone")} style={styles.link}>
                ← Change number
              </Text>
            </>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            We&rsquo;ll text you a one-time code to sign in.
          </Text>
          <Text style={styles.tc}>
            By continuing, you agree to our{" "}
            <Text style={styles.tcLink} onPress={() => router.push("/terms")}>Terms & Conditions</Text>
            {" "}and{" "}
            <Text style={styles.tcLink} onPress={() => router.push("/privacy")}>Privacy Policy</Text>.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  body: { flex: 1, paddingHorizontal: 28, paddingTop: 40 },
  logo: {
    height: 56, width: 56, borderRadius: radius.md, backgroundColor: colors.ink,
    alignItems: "center", justifyContent: "center",
  },
  logoText: { color: colors.brand, fontSize: 26, fontWeight: "900" },
  title: { marginTop: 28, fontSize: 26, fontWeight: "900", color: colors.ink },
  subtitle: { marginTop: 6, fontSize: 15, color: colors.muted },
  input: {
    borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white,
    borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 16, fontSize: 18, fontWeight: "500",
  },
  otp: { textAlign: "center", fontSize: 30, letterSpacing: 12, fontWeight: "800" },
  error: { marginTop: 10, color: colors.error, fontWeight: "600" },
  link: { marginTop: 14, textAlign: "center", color: colors.muted, fontWeight: "600" },
  footer: { paddingHorizontal: 28, paddingBottom: 24 },
  footerText: {
    backgroundColor: colors.brandSoft, textAlign: "center", color: colors.inkSoft,
    borderRadius: radius.md, paddingVertical: 10, fontSize: 13, fontWeight: "500",
  },
  tc: { marginTop: 12, textAlign: "center", color: colors.muted, fontSize: 11, lineHeight: 16 },
  tcLink: { color: colors.ink, fontWeight: "600", textDecorationLine: "underline" },
});
