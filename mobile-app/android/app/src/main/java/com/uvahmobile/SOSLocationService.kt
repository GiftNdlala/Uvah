package com.uvahmobile

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Location
import android.os.Build
import android.os.IBinder
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

/**
 * Runs only during an active SOS. Android shows a persistent notification while
 * it is collecting and sending the user's real location in the background.
 */
class SOSLocationService : Service() {
  companion object {
    const val ACTION_START = "com.uvahmobile.action.START_SOS_LOCATION"
    const val EXTRA_ALERT_ID = "alert_id"
    const val EXTRA_BASE_URL = "base_url"
    const val EXTRA_ACCESS_TOKEN = "access_token"
    private const val CHANNEL_ID = "uvah-sos-active"
    private const val NOTIFICATION_ID = 4101
  }

  private lateinit var fusedLocationClient: FusedLocationProviderClient
  private val networkExecutor: ExecutorService = Executors.newSingleThreadExecutor()
  private var alertId = 0
  private var baseUrl = ""
  private var accessToken = ""

  private val locationCallback = object : LocationCallback() {
    override fun onLocationResult(result: LocationResult) {
      result.lastLocation?.let(::sendLocation)
    }
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action != ACTION_START) return START_NOT_STICKY

    alertId = intent.getIntExtra(EXTRA_ALERT_ID, 0)
    baseUrl = intent.getStringExtra(EXTRA_BASE_URL).orEmpty().trimEnd('/')
    accessToken = intent.getStringExtra(EXTRA_ACCESS_TOKEN).orEmpty()
    if (alertId <= 0 || baseUrl.isBlank() || accessToken.isBlank()) {
      stopSelf()
      return START_NOT_STICKY
    }

    createChannel()
    startAsForeground()
    fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
    requestUpdates()
    return START_NOT_STICKY
  }

  private fun startAsForeground() {
    val notification: Notification = NotificationCompat.Builder(this, CHANNEL_ID)
      .setSmallIcon(R.mipmap.ic_launcher)
      .setContentTitle("UVAH SOS is active")
      .setContentText("Sharing your live location with your trusted circle.")
      .setOngoing(true)
      .setCategory(NotificationCompat.CATEGORY_SERVICE)
      .build()

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      startForeground(NOTIFICATION_ID, notification, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION)
    } else {
      startForeground(NOTIFICATION_ID, notification)
    }
  }

  private fun createChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(
        CHANNEL_ID,
        "Active SOS location sharing",
        NotificationManager.IMPORTANCE_HIGH,
      ).apply {
        description = "Shown while UVAH is actively sharing an SOS location."
        setShowBadge(false)
      }
      getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }
  }

  private fun requestUpdates() {
    val granted = ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED ||
      ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
    if (!granted) {
      stopSelf()
      return
    }
    val request = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 5_000)
      .setMinUpdateIntervalMillis(3_000)
      .setWaitForAccurateLocation(false)
      .build()
    fusedLocationClient.requestLocationUpdates(request, locationCallback, mainLooper)
  }

  private fun sendLocation(location: Location) {
    networkExecutor.execute {
      val body = JSONObject().apply {
        put("lat", location.latitude)
        put("lon", location.longitude)
        put("accuracy", location.accuracy.toDouble())
      }
      postJson("$baseUrl/api/alerts/$alertId/locations", body)
      postJson("$baseUrl/api/social/location/update/", body)
    }
  }

  private fun postJson(endpoint: String, body: JSONObject) {
    try {
      val connection = (URL(endpoint).openConnection() as HttpURLConnection).apply {
        requestMethod = "POST"
        connectTimeout = 10_000
        readTimeout = 10_000
        doOutput = true
        setRequestProperty("Content-Type", "application/json")
        setRequestProperty("Authorization", "Bearer $accessToken")
      }
      connection.outputStream.bufferedWriter().use { it.write(body.toString()) }
      connection.responseCode
      connection.disconnect()
    } catch (_: Exception) {
      // The next GPS update retries automatically. The SOS remains visibly active.
    }
  }

  override fun onDestroy() {
    if (::fusedLocationClient.isInitialized) {
      fusedLocationClient.removeLocationUpdates(locationCallback)
    }
    networkExecutor.shutdownNow()
    super.onDestroy()
  }
}
