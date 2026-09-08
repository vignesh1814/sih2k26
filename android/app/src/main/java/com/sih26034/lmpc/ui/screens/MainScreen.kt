package com.sih26034.lmpc.ui.screens

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.sih26034.lmpc.data.models.ScanResponse
import com.sih26034.lmpc.ui.theme.*
import com.sih26034.lmpc.viewmodel.MainViewModel
import com.sih26034.lmpc.viewmodel.ScanUiState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(viewModel: MainViewModel) {
    val context = LocalContext.current
    val uiState by viewModel.uiState.collectAsState()
    val serverStatus by viewModel.serverStatus.collectAsState()

    val cameraLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicturePreview()
    ) { bitmap ->
        bitmap?.let { viewModel.scanBitmap(context, it) }
    }

    val galleryLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let { viewModel.scanImage(context, it) }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "LMPC Compliance Inspector",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Text(
                            text = "Govt. of India | Legal Metrology Rules 2011",
                            style = MaterialTheme.typography.bodySmall,
                            color = GoldAccent
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = NavyPrimary
                )
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Server status badge
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = if (serverStatus.contains("ONLINE")) Color(0xFFE8F5E9) else Color(0xFFFFF3E0)
                ),
                shape = RoundedCornerShape(8.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "●",
                        color = if (serverStatus.contains("ONLINE")) StatusPass else StatusWarning,
                        fontSize = 18.sp
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Backend: $serverStatus",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Action Buttons Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "Statutory Package Audit",
                        fontWeight = FontWeight.Bold,
                        style = MaterialTheme.typography.titleLarge
                    )
                    Text(
                        text = "Capture or select image of commodity label to audit Rule 6 declarations.",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.Gray
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    Button(
                        onClick = { cameraLauncher.launch(null) },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = NavyPrimary)
                    ) {
                        Text("📷 Take Photo with Camera")
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedButton(
                        onClick = { galleryLauncher.launch("image/*") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("🖼 Select Photo from Gallery")
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    // Hackathon Quick Replay Buttons
                    Text(
                        text = "Offline Fallback & Demonstration Scenarios:",
                        style = MaterialTheme.typography.labelSmall,
                        color = Color.DarkGray,
                        modifier = Modifier.align(Alignment.Start)
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedButton(
                            onClick = { viewModel.runDemoScenario("compliant_biscuit") },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("1. Compliant", fontSize = 11.sp)
                        }
                        OutlinedButton(
                            onClick = { viewModel.runDemoScenario("obscured_mrp_violation") },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("2. No MRP", fontSize = 11.sp)
                        }
                        OutlinedButton(
                            onClick = { viewModel.runDemoScenario("non_standard_unit_violation") },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("3. Bad Unit", fontSize = 11.sp)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // State Display
            when (val state = uiState) {
                is ScanUiState.Idle -> {
                    Text(
                        text = "Ready to inspect package.",
                        color = Color.Gray,
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
                is ScanUiState.Loading -> {
                    CircularProgressIndicator(color = NavyPrimary)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Running RapidOCR & Zen Engine statutory verification...",
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
                is ScanUiState.Success -> {
                    ComplianceResultCard(state.response) {
                        viewModel.resetState()
                    }
                }
                is ScanUiState.Error -> {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFFFFEBEE))
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(
                                text = "Scan Failed",
                                fontWeight = FontWeight.Bold,
                                color = StatusFail
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(text = state.message, style = MaterialTheme.typography.bodySmall)
                            Spacer(modifier = Modifier.height(8.dp))
                            Button(
                                onClick = { viewModel.resetState() },
                                colors = ButtonDefaults.buttonColors(containerColor = StatusFail)
                            ) {
                                Text("Dismiss")
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ComplianceResultCard(res: ScanResponse, onReset: () -> Unit) {
    val statusColor = when (res.status) {
        "PASS" -> StatusPass
        "FAIL" -> StatusFail
        else -> StatusWarning
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Status Banner
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(statusColor, shape = RoundedCornerShape(8.dp))
                    .padding(vertical = 12.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "AUDIT VERDICT: ${res.status}",
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 18.sp,
                    color = Color.White
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Extracted info
            Text("Extracted Declarations (Rule 6):", fontWeight = FontWeight.Bold)
            res.declarations.let { d ->
                Text("• Generic Name: ${d.genericName ?: "Missing"}")
                Text("• Net Quantity: ${d.netQuantity ?: "-"} ${d.unit ?: ""}")
                Text("• MRP: Rs. ${d.mrp ?: "Missing"}")
                Text("• Mfg Date: ${d.mfgDate ?: "Missing"}")
                Text("• Manufacturer: ${d.manufacturer ?: "Missing"}")
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Violations
            if (res.violations.isNotEmpty()) {
                Text(
                    text = "Statutory Violations (${res.violations.size}):",
                    fontWeight = FontWeight.Bold,
                    color = StatusFail
                )
                res.violations.forEach { v ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFFFFF0F0))
                    ) {
                        Column(modifier = Modifier.padding(8.dp)) {
                            Text(
                                text = "⚖ ${v.ruleCode} — ${v.declaration}",
                                fontWeight = FontWeight.Bold,
                                color = StatusFail,
                                fontSize = 12.sp
                            )
                            Text(text = v.reason, fontSize = 11.sp)
                            v.suggestedCorrection?.let { corr ->
                                Text(
                                    text = "Correction: $corr",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = Color.DarkGray
                                )
                            }
                        }
                    }
                }
            } else {
                Text("✓ All mandatory Rule 6 declarations verified compliant.", color = StatusPass)
            }

            Spacer(modifier = Modifier.height(16.dp))
            Button(
                onClick = onReset,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = NavyPrimary)
            ) {
                Text("Start New Audit")
            }
        }
    }
}
