import SwiftUI

// MARK: - Home Tab
// Sectioned dashboard matching the web app's layout hierarchy

struct HomeTab: View {
    // ViewModels — each manages its own polling lifecycle
    @State private var weatherVM = WeatherViewModel()
    @State private var transitVM = TransitViewModel()
    @State private var riversVM = RiversViewModel()
    @State private var airQualityVM = AirQualityViewModel()
    @State private var trafficEventsVM = TrafficEventsViewModel()
    @State private var flightsVM = FlightsViewModel()
    @State private var aviationVM = AviationViewModel()
    @State private var earthquakeVM = EarthquakeViewModel()
    @State private var gasPricesVM = GasPricesViewModel()
    @State private var outagesVM = OutagesViewModel()
    @State private var newsVM = NewsViewModel()
    @State private var eventsVM = EventsViewModel()
    @State private var councilVM = CouncilViewModel()
    @State private var digestVM = DigestViewModel()

    private let twoColumnGrid = [
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12),
    ]

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack(spacing: 16) {
                    // 1. Weather Hero (full width, no DashboardCard wrapper)
                    WeatherHeroCard(
                        observation: weatherVM.observation,
                        alerts: weatherVM.alerts,
                        status: weatherVM.status,
                        onRefresh: { await weatherVM.fetchAll() }
                    )

                    // 2. Digest (primary tier)
                    DigestCard(viewModel: digestVM)

                    // 3. Live Updates section
                    SectionHeader(title: "Live Updates")

                    WeatherForecastCard(
                        forecast: weatherVM.forecast,
                        hourlyForecast: weatherVM.hourlyForecast
                    )

                    // Weather alerts (if any)
                    ForEach(weatherVM.alerts) { alert in
                        WeatherAlertBanner(alert: alert)
                    }

                    NewsCard(viewModel: newsVM)
                    CouncilCard(viewModel: councilVM)

                    // 4. Conditions & Services section (2-column grid)
                    SectionHeader(title: "Conditions & Services")

                    LazyVGrid(columns: twoColumnGrid, spacing: 12) {
                        TrafficEventsCard(viewModel: trafficEventsVM)
                        RiverGaugeCard(viewModel: riversVM)
                        AirQualityCard(viewModel: airQualityVM)
                        TransitCard(viewModel: transitVM)
                        OutagesCard(viewModel: outagesVM)
                        GasPricesCard(viewModel: gasPricesVM)
                        EventsCard(viewModel: eventsVM)
                    }

                    // 5. More Info section (2-column grid, compact)
                    SectionHeader(title: "More Info")

                    LazyVGrid(columns: twoColumnGrid, spacing: 12) {
                        FlightBoardCard(viewModel: flightsVM)
                        AviationWeatherCard(viewModel: aviationVM)
                        ScannerCard()
                        EarthquakeCard(viewModel: earthquakeVM)
                    }

                    // Footer
                    dataSourcesFooter
                }
                .padding(.horizontal)
                .padding(.bottom, 24)
            }
            .background(Color("SlBackground"))
            .refreshable {
                await refreshAll()
            }
            .toolbar {
                ToolbarItem(placement: .principal) {
                    brandedTitle
                }
            }
            .task { startAllPolling() }
        }
    }

    // MARK: - Branded Title

    private var brandedTitle: some View {
        HStack(spacing: 0) {
            Text("Siouxland")
                .font(.system(size: 20, weight: .bold))
                .foregroundStyle(Color("SlPrimary"))
            Text(".Online")
                .font(.system(size: 20, weight: .regular))
                .foregroundStyle(Color("SlMutedForeground"))
        }
    }

    // MARK: - Footer

    private var dataSourcesFooter: some View {
        VStack(spacing: 4) {
            Text("Data from NWS, USGS, FAA, Iowa DOT & public APIs")
                .font(.slCompact)
                .foregroundStyle(Color("SlMutedForeground"))
            Text("Updated automatically every few minutes")
                .font(.slCompact)
                .foregroundStyle(Color("SlMutedForeground"))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
    }

    // MARK: - Polling

    private func startAllPolling() {
        weatherVM.startPolling()
        transitVM.startPolling()
        riversVM.startPolling()
        airQualityVM.startPolling()
        trafficEventsVM.startPolling()
        flightsVM.startPolling()
        aviationVM.startPolling()
        earthquakeVM.startPolling()
        gasPricesVM.startPolling()
        outagesVM.startPolling()
        newsVM.startPolling()
        eventsVM.startPolling()
        councilVM.startPolling()
        digestVM.startPolling()
    }

    private func refreshAll() async {
        await withTaskGroup(of: Void.self) { group in
            group.addTask { await weatherVM.fetchAll() }
            group.addTask { await transitVM.fetch() }
            group.addTask { await riversVM.fetch() }
            group.addTask { await airQualityVM.fetch() }
            group.addTask { await trafficEventsVM.fetch() }
            group.addTask { await flightsVM.fetch() }
            group.addTask { await aviationVM.fetchAll() }
            group.addTask { await earthquakeVM.fetch() }
            group.addTask { await gasPricesVM.fetch() }
            group.addTask { await outagesVM.fetch() }
            group.addTask { await newsVM.fetch() }
            group.addTask { await eventsVM.fetch() }
            group.addTask { await councilVM.fetch() }
            group.addTask { await digestVM.fetch() }
        }
    }
}

#Preview {
    HomeTab()
}
