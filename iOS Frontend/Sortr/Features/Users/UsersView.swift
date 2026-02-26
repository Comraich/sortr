import SwiftUI

struct UsersView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "person.3.fill")
                .font(.system(size: 48))
                .foregroundStyle(.tint)
            Text("Users")
                .font(.largeTitle.bold())
        }
        .navigationTitle("Users")
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

#Preview {
    NavigationStack { UsersView() }
}
