# Development Build: npx expo run:android

To generater apk : eas build -p android --profile preview

# Local APK Build (Emulator apk):

## Step1: npx expo prebuild --platform android

## Step 2: cd android

## Step 3: .\gradlew.bat assembleRelease

    .\gradlew.bat assembleDebug

## Step 4: adb install -r app\build\outputs\apk\release\app-release.apk

    adb install app\build\outputs\apk\debug\app-debug.apk

## npx expo start --dev-client

# Checklist Before Build

1. npx expo-doctor
2. npx expo install --check
3. npx expo config --type public
4. npx expo prebuild --clean --no-install

cd android

.\gradlew.bat clean

.\gradlew.bat assembleDebug
