package com.sih26034.lmpc

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import com.sih26034.lmpc.ui.screens.MainScreen
import com.sih26034.lmpc.ui.theme.LMPCTheme
import com.sih26034.lmpc.viewmodel.MainViewModel

class MainActivity : ComponentActivity() {
    private val viewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            LMPCTheme {
                MainScreen(viewModel = viewModel)
            }
        }
    }
}
