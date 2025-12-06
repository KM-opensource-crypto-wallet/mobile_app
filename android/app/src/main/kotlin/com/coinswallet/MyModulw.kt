package com.coinswallet

import com.facebook.react.bridge.*
import android.app.Application
import android.util.Log
import com.walletconnect.android.BuildConfig
import com.walletconnect.android.Core
import com.walletconnect.android.CoreClient
import com.walletconnect.android.cacao.signature.SignatureType
import com.walletconnect.android.relay.ConnectionType
import com.walletconnect.android.utils.cacao.sign
import com.walletconnect.util.hexToBytes
import com.walletconnect.web3.wallet.client.Wallet
import com.walletconnect.web3.wallet.client.Web3Wallet
import com.facebook.react.bridge.*

class MyModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    init {
        val projectId = "" // Get Project ID at https://cloud.walletconnect.com/
        val relayUrl = "relay.walletconnect.com"
        val serverUrl = "wss://$relayUrl?projectId=${projectId}"
        val appMetaData = Core.Model.AppMetaData(
            name = "Kotlin.Responder",
            description = "Kotlin AuthSDK Responder Implementation",
            url = "kotlin.responder.walletconnect.com",
            icons = listOf("https://raw.githubusercontent.com/WalletConnect/walletconnect-assets/master/Icon/Gradient/Icon.png"),
            redirect = "kotlin-responder-wc:/request"
        )

        CoreClient.initialize(
            relayServerUrl = serverUrl,
            connectionType = ConnectionType.AUTOMATIC,
            application = reactContext.applicationContext as Application,
            metaData = appMetaData,
            // onConnect = { /* handle connection */ },
            onError = { /* handle error */ }
        )

        // AuthClient.initialize(
        //     init = Auth.Params.Init(core = CoreClient),
        //     onConnect = { /* handle connection */ },
        //     onError = { /* handle error */ }
        // )
    }

    override fun getName(): String {
        return "MyModule"
    }

    @ReactMethod
    fun myMethod() {
        // Your code here
    }
}
