import SwiftUI

// MARK: - Siouxland Brand Colors (Midwest Warm Palette)

extension Color {
    // Primary brand
    static let slBarnRed = Color(red: 0.42, green: 0.23, blue: 0.17)        // #6b3b2c
    static let slWarmAmber = Color(red: 0.79, green: 0.66, blue: 0.43)      // #c9a96e
    static let slSoftRust = Color(red: 0.63, green: 0.44, blue: 0.37)       // #a0715e

    // Backgrounds
    static let slCream = Color(red: 0.96, green: 0.95, blue: 0.93)          // #f5f1ec
    static let slDeepUmber = Color(red: 0.10, green: 0.08, blue: 0.06)      // #1a1410

    // Status colors
    static let slLive = Color(red: 0.13, green: 0.77, blue: 0.37)           // #22c55e
    static let slStale = Color(red: 0.96, green: 0.62, blue: 0.04)          // #f59e0b
    static let slError = Color(red: 0.94, green: 0.27, blue: 0.27)          // #ef4444
    static let slLoading = Color(red: 0.05, green: 0.65, blue: 0.89)        // #0ea5e9

    // Severity
    static let slSeverityMinor = Color.yellow
    static let slSeverityModerate = Color.orange
    static let slSeverityMajor = Color.red
    static let slSeverityCritical = Color(red: 0.5, green: 0, blue: 0.13)   // #7e0023

    // Flood stages
    static let slFloodNormal = Color.green
    static let slFloodAction = Color.yellow
    static let slFloodMinor = Color.orange
    static let slFloodModerate = Color.red
    static let slFloodMajor = Color.purple
}

// MARK: - Adaptive Colors (light/dark via asset catalog)

extension ShapeStyle where Self == Color {
    static var slBackground: Color { Color("SlBackground") }
    static var slCardBackground: Color { Color("SlCardBackground") }
    static var slPrimary: Color { Color("SlPrimary") }
    static var slAccent: Color { Color("SlAccent") }
    static var slForeground: Color { Color("SlForeground") }
    static var slSecondaryBackground: Color { Color("SlSecondaryBackground") }
    static var slBorder: Color { Color("SlBorder") }
    static var slMutedForeground: Color { Color("SlMutedForeground") }

    // Brand colors accessible from foregroundStyle()
    static var slBarnRed: Color { Color.slBarnRed }
    static var slWarmAmber: Color { Color.slWarmAmber }
    static var slSoftRust: Color { Color.slSoftRust }
    static var slCream: Color { Color.slCream }
    static var slDeepUmber: Color { Color.slDeepUmber }

    // Status colors
    static var slLive: Color { Color.slLive }
    static var slStale: Color { Color.slStale }
    static var slError: Color { Color.slError }
    static var slLoading: Color { Color.slLoading }
}
