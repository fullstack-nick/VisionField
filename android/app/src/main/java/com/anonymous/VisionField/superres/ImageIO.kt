package com.anonymous.VisionField.superres

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.net.Uri
import androidx.exifinterface.media.ExifInterface
import java.io.File
import java.io.FileOutputStream

data class ImageData(val width: Int, val height: Int, val data: FloatArray)

object ImageIO {
  fun decodeToFloat(context: Context, uriString: String): ImageData {
    val uri = Uri.parse(uriString)
    val resolver = context.contentResolver

    val options = BitmapFactory.Options().apply {
      inPreferredConfig = Bitmap.Config.ARGB_8888
    }

    val bitmap = resolver.openInputStream(uri)?.use { input ->
      BitmapFactory.decodeStream(input, null, options)
    } ?: throw IllegalStateException("Unable to decode image.")

    val orientation = resolver.openInputStream(uri)?.use { input ->
      ExifInterface(input).getAttributeInt(
        ExifInterface.TAG_ORIENTATION,
        ExifInterface.ORIENTATION_NORMAL
      )
    } ?: ExifInterface.ORIENTATION_NORMAL

    val rotated = rotateBitmap(bitmap, orientation)
    if (rotated != bitmap) {
      bitmap.recycle()
    }

    val width = rotated.width
    val height = rotated.height
    val pixels = IntArray(width * height)
    rotated.getPixels(pixels, 0, width, 0, 0, width, height)

    val data = FloatArray(width * height * 3)
    for (i in pixels.indices) {
      val color = pixels[i]
      data[i * 3] = ((color shr 16) and 0xFF).toFloat()
      data[i * 3 + 1] = ((color shr 8) and 0xFF).toFloat()
      data[i * 3 + 2] = (color and 0xFF).toFloat()
    }

    rotated.recycle()
    return ImageData(width, height, data)
  }

  fun reflectPad(input: ImageData, left: Int, top: Int, right: Int, bottom: Int): ImageData {
    val srcW = input.width
    val srcH = input.height
    val dstW = srcW + left + right
    val dstH = srcH + top + bottom
    val dst = FloatArray(dstW * dstH * 3)

    for (y in 0 until dstH) {
      val sy = reflectIndex(y - top, srcH)
      for (x in 0 until dstW) {
        val sx = reflectIndex(x - left, srcW)
        val srcIdx = (sy * srcW + sx) * 3
        val dstIdx = (y * dstW + x) * 3
        dst[dstIdx] = input.data[srcIdx]
        dst[dstIdx + 1] = input.data[srcIdx + 1]
        dst[dstIdx + 2] = input.data[srcIdx + 2]
      }
    }

    return ImageData(dstW, dstH, dst)
  }

  fun encodePng(context: Context, data: ByteArray, srcWidth: Int, srcHeight: Int, outWidth: Int, outHeight: Int): String {
    val width = outWidth.coerceAtMost(srcWidth)
    val height = outHeight.coerceAtMost(srcHeight)
    val pixels = IntArray(width * height)

    for (y in 0 until height) {
      var srcIdx = (y * srcWidth) * 3
      var dstIdx = y * width
      for (x in 0 until width) {
        val r = data[srcIdx].toInt() and 0xFF
        val g = data[srcIdx + 1].toInt() and 0xFF
        val b = data[srcIdx + 2].toInt() and 0xFF
        pixels[dstIdx] = (0xFF shl 24) or (r shl 16) or (g shl 8) or b
        srcIdx += 3
        dstIdx += 1
      }
    }

    val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
    bitmap.setPixels(pixels, 0, width, 0, 0, width, height)

    val outputFile = File(context.cacheDir, "enhanced_${System.currentTimeMillis()}.png")
    FileOutputStream(outputFile).use { stream ->
      bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream)
    }
    bitmap.recycle()

    return Uri.fromFile(outputFile).toString()
  }

  private fun rotateBitmap(bitmap: Bitmap, orientation: Int): Bitmap {
    val rotation = when (orientation) {
      ExifInterface.ORIENTATION_ROTATE_90 -> 90f
      ExifInterface.ORIENTATION_ROTATE_180 -> 180f
      ExifInterface.ORIENTATION_ROTATE_270 -> 270f
      else -> 0f
    }
    if (rotation == 0f) return bitmap
    val matrix = Matrix().apply { postRotate(rotation) }
    return Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
  }

  private fun reflectIndex(index: Int, size: Int): Int {
    if (size <= 1) return 0
    var idx = index
    while (idx < 0 || idx >= size) {
      idx = if (idx < 0) {
        -idx
      } else {
        2 * size - idx - 2
      }
    }
    return idx
  }
}
