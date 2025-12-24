import { CameraCapturedPicture, CameraView } from "expo-camera";
import { MutableRefObject } from "react";

export async function capturePhoto(cameraRef: MutableRefObject<CameraView | null>): Promise<CameraCapturedPicture> {
  if (!cameraRef.current) {
    throw new Error("Camera is not ready yet");
  }

  const photo = await cameraRef.current.takePictureAsync({
    quality: 1,
    skipProcessing: true,
  });

  return photo;
}
