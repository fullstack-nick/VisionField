import { Camera } from "expo-camera";
import * as MediaLibrary from "expo-media-library";

type GenericStatus = "undetermined" | "granted" | "denied" | "limited";

export type PermissionState = {
  camera: Awaited<ReturnType<typeof Camera.getCameraPermissionsAsync>>;
  mediaLibrary: Awaited<ReturnType<typeof MediaLibrary.getPermissionsAsync>>;
};

const isGranted = (status: GenericStatus) => status === "granted" || status === "limited";

export async function checkPermissions(): Promise<PermissionState> {
  const [camera, mediaLibrary] = await Promise.all([
    Camera.getCameraPermissionsAsync(),
    MediaLibrary.getPermissionsAsync(),
  ]);

  return { camera, mediaLibrary };
}

export async function requestPermissions(): Promise<PermissionState> {
  const camera = await Camera.requestCameraPermissionsAsync();
  const mediaLibrary = await MediaLibrary.requestPermissionsAsync();

  return { camera, mediaLibrary };
}

export function permissionsReady(state: PermissionState) {
  return isGranted(state.camera.status as GenericStatus) && isGranted(state.mediaLibrary.status as GenericStatus);
}

export function formatPermissionState(state: PermissionState) {
  return {
    cameraGranted: isGranted(state.camera.status as GenericStatus),
    mediaGranted: isGranted(state.mediaLibrary.status as GenericStatus),
  };
}
