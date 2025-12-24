import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  PanResponder,
  SafeAreaView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { RootStackParamList } from "../navigation/types";

type CropNav = NativeStackNavigationProp<RootStackParamList, "Crop">;
type CropRoute = RouteProp<RootStackParamList, "Crop">;

type CropBox = { top: number; left: number; right: number; bottom: number };

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const defaultCropBox: CropBox = { top: 0.06, left: 0.06, right: 0.94, bottom: 0.94 };

export default function CropScreen() {
  const navigation = useNavigation<CropNav>();
  const route = useRoute<CropRoute>();
  const { imageUri, tool } = route.params;

  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [cropping, setCropping] = useState(false);
  const [box, setBox] = useState<CropBox>(defaultCropBox);
  const boxRef = useRef<CropBox>(box);
  const startBox = useRef<CropBox>(box);
  const sizeRef = useRef({ width: 0, height: 0 });
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  useEffect(() => {
    Image.getSize(
      imageUri,
      (width, height) => setImageSize({ width, height }),
      () => setImageSize({ width: 1000, height: 1000 })
    );
  }, [imageUri]);

  useEffect(() => {
    setBox(defaultCropBox);
  }, [imageUri]);

  const aspectRatio = useMemo(() => {
    if (!imageSize) return 1;
    return imageSize.width / imageSize.height;
  }, [imageSize]);

  const { displayWidth, displayHeight } = useMemo(() => {
    const paddedWidth = windowWidth - 32;
    const maxHeight = windowHeight * 0.65;
    let width = paddedWidth;
    let height = aspectRatio ? paddedWidth / aspectRatio : paddedWidth;

    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }

    return { displayWidth: width, displayHeight: height };
  }, [aspectRatio, windowHeight, windowWidth]);

  useEffect(() => {
    boxRef.current = box;
  }, [box]);

  useEffect(() => {
    sizeRef.current = { width: displayWidth, height: displayHeight };
  }, [displayWidth, displayHeight]);

  const createPanResponder = useCallback((corner: "tl" | "tr" | "bl" | "br") => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        startBox.current = boxRef.current;
      },
      onPanResponderMove: (_, gesture) => {
        const { width, height } = sizeRef.current;
        if (!width || !height) return;

        const base = startBox.current;
        if (!base) return;

        const dx = gesture.dx / width;
        const dy = gesture.dy / height;
        const minGap = 0.15;

        const next: CropBox = { ...base };

        if (corner === "tl" || corner === "bl") {
          next.left = clamp(base.left + dx, 0, base.right - minGap);
        }
        if (corner === "tr" || corner === "br") {
          next.right = clamp(base.right + dx, next.left + minGap, 1);
        }
        if (corner === "tl" || corner === "tr") {
          next.top = clamp(base.top + dy, 0, base.bottom - minGap);
        }
        if (corner === "bl" || corner === "br") {
          next.bottom = clamp(base.bottom + dy, next.top + minGap, 1);
        }

        setBox(next);
      },
    });
  }, []);

  const topLeft = useMemo(() => createPanResponder("tl"), [createPanResponder]);
  const topRight = useMemo(() => createPanResponder("tr"), [createPanResponder]);
  const bottomLeft = useMemo(() => createPanResponder("bl"), [createPanResponder]);
  const bottomRight = useMemo(() => createPanResponder("br"), [createPanResponder]);

  const handleConfirm = async () => {
    if (!imageSize) return;
    try {
      setCropping(true);
      const cropWidth = Math.max(1, Math.round((box.right - box.left) * imageSize.width));
      const cropHeight = Math.max(1, Math.round((box.bottom - box.top) * imageSize.height));
      const originX = Math.max(0, Math.round(box.left * imageSize.width));
      const originY = Math.max(0, Math.round(box.top * imageSize.height));

      const manipulated = await manipulateAsync(
        imageUri,
        [{ crop: { originX, originY, width: cropWidth, height: cropHeight } }],
        { compress: 1, format: SaveFormat.JPEG }
      );

      if (tool === "ocr") {
        navigation.navigate("OcrResult", { imageUri: manipulated.uri });
      } else if (tool === "enhance") {
        navigation.navigate("EnhanceProgress", { imageUri: manipulated.uri });
      } else {
        navigation.navigate("Result", { imageUri: manipulated.uri, tool });
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Crop failed", "Unable to crop this image. Please try again.");
    } finally {
      setCropping(false);
    }
  };

  const cropRect = useMemo(() => {
    const width = (box.right - box.left) * displayWidth;
    const height = (box.bottom - box.top) * displayHeight;
    const left = box.left * displayWidth;
    const top = box.top * displayHeight;
    return { width, height, left, top };
  }, [box, displayHeight, displayWidth]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="items-center px-4 pt-4">
        <Text className="text-lg font-bold text-gray-900">Adjust Crop</Text>
      </View>

      <View className="flex-1 items-center justify-center px-4">
        {!imageSize ? (
          <ActivityIndicator />
        ) : (
          <View style={{ width: displayWidth, height: displayHeight }} className="overflow-hidden rounded-xl bg-black">
            <Image
              source={{ uri: imageUri }}
              style={{ width: displayWidth, height: displayHeight }}
              resizeMode="contain"
            />
            <View className="absolute inset-0">
              <View
                className="absolute bg-black/40"
                style={{ top: 0, left: 0, right: 0, height: cropRect.top }}
              />
              <View
                className="absolute bg-black/40"
                style={{ top: cropRect.top, left: 0, width: cropRect.left, height: cropRect.height }}
              />
              <View
                className="absolute bg-black/40"
                style={{
                  top: cropRect.top,
                  left: cropRect.left + cropRect.width,
                  right: 0,
                  height: cropRect.height,
                }}
              />
              <View
                className="absolute bg-black/40"
                style={{
                  top: cropRect.top + cropRect.height,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              />

              <View
                className="absolute rounded-xl border-2 border-white"
                style={{
                  width: cropRect.width,
                  height: cropRect.height,
                  left: cropRect.left,
                  top: cropRect.top,
                }}
              />

              <View
                {...topLeft.panHandlers}
                className="absolute h-6 w-6 rounded-full border-2 border-white bg-blue-500"
                style={{ left: cropRect.left, top: cropRect.top, marginLeft: -12, marginTop: -12 }}
              />
              <View
                {...topRight.panHandlers}
                className="absolute h-6 w-6 rounded-full border-2 border-white bg-blue-500"
                style={{ left: cropRect.left + cropRect.width, top: cropRect.top, marginLeft: -12, marginTop: -12 }}
              />
              <View
                {...bottomLeft.panHandlers}
                className="absolute h-6 w-6 rounded-full border-2 border-white bg-blue-500"
                style={{
                  left: cropRect.left,
                  top: cropRect.top + cropRect.height,
                  marginLeft: -12,
                  marginTop: -12,
                }}
              />
              <View
                {...bottomRight.panHandlers}
                className="absolute h-6 w-6 rounded-full border-2 border-white bg-blue-500"
                style={{
                  left: cropRect.left + cropRect.width,
                  top: cropRect.top + cropRect.height,
                  marginLeft: -12,
                  marginTop: -12,
                }}
              />
            </View>
          </View>
        )}
      </View>

      <View className="flex-row justify-center gap-3 px-4 pb-8">
        <TouchableOpacity
          className="flex-1 rounded-full border border-blue-600 px-4 py-3"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-center text-base font-semibold text-blue-600">Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 rounded-full px-4 py-3 ${cropping ? "bg-gray-400" : "bg-blue-600"}`}
          onPress={handleConfirm}
          disabled={cropping}
        >
          <Text className="text-center text-base font-semibold text-white">
            {cropping ? "Cropping..." : "Use Crop"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
