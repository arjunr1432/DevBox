#!/bin/bash
# build/sign-and-notarize.sh
# A script to sign, zip, submit for notarization, and staple the DevBox application.

set -e

# Configuration
ZIP_PATH="DevBox-macOS.zip"
ENTITLEMENTS="build/entitlements.plist"

# Detect packaged app path dynamically (supports both arm64 and x64 builds)
if [ -d "dist-app/DevBox-darwin-arm64/DevBox.app" ]; then
  APP_PATH="dist-app/DevBox-darwin-arm64/DevBox.app"
elif [ -d "dist-app/DevBox-darwin-x64/DevBox.app" ]; then
  APP_PATH="dist-app/DevBox-darwin-x64/DevBox.app"
else
  echo "Error: Packaged application not found in dist-app/DevBox-darwin-arm64 or dist-app/DevBox-darwin-x64."
  echo "Please run 'npm run package:mac' first."
  exit 1
fi

# Helper for usage
usage() {
  echo "Usage: ./build/sign-and-notarize.sh -i \"<Signing Identity>\" -u \"<Apple ID Email>\" -p \"<App-Specific Password>\" -t \"<Team ID>\""
  echo ""
  echo "Arguments:"
  echo "  -i  Your 'Developer ID Application' certificate name (e.g. \"Developer ID Application: Jane Doe (12345678AB)\")"
  echo "  -u  Your Apple ID email address (e.g. jane.doe@example.com)"
  echo "  -p  Your Apple ID app-specific password (generated at appleid.apple.com)"
  echo "  -t  Your Apple Developer Team ID (10-character alphanumeric)"
  exit 1
}

# Parse options
while getopts "i:u:p:t:h" opt; do
  case ${opt} in
    i ) IDENTITY=$OPTARG ;;
    u ) APPLE_ID=$OPTARG ;;
    p ) PASSWORD=$OPTARG ;;
    t ) TEAM_ID=$OPTARG ;;
    h ) usage ;;
    \? ) usage ;;
  esac
done

if [ -z "$IDENTITY" ] || [ -z "$APPLE_ID" ] || [ -z "$PASSWORD" ] || [ -z "$TEAM_ID" ]; then
  echo "Error: All fields (-i, -u, -p, -t) are required."
  echo ""
  usage
fi

echo "========================================="
echo "Step 1: Code Signing application (Inside-Out)..."
echo "========================================="

# 1. Sign all dynamic libraries and native node modules
echo "Signing nested dynamic libraries..."
find "$APP_PATH" -type f \( -name "*.dylib" -o -name "*.node" \) -print0 | while IFS= read -r -d '' file; do
    echo "  -> Signing: $file"
    codesign --force --timestamp --options runtime --sign "$IDENTITY" "$file"
done

# 2. Sign other executables
echo "Signing helper binaries..."
find "$APP_PATH" -type f -print0 | while IFS= read -r -d '' file; do
    if [ -x "$file" ]; then
        if [[ "$file" != *.sh && "$file" != *.js && "$file" != *.html && "$file" != *.json && "$file" != *.css ]]; then
            echo "  -> Signing binary: $file"
            codesign --force --timestamp --options runtime --entitlements "$ENTITLEMENTS" --sign "$IDENTITY" "$file"
        fi
    fi
done

# 3. Sign frameworks
if [ -d "$APP_PATH/Contents/Frameworks" ]; then
    echo "Signing nested frameworks..."
    find "$APP_PATH/Contents/Frameworks" -name "*.framework" -type d -print0 | while IFS= read -r -d '' fw; do
        echo "  -> Signing framework: $fw"
        codesign --force --timestamp --options runtime --sign "$IDENTITY" "$fw"
    done
fi

# 4. Sign helper apps
if [ -d "$APP_PATH/Contents/Frameworks" ]; then
    echo "Signing helper apps..."
    find "$APP_PATH/Contents/Frameworks" -name "*.app" -type d -print0 | while IFS= read -r -d '' helper; do
        echo "  -> Signing helper app: $helper"
        codesign --force --timestamp --options runtime --entitlements "$ENTITLEMENTS" --sign "$IDENTITY" "$helper"
    done
fi

# 5. Finally, sign the main app bundle
echo "Signing main application bundle..."
codesign --force --timestamp --options runtime --entitlements "$ENTITLEMENTS" --sign "$IDENTITY" "$APP_PATH"

echo "Verifying local signature..."
codesign --verify --verbose --deep "$APP_PATH"

echo "========================================="
echo "Step 2: Compressing application..."
echo "========================================="
rm -f "$ZIP_PATH"
ditto -c -k --sequesterRsrc --keepParent "$APP_PATH" "$ZIP_PATH"
echo "Created archive: $ZIP_PATH"

echo "========================================="
echo "Step 3: Submitting to Apple Notary Service..."
echo "========================================="
xcrun notarytool submit "$ZIP_PATH" \
  --apple-id "$APPLE_ID" \
  --password "$PASSWORD" \
  --team-id "$TEAM_ID" \
  --wait

echo "========================================="
echo "Step 4: Stapling notarization ticket..."
echo "========================================="
xcrun stapler staple "$APP_PATH"

echo "========================================="
echo "Step 5: Updating the release archive..."
echo "========================================="
rm -f "$ZIP_PATH"
ditto -c -k --sequesterRsrc --keepParent "$APP_PATH" "$ZIP_PATH"

echo "Done! The application is signed, notarized, and stapled."
echo "You can distribute the final ZIP file: $ZIP_PATH"
