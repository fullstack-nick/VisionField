import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { RootStackParamList } from "../navigation/types";
import { runOcr } from "../../features/ocr/ocr.service";

type OcrNav = NativeStackNavigationProp<RootStackParamList, "OcrResult">;
type OcrRoute = RouteProp<RootStackParamList, "OcrResult">;

export default function OcrResultScreen() {
  const navigation = useNavigation<OcrNav>();
  const route = useRoute<OcrRoute>();
  const { imageUri } = route.params;

  const [loading, setLoading] = useState(true);
  const [recognizedText, setRecognizedText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const result = await runOcr(imageUri);
        if (mounted) {
          setRecognizedText(result.text ?? "");
        }
      } catch (error) {
        console.error(error);
        if (mounted) {
          setErrorMessage("Unable to recognize text. Please try again.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [imageUri]);

  const hasText = useMemo(() => recognizedText.trim().length > 0, [recognizedText]);

  const handleCopy = async () => {
    if (!hasText) return;
    try {
      await Clipboard.setStringAsync(recognizedText);
      Alert.alert("Copied", "Recognized text copied to clipboard.");
    } catch (error) {
      console.error(error);
      Alert.alert("Copy failed", "Could not copy text. Please try again.");
    }
  };

  return (
    <View className="flex-1 bg-white px-4 pt-4">
      <Text className="text-sm font-semibold uppercase text-gray-500">OCR Result</Text>
      <Text className="mt-1 text-2xl font-bold text-gray-900">Recognized Text</Text>

      <View className="mt-4 flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator />
            <Text className="mt-3 text-sm text-gray-500">Analyzing image...</Text>
          </View>
        ) : errorMessage ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-sm text-gray-600">{errorMessage}</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text className="text-base text-gray-800">{hasText ? recognizedText : "No text detected."}</Text>
          </ScrollView>
        )}
      </View>

      <View className="flex-row gap-3 pb-8 pt-4">
        <TouchableOpacity
          className="flex-1 rounded-full border border-gray-300 px-4 py-3"
          onPress={() => navigation.popToTop()}
        >
          <Text className="text-center text-base font-semibold text-gray-700">Discard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 rounded-full px-4 py-3 ${hasText ? "bg-blue-600" : "bg-gray-300"}`}
          onPress={handleCopy}
          disabled={!hasText}
        >
          <Text className="text-center text-base font-semibold text-white">Copy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
