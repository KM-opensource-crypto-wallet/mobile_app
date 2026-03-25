package expo.modules

import expo.modules.kotlin.ModulesProvider
import expo.modules.kotlin.modules.Module
import expo.modules.xmtpreactnativesdk.XMTPModule

class ExpoModulesPackageList : ModulesProvider {
  override fun getModulesList(): List<Class<out Module>> = listOf(
    XMTPModule::class.java,
  )
}
