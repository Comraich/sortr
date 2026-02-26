import SwiftUI

struct ItemsView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "tray.2.fill")
                .font(.system(size: 48))
                .foregroundStyle(.tint)
            Text("Items")
                .font(.largeTitle.bold())
        }
        .navigationTitle("Items")
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

#Preview {
    NavigationStack { ItemsView() }
}
