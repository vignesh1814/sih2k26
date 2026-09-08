package com.sih26034.lmpc.viewmodel

import android.content.Context
import android.graphics.Bitmap
import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sih26034.lmpc.data.api.RetrofitClient
import com.sih26034.lmpc.data.models.ScanResponse
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import java.io.File
import java.io.FileOutputStream

sealed class ScanUiState {
    object Idle : ScanUiState()
    object Loading : ScanUiState()
    data class Success(val response: ScanResponse) : ScanUiState()
    data class Error(val message: String) : ScanUiState()
}

class MainViewModel : ViewModel() {
    private val _uiState = MutableStateFlow<ScanUiState>(ScanUiState.Idle)
    val uiState: StateFlow<ScanUiState> = _uiState.asStateFlow()

    private val _serverStatus = MutableStateFlow("Checking...")
    val serverStatus: StateFlow<String> = _serverStatus.asStateFlow()

    init {
        checkServerHealth()
    }

    fun checkServerHealth() {
        viewModelScope.launch {
            try {
                val resp = RetrofitClient.apiService.getHealth()
                if (resp.isSuccessful) {
                    _serverStatus.value = "ONLINE: ${resp.body()?.service}"
                } else {
                    _serverStatus.value = "OFFLINE"
                }
            } catch (e: Exception) {
                _serverStatus.value = "OFFLINE (Using Local/Demo Mode)"
            }
        }
    }

    fun scanImage(context: Context, imageUri: Uri) {
        _uiState.value = ScanUiState.Loading
        viewModelScope.launch {
            try {
                // Copy stream to temp file
                val inputStream = context.contentResolver.openInputStream(imageUri)
                val tempFile = File(context.cacheDir, "scan_upload.png")
                val outputStream = FileOutputStream(tempFile)
                inputStream?.use { input ->
                    outputStream.use { output ->
                        input.copyTo(output)
                    }
                }

                val reqFile = tempFile.asRequestBody("image/*".toMediaTypeOrNull())
                val body = MultipartBody.Part.createFormData("file", tempFile.name, reqFile)

                val response = RetrofitClient.apiService.scanPackage(body)
                if (response.isSuccessful && response.body() != null) {
                    _uiState.value = ScanUiState.Success(response.body()!!)
                } else {
                    _uiState.value = ScanUiState.Error("Server error: ${response.code()} ${response.message()}")
                }
            } catch (e: Exception) {
                _uiState.value = ScanUiState.Error("Connection error: ${e.localizedMessage}. Tip: Run demo mode if offline.")
            }
        }
    }

    fun scanBitmap(context: Context, bitmap: Bitmap) {
        _uiState.value = ScanUiState.Loading
        viewModelScope.launch {
            try {
                val tempFile = File(context.cacheDir, "scan_upload.png")
                FileOutputStream(tempFile).use { out ->
                    bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
                }

                val reqFile = tempFile.asRequestBody("image/*".toMediaTypeOrNull())
                val body = MultipartBody.Part.createFormData("file", tempFile.name, reqFile)

                val response = RetrofitClient.apiService.scanPackage(body)
                if (response.isSuccessful && response.body() != null) {
                    _uiState.value = ScanUiState.Success(response.body()!!)
                } else {
                    _uiState.value = ScanUiState.Error("Server error: ${response.code()} ${response.message()}")
                }
            } catch (e: Exception) {
                _uiState.value = ScanUiState.Error("Connection error: ${e.localizedMessage}. Tip: Run demo mode if offline.")
            }
        }
    }

    fun runDemoScenario(scenarioKey: String) {
        _uiState.value = ScanUiState.Loading
        viewModelScope.launch {
            try {
                val response = RetrofitClient.apiService.getDemoScenario(scenarioKey)
                if (response.isSuccessful && response.body() != null) {
                    _uiState.value = ScanUiState.Success(response.body()!!)
                } else {
                    _uiState.value = ScanUiState.Error("Failed to fetch demo scenario: ${scenarioKey}")
                }
            } catch (e: Exception) {
                _uiState.value = ScanUiState.Error("Error: ${e.localizedMessage}")
            }
        }
    }

    fun resetState() {
        _uiState.value = ScanUiState.Idle
    }
}
