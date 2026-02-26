import SwiftUI
import Charts

struct DashboardView: View {
    @State private var viewModel = DashboardViewModel()

    var body: some View {
        content
            .navigationTitle("Dashboard")
            .task { await viewModel.load() }
            .refreshable { await viewModel.load() }
    }

    // MARK: - Top-level content state

    @ViewBuilder
    private var content: some View {
        if let stats = viewModel.stats {
            ScrollView {
                LazyVStack(spacing: 16) {
                    overviewGrid(stats.overview)
                    storageHealthCard(stats.overview)
                    if !viewModel.trends.isEmpty {
                        trendCard
                    }
                    if !stats.itemsByCategory.isEmpty {
                        categoryChart(stats.itemsByCategory)
                    }
                    if !stats.itemsByLocation.isEmpty {
                        locationChart(stats.itemsByLocation)
                    }
                    recentItemsCard(stats.recentItems)
                    if !stats.recentActivity.isEmpty {
                        activityCard(stats.recentActivity)
                    }
                }
                .padding()
            }
        } else if let error = viewModel.errorMessage {
            ContentUnavailableView {
                Label("Unable to Load", systemImage: "exclamationmark.triangle")
            } description: {
                Text(error)
            } actions: {
                Button("Try Again") { Task { await viewModel.load() } }
            }
        } else {
            ProgressView()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }

    // MARK: - Overview grid

    private func overviewGrid(_ o: DashboardStats.Overview) -> some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            StatCard(value: "\(o.totalItems)",      label: "Items",      icon: "tray.2.fill",      color: .blue)
            StatCard(value: "\(o.totalLocations)",  label: "Locations",  icon: "map.fill",          color: .green)
            StatCard(value: "\(o.totalBoxes)",      label: "Boxes",      icon: "shippingbox.fill",  color: .orange)
            StatCard(value: "\(o.totalCategories)", label: "Categories", icon: "tag.fill",           color: .purple)
        }
    }

    // MARK: - Storage health

    private func storageHealthCard(_ o: DashboardStats.Overview) -> some View {
        SectionCard(title: "Storage Health") {
            VStack(spacing: 12) {
                Gauge(value: o.boxUtilization, in: 0...100) {
                    Text("Box utilization")
                } currentValueLabel: {
                    Text("\(Int(o.boxUtilization))%")
                }
                .gaugeStyle(.linearCapacity)
                .tint(utilizationColor(o.boxUtilization))

                HStack {
                    Label(
                        "\(o.emptyBoxesCount) empty \(o.emptyBoxesCount == 1 ? "box" : "boxes")",
                        systemImage: "shippingbox"
                    )
                    .font(.caption)
                    .foregroundStyle(.secondary)

                    Spacer()

                    Text(String(format: "%.1f items / box avg", o.averageItemsPerBox))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
    }

    private func utilizationColor(_ pct: Double) -> Color {
        switch pct {
        case ..<40: return .green
        case ..<75: return .yellow
        default:    return .red
        }
    }

    // MARK: - Trend chart

    private var trendCard: some View {
        SectionCard(title: "Items Added — Last 30 Days") {
            Chart(viewModel.trends) { point in
                AreaMark(
                    x: .value("Date", point.date),
                    y: .value("Items", point.count)
                )
                .foregroundStyle(.tint.opacity(0.2))
                .interpolationMethod(.catmullRom)

                LineMark(
                    x: .value("Date", point.date),
                    y: .value("Items", point.count)
                )
                .foregroundStyle(.tint)
                .interpolationMethod(.catmullRom)
            }
            .chartXAxis {
                AxisMarks(values: .automatic(desiredCount: 5)) { value in
                    AxisGridLine()
                    AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                }
            }
            .chartYAxis {
                AxisMarks { AxisGridLine() }
            }
            .frame(height: 140)
        }
    }

    // MARK: - Category chart

    private func categoryChart(_ data: [DashboardStats.CategoryCount]) -> some View {
        SectionCard(title: "Items by Category") {
            Chart(data) { item in
                BarMark(
                    x: .value("Count", item.count),
                    y: .value("Category", item.category)
                )
                .foregroundStyle(.tint)
            }
            .chartXAxis {
                AxisMarks { value in
                    AxisGridLine()
                    AxisValueLabel()
                }
            }
            .frame(height: CGFloat(max(data.count, 3)) * 36)
        }
    }

    // MARK: - Location chart

    private func locationChart(_ data: [DashboardStats.LocationCount]) -> some View {
        SectionCard(title: "Items by Location") {
            Chart(data) { loc in
                BarMark(
                    x: .value("Count", loc.count),
                    y: .value("Location", loc.name)
                )
                .foregroundStyle(.green)
            }
            .chartXAxis {
                AxisMarks { value in
                    AxisGridLine()
                    AxisValueLabel()
                }
            }
            .frame(height: CGFloat(max(data.count, 3)) * 36)
        }
    }

    // MARK: - Recent items

    private func recentItemsCard(_ items: [DashboardStats.RecentItem]) -> some View {
        SectionCard(title: "Recently Added") {
            if items.isEmpty {
                Text("No items yet.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            } else {
                VStack(spacing: 0) {
                    ForEach(items) { item in
                        VStack(alignment: .leading, spacing: 3) {
                            HStack {
                                Text(item.name)
                                    .font(.subheadline).fontWeight(.medium)
                                    .lineLimit(1)
                                Spacer()
                                Text(item.createdAt.formatted(.relative(presentation: .named)))
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                            }
                            HStack(spacing: 6) {
                                if let cat = item.category {
                                    Text(cat)
                                        .font(.caption)
                                        .foregroundStyle(.tint)
                                }
                                if item.location != "-" {
                                    Text(item.location)
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                            }
                        }
                        .padding(.vertical, 8)
                        if item.id != items.last?.id { Divider() }
                    }
                }
            }
        }
    }

    // MARK: - Recent activity

    private func activityCard(_ entries: [DashboardStats.ActivityEntry]) -> some View {
        SectionCard(title: "Recent Activity") {
            VStack(spacing: 0) {
                ForEach(entries) { entry in
                    HStack(alignment: .top, spacing: 10) {
                        Image(systemName: entry.actionIconName)
                            .font(.body)
                            .foregroundStyle(activityColor(entry.action))
                            .frame(width: 22)

                        VStack(alignment: .leading, spacing: 2) {
                            Text(entry.summary)
                                .font(.subheadline)
                                .lineLimit(2)
                            Text(entry.createdAt.formatted(.relative(presentation: .named)))
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                    }
                    .padding(.vertical, 8)
                    if entry.id != entries.last?.id { Divider() }
                }
            }
        }
    }

    private func activityColor(_ action: String) -> Color {
        switch action {
        case "create": return .green
        case "delete": return .red
        default:       return .blue
        }
    }
}

// MARK: - Reusable sub-views

private struct StatCard: View {
    let value: String
    let label: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundStyle(color)
            Text(value)
                .font(.title.bold())
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.fill.tertiary, in: RoundedRectangle(cornerRadius: 12))
    }
}

private struct SectionCard<Content: View>: View {
    let title: String
    @ViewBuilder let content: () -> Content

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.headline)
            content()
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.fill.tertiary, in: RoundedRectangle(cornerRadius: 12))
    }
}

#Preview {
    NavigationStack { DashboardView() }
}
