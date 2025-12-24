import { Paths } from "expo-file-system";

const CROPPED_PREFIX = "cropped_";

export function getTempCroppedPath(extension = "jpg") {
  const sanitizedExt = extension.replace(".", "");
  const base = ensureTrailingSlash(Paths.cache.uri);
  return `${base}${CROPPED_PREFIX}${Date.now()}.${sanitizedExt}`;
}

export function getFileExtension(uri: string) {
  const match = uri.match(/\.([a-zA-Z0-9]+)(?:\?|#)?/);
  return match?.[1] ?? null;
}

export function withExtension(uri: string, fallback = "jpg") {
  if (getFileExtension(uri)) return uri;
  return `${uri}.${fallback}`;
}

function ensureTrailingSlash(uri: string) {
  return uri.endsWith("/") ? uri : `${uri}/`;
}
