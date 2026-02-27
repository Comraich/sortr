import SwiftUI
import VisionKit

struct ScannerView: View {
    @State private var isProcessing = false
    @State private var errorMessage: String?
    @State private var scannedItem: Item?
    @State private var scannedBox: Box?
    @State private var didScan = false

    var body: some View {
        Group {
            if DataScannerViewController.isSupported {
                scannerContent
            } else {
                ContentUnavailableView(
                    "Scanner Unavailable",
                    systemImage: "camera.slash",
                    description: Text("QR code scanning is not supported on this device.")
                )
            }
        }
        .navigationTitle("Scanner")
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(item: $scannedItem) { ItemDetailView(item: $0) }
        .navigationDestination(item: $scannedBox) { BoxDetailView(box: $0) }
        .onChange(of: scannedItem) { _, val in if val == nil { didScan = false } }
        .onChange(of: scannedBox)  { _, val in if val == nil { didScan = false } }
    }

    // MARK: - Scanner content

    @ViewBuilder
    private var scannerContent: some View {
        ZStack(alignment: .bottom) {
            DataScannerView(
                isActive: !isProcessing && scannedItem == nil && scannedBox == nil
            ) { code in
                guard !didScan else { return }
                didScan = true
                Task { await handleCode(code) }
            }
            .ignoresSafeArea()

            // Status overlay
            if isProcessing {
                statusBanner {
                    HStack(spacing: 10) {
                        ProgressView().tint(.white)
                        Text("Looking up…").foregroundStyle(.white)
                    }
                }
            } else if let error = errorMessage {
                statusBanner {
                    HStack(spacing: 10) {
                        Image(systemName: "exclamationmark.triangle.fill").foregroundStyle(.yellow)
                        Text(error).foregroundStyle(.white).lineLimit(2)
                        Spacer()
                        Button("Retry") { errorMessage = nil; didScan = false }
                            .buttonStyle(.bordered).tint(.white)
                    }
                }
            }
        }
    }

    private func statusBanner<Content: View>(@ViewBuilder content: () -> Content) -> some View {
        content()
            .padding(14)
            .background(.black.opacity(0.72), in: RoundedRectangle(cornerRadius: 14))
            .padding(.horizontal, 20)
            .padding(.bottom, 40)
    }

    // MARK: - Code handling

    private func handleCode(_ string: String) async {
        guard let (type, id) = parseCode(string) else {
            errorMessage = "Unrecognised QR code"
            didScan = false
            return
        }
        isProcessing = true
        do {
            switch type {
            case "item": scannedItem = try await APIClient.shared.request(.item(id: id))
            case "box":  scannedBox  = try await APIClient.shared.request(.box(id: id))
            default: break
            }
        } catch {
            errorMessage = (error as? APIError)?.localizedDescription ?? error.localizedDescription
            didScan = false
        }
        isProcessing = false
    }

    /// Parses `/item/42` or `/box/42` from a URL string, regardless of host.
    private func parseCode(_ string: String) -> (String, Int)? {
        guard let url = URL(string: string) else { return nil }
        let parts = url.pathComponents.filter { $0 != "/" }
        guard parts.count >= 2 else { return nil }
        let type = parts[parts.count - 2]
        guard let id = Int(parts[parts.count - 1]),
              ["item", "box"].contains(type) else { return nil }
        return (type, id)
    }
}

// MARK: - DataScannerViewController wrapper

private struct DataScannerView: UIViewControllerRepresentable {
    let isActive: Bool
    let onCode: (String) -> Void

    func makeCoordinator() -> Coordinator { Coordinator(onCode: onCode) }

    func makeUIViewController(context: Context) -> DataScannerViewController {
        let vc = DataScannerViewController(
            recognizedDataTypes: [.barcode(symbologies: [.qr])],
            qualityLevel: .accurate,
            recognizesMultipleItems: false,
            isHighlightingEnabled: true
        )
        vc.delegate = context.coordinator
        context.coordinator.vc = vc
        // Defer startScanning until the VC is in the view hierarchy
        DispatchQueue.main.async { try? vc.startScanning() }
        return vc
    }

    func updateUIViewController(_ vc: DataScannerViewController, context: Context) {
        guard DataScannerViewController.isAvailable else { return }
        if isActive, !vc.isScanning  { try? vc.startScanning() }
        if !isActive, vc.isScanning  { vc.stopScanning() }
    }

    final class Coordinator: NSObject, DataScannerViewControllerDelegate {
        weak var vc: DataScannerViewController?
        let onCode: (String) -> Void
        init(onCode: @escaping (String) -> Void) { self.onCode = onCode }

        func dataScanner(
            _ dataScanner: DataScannerViewController,
            didAdd addedItems: [RecognizedItem],
            allItems: [RecognizedItem]
        ) {
            guard case .barcode(let barcode) = addedItems.first,
                  let value = barcode.payloadStringValue else { return }
            onCode(value)
        }
    }
}

#Preview {
    NavigationStack { ScannerView() }
}
