package com.anonymous.VisionField.superres

import android.content.Context
import com.facebook.react.bridge.Arguments
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.FloatBuffer
import java.util.concurrent.atomic.AtomicBoolean
import kotlin.concurrent.thread

class SuperResWorker(
  private val context: Context,
  private val jobId: String,
  private val inputUri: String,
  private val onProgress: (com.facebook.react.bridge.WritableMap) -> Unit,
  private val onComplete: (com.facebook.react.bridge.WritableMap) -> Unit,
  private val onError: (com.facebook.react.bridge.WritableMap) -> Unit,
  private val onCancelled: (com.facebook.react.bridge.WritableMap) -> Unit,
) {
  companion object {
    private const val SCALE = 4
    private const val TILE_SIZE = 256
    private const val HALO = 16
    private const val CONTEXT = 288
    private const val OUT_HALO = HALO * SCALE
    private const val OUT_CONTEXT = CONTEXT * SCALE
    private const val OUT_TILE = TILE_SIZE * SCALE
    private const val MODEL_PATH = "models/ESRGAN_288.tflite"
  }

  private val cancelRequested = AtomicBoolean(false)

  fun start() {
    thread(start = true, name = "SuperResWorker-$jobId") {
      runInternal()
    }
  }

  fun cancel() {
    cancelRequested.set(true)
  }

  private fun runInternal() {
    var interpreterHandle: InterpreterHandle? = null
    try {
      val inputImage = ImageIO.decodeToFloat(context, inputUri)
      val padR = (TILE_SIZE - (inputImage.width % TILE_SIZE)) % TILE_SIZE
      val padB = (TILE_SIZE - (inputImage.height % TILE_SIZE)) % TILE_SIZE

      val padded = ImageIO.reflectPad(inputImage, 0, 0, padR, padB)
      val haloed = ImageIO.reflectPad(padded, HALO, HALO, HALO, HALO)

      val tilesX = padded.width / TILE_SIZE
      val tilesY = padded.height / TILE_SIZE
      val totalTiles = tilesX * tilesY

      val outW = padded.width * SCALE
      val outH = padded.height * SCALE
      val outSR = ByteArray(outW * outH * 3)

      val inputBuffer = ByteBuffer.allocateDirect(CONTEXT * CONTEXT * 3 * 4).order(ByteOrder.nativeOrder())
      val outputBuffer = ByteBuffer.allocateDirect(OUT_CONTEXT * OUT_CONTEXT * 3 * 4).order(ByteOrder.nativeOrder())
      val outputFloats = outputBuffer.asFloatBuffer()

      val modelBuffer = TFLiteRuntime.loadModel(context, MODEL_PATH)
      val initialHandle = try {
        TFLiteRuntime.createInterpreter(modelBuffer, true)
      } catch (_: Exception) {
        TFLiteRuntime.createInterpreter(modelBuffer, false)
      }
      interpreterHandle = initialHandle
      var handle = initialHandle
      var usingGpu = handle.gpuDelegate != null

      var tileIndex = 0
      for (ty in 0 until tilesY) {
        for (tx in 0 until tilesX) {
          if (cancelRequested.get()) {
            onCancelled(cancelPayload())
            return
          }

          val x = tx * TILE_SIZE
          val y = ty * TILE_SIZE
          fillInputBuffer(haloed.data, haloed.width, x, y, CONTEXT, inputBuffer)

          try {
            outputBuffer.rewind()
            handle.interpreter.run(inputBuffer, outputBuffer)
          } catch (e: Throwable) {
            if (usingGpu) {
              handle.interpreter.close()
              handle.gpuDelegate?.close()
              handle = TFLiteRuntime.createInterpreter(modelBuffer, false)
              interpreterHandle = handle
              usingGpu = false
              outputBuffer.rewind()
              handle.interpreter.run(inputBuffer, outputBuffer)
            } else {
              throw e
            }
          }

          outputBuffer.rewind()
          outputFloats.rewind()
          pasteCore(outputFloats, outSR, outW, x * SCALE, y * SCALE)

          tileIndex += 1
          val percent = tileIndex.toFloat() / totalTiles.toFloat()
          val message = "$tileIndex/$totalTiles tiles"
          val progressPayload = Arguments.createMap().apply {
            putString("jobId", jobId)
            putInt("done", tileIndex)
            putInt("total", totalTiles)
            putDouble("percent", percent.toDouble())
            putString("message", message)
          }
          onProgress(progressPayload)
        }
      }

      if (cancelRequested.get()) {
        onCancelled(cancelPayload())
        return
      }

      val finalW = inputImage.width * SCALE
      val finalH = inputImage.height * SCALE

      val enhancedUri = ImageIO.encodePng(context, outSR, outW, outH, finalW, finalH)
      val completePayload = Arguments.createMap().apply {
        putString("jobId", jobId)
        putString("enhancedUri", enhancedUri)
        putInt("width", finalW)
        putInt("height", finalH)
      }
      onComplete(completePayload)
    } catch (e: Exception) {
      val errorPayload = Arguments.createMap().apply {
        putString("jobId", jobId)
        putString("message", e.message ?: "Enhancement failed")
      }
      onError(errorPayload)
    } finally {
      interpreterHandle?.interpreter?.close()
      interpreterHandle?.gpuDelegate?.close()
    }
  }

  private fun fillInputBuffer(
    src: FloatArray,
    srcWidth: Int,
    startX: Int,
    startY: Int,
    size: Int,
    buffer: ByteBuffer,
  ) {
    buffer.rewind()
    for (y in 0 until size) {
      var idx = ((startY + y) * srcWidth + startX) * 3
      for (x in 0 until size) {
        buffer.putFloat(src[idx])
        buffer.putFloat(src[idx + 1])
        buffer.putFloat(src[idx + 2])
        idx += 3
      }
    }
    buffer.rewind()
  }

  private fun pasteCore(
    outputTile: FloatBuffer,
    outSR: ByteArray,
    outWidth: Int,
    outX: Int,
    outY: Int,
  ) {
    for (y in 0 until OUT_TILE) {
      var srcIdx = ((y + OUT_HALO) * OUT_CONTEXT + OUT_HALO) * 3
      var dstIdx = ((outY + y) * outWidth + outX) * 3
      for (x in 0 until OUT_TILE) {
        outSR[dstIdx] = clampToByte(outputTile.get(srcIdx))
        outSR[dstIdx + 1] = clampToByte(outputTile.get(srcIdx + 1))
        outSR[dstIdx + 2] = clampToByte(outputTile.get(srcIdx + 2))
        srcIdx += 3
        dstIdx += 3
      }
    }
  }

  private fun clampToByte(value: Float): Byte {
    val rounded = value.toInt()
    val clamped = when {
      rounded < 0 -> 0
      rounded > 255 -> 255
      else -> rounded
    }
    return clamped.toByte()
  }

  private fun cancelPayload(): com.facebook.react.bridge.WritableMap =
    Arguments.createMap().apply { putString("jobId", jobId) }
}
