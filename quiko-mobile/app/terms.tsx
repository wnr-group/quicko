import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Header } from "@/components/ui";
import { colors } from "@/lib/theme";

const SECTIONS: [string, string][] = [
  ["1. Who can use Quiko", "You must be at least 18 and able to enter a binding contract. You're responsible for keeping your account and phone number secure, and for everything that happens under your account."],
  ["2. How it works", "Senders post a package with its route, weight and a short description. Travellers post trips with spare capacity. When both agree, a match is created. Quiko is a marketplace that introduces the two parties — the delivery itself happens directly between them."],
  ["3. Prohibited items", "You may not send anything illegal, dangerous, perishable or restricted — including cash, weapons, drugs, flammable or hazardous goods, live animals, or counterfeit items. Senders are responsible for their contents; travellers may refuse or inspect any package."],
  ["4. Payments & fees", "The price is calculated automatically from distance, weight and how quickly it must arrive. Payment is held securely until delivery is confirmed with the recipient's OTP, then released to the traveller. Quiko charges a small service fee on each completed delivery."],
  ["5. Cancellations", "Either side may cancel before pickup. Once a delivery is in progress, cancellations are handled case by case. Repeated no-shows may limit your access to the platform."],
  ["6. Responsibility & liability", "Quiko provides the platform but is not a courier and does not take possession of packages. Travellers carry packages at the value declared by the sender. To the extent permitted by law, Quiko is not liable for loss or damage arising from the conduct of users or third parties."],
  ["7. Your conduct", "Be honest and respectful. Don't misrepresent packages or trips, harass other users, or move payments off the platform. We may suspend accounts that break these rules."],
  ["8. Changes to these terms", "We may update these terms from time to time. Material changes will be notified in the app. Continuing to use Quiko means you accept the updated terms."],
  ["9. Contact", "Questions? Email support@quiko.app."],
];

export default function Terms() {
  return (
    <View style={styles.screen}>
      <Header title="Terms & Conditions" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8 }}>
        <Text style={styles.updated}>Last updated: August 2026</Text>
        <Text style={styles.intro}>
          Welcome to Quiko. These terms govern your use of the Quiko peer-to-peer delivery platform, which connects
          people sending packages (&ldquo;Senders&rdquo;) with travellers heading the same way (&ldquo;Travellers&rdquo;). By using Quiko you agree to these terms.
        </Text>
        {SECTIONS.map(([title, body]) => (
          <View key={title} style={{ marginTop: 22 }}>
            <Text style={styles.h2}>{title}</Text>
            <Text style={styles.body}>{body}</Text>
          </View>
        ))}
        <Text style={styles.note}>
          This is a placeholder agreement for the current build and should be reviewed by legal counsel before launch.
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
