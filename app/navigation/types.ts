export type ToolKey = "enhance" | "ocr" | "scan";

export type ViewMode = "buttons" | "camera";

export type RootStackParamList = {
  Home: undefined;
  Crop: { imageUri: string; tool: ToolKey };
  EnhanceProgress: { imageUri: string };
  Result: { imageUri: string; tool: ToolKey };
  OcrResult: { imageUri: string };
  ScanResult: { pages: string[] | null; pdf: { uri: string; pageCount: number } | null };
};

export default function TypesRoutePlaceholder() {
  return null;
}
