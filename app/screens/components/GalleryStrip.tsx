import { useCallback } from "react";
import { FlatList, Image, Text, TouchableOpacity, View } from "react-native";

type Props = {
  photos: string[];
  onSelect: (uri: string) => void;
};

export default function GalleryStrip({ photos, onSelect }: Props) {
  const renderItem = useCallback(
    ({ item }: { item: string }) => (
      <TouchableOpacity className="mr-3 overflow-hidden rounded-lg border border-gray-200" onPress={() => onSelect(item)}>
        <Image source={{ uri: item }} className="h-16 w-16" resizeMode="cover" />
      </TouchableOpacity>
    ),
    [onSelect]
  );

  if (!photos.length) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-xs text-gray-500">No recent photos</Text>
      </View>
    );
  }

  return (
    <FlatList
      horizontal
      data={photos}
      renderItem={renderItem}
      keyExtractor={(uri) => uri}
      showsHorizontalScrollIndicator={false}
      className="flex-1"
    />
  );
}
