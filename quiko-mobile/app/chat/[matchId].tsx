import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Header } from "@/components/ui";
import { QuickNav } from "@/components/QuickNav";
import { api, Message, Thread } from "@/lib/api";
import { colors, radius } from "@/lib/theme";

export default function Chat() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const [thread, setThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scroller = useRef<ScrollView>(null);

  useEffect(() => {
    api.thread(String(matchId)).then((t) => {
      setThread(t);
      setMessages(t.messages);
    }).catch(() => {});
  }, [matchId]);

  async function send() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setText("");
    // optimistic append (mock has no realtime backend)
    const optimistic: Message = { id: `local-${messages.length}`, mine: true, body, at: "now" };
    setMessages((prev) => [...prev, optimistic]);
    try {
      await api.sendMessage(String(matchId), body);
    } finally {
      setSending(false);
      requestAnimationFrame(() => scroller.current?.scrollToEnd({ animated: true }));
    }
  }

  return (
    <View style={styles.screen}>
      <Header title={thread?.counterpartName ?? "Chat"} />
      {thread && (
        <View style={styles.routeBar}>
          <Text style={styles.routeText}>{thread.fromCity} → {thread.toCity}</Text>
        </View>
      )}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          ref={scroller}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: false })}
        >
          {messages.map((msg) => (
            <View key={msg.id} style={[styles.row, { justifyContent: msg.mine ? "flex-end" : "flex-start" }]}>
              <View style={[styles.bubble, msg.mine ? styles.mine : styles.theirs]}>
                <Text style={[styles.body, { color: msg.mine ? colors.white : colors.ink }]}>{msg.body}</Text>
                <Text style={[styles.time, { color: msg.mine ? "rgba(255,255,255,0.5)" : colors.muted }]}>{msg.at}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.composer}>
          <TextInput
            value={text} onChangeText={setText} placeholder="Message…" multiline
            style={styles.input} onSubmitEditing={send}
          />
          <Pressable onPress={send} disabled={!text.trim()} style={[styles.send, { opacity: text.trim() ? 1 : 0.4 }]}>
            <Ionicons name="arrow-up" size={20} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
      <QuickNav />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  routeBar: { paddingHorizontal: 20, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.white },
  routeText: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  row: { flexDirection: "row" },
  bubble: { maxWidth: "78%", borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 8 },
  mine: { backgroundColor: colors.ink, borderBottomRightRadius: 6 },
  theirs: { backgroundColor: colors.white, borderBottomLeftRadius: 6 },
  body: { fontSize: 15 },
  time: { fontSize: 10, textAlign: "right", marginTop: 2 },
  composer: { flexDirection: "row", alignItems: "flex-end", gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.white },
  input: { flex: 1, maxHeight: 100, minHeight: 44, backgroundColor: colors.canvas, borderRadius: radius.lg, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15 },
  send: { height: 44, width: 44, borderRadius: 22, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
});
