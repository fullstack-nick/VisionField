import { recognizeText } from "@infinitered/react-native-mlkit-text-recognition";
import type { Text } from "./ocr.types";

export async function runOcr(imageUri: string): Promise<Text> {
  const imagePath = normalizeImagePath(imageUri);
  return await recognizeText(imagePath);
}

function normalizeImagePath(uri: string) {
  if (!uri) {
    return uri;
  }

  if (uri.startsWith("file://") || uri.startsWith("content://")) {
    return uri;
  }

  return `file://${uri}`;
}
