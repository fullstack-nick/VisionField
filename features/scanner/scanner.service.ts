import { launchDocumentScannerAsync } from "@infinitered/react-native-mlkit-document-scanner";
import type { DocumentScannerOptions, DocumentScannerResult } from "./scanner.types";
import { ResultFormatOptions, ScannerModeOptions } from "./scanner.types";

const defaultOptions: DocumentScannerOptions = {
  pageLimit: 1,
  galleryImportAllowed: false,
  scannerMode: ScannerModeOptions.FULL,
  resultFormats: ResultFormatOptions.ALL,
};

export async function scanDocument(options?: DocumentScannerOptions): Promise<DocumentScannerResult> {
  const result = await launchDocumentScannerAsync({ ...defaultOptions, ...options });
  return normalizeScannerResult(result);
}

function normalizeScannerResult(result: DocumentScannerResult): DocumentScannerResult {
  if (result.canceled) {
    return result;
  }

  return {
    ...result,
    pages: result.pages?.filter(Boolean) ?? null,
    pdf: result.pdf ?? null,
  };
}
