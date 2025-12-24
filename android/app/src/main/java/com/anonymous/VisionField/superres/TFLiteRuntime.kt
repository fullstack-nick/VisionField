package com.anonymous.VisionField.superres

import android.content.Context
import org.tensorflow.lite.Interpreter
import org.tensorflow.lite.gpu.GpuDelegate
import java.io.FileInputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.channels.FileChannel

data class InterpreterHandle(val interpreter: Interpreter, val gpuDelegate: GpuDelegate?)

object TFLiteRuntime {
  fun loadModel(context: Context, assetPath: String): ByteBuffer {
    return try {
      val assetFd = context.assets.openFd(assetPath)
      FileInputStream(assetFd.fileDescriptor).use { input ->
        val channel = input.channel
        channel.map(FileChannel.MapMode.READ_ONLY, assetFd.startOffset, assetFd.declaredLength)
      }
    } catch (_: Exception) {
      val bytes = context.assets.open(assetPath).use { it.readBytes() }
      ByteBuffer.allocateDirect(bytes.size).apply {
        order(ByteOrder.nativeOrder())
        put(bytes)
        rewind()
      }
    }
  }

  fun createInterpreter(modelBuffer: ByteBuffer, useGpu: Boolean): InterpreterHandle {
    if (useGpu) {
      try {
        val gpuOptions = Interpreter.Options().apply {
          setUseXNNPACK(true)
          setNumThreads(Runtime.getRuntime().availableProcessors().coerceAtLeast(2))
        }
        val gpuDelegate = GpuDelegate()
        gpuOptions.addDelegate(gpuDelegate)
        val interpreter = Interpreter(modelBuffer, gpuOptions)
        return InterpreterHandle(interpreter, gpuDelegate)
      } catch (_: Throwable) {
        // GPU delegate unavailable or failed; fall back to CPU.
      }
    }

    val cpuOptions = Interpreter.Options().apply {
      setUseXNNPACK(true)
      setNumThreads(Runtime.getRuntime().availableProcessors().coerceAtLeast(2))
    }
    val interpreter = Interpreter(modelBuffer, cpuOptions)
    return InterpreterHandle(interpreter, null)
  }
}
