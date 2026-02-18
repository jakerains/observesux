import SwiftUI
import MapKit

// MARK: - Map Layer Types

enum MapLayer: String, CaseIterable, Identifiable {
    case cameras
    case buses
    case trafficEvents
    case rivers
    case gasStations
    case aircraft
    case snowplows
    case radar

    var id: String { rawValue }

    var label: String {
        switch self {
        case .cameras: "Cameras"
        case .buses: "Buses"
        case .trafficEvents: "Traffic"
        case .rivers: "Rivers"
        case .gasStations: "Gas"
        case .aircraft: "Aircraft"
        case .snowplows: "Plows"
        case .radar: "Radar"
        }
    }

    var icon: String {
        switch self {
        case .cameras: "video.fill"
        case .buses: "bus.fill"
        case .trafficEvents: "exclamationmark.triangle.fill"
        case .rivers: "water.waves"
        case .gasStations: "fuelpump.fill"
        case .aircraft: "airplane"
        case .snowplows: "snowflake"
        case .radar: "cloud.rain.fill"
        }
    }
}

@Observable
@MainActor
final class MapViewModel {
    // Layer visibility
    var activeLayers: Set<MapLayer> = [.cameras, .buses]

    // Data per layer
    var cameras: [TrafficCamera] = []
    var buses: [BusPosition] = []
    var trafficEvents: [TrafficEvent] = []
    var rivers: [RiverGaugeReading] = []
    var gasStations: [GasStation] = []
    var aircraft: [Aircraft] = []
    var snowplows: [Snowplow] = []

    // Map state
    var cameraPosition: MapCameraPosition = .region(
        MKCoordinateRegion(
            center: CLLocationCoordinate2D(latitude: 42.4963, longitude: -96.4050),
            span: MKCoordinateSpan(latitudeDelta: 0.15, longitudeDelta: 0.15)
        )
    )

    var selectedAnnotation: String?
    private var pollingTask: Task<Void, Never>?

    func toggleLayer(_ layer: MapLayer) {
        if activeLayers.contains(layer) {
            activeLayers.remove(layer)
        } else {
            activeLayers.insert(layer)
            // Fetch data for newly enabled layer
            Task { await fetchLayer(layer) }
        }
    }

    func startPolling() {
        pollingTask = Task {
            await fetchAllActiveLayers()
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(30))
                await fetchAllActiveLayers()
            }
        }
    }

    func stopPolling() {
        pollingTask?.cancel()
        pollingTask = nil
    }

    func fetchAllActiveLayers() async {
        await withTaskGroup(of: Void.self) { group in
            for layer in activeLayers {
                group.addTask { await self.fetchLayer(layer) }
            }
        }
    }

    private func fetchLayer(_ layer: MapLayer) async {
        do {
            switch layer {
            case .cameras:
                let sources: [CameraSource] = try await APIClient.shared.fetchData(Endpoints.cameras)
                cameras = sources.flatMap(\.cameras)
            case .buses:
                let data: TransitData = try await APIClient.shared.fetchData(Endpoints.transit)
                buses = data.buses
            case .trafficEvents:
                trafficEvents = try await APIClient.shared.fetchData(Endpoints.trafficEvents)
            case .rivers:
                rivers = try await APIClient.shared.fetchData(Endpoints.rivers)
            case .gasStations:
                let data: GasPriceData = try await APIClient.shared.fetchData(Endpoints.gasPrices)
                gasStations = data.stations
            case .aircraft:
                let data: AircraftData = try await APIClient.shared.fetchData(Endpoints.aircraft)
                aircraft = data.aircraft
            case .snowplows:
                snowplows = try await APIClient.shared.fetchData(Endpoints.snowplows)
            case .radar:
                break // Radar is a tile overlay, not fetched data
            }
        } catch {
            // Individual layer fetch failure shouldn't crash others
        }
    }
}
