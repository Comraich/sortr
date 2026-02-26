import SwiftUI

struct DashboardView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "chart.bar.fill")
                .font(.system(size: 48))
                .foregroundStyle(.tint)
            Text("Dashboard")
                .font(.largeTitle.bold())
        }
        .navigationTitle("Dashboard")
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

#Preview {
    NavigationStack { DashboardView() }
}
