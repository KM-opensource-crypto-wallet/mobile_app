package com.coinswallet;

import expo.modules.ApplicationLifecycleDispatcher;
import expo.modules.ReactNativeHostWrapper;
import android.content.res.Configuration
import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost


class MainApplication : Application(), ReactApplication {
  private val runningActivities = mutableListOf<Class<*>>()
  override val reactNativeHost: ReactNativeHost =
          ReactNativeHostWrapper(this, object : DefaultReactNativeHost(this) {
            override fun getPackages(): List<ReactPackage> =
                    PackageList(this).packages.apply {
                      // Packages that cannot be autolinked yet can be added manually here, for example:
                       add(NativeKeygenPackage())
                    }

            override fun getJSMainModuleName(): String = ".expo/.virtual-metro-entry"

            override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

            override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
            override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
          })

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
    ApplicationLifecycleDispatcher.onApplicationCreate(this)
  }

    fun addActivityToStack(cls: Class<*>) {
        if (!runningActivities.contains(cls)) runningActivities.add(cls)
    }

    fun removeActivityFromStack(cls: Class<*>) {
        if (runningActivities.contains(cls)) runningActivities.remove(cls)
    }

    fun isActivityInBackStack(cls: Class<*>): Boolean {
        return runningActivities.contains(cls)
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
    }
}
