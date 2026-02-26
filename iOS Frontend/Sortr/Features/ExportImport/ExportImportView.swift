import SwiftUI

struct ExportImportView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "arrow.up.arrow.down")
                .font(.system(size: 48))
                .foregroundStyle(.tint)
            Text("Export / Import")
                .font(.largeTitle.bold())
        }
        .navigationTitle("Export / Import")
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

#Preview {
    NavigationStack { ExportImportView() }
}
