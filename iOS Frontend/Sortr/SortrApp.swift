import SwiftUI

@main
struct SortrApp: App {
    @State private var authSession = AuthSession()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(authSession)
        }
    }
}
