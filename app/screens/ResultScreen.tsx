import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState } from "react";
import { Alert, Image, SafeAreaView, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { saveToGallery } from "../../shared/image/saveToGallery";
import { RootStackParamList } from "../navigation/types";

type ResultNav = NativeStackNavigationProp<RootStackParamList, "Result">;
type ResultRoute = RouteProp<RootStackParamList, "Result">;

export default function ResultScreen() {
  const navigation = useNavigation<ResultNav>();
  const route = useRoute<ResultRoute>();
  const { imageUri, tool } = route.params;
  const { width } = useWindowDimensions();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await saveToGallery(imageUri);
      Alert.alert("Saved", "Image saved to your gallery.");
    } catch (error) {
      console.error(error);
      Alert.alert("Save failed", "Unable to save this image. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    navigation.popToTop();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-4 pt-4">
        <Text className="text-sm font-semibold uppercase text-gray-500">Result</Text>
        <Text className="mt-1 text-2xl font-bold text-gray-900">Preview</Text>
        <Text className="mt-1 text-sm text-gray-600">Tool: {tool}</Text>
      </View>

      <View className="flex-1 items-center justify-center px-4">
        <Image
          source={{ uri: imageUri }}
          style={{ width: width - 32, height: width - 32 }}
          resizeMode="contain"
          className="rounded-xl border border-gray-200 bg-black/5"
        />
      </View>

      <View className="flex-row gap-3 px-4 pb-8">
        <TouchableOpacity
          className="flex-1 rounded-full border border-gray-300 px-4 py-3"
          onPress={handleDiscard}
          disabled={saving}
        >
          <Text className="text-center text-base font-semibold text-gray-700">Discard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 rounded-full px-4 py-3 ${saving ? "bg-gray-400" : "bg-blue-600"}`}
          onPress={handleSave}
          disabled={saving}
        >
          <Text className="text-center text-base font-semibold text-white">{saving ? "Saving..." : "Save"}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
