import SwiftUI

/// Top-level navigation shell using the iOS 18 `Tab`/`TabSection` API.
///
/// - iPhone: standard bottom tab bar; overflow tabs accessible via "More".
/// - iPad:   automatic sidebar with section headers.
///
/// Each tab owns its own `NavigationStack` so navigation history is
/// independent per-tab. Admin-only tabs are conditionally included based
/// on `AuthSession.isAdmin`.
struct MainTabView: View {
    @Environment(AuthSession.self) private var authSession

    @State private var selectedTab: AppTab = .items
    @State private var unreadCount = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            Tab("Items", systemImage: "tray.2.fill", value: AppTab.items) {
                NavigationStack { ItemsView() }
            }

            Tab("Locations", systemImage: "map.fill", value: AppTab.locations) {
                NavigationStack { LocationsView() }
            }

            Tab("Scanner", systemImage: "qrcode.viewfinder", value: AppTab.scanner) {
                NavigationStack { ScannerView() }
            }

            Tab("Dashboard", systemImage: "chart.bar.fill", value: AppTab.dashboard) {
                NavigationStack { DashboardView() }
            }

            TabSection("More") {
                Tab("Notifications", systemImage: "bell.fill", value: AppTab.notifications) {
                    NavigationStack { NotificationsView() }
                }
                .badge(unreadCount)

                Tab("Shares", systemImage: "person.2.fill", value: AppTab.shares) {
                    NavigationStack { SharesView() }
                }

                Tab("Profile", systemImage: "person.crop.circle.fill", value: AppTab.profile) {
                    NavigationStack { ProfileView() }
                }

                Tab("Settings", systemImage: "gearshape.fill", value: AppTab.settings) {
                    NavigationStack { SettingsView() }
                }

                Tab("Export / Import", systemImage: "arrow.up.arrow.down", value: AppTab.exportImport) {
                    NavigationStack { ExportImportView() }
                }

                if authSession.isAdmin {
                    Tab("Activity", systemImage: "clock.arrow.2.circlepath", value: AppTab.activity) {
                        NavigationStack { ActivityView() }
                    }

                    Tab("Categories", systemImage: "tag.fill", value: AppTab.categories) {
                        NavigationStack { CategoriesView() }
                    }

                    Tab("Users", systemImage: "person.3.fill", value: AppTab.users) {
                        NavigationStack { UsersView() }
                    }
                }
            }
        }
        .tabViewStyle(.sidebarAdaptable)
        .task { await fetchUnreadCount() }
    }

    private func fetchUnreadCount() async {
        guard let count: UnreadCountResponse = try? await APIClient.shared.request(.unreadCount) else { return }
        unreadCount = count.count
    }
}

// MARK: - Supporting types

enum AppTab: Hashable {
    case items, locations, scanner, dashboard
    case notifications, shares, profile, settings, exportImport
    case activity, categories, users
}

private struct UnreadCountResponse: Decodable {
    let count: Int
}

#Preview {
    MainTabView()
        .environment(AuthSession())
}
