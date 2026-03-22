import { Redirect, Stack } from "expo-router";
import { useDailyReset } from "@/hooks/useDailyReset";
import { useAuth } from "@/hooks/useAuth";
import { useSync } from "@/hooks/useSync";
import { COLORS, FONTS } from "@/constants/theme";
import { Text, View } from "react-native";

export default function AppLayout() {
  useDailyReset();
  const { isLoading, session } = useAuth();
  useSync(Boolean(session));

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.background }}>
        <Text style={{ color: COLORS.mutedForeground, fontFamily: FONTS.body }}>Loading session...</Text>
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/welcome" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
