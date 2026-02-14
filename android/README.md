# Sortr Android App

Native Android app for Sortr inventory management, built with Kotlin and Jetpack Compose.

## Features

- Full feature parity with the web app
- QR code scanning for quick navigation to locations, boxes, and items
- QR code generation for physical labeling
- Material 3 design with dynamic color support
- Offline-friendly error handling

## Tech Stack

- **Language**: Kotlin
- **UI**: Jetpack Compose + Material 3
- **Architecture**: MVVM with Hilt dependency injection
- **Networking**: Retrofit + OkHttp
- **QR Scanning**: ML Kit + CameraX
- **QR Generation**: ZXing
- **Storage**: DataStore (for tokens)

## Setup

### Prerequisites

- Android Studio Hedgehog (2023.1.1) or newer
- JDK 17
- Android SDK 34

### Configuration

1. Open the `android` folder in Android Studio

2. Configure the API URL in `app/build.gradle.kts`:
   - For emulator testing, the default `http://10.0.2.2:8000` points to your host machine's localhost
   - For device testing on local network, update to your machine's IP address

3. For Google Sign-In (optional):
   - Create a project in Google Cloud Console
   - Enable the Google Sign-In API
   - Create OAuth 2.0 credentials (Android client)
   - Add your SHA-1 certificate fingerprint
   - Replace `YOUR_WEB_CLIENT_ID` in `LoginScreen.kt` with your Web client ID
   - Set `GOOGLE_CLIENT_ID` in your backend `.env` file

### Build & Run

```bash
# Build debug APK
./gradlew assembleDebug

# Install on connected device/emulator
./gradlew installDebug

# Run tests
./gradlew test
```

Or simply click "Run" in Android Studio.

## Project Structure

```
app/src/main/java/com/sortr/app/
├── SortrApplication.kt          # Hilt application
├── MainActivity.kt              # Single activity entry point
├── data/
│   ├── model/                   # Domain models
│   ├── remote/
│   │   ├── api/                 # Retrofit API interface
│   │   ├── dto/                 # Data transfer objects
│   │   └── interceptor/         # Auth interceptor
│   └── repository/              # Data repositories
├── di/                          # Hilt modules
├── ui/
│   ├── auth/                    # Login screen
│   ├── home/                    # Home screen
│   ├── location/                # Location screens
│   ├── box/                     # Box screens
│   ├── item/                    # Item screens
│   ├── scanner/                 # QR scanner
│   ├── settings/                # Settings screen
│   ├── components/              # Reusable composables
│   ├── navigation/              # Navigation setup
│   └── theme/                   # Material theme
└── util/                        # Utilities (token manager, QR generator)
```

## Deep Links

The app handles the following deep link patterns:

- `sortr://location/{id}` - Opens location detail
- `sortr://box/{id}` - Opens box detail
- `sortr://item/{id}` - Opens item detail

These are used by QR codes generated within the app.

## Backend Requirements

The app requires the Sortr backend running with the following endpoints:

- `POST /api/login` - Username/password authentication
- `POST /api/register` - User registration
- `POST /api/auth/google-mobile` - Google Sign-In (ID token verification)
- `GET/POST/PUT/DELETE /api/items`
- `GET/POST/PUT/DELETE /api/locations`
- `GET/POST/PUT/DELETE /api/boxes`

All endpoints except login/register require `Authorization: Bearer {token}` header.
