import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as FileSystem from "expo-file-system/legacy";
import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { saveToGallery } from "../../shared/image/saveToGallery";
import { RootStackParamList } from "../navigation/types";

type ScanNav = NativeStackNavigationProp<RootStackParamList, "ScanResult">;
type ScanRoute = RouteProp<RootStackParamList, "ScanResult">;

const buildFileUri = (baseDir: string, prefix: string, extension: string) =>
  `${baseDir}${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}.${extension}`;

const getWritableDirectory = (preferCache = false) => {
  if (preferCache) {
    return FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  }
  return FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
};

const copyWithFallback = async (from: string, to: string) => {
  try {
    await FileSystem.copyAsync({ from, to });
  } catch {
    const data = await FileSystem.readAsStringAsync(from, { encoding: FileSystem.EncodingType.Base64 });
    await FileSystem.writeAsStringAsync(to, data, { encoding: FileSystem.EncodingType.Base64 });
  }
};

const ensureFileUri = async (uri: string, extension: string, prefix: string) => {
  if (uri.startsWith("file://")) {
    return uri;
  }

  const baseDir = getWritableDirectory(true);
  if (!baseDir) {
    throw new Error("No writable directory available.");
  }

  const target = buildFileUri(baseDir, prefix, extension);
  await copyWithFallback(uri, target);
  return target;
};

const copyToDocuments = async (uri: string, extension: string) => {
  if (Platform.OS === "android") {
    const { StorageAccessFramework } = FileSystem;
    const downloadsUri = StorageAccessFramework.getUriForDirectoryInRoot("Download");
    const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync(downloadsUri);
    if (!permissions.granted) {
      throw new Error("Storage permission not granted.");
    }

    const fileName = `VisionField_${Date.now()}.${extension}`;
    const mimeType = extension === "pdf" ? "application/pdf" : "application/octet-stream";
    const target = await StorageAccessFramework.createFileAsync(permissions.directoryUri, fileName, mimeType);
    await copyWithFallback(uri, target);
    return target;
  }

  const baseDir = getWritableDirectory();
  if (baseDir) {
    const target = buildFileUri(baseDir, "scan", extension);
    await copyWithFallback(uri, target);
    return target;
  }

  throw new Error("No writable directory available.");
};

export default function ScanResultScreen() {
  const navigation = useNavigation<ScanNav>();
  const route = useRoute<ScanRoute>();
  const { pages, pdf } = route.params;

  const [savingImages, setSavingImages] = useState(false);
  const [savingPdf, setSavingPdf] = useState(false);

  const hasPages = useMemo(() => (pages ?? []).length > 0, [pages]);
  const pdfUri = pdf?.uri ?? null;

  const handleSaveImages = async () => {
    if (!hasPages) return;
    try {
      setSavingImages(true);
      const assets = pages ?? [];
      for (let index = 0; index < assets.length; index += 1) {
        const source = assets[index];
        const fileUri = await ensureFileUri(source, "jpg", `scan_page_${index}`);
        await saveToGallery(fileUri);
      }
      Alert.alert("Saved", "Scanned images saved to your gallery.");
    } catch (error) {
      console.error(error);
      Alert.alert("Save failed", "Unable to save scanned images. Please try again.");
    } finally {
      setSavingImages(false);
    }
  };

  const handleSavePdf = async () => {
    if (!pdfUri) return;
    try {
      setSavingPdf(true);
      await copyToDocuments(pdfUri, "pdf");
      Alert.alert("Saved", "PDF saved.");
    } catch (error) {
      console.error(error);
      Alert.alert("Save failed", "Unable to save PDF. Please try again.");
    } finally {
      setSavingPdf(false);
    }
  };

  return (
    <View className="flex-1 bg-white px-4 pt-4">
      <Text className="text-sm font-semibold uppercase text-gray-500">Scan Result</Text>
      <Text className="mt-1 text-2xl font-bold text-gray-900">Preview</Text>

      <View className="mt-4 flex-1">
        {hasPages ? (
          <ScrollView contentContainerStyle={{ gap: 12 }}>
            {pages?.map((uri, index) => (
              <Image
                key={`${uri}-${index}`}
                source={{ uri }}
                className="h-64 w-full rounded-xl border border-gray-200 bg-black/5"
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        ) : (
          <View className="flex-1 items-center justify-center rounded-xl border border-dashed border-gray-300">
            <Text className="text-sm text-gray-500">No pages available.</Text>
          </View>
        )}
      </View>

      <View className="flex-row gap-3 pb-8 pt-4">
        <TouchableOpacity
          className="flex-1 rounded-full border border-gray-300 px-4 py-3"
          onPress={() => navigation.popToTop()}
          disabled={savingImages || savingPdf}
        >
          <Text className="text-center text-base font-semibold text-gray-700">Discard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 rounded-full px-4 py-3 ${hasPages && !savingImages ? "bg-blue-600" : "bg-gray-300"}`}
          onPress={handleSaveImages}
          disabled={!hasPages || savingImages}
        >
          {savingImages ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-center text-base font-semibold text-white">Save Images</Text>
          )}
        </TouchableOpacity>
      </View>

      <View className="pb-8">
        <TouchableOpacity
          className={`rounded-full px-4 py-3 ${pdfUri && !savingPdf ? "bg-gray-900" : "bg-gray-300"}`}
          onPress={handleSavePdf}
          disabled={!pdfUri || savingPdf}
        >
          {savingPdf ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-center text-base font-semibold text-white">Save PDF</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
