import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
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
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      try {
        const msg = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (msg?.type === "select") onConfirm({ lat: msg.lat, lng: msg.lng, label: msg.label });
      } catch {}
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [onConfirm]);

  return (
    <View style={styles.overlay}>
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={10} style={styles.iconBtn}>
          <Ionicons name="close" size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.iconBtn} />
      </View>
      {/* Raw DOM iframe — valid in Expo web (react-native-web renders to react-dom). */}
      <iframe
        title="map"
        srcDoc={leafletHtml(initial?.lat, initial?.lng)}
        style={{ border: "none", flex: 1, width: "100%" }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.canvas, zIndex: 1000 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8 },
  iconBtn: { height: 40, width: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  title: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "800", color: colors.ink },
});
