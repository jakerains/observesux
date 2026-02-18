import SwiftUI

// MARK: - Weather Condition Gradients
// Dynamic backgrounds based on conditions + time of day
// Aligned with web app's OKLCH gradient definitions

enum WeatherGradients {

    static func gradient(for conditions: String, isDaytime: Bool) -> LinearGradient {
        let colors = colorPair(for: conditions, isDaytime: isDaytime)
        return LinearGradient(
            colors: colors,
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    private static func colorPair(for conditions: String, isDaytime: Bool) -> [Color] {
        let lower = conditions.lowercased()

        // Night
        if !isDaytime {
            if lower.contains("cloud") || lower.contains("overcast") {
                return [Color(red: 0.12, green: 0.13, blue: 0.22), Color(red: 0.08, green: 0.09, blue: 0.18)]
            }
            // Clear night — deep navy with hint of purple
            return [Color(red: 0.06, green: 0.06, blue: 0.18), Color(red: 0.12, green: 0.08, blue: 0.25)]
        }

        // Thunderstorm / Severe — dark moody purples
        if lower.contains("thunder") || lower.contains("storm") {
            return [Color(red: 0.22, green: 0.15, blue: 0.32), Color(red: 0.38, green: 0.28, blue: 0.18)]
        }

        // Rain / Drizzle — cool blue-grays
        if lower.contains("rain") || lower.contains("drizzle") || lower.contains("shower") {
            return [Color(red: 0.30, green: 0.40, blue: 0.52), Color(red: 0.22, green: 0.32, blue: 0.48)]
        }

        // Snow / Ice / Winter — pale blue-whites
        if lower.contains("snow") || lower.contains("ice") || lower.contains("sleet")
            || lower.contains("freezing") || lower.contains("blizzard") {
            return [Color(red: 0.72, green: 0.78, blue: 0.86), Color(red: 0.52, green: 0.58, blue: 0.68)]
        }

        // Fog / Mist / Haze — warm grays
        if lower.contains("fog") || lower.contains("mist") || lower.contains("haze") {
            return [Color(red: 0.68, green: 0.67, blue: 0.65), Color(red: 0.52, green: 0.52, blue: 0.55)]
        }

        // Cloudy / Overcast — blue-slate
        if lower.contains("cloud") || lower.contains("overcast") {
            return [Color(red: 0.50, green: 0.57, blue: 0.68), Color(red: 0.38, green: 0.45, blue: 0.58)]
        }

        // Partly Cloudy — warm blue with hint of amber
        if lower.contains("partly") {
            return [Color(red: 0.35, green: 0.55, blue: 0.82), Color(red: 0.50, green: 0.65, blue: 0.88)]
        }

        // Sunset window (5-7 PM)
        let hour = Calendar.current.component(.hour, from: .now)
        if (17...19).contains(hour) {
            return [Color(red: 0.85, green: 0.50, blue: 0.25), Color(red: 0.55, green: 0.30, blue: 0.45)]
        }

        // Clear / Sunny — vibrant blue
        return [Color(red: 0.25, green: 0.50, blue: 0.88), Color(red: 0.40, green: 0.65, blue: 0.92)]
    }
}
