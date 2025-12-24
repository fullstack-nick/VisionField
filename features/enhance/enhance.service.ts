import {
  addCancelledListener,
  addCompleteListener,
  addErrorListener,
  addProgressListener,
  cancelEnhance,
  startEnhance,
} from "../../native/superres";
import type {
  EnhanceCancelled,
  EnhanceComplete,
  EnhanceError,
  EnhanceProgress,
  EnhanceStartParams,
} from "./enhance.types";

export async function startEnhanceJob(params: EnhanceStartParams) {
  return await startEnhance(params);
}

export async function cancelEnhanceJob(jobId: string) {
  await cancelEnhance(jobId);
}

export function onEnhanceProgress(callback: (payload: EnhanceProgress) => void) {
  return addProgressListener(callback);
}

export function onEnhanceComplete(callback: (payload: EnhanceComplete) => void) {
  return addCompleteListener(callback);
}

export function onEnhanceError(callback: (payload: EnhanceError) => void) {
  return addErrorListener(callback);
}

export function onEnhanceCancelled(callback: (payload: EnhanceCancelled) => void) {
  return addCancelledListener(callback);
}
