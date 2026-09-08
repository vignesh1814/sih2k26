package com.sih26034.lmpc.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val NavyPrimary = Color(0xFF0D253F)
val NavyLight = Color(0xFF1E3C72)
val GoldAccent = Color(0xFFD4AF37)
val StatusPass = Color(0xFF2E7D32)
val StatusFail = Color(0xFFC62828)
val StatusWarning = Color(0xFFEF6C00)
val SurfaceLight = Color(0xFFF8F9FA)

private val LightColorScheme = lightColorScheme(
    primary = NavyPrimary,
    secondary = GoldAccent,
    tertiary = NavyLight,
    background = SurfaceLight,
    surface = Color.White
)

@Composable
fun LMPCTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        typography = Typography(),
        content = content
    )
}
