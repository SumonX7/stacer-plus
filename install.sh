#!/usr/bin/env bash
# ==============================================================================
# Stacer Plus - One-Line Universal Linux Installer & Updater
# Repository: https://github.com/SumonX7/stacer-plus
# ==============================================================================

set -e

APP_NAME="Stacer Plus"
REPO="SumonX7/stacer-plus"
LATEST_TAG="v1.2.1"
VERSION="1.2.1"
RPM_NAME="Stacer-Plus-${VERSION}-1.x86_64.rpm"

# Colors for terminal output
BOLD="\033[1m"
GREEN="\033[32m"
CYAN="\033[36m"
YELLOW="\033[33m"
RED="\033[31m"
RESET="\033[0m"

echo -e "${CYAN}${BOLD}"
echo "  ⚡ STACER PLUS - LINUX SYSTEM OPTIMIZER & MONITOR"
echo "  --------------------------------------------------"
echo -e "${RESET}"

# 1. Architecture Check
ARCH=$(uname -m)
if [ "$ARCH" != "x86_64" ]; then
    echo -e "${YELLOW}Warning: Architecture '$ARCH' detected. Official binaries are built for x86_64.${RESET}"
fi

# Determine privilege elevator (sudo or doas or root)
SUDO=""
if [ "$(id -u)" -ne 0 ]; then
    if command -v sudo >/dev/null 2>&1; then
        SUDO="sudo"
    elif command -v doas >/dev/null 2>&1; then
        SUDO="doas"
    else
        echo -e "${YELLOW}Note: Running without root privileges. Installing to user directory ~/.local...${RESET}"
    fi
fi

# Detect package manager
HAS_ZYPPER=false
HAS_DNF=false
HAS_RPM=false

if command -v zypper >/dev/null 2>&1; then
    HAS_ZYPPER=true
elif command -v dnf >/dev/null 2>&1; then
    HAS_DNF=true
fi

if command -v rpm >/dev/null 2>&1; then
    HAS_RPM=true
fi

# Find RPM file if already present locally
LOCAL_RPM=""
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd || echo "")"

CANDIDATES=(
    "$SCRIPT_DIR/Stacer-Plus-${VERSION}-1.x86_64.rpm"
    "$SCRIPT_DIR/../Stacer-Plus-${VERSION}-1.x86_64.rpm"
    "$SCRIPT_DIR/src-tauri/target/release/bundle/rpm/Stacer Plus-${VERSION}-1.x86_64.rpm"
    "$PWD/Stacer-Plus-${VERSION}-1.x86_64.rpm"
    "$PWD/../Stacer-Plus-${VERSION}-1.x86_64.rpm"
    "/home/$USER/Desktop/SEO Automation/Stacer/Stacer-Plus-${VERSION}-1.x86_64.rpm"
)

for c in "${CANDIDATES[@]}"; do
    if [ -f "$c" ]; then
        LOCAL_RPM="$c"
        break
    fi
done

TEMP_DIR=$(mktemp -d /tmp/stacer-plus-install.XXXXXX)
cleanup() {
    rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

TARGET_RPM=""

if [ -n "$LOCAL_RPM" ] && [ -f "$LOCAL_RPM" ]; then
    echo -e "${GREEN}✔ Found local RPM package:${RESET} $LOCAL_RPM"
    TARGET_RPM="$LOCAL_RPM"
else
    echo -e "${CYAN}→ Downloading latest Stacer Plus ${LATEST_TAG} RPM from GitHub...${RESET}"
    DOWNLOAD_URL="https://github.com/${REPO}/releases/download/${LATEST_TAG}/${RPM_NAME}"
    
    if curl -fsSL -o "$TEMP_DIR/$RPM_NAME" "$DOWNLOAD_URL" 2>/dev/null; then
        TARGET_RPM="$TEMP_DIR/$RPM_NAME"
        echo -e "${GREEN}✔ Download complete!${RESET}"
    else
        # Fallback to direct raw or release artifacts
        FALLBACK_URL="https://github.com/${REPO}/raw/main/${RPM_NAME}"
        if curl -fsSL -o "$TEMP_DIR/$RPM_NAME" "$FALLBACK_URL" 2>/dev/null; then
            TARGET_RPM="$TEMP_DIR/$RPM_NAME"
            echo -e "${GREEN}✔ Download complete!${RESET}"
        fi
    fi
fi

# 2. Installation using Package Manager
INSTALLED=false

if [ -n "$TARGET_RPM" ] && [ -f "$TARGET_RPM" ]; then
    echo -e "${CYAN}→ Installing / Updating RPM package...${RESET}"
    if [ "$HAS_ZYPPER" = true ]; then
        echo -e "${CYAN}Using zypper (openSUSE)...${RESET}"
        $SUDO zypper --non-interactive install --allow-unsigned-rpm "$TARGET_RPM" && INSTALLED=true
    elif [ "$HAS_DNF" = true ]; then
        echo -e "${CYAN}Using dnf (Fedora)...${RESET}"
        $SUDO dnf install -y "$TARGET_RPM" && INSTALLED=true
    elif [ "$HAS_RPM" = true ]; then
        echo -e "${CYAN}Using rpm...${RESET}"
        $SUDO rpm -Uvh --replacepkgs "$TARGET_RPM" && INSTALLED=true
    fi
fi

# 3. Fallback: Local User Installation (If not installed via system package manager)
if [ "$INSTALLED" = false ]; then
    echo -e "${YELLOW}→ Performing portable/user-level installation...${RESET}"
    
    USER_BIN_DIR="$HOME/.local/bin"
    USER_APP_DIR="$HOME/.local/share/applications"
    USER_ICON_DIR="$HOME/.local/share/icons"
    
    mkdir -p "$USER_BIN_DIR" "$USER_APP_DIR" "$USER_ICON_DIR/hicolor/scalable/apps" "$USER_ICON_DIR/WhiteSur-dark/apps/scalable"
    
    # If we have the RPM, unpack it
    if [ -n "$TARGET_RPM" ] && [ -f "$TARGET_RPM" ] && command -v rpm2cpio >/dev/null 2>&1; then
        (cd "$TEMP_DIR" && rpm2cpio "$TARGET_RPM" | cpio -idmv 2>/dev/null)
        if [ -f "$TEMP_DIR/usr/bin/stacer-plus" ]; then
            cp "$TEMP_DIR/usr/bin/stacer-plus" "$USER_BIN_DIR/stacer-plus"
            chmod +x "$USER_BIN_DIR/stacer-plus"
        fi
        if [ -f "$TEMP_DIR/usr/bin/stacer-plus-clean-ram" ]; then
            if [ -n "$SUDO" ]; then
                $SUDO cp "$TEMP_DIR/usr/bin/stacer-plus-clean-ram" /usr/bin/stacer-plus-clean-ram 2>/dev/null || true
                $SUDO chmod 4755 /usr/bin/stacer-plus-clean-ram 2>/dev/null || true
            fi
        fi
    elif [ -f "$SCRIPT_DIR/src-tauri/target/release/stacer-plus" ]; then
        cp "$SCRIPT_DIR/src-tauri/target/release/stacer-plus" "$USER_BIN_DIR/stacer-plus"
        chmod +x "$USER_BIN_DIR/stacer-plus"
    fi

    # Create desktop launcher
    cat << 'EOF' > "$USER_APP_DIR/stacer-plus.desktop"
[Desktop Entry]
Categories=Utility;System;
Comment=Modern Linux System Optimizer & Telemetry Monitor
Exec=stacer-plus
StartupWMClass=stacer-plus
Icon=stacer-plus
Name=Stacer Plus
Terminal=false
Type=Application
EOF
    chmod +x "$USER_APP_DIR/stacer-plus.desktop"

    # Install icons if present
    if [ -f "$SCRIPT_DIR/src-tauri/icons/stacer-plus.svg" ]; then
        cp "$SCRIPT_DIR/src-tauri/icons/stacer-plus.svg" "$USER_ICON_DIR/hicolor/scalable/apps/stacer-plus.svg"
        cp "$SCRIPT_DIR/src-tauri/icons/stacer-plus.svg" "$USER_ICON_DIR/WhiteSur-dark/apps/scalable/stacer-plus.svg" 2>/dev/null || true
    fi

    INSTALLED=true
fi

# 4. Update Desktop and Icon Caches
echo -e "${CYAN}→ Refreshing desktop icon caches...${RESET}"
gtk-update-icon-cache -f -t "$HOME/.local/share/icons/WhiteSur-dark" 2>/dev/null || true
gtk-update-icon-cache -f -t "$HOME/.local/share/icons/hicolor" 2>/dev/null || true
if [ -n "$SUDO" ]; then
    $SUDO gtk-update-icon-cache -f -t /usr/share/icons/hicolor 2>/dev/null || true
fi
update-desktop-database "$HOME/.local/share/applications" 2>/dev/null || true

echo ""
echo -e "${GREEN}${BOLD}✔ Stacer Plus v${VERSION} installed successfully!${RESET}"
echo -e "You can launch it from your ${BOLD}Application Menu${RESET} or run ${BOLD}stacer-plus${RESET} in the terminal."
echo ""
