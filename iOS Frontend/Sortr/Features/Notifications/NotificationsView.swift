import SwiftUI

struct NotificationsView: View {
    @State private var viewModel = NotificationsViewModel()

    var body: some View {
        content
            .navigationTitle("Notifications")
            .toolbar {
                if viewModel.unreadCount > 0 {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button("Mark All Read") {
                            Task { await viewModel.markAllRead() }
                        }
                    }
                }
            }
            .task { await viewModel.load() }
            .refreshable { await viewModel.load() }
            .alert("Error", isPresented: Binding(
                get: { viewModel.errorMessage != nil },
                set: { if !$0 { viewModel.errorMessage = nil } }
            )) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(viewModel.errorMessage ?? "")
            }
    }

    @ViewBuilder
    private var content: some View {
        if let error = viewModel.errorMessage, viewModel.notifications.isEmpty {
            ContentUnavailableView {
                Label("Unable to Load", systemImage: "exclamationmark.triangle")
            } description: {
                Text(error)
            } actions: {
                Button("Try Again") { Task { await viewModel.load() } }
            }
        } else if viewModel.notifications.isEmpty {
            if viewModel.isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ContentUnavailableView(
                    "All Caught Up",
                    systemImage: "bell.slash",
                    description: Text("No notifications yet.")
                )
            }
        } else {
            List {
                ForEach(viewModel.notifications) { notification in
                    NotificationRow(notification: notification)
                        .contentShape(Rectangle())
                        .onTapGesture {
                            Task { await viewModel.markRead(notification) }
                        }
                        .swipeActions(edge: .leading) {
                            if !notification.isRead {
                                Button {
                                    Task { await viewModel.markRead(notification) }
                                } label: {
                                    Label("Mark Read", systemImage: "checkmark.circle")
                                }
                                .tint(.blue)
                            }
                        }
                        .swipeActions(edge: .trailing) {
                            Button(role: .destructive) {
                                Task { await viewModel.delete(notification) }
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                        }
                        .listRowBackground(notification.isRead ? nil : Color.accentColor.opacity(0.07))
                }
            }
            .listStyle(.plain)
        }
    }
}

// MARK: - Row

private struct NotificationRow: View {
    let notification: AppNotification

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            // Unread indicator dot
            Circle()
                .fill(notification.isRead ? .clear : Color.accentColor)
                .frame(width: 8, height: 8)
                .padding(.top, 6)

            Image(systemName: notification.type.iconName)
                .font(.title3)
                .foregroundStyle(iconColor)
                .frame(width: 28)

            VStack(alignment: .leading, spacing: 3) {
                Text(notification.message)
                    .font(.subheadline)
                    .fontWeight(notification.isRead ? .regular : .medium)
                    .lineLimit(3)
                Text(notification.createdAt.formatted(.relative(presentation: .named)))
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 4)
    }

    private var iconColor: Color {
        switch notification.type {
        case .share:   return .green
        case .comment: return .blue
        case .mention: return .orange
        case .unknown: return .secondary
        }
    }
}

#Preview {
    NavigationStack { NotificationsView() }
}
