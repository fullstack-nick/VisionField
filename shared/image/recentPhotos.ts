import * as MediaLibrary from "expo-media-library";

export async function fetchRecentPhotos(limit = 12) {
  const permission = await MediaLibrary.getPermissionsAsync();
  if (!permission.granted || permission.accessPrivileges === "none") {
    return [];
  }

  const result = await MediaLibrary.getAssetsAsync({
    first: limit,
    mediaType: MediaLibrary.MediaType.photo,
    sortBy: MediaLibrary.SortBy.creationTime,
  });

  const assets = result.assets ?? [];
  return assets
    .map((asset) => asset.uri)
    .filter(Boolean) as string[];
}
