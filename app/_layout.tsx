import "../global.css";
import { Stack } from "expo-router";
import { View } from "react-native";

export default function RootLayout() {
  return (
    <View className="flex-1 bg-white">
      <View className="h-7 bg-white" />
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}
