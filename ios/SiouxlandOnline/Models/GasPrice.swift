import Foundation

enum FuelType: String, Decodable, Sendable {
    case regular = "Regular"
    case midgrade = "Midgrade"
    case premium = "Premium"
    case diesel = "Diesel"
}

struct GasPrice: Decodable, Sendable {
    let fuelType: FuelType
    let price: Double
}

struct GasStation: Decodable, Identifiable, Sendable {
    let id: Int
    let brandName: String
    let streetAddress: String
    let city: String?
    let state: String?
    let latitude: Double?
    let longitude: Double?
    let prices: [GasPrice]
}

struct GasPriceStats: Decodable, Sendable {
    let lowestRegular: Double?
    let averageRegular: Double?
    let highestRegular: Double?
    let stationCount: Int
    let cheapestStation: String?
}

struct GasPriceData: Decodable, Sendable {
    let stations: [GasStation]
    let stats: GasPriceStats
    let scrapedAt: String?
}
