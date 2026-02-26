import SwiftUI

struct ScannerView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "qrcode.viewfinder")
                .font(.system(size: 48))
                .foregroundStyle(.tint)
            Text("Scanner")
                .font(.largeTitle.bold())
        }
        .navigationTitle("Scanner")
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

#Preview {
    NavigationStack { ScannerView() }
}
