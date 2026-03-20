import { Link, Stack } from "expo-router";
import { View, Text } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>This screen doesn’t exist.</Text>
        <Link href="/" style={{ marginTop: 12 }}>
          Go to home
        </Link>
      </View>
    </>
  );
}
