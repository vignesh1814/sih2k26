package com.sih26034.lmpc.data.api

import com.sih26034.lmpc.data.models.HealthResponse
import com.sih26034.lmpc.data.models.ScanResponse
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.GET
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.Part
import retrofit2.http.Path
import java.util.concurrent.TimeUnit

interface LMPCApiService {
    @GET("api/v1/health")
    suspend fun getHealth(): Response<HealthResponse>

    @Multipart
    @POST("api/v1/scan")
    suspend fun scanPackage(
        @Part file: MultipartBody.Part
    ): Response<ScanResponse>

    @GET("api/v1/demo/{scenario}")
    suspend fun getDemoScenario(
        @Path("scenario") scenario: String
    ): Response<ScanResponse>
}

object RetrofitClient {
    // 10.0.2.2 maps to host localhost in Android Emulator; can be updated to PC Wi-Fi IP for real device
    private const val BASE_URL = "http://10.0.2.2:8000/"

    private val logging = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(logging)
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .build()

    val apiService: LMPCApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(LMPCApiService::class.java)
    }
}
