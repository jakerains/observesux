import Foundation

// MARK: - NWS Icon URL → SF Symbol Mapping

extension String {
    /// Converts NWS API icon codes to SF Symbol names
    /// Input: URL like "https://api.weather.gov/icons/land/day/skc" or condition text
    var weatherSFSymbol: String {
        let code = self
            .replacingOccurrences(of: "https://api.weather.gov/icons/land/", with: "")
            .components(separatedBy: "/")
            .last?
            .components(separatedBy: ",")
            .first?
            .components(separatedBy: "?")
            .first ?? self.lowercased()

        // Check if it's a night icon
        let isNight = self.contains("/night/")

        switch code {
        // Clear
        case "skc":
            return isNight ? "moon.stars.fill" : "sun.max.fill"

        // Few clouds
        case "few":
            return isNight ? "cloud.moon.fill" : "cloud.sun.fill"

        // Scattered clouds
        case "sct":
            return isNight ? "cloud.moon.fill" : "cloud.sun.fill"

        // Broken / Overcast
        case "bkn":
            return "cloud.fill"
        case "ovc":
            return "smoke.fill"

        // Wind
        case "wind_skc", "wind_few", "wind_sct", "wind_bkn", "wind_ovc":
            return "wind"

        // Rain
        case "rain", "rain_showers", "rain_showers_hi":
            return "cloud.rain.fill"

        // Thunderstorms
        case "tsra", "tsra_sct", "tsra_hi":
            return "cloud.bolt.rain.fill"

        // Snow
        case "snow", "rain_snow", "snow_sleet", "rain_sleet":
            return "cloud.snow.fill"
        case "blizzard":
            return "wind.snow"

        // Freezing rain
        case "rain_fzra", "fzra", "snow_fzra":
            return "cloud.sleet.fill"

        // Ice / Sleet
        case "sleet":
            return "cloud.hail.fill"

        // Fog
        case "fog":
            return "cloud.fog.fill"

        // Haze / Smoke / Dust
        case "haze", "smoke", "dust":
            return "sun.haze.fill"

        // Hot / Cold
        case "hot":
            return "thermometer.sun.fill"
        case "cold":
            return "thermometer.snowflake"

        // Tornado / Hurricane
        case "tornado":
            return "tornado"
        case "hurricane":
            return "hurricane"
        case "tropical_storm":
            return "tropicalstorm"

        default:
            return conditionTextToSymbol(code, isNight: isNight)
        }
    }

    private func conditionTextToSymbol(_ text: String, isNight: Bool) -> String {
        let lower = text.lowercased()

        if lower.contains("thunder") { return "cloud.bolt.rain.fill" }
        if lower.contains("snow") { return "cloud.snow.fill" }
        if lower.contains("rain") || lower.contains("drizzle") { return "cloud.rain.fill" }
        if lower.contains("fog") || lower.contains("mist") { return "cloud.fog.fill" }
        if lower.contains("cloud") || lower.contains("overcast") { return "cloud.fill" }
        if lower.contains("partly") {
            return isNight ? "cloud.moon.fill" : "cloud.sun.fill"
        }
        if lower.contains("clear") || lower.contains("sunny") || lower.contains("fair") {
            return isNight ? "moon.stars.fill" : "sun.max.fill"
        }
        if lower.contains("wind") { return "wind" }
        if lower.contains("haze") { return "sun.haze.fill" }

        return isNight ? "moon.fill" : "sun.max.fill"
    }
}
