import Foundation

enum Endpoints {
    static let baseURL = URL(string: "https://siouxland.online")!

    // MARK: - Public Data Endpoints

    static let weather = baseURL.appending(path: "/api/weather")
    static let weatherAlerts = baseURL.appending(path: "/api/weather/alerts")
    static let weatherForecast = baseURL.appending(path: "/api/weather/forecast")
    static let weatherHourly = baseURL.appending(path: "/api/weather/hourly")

    static let cameras = baseURL.appending(path: "/api/cameras")
    static let trafficEvents = baseURL.appending(path: "/api/traffic")

    static let transit = baseURL.appending(path: "/api/transit")
    static let transitRoutes = baseURL.appending(path: "/api/transit/routes")
    static let transitShapes = baseURL.appending(path: "/api/transit/shapes")

    static let rivers = baseURL.appending(path: "/api/rivers")

    static let airQuality = baseURL.appending(path: "/api/air-quality")

    static let aviation = baseURL.appending(path: "/api/aviation")
    static let aircraft = baseURL.appending(path: "/api/aircraft")
    static let flights = baseURL.appending(path: "/api/flights")

    static let earthquakes = baseURL.appending(path: "/api/earthquakes")
    static let gasPrices = baseURL.appending(path: "/api/gas-prices")
    static let news = baseURL.appending(path: "/api/news")
    static let events = baseURL.appending(path: "/api/events")
    static let outages = baseURL.appending(path: "/api/outages")
    static let scanner = baseURL.appending(path: "/api/scanner")
    static let snowplows = baseURL.appending(path: "/api/snowplows")

    static let councilMeetings = baseURL.appending(path: "/api/council-meetings/recaps")

    static let digest = baseURL.appending(path: "/api/digest")

    static let status = baseURL.appending(path: "/api/status")

    // MARK: - Chat (SSE streaming)

    static let chat = baseURL.appending(path: "/api/chat")

    // MARK: - Auth Endpoints

    static let signIn = baseURL.appending(path: "/api/auth/sign-in/email")
    static let signUp = baseURL.appending(path: "/api/auth/sign-up/email")
    static let signOut = baseURL.appending(path: "/api/auth/sign-out")
    static let session = baseURL.appending(path: "/api/auth/get-session")

    // MARK: - User Endpoints (authenticated)

    static let userAlerts = baseURL.appending(path: "/api/user/alerts")
    static let userWatchlist = baseURL.appending(path: "/api/user/watchlist")
    static let userPreferences = baseURL.appending(path: "/api/user/preferences")
    static let pushSubscription = baseURL.appending(path: "/api/user/push-subscription")

    // MARK: - Refresh Intervals (seconds)

    enum RefreshInterval {
        static let transit: TimeInterval = 30
        static let weather: TimeInterval = 60
        static let aircraft: TimeInterval = 60
        static let snowplows: TimeInterval = 60
        static let cameras: TimeInterval = 120
        static let traffic: TimeInterval = 300
        static let rivers: TimeInterval = 300
        static let flights: TimeInterval = 300
        static let outages: TimeInterval = 300
        static let airQuality: TimeInterval = 600
        static let earthquakes: TimeInterval = 600
        static let events: TimeInterval = 1800
        static let gasPrices: TimeInterval = 3600
        static let news: TimeInterval = 600
        static let scanner: TimeInterval = 300
        static let council: TimeInterval = 3600
        static let digest: TimeInterval = 3600
        static let status: TimeInterval = 60
    }
}
