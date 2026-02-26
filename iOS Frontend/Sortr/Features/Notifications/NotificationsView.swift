import SwiftUI

struct NotificationsView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "bell.fill")
                .font(.system(size: 48))
                .foregroundStyle(.tint)
            Text("Notifications")
                .font(.largeTitle.bold())
        }
        .navigationTitle("Notifications")
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

#Preview {
    NavigationStack { NotificationsView() }
}
