import SwiftUI

struct CategoriesView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "tag.fill")
                .font(.system(size: 48))
                .foregroundStyle(.tint)
            Text("Categories")
                .font(.largeTitle.bold())
        }
        .navigationTitle("Categories")
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

#Preview {
    NavigationStack { CategoriesView() }
}
