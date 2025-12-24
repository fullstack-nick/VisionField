import type { NativeModule } from "react-native";
import { NativeEventEmitter, NativeModules, Platform } from "react-native";
import {
  ENHANCE_CANCELLED_EVENT,
  ENHANCE_COMPLETE_EVENT,
  ENHANCE_ERROR_EVENT,
  ENHANCE_PROGRESS_EVENT,
} from "../../features/enhance/enhance.events";
import type {
  SuperResCancelled,
  SuperResComplete,
  SuperResError,
  SuperResProgress,
  SuperResStartParams,
  SuperResStartResult,
} from "./superres.types";

type SuperResNativeModule = NativeModule & {
  startEnhance(params: SuperResStartParams): Promise<SuperResStartResult>;
  cancelEnhance(jobId: string): Promise<void>;
};

const SuperResModule = NativeModules.SuperRes as SuperResNativeModule | undefined;
const emitter = SuperResModule ? new NativeEventEmitter(SuperResModule) : null;

function requireModule(): SuperResNativeModule {
  if (Platform.OS !== "android") {
    throw new Error("SuperRes is only available on Android.");
  }
  if (!SuperResModule) {
    throw new Error("SuperRes native module is not available.");
  }
  return SuperResModule;
}

export async function startEnhance(params: SuperResStartParams): Promise<SuperResStartResult> {
  const module = requireModule();
  return await module.startEnhance(params);
}

export async function cancelEnhance(jobId: string): Promise<void> {
  const module = requireModule();
  await module.cancelEnhance(jobId);
}

export function addProgressListener(callback: (payload: SuperResProgress) => void) {
  if (!emitter) return { remove: () => {} };
  return emitter.addListener(ENHANCE_PROGRESS_EVENT, callback);
}

export function addCompleteListener(callback: (payload: SuperResComplete) => void) {
  if (!emitter) return { remove: () => {} };
  return emitter.addListener(ENHANCE_COMPLETE_EVENT, callback);
}

export function addErrorListener(callback: (payload: SuperResError) => void) {
  if (!emitter) return { remove: () => {} };
  return emitter.addListener(ENHANCE_ERROR_EVENT, callback);
}

export function addCancelledListener(callback: (payload: SuperResCancelled) => void) {
  if (!emitter) return { remove: () => {} };
  return emitter.addListener(ENHANCE_CANCELLED_EVENT, callback);
}
