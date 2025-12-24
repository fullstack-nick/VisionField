import * as ImagePicker from "expo-image-picker";

export async function pickImageFromLibrary() {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: false,
    quality: 1,
  });

  if (result.canceled || !result.assets?.length) {
    return null;
  }

  const asset = result.assets[0];
  return { uri: asset.uri, width: asset.width, height: asset.height };
}
