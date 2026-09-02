import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { leafletHtml } from "@/lib/leafletHtml";
import { colors } from "@/lib/theme";

export type PickedLocation = { lat: number; lng: number; label: string };

export function LocationSheet({
  title, initial, onConfirm, onClose,
}: {
  title: string;
  initial?: { lat: number; lng: number } | null;
  onConfirm: (loc: PickedLocation) => void;
  onClose: () => void;
}) {
  return (
    <Modal animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={10} style={styles.iconBtn}>
            <Ionicons name="close" size={22} color={colors.ink} />
          </Pressable>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.iconBtn} />
        </View>
        <WebView
          originWhitelist={["*"]}
          javaScriptEnabled
          domStorageEnabled
          source={{ html: leafletHtml(initial?.lat, initial?.lng) }}
          onMessage={(e) => {
            try {
              const msg = JSON.parse(e.nativeEvent.data);
              if (msg?.type === "select") onConfirm({ lat: msg.lat, lng: msg.lng, label: msg.label });
            } catch {}
          }}
          style={{ flex: 1 }}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8 },
  iconBtn: { height: 40, width: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  title: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "800", color: colors.ink },
});
