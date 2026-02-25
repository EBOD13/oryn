import Foundation
import FamilyControls
import DeviceActivity
import ManagedSettings

// MARK: - ScreenTimeModule
// React Native native module for Apple Screen Time API.
// Provides app blocking and usage monitoring via FamilyControls.
//
// Setup required in Xcode:
//   1. Add "Family Controls" capability to the Oryn target
//      (Signing & Capabilities → + Capability → Family Controls)
//   2. Add NSFamilyControlsUsageDescription to Info.plist
//   3. Run `pod install` after adding this file

@objc(ScreenTimeModule)
class ScreenTimeModule: NSObject {

  // MARK: - Authorization

  @objc
  static func requiresMainQueueSetup() -> Bool { false }

  @objc
  func requestAuthorization(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard #available(iOS 16.0, *) else {
      reject("UNSUPPORTED", "Screen Time API requires iOS 16.0 or later", nil)
      return
    }
    Task { @MainActor in
      do {
        try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
        resolve(["authorized": true, "status": "approved"])
      } catch {
        // User denied or error
        reject("AUTH_FAILED", error.localizedDescription, error)
      }
    }
  }

  @objc
  func getAuthorizationStatus(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard #available(iOS 16.0, *) else {
      resolve("unsupported")
      return
    }
    let status: String
    switch AuthorizationCenter.shared.authorizationStatus {
    case .approved:       status = "approved"
    case .denied:         status = "denied"
    case .notDetermined:  status = "notDetermined"
    @unknown default:     status = "unknown"
    }
    resolve(status)
  }

  // MARK: - Monitoring

  /// Start monitoring usage thresholds.
  /// `config` is a JSON string: { "intervalMinutes": 30, "activityName": "oryn.focus" }
  @objc
  func startMonitoring(
    _ configJSON: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard #available(iOS 16.0, *) else {
      reject("UNSUPPORTED", "Requires iOS 16+", nil)
      return
    }
    guard
      let data = configJSON.data(using: .utf8),
      let config = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
      let intervalMinutes = config["intervalMinutes"] as? Double,
      let activityName = config["activityName"] as? String
    else {
      reject("INVALID_CONFIG", "Expected { intervalMinutes, activityName }", nil)
      return
    }

    Task { @MainActor in
      let center = DeviceActivityCenter()
      let schedule = DeviceActivitySchedule(
        intervalStart: DateComponents(hour: 0, minute: 0, second: 0),
        intervalEnd:   DateComponents(hour: 23, minute: 59, second: 59),
        repeats: true
      )
      let threshold = DeviceActivityEvent(
        threshold: DateComponents(minute: Int(intervalMinutes))
      )
      let name = DeviceActivityName(activityName)
      do {
        try center.startMonitoring(name, during: schedule, events: [.threshold: threshold])
        resolve(["monitoring": true, "activity": activityName])
      } catch {
        reject("MONITOR_FAILED", error.localizedDescription, error)
      }
    }
  }

  @objc
  func stopMonitoring(
    _ activityName: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard #available(iOS 16.0, *) else {
      resolve(["stopped": false])
      return
    }
    let center = DeviceActivityCenter()
    center.stopMonitoring([DeviceActivityName(activityName)])
    resolve(["stopped": true])
  }

  // MARK: - App Selection
  // NOTE: FamilyActivityPicker is a SwiftUI view — must be presented from a SwiftUI context.
  // Call this from JS to signal that the picker should appear; the host view
  // controller will observe the `showPickerNotification` and present the SwiftUI sheet.

  @objc
  func presentAppPicker(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard #available(iOS 16.0, *) else {
      reject("UNSUPPORTED", "Requires iOS 16+", nil)
      return
    }
    DispatchQueue.main.async {
      NotificationCenter.default.post(
        name: NSNotification.Name("OrynShowFamilyActivityPicker"),
        object: nil
      )
      resolve(["pickerPresented": true])
    }
  }

  // MARK: - Shield (ManagedSettings)
  // Apply a shield to a saved selection stored in shared App Group UserDefaults.

  @objc
  func applyShield(
    _ isActive: Bool,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard #available(iOS 16.0, *) else {
      resolve(["applied": false])
      return
    }
    Task { @MainActor in
      let store = ManagedSettingsStore()
      if isActive {
        // Load the saved FamilyActivitySelection from shared UserDefaults (App Group)
        if
          let groupDefaults = UserDefaults(suiteName: "group.com.oryn.app"),
          let data = groupDefaults.data(forKey: "selectedActivities"),
          let selection = try? PropertyListDecoder().decode(FamilyActivitySelection.self, from: data)
        {
          store.shield.applications = selection.applicationTokens.isEmpty ? nil : selection.applicationTokens
        }
      } else {
        store.shield.applications = nil
      }
      resolve(["applied": isActive])
    }
  }
}
