import SwiftUI

struct ActivityView: View {
    @State private var entries: [ActivityLog] = []
    @State private var isLoading = false
    @State private var isLoadingMore = false
    @State private var errorMessage: String?
    @State private var hasMore = true

    private let pageSize = 50

    var body: some View {
        content
            .navigationTitle("Activity")
            .task { await load() }
            .refreshable { await load() }
            .alert("Error", isPresented: Binding(
                get: { errorMessage != nil },
                set: { if !$0 { errorMessage = nil } }
            )) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(errorMessage ?? "")
            }
    }

    @ViewBuilder
    private var content: some View {
        if entries.isEmpty {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let error = errorMessage {
                ContentUnavailableView {
                    Label("Unable to Load", systemImage: "exclamationmark.triangle")
                } description: {
                    Text(error)
                } actions: {
                    Button("Try Again") { Task { await load() } }
                }
            } else {
                ContentUnavailableView(
                    "No Activity",
                    systemImage: "clock.arrow.2.circlepath",
                    description: Text("Activity will appear here as users make changes.")
                )
            }
        } else {
            List {
                ForEach(entries) { entry in
                    ActivityRow(entry: entry)
                }
                if hasMore {
                    HStack {
                        Spacer()
                        if isLoadingMore {
                            ProgressView()
                        } else {
                            Button("Load More") { Task { await loadMore() } }
                        }
                        Spacer()
                    }
                    .listRowSeparator(.hidden)
                }
            }
            .listStyle(.plain)
        }
    }

    private func load() async {
        if entries.isEmpty { isLoading = true }
        errorMessage = nil
        do {
            let page: [ActivityLog] = try await APIClient.shared.request(
                .activities(skip: 0, limit: pageSize)
            )
            entries = page
            hasMore = page.count == pageSize
        } catch {
            errorMessage = (error as? APIError)?.localizedDescription
                ?? error.localizedDescription
        }
        isLoading = false
    }

    private func loadMore() async {
        guard !isLoadingMore, hasMore else { return }
        isLoadingMore = true
        do {
            let page: [ActivityLog] = try await APIClient.shared.request(
                .activities(skip: entries.count, limit: pageSize)
            )
            entries.append(contentsOf: page)
            hasMore = page.count == pageSize
        } catch {
            errorMessage = (error as? APIError)?.localizedDescription
                ?? error.localizedDescription
        }
        isLoadingMore = false
    }
}

// MARK: - Row

private struct ActivityRow: View {
    let entry: ActivityLog

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: entry.iconName)
                .font(.body)
                .foregroundStyle(actionColor)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 2) {
                Text(entry.summary)
                    .font(.subheadline)
                    .lineLimit(2)
                Text(entry.createdAt.formatted(.relative(presentation: .named)))
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 4)
    }

    private var actionColor: Color {
        switch entry.action {
        case "create": return .green
        case "delete": return .red
        default:       return .blue
        }
    }
}

#Preview {
    NavigationStack { ActivityView() }
}
