import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Header } from "@/components/ui";
import { colors } from "@/lib/theme";

const SECTIONS: [string, string][] = [
  ["1. Information we collect", "Your phone number (to sign in), your name and email, and the pickup and drop-off locations you pin for packages and trips. We also keep records of your requests, matches, deliveries and ratings."],
  ["2. How we use it", "To create your account, match you with the other side of a delivery, calculate prices, process payments, send you updates, and keep the platform safe from fraud and misuse."],
  ["3. What we share", "When you match with someone, we share the details needed to complete the delivery — names, the route, and the receiver's contact for hand-off. We use trusted providers (SMS, maps, payments) that process data on our behalf. We do not sell your data."],
  ["4. Location data", "Pickup and destination pins are used to match routes and estimate distance and price. We use a map provider to turn coordinates into readable place names. We don't track your live location in the background."],
  ["5. Data retention", "We keep your information for as long as your account is active and as needed to provide the service, resolve disputes, and meet legal obligations."],
  ["6. Your rights", "You can view and edit your name and email in your profile at any time. You may request a copy of your data or ask us to delete your account by contacting us."],
  ["7. Security", "We protect your account with one-time-code sign-in and store data securely. No system is perfectly secure, so please keep your phone and account safe."],
  ["8. Changes", "We may update this policy as Quiko evolves. Material changes will be notified in the app."],
  ["9. Contact", "Privacy questions? Email privacy@quiko.app."],
];

export default function Privacy() {
  return (
    <View style={styles.screen}>
      <Header title="Privacy Policy" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8 }}>
        <Text style={styles.updated}>Last updated: August 2026</Text>
        <Text style={styles.intro}>
          This policy explains what information Quiko collects, how we use it, and the choices you have. We collect only
          what we need to match Senders and Travellers and complete deliveries safely.
        </Text>
        {SECTIONS.map(([title, body]) => (
          <View key={title} style={{ marginTop: 22 }}>
            <Text style={styles.h2}>{title}</Text>
            <Text style={styles.body}>{body}</Text>
          </View>
        ))}
        <Text style={styles.note}>
          This is a placeholder policy for the current build and should be reviewed by legal counsel before launch.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  updated: { fontSize: 13, color: colors.muted },
  intro: { marginTop: 12, fontSize: 14, lineHeight: 21, color: colors.inkSoft },
  h2: { fontSize: 15, fontWeight: "800", color: colors.ink },
  body: { marginTop: 6, fontSize: 14, lineHeight: 21, color: colors.inkSoft },
  note: { marginTop: 28, backgroundColor: colors.line, borderRadius: 12, padding: 12, fontSize: 12, lineHeight: 18, color: colors.muted },
});
