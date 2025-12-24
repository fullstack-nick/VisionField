import { CameraType, CameraView } from "expo-camera";
import { MutableRefObject } from "react";
import { StyleSheet, View } from "react-native";

type Props = {
  cameraRef: MutableRefObject<CameraView | null>;
  facing?: CameraType;
};

export default function CameraPreview({ cameraRef, facing = "back" }: Props) {
  return (
    <View className="flex-1 overflow-hidden rounded-2xl bg-black">
      <CameraView ref={cameraRef} facing={facing} mode="picture" style={StyleSheet.absoluteFillObject} />
    </View>
  );
}
