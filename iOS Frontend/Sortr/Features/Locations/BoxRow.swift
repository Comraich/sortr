import SwiftUI

struct BoxRow: View {
    let box: Box

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "shippingbox")
                .font(.body)
                .foregroundStyle(.tint)
                .frame(width: 24)

            Text(box.name)
                .font(.body)
                .fontWeight(.medium)
        }
        .padding(.vertical, 2)
    }
}
