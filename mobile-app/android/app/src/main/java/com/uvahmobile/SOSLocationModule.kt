package com.uvahmobile

import android.content.Intent
import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class SOSLocationModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName() = "SOSLocationService"

  @ReactMethod
  fun start(alertId: Int, baseUrl: String, accessToken: String, promise: Promise) {
    try {
      val intent = Intent(reactContext, SOSLocationService::class.java).apply {
        action = SOSLocationService.ACTION_START
        putExtra(SOSLocationService.EXTRA_ALERT_ID, alertId)
        putExtra(SOSLocationService.EXTRA_BASE_URL, baseUrl)
        putExtra(SOSLocationService.EXTRA_ACCESS_TOKEN, accessToken)
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        reactContext.startForegroundService(intent)
      } else {
        reactContext.startService(intent)
      }
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("SOS_SERVICE_START_FAILED", error.message, error)
    }
  }

  @ReactMethod
  fun stop(promise: Promise) {
    try {
      reactContext.stopService(Intent(reactContext, SOSLocationService::class.java))
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("SOS_SERVICE_STOP_FAILED", error.message, error)
    }
  }
}
