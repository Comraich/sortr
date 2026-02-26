import SwiftUI

@main
struct SortrApp: App {
    @State private var authSession = AuthSession()

    init() {
        // Register defaults so UserDefaults returns the right value even before
        // the user has opened Settings.app and the key has been written.
        UserDefaults.standard.register(defaults: ["serverURL": "http://localhost:8000"])
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(authSession)
        }
    }
}
