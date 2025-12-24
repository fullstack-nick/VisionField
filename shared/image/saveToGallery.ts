import * as MediaLibrary from "expo-media-library";

export async function saveToGallery(uri: string, albumName = "VisionField") {
  const asset = await MediaLibrary.createAssetAsync(uri);

  try {
    await MediaLibrary.createAlbumAsync(albumName, asset, false);
  } catch {
    // Album might already exist; ensure the asset is still saved.
    await MediaLibrary.saveToLibraryAsync(uri);
  }

  return asset;
}
