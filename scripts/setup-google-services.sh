#!/bin/bash

# =============================================================================
# Setup Google Services Configuration Files
# Downloads google-services.json and GoogleService-Info.plist from private repo
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Prefer an already-exported GITHUB_PAT, but if not set, try to read it from .env
if [ -z "${GITHUB_PAT:-}" ] && [ -f "$PROJECT_ROOT/.env" ]; then
  GITHUB_PAT="$(grep -E '^GITHUB_PAT=' "$PROJECT_ROOT/.env" | head -n 1 | cut -d= -f2-)"
fi

if [ -z "${GITHUB_PAT:-}" ]; then
  echo -e "${RED}Error: GITHUB_PAT is not set (export it, or add it to .env for local dev)${NC}"
  exit 1
fi

PRIVATE_REPO="https://${GITHUB_PAT}@github.com/KM-opensource-crypto-wallet/km_mobile_config.git"
BRANCH="main"

echo -e "${YELLOW}Setting up Google Services configuration files...${NC}"

# Create temp directory
TEMP_DIR=$(mktemp -d)
trap 'rm -rf $TEMP_DIR' EXIT

echo "Cloning config repository..."

# Clone the private repo (shallow clone for speed)
if ! git clone --depth 1 --branch "$BRANCH" "$PRIVATE_REPO" "$TEMP_DIR/config" 2>/dev/null; then
  echo -e "${RED}Error: Failed to clone config repository.${NC}"
  echo ""
  echo "Please ensure your GITHUB_PAT has access to: KM-opensource-crypto-wallet/km_mobile_config"
  echo "Contact the repository admin to request access."
  exit 1
fi

# Create directories if they don't exist
mkdir -p "$PROJECT_ROOT/android/app/src/dokwallet"
mkdir -p "$PROJECT_ROOT/android/app/src/kimlwallet"
mkdir -p "$PROJECT_ROOT/ios/dokwallet"
mkdir -p "$PROJECT_ROOT/ios/kimlwallet"

echo "Copying configuration files..."

# Copy dokwallet files
echo -n "  - dokwallet/google-services.json... "
if cp "$TEMP_DIR/config/dokwallet/google-services.json" "$PROJECT_ROOT/android/app/src/dokwallet/" 2>/dev/null; then
  echo -e "${GREEN}OK${NC}"
else
  echo -e "${RED}FAILED${NC}"
fi

echo -n "  - dokwallet/GoogleService-Info.plist... "
if cp "$TEMP_DIR/config/dokwallet/GoogleService-Info.plist" "$PROJECT_ROOT/ios/dokwallet/" 2>/dev/null; then
  echo -e "${GREEN}OK${NC}"
else
  echo -e "${RED}FAILED${NC}"
fi

# Copy kimlwallet files
echo -n "  - kimlwallet/google-services.json... "
if cp "$TEMP_DIR/config/kimlwallet/google-services.json" "$PROJECT_ROOT/android/app/src/kimlwallet/" 2>/dev/null; then
  echo -e "${GREEN}OK${NC}"
else
  echo -e "${RED}FAILED${NC}"
fi

echo -n "  - kimlwallet/GoogleService-Info.plist... "
if cp "$TEMP_DIR/config/kimlwallet/GoogleService-Info.plist" "$PROJECT_ROOT/ios/kimlwallet/" 2>/dev/null; then
  echo -e "${GREEN}OK${NC}"
else
  echo -e "${RED}FAILED${NC}"
fi

echo ""

# Add iOS plist files to Xcode project
echo "Adding GoogleService-Info.plist to Xcode project..."
if ruby "$SCRIPT_DIR/add-google-services-to-xcode.rb"; then
  echo -e "${GREEN}Xcode project updated successfully!${NC}"
else
  echo -e "${YELLOW}Warning: Could not update Xcode project automatically.${NC}"
  echo "You may need to add GoogleService-Info.plist to targets manually in Xcode."
fi

echo ""
echo -e "${GREEN}Google Services setup complete!${NC}"
