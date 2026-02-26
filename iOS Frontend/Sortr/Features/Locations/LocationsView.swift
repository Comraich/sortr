import SwiftUI

struct LocationsView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "map.fill")
                .font(.system(size: 48))
                .foregroundStyle(.tint)
            Text("Locations")
                .font(.largeTitle.bold())
        }
        .navigationTitle("Locations")
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

#Preview {
    NavigationStack { LocationsView() }
}
