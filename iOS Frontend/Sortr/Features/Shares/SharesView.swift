import SwiftUI

struct SharesView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "person.2.fill")
                .font(.system(size: 48))
                .foregroundStyle(.tint)
            Text("Shares")
                .font(.largeTitle.bold())
        }
        .navigationTitle("Shares")
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

#Preview {
    NavigationStack { SharesView() }
}
