import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/lib/auth";
import { colors } from "@/lib/theme";

// Entry gate: wait for the stored token to load, then route to app or login.
export default function Index() {
  const { token, ready } = useAuth();

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.canvas }}>
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  }
  return <Redirect href={token ? "/(tabs)/home" : "/(auth)/login"} />;
}
