import { ActivityIndicator, Image, Text, TouchableOpacity, View } from "react-native";

type Props = {
  previewPhotos: string[];
  onOpenGallery: () => void;
  onCapture: () => void;
  isCapturing?: boolean;
  captureLabel?: string;
};

export default function BottomBar({
  previewPhotos,
  onOpenGallery,
  onCapture,
  isCapturing,
  captureLabel = "Snap",
}: Props) {
  const recent = previewPhotos.slice(0, 3);

  return (
    <View className="absolute bottom-4 left-4 right-4">
      <View className="rounded-2xl bg-white/85 px-4 py-2 shadow-lg shadow-black/10">
        <View className="flex-row items-center justify-center gap-6">
          <TouchableOpacity
            onPress={onOpenGallery}
            className="h-14 w-20 items-center justify-center overflow-hidden rounded-2xl"
          >
            {recent.length ? (
              <View className="flex-row items-center justify-center">
                {recent.map((uri, index) => (
                  <View
                    key={`${uri}-${index}`}
                    className={`h-10 w-10 overflow-hidden rounded-lg border-2 border-white ${index ? "-ml-4" : ""}`}
                  >
                    <Image source={{ uri }} className="h-full w-full" resizeMode="cover" />
                  </View>
                ))}
              </View>
            ) : (
              <Text className="text-xs font-semibold text-gray-700">Gallery</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onCapture}
            disabled={isCapturing}
            className={`h-16 w-16 items-center justify-center rounded-full border-4 border-white ${isCapturing ? "bg-gray-400" : "bg-blue-500"}`}
          >
            {isCapturing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-base font-bold text-white">{captureLabel}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
