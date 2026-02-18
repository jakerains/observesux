import SwiftUI
import MapKit

// MARK: - Map Tab
// Full-screen MapKit with toggleable data layers

struct MapTab: View {
    @State private var viewModel = MapViewModel()

    var body: some View {
        ZStack(alignment: .top) {
            mapView

            // Layer toggle pills at top
            VStack {
                MapLayerToggle(viewModel: viewModel)
                    .padding(.top, 8)
                Spacer()
            }
        }
        .task {
            viewModel.startPolling()
        }
        .onDisappear {
            viewModel.stopPolling()
        }
    }

    // MARK: - Map Content

    private var mapView: some View {
        Map(position: $viewModel.cameraPosition) {
            // Camera annotations
            if viewModel.activeLayers.contains(.cameras) {
                ForEach(viewModel.cameras) { camera in
                    Annotation(camera.name, coordinate: CLLocationCoordinate2D(
                        latitude: camera.latitude,
                        longitude: camera.longitude
                    )) {
                        CameraAnnotation(camera: camera)
                    }
                }
            }

            // Bus annotations
            if viewModel.activeLayers.contains(.buses) {
                ForEach(viewModel.buses) { bus in
                    Annotation(bus.routeName, coordinate: CLLocationCoordinate2D(
                        latitude: bus.latitude,
                        longitude: bus.longitude
                    )) {
                        BusAnnotation(bus: bus)
                    }
                }
            }

            // Traffic event annotations
            if viewModel.activeLayers.contains(.trafficEvents) {
                ForEach(viewModel.trafficEvents) { event in
                    Annotation(event.headline, coordinate: CLLocationCoordinate2D(
                        latitude: event.latitude,
                        longitude: event.longitude
                    )) {
                        TrafficAnnotation(event: event)
                    }
                }
            }

            // River gauge annotations
            if viewModel.activeLayers.contains(.rivers) {
                ForEach(viewModel.rivers) { reading in
                    Annotation(reading.siteName, coordinate: CLLocationCoordinate2D(
                        latitude: reading.latitude,
                        longitude: reading.longitude
                    )) {
                        RiverAnnotation(reading: reading)
                    }
                }
            }

            // Gas station annotations
            if viewModel.activeLayers.contains(.gasStations) {
                ForEach(viewModel.gasStations) { station in
                    if let lat = station.latitude, let lng = station.longitude {
                        Annotation(station.brandName, coordinate: CLLocationCoordinate2D(
                            latitude: lat,
                            longitude: lng
                        )) {
                            GasStationAnnotation(station: station)
                        }
                    }
                }
            }

            // Aircraft annotations
            if viewModel.activeLayers.contains(.aircraft) {
                ForEach(viewModel.aircraft) { ac in
                    Annotation(ac.callsign ?? ac.icao24, coordinate: CLLocationCoordinate2D(
                        latitude: ac.latitude,
                        longitude: ac.longitude
                    )) {
                        AircraftAnnotation(aircraft: ac)
                    }
                }
            }

            // Snowplow annotations
            if viewModel.activeLayers.contains(.snowplows) {
                ForEach(viewModel.snowplows) { plow in
                    Annotation(plow.name, coordinate: CLLocationCoordinate2D(
                        latitude: plow.latitude,
                        longitude: plow.longitude
                    )) {
                        SnowplowAnnotation(plow: plow)
                    }
                }
            }
        }
        .mapStyle(.standard(elevation: .realistic))
        .mapControls {
            MapCompass()
            MapScaleView()
            MapUserLocationButton()
        }
    }
}

#Preview {
    MapTab()
}
