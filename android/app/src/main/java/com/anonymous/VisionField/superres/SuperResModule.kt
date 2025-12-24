package com.anonymous.VisionField.superres

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

class SuperResModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  companion object {
    const val NAME = "SuperRes"
    const val EVENT_PROGRESS = "enhanceProgress"
    const val EVENT_COMPLETE = "enhanceComplete"
    const val EVENT_ERROR = "enhanceError"
    const val EVENT_CANCELLED = "enhanceCancelled"
  }

  private val workers = ConcurrentHashMap<String, SuperResWorker>()

  override fun getName(): String = NAME

  @ReactMethod
  fun startEnhance(params: ReadableMap, promise: Promise) {
    val imageUri = params.getString("imageUri")
    if (imageUri.isNullOrBlank()) {
      promise.reject("E_INVALID_INPUT", "imageUri is required")
      return
    }

    val jobId = UUID.randomUUID().toString()
    val worker = SuperResWorker(
      context = reactContext,
      jobId = jobId,
      inputUri = imageUri,
      onProgress = { payload -> emitEvent(EVENT_PROGRESS, payload) },
      onComplete = { payload ->
        emitEvent(EVENT_COMPLETE, payload)
        workers.remove(jobId)
      },
      onError = { payload ->
        emitEvent(EVENT_ERROR, payload)
        workers.remove(jobId)
      },
      onCancelled = { payload ->
        emitEvent(EVENT_CANCELLED, payload)
        workers.remove(jobId)
      },
    )

    workers[jobId] = worker
    worker.start()

    val result = Arguments.createMap().apply {
      putString("jobId", jobId)
    }
    promise.resolve(result)
  }

  @ReactMethod
  fun cancelEnhance(jobId: String, promise: Promise) {
    val worker = workers[jobId]
    if (worker != null) {
      worker.cancel()
    }
    promise.resolve(null)
  }

  @ReactMethod
  fun addListener(eventName: String) {
    // Required for RN event emitter.
  }

  @ReactMethod
  fun removeListeners(count: Int) {
    // Required for RN event emitter.
  }

  private fun emitEvent(eventName: String, payload: com.facebook.react.bridge.WritableMap) {
    reactContext.runOnUiQueueThread {
      reactContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit(eventName, payload)
    }
  }
}
