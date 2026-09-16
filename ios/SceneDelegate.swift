//
//  SceneDelegate.swift
//  coinswallet
//
//  Created by Divyang Khatri on 16/09/26.
//
import UIKit
import React
import React_RCTAppDelegate

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  /// iOS can disconnect this scene and reconnect it in the same process, which
  /// builds a *new* SceneDelegate. React Native must only be started once, so the
  /// root view controller outlives the scene and is re-attached to the new window.
  private static var reactRootViewController: UIViewController?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene else {
      assertionFailure("SceneDelegate attached to a non-window scene: \(scene)")
      return
    }
    guard let appDelegate = UIApplication.shared.delegate as? AppDelegate,
          let factory = appDelegate.reactNativeFactory
    else {
      assertionFailure("React Native factory missing — the app will show an empty window")
      return
    }

    let window = UIWindow(windowScene: windowScene)
    self.window = window
    appDelegate.window = window

    if let rootViewController = Self.reactRootViewController {
      window.rootViewController = rootViewController
      window.makeKeyAndVisible()
      return
    }

    factory.startReactNative(
      withModuleName: "coinswallet",
      in: window,
      launchOptions: Self.launchOptions(from: connectionOptions)
    )

    Self.reactRootViewController = window.rootViewController
  }

  func sceneDidDisconnect(_ scene: UIScene) {
    // The root view controller is deliberately kept: the React Native runtime
    // stays alive and is re-attached if the scene reconnects.
    window = nil
  }

  // A scene-based app never gets `application:openURL:` / `application:continue:`,
  // so every deep link (dokwallet://, Google sign-in callback, wc:) and universal
  // link has to be forwarded to RCTLinkingManager from here.
  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    for context in URLContexts {
      RCTLinkingManager.application(UIApplication.shared, open: context.url, options: [:])
    }
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    RCTLinkingManager.application(
      UIApplication.shared,
      continue: userActivity,
      restorationHandler: { _ in }
    )
  }

  /// The cold-start URL can't go through RCTLinkingManager: it posts a notification
  /// that nothing observes until JS registers its `url` listener. `Linking.getInitialURL()`
  /// reads `bridge.launchOptions` instead, so rebuild the dictionary UIKit would have
  /// handed `application:didFinishLaunchingWithOptions:`.
  private static func launchOptions(
    from connectionOptions: UIScene.ConnectionOptions
  ) -> [AnyHashable: Any]? {
    if let url = connectionOptions.urlContexts.first?.url {
      return [UIApplication.LaunchOptionsKey.url.rawValue: url]
    }

    if let activity = connectionOptions.userActivities.first(where: {
      $0.activityType == NSUserActivityTypeBrowsingWeb && $0.webpageURL != nil
    }) {
      return [
        UIApplication.LaunchOptionsKey.userActivityDictionary.rawValue: [
          UIApplication.LaunchOptionsKey.userActivityType.rawValue: activity.activityType,
          "UIApplicationLaunchOptionsUserActivityKey": activity,
        ] as [String: Any],
      ]
    }

    return nil
  }
}
