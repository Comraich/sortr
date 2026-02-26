import SwiftUI

struct ActivityView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "clock.arrow.2.circlepath")
                .font(.system(size: 48))
                .foregroundStyle(.tint)
            Text("Activity")
                .font(.largeTitle.bold())
        }
        .navigationTitle("Activity")
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

#Preview {
    NavigationStack { ActivityView() }
}
