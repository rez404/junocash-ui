# JunoCash Wallet Installation Guide

## macOS Installation

### Step 1: Installation
1. Download the DMG file
2. Double-click to open the DMG
3. **Drag JunoCash Wallet to the Applications folder**
4. Wait for the copy process to complete
5. You can eject the DMG

### Step 2: "Damaged" Error Solution

⚠️ **IMPORTANT**: Make sure to copy the app to Applications folder first!

If you get "JunoCash Wallet is damaged" error on macOS:

#### Method 1: Right-Click and Open (Easiest) ⭐
1. In the **Applications folder**, **right-click** on JunoCash Wallet
2. Click **"Open"**
3. In the warning dialog, click **"Open"** button again
4. The app will launch and will work normally with double-click from now on

#### Method 2: Terminal Command
Open Terminal and run:

```bash
xattr -cr "/Applications/JunoCash Wallet.app"
```

Then open normally from Applications folder.

### Why Does This Error Occur?

This is Apple's security measure for unsigned applications (Gatekeeper). You can safely open it using the methods above. The application source code is open and secure.

## Windows Installation

### NSIS Installer
1. Run `JunoCash Wallet Setup 1.0.0.exe`
2. Follow the installation wizard
3. Choose installation location
4. Select desktop shortcut creation (optional)
5. Complete the installation

### Portable Version
1. Copy `JunoCash Wallet 1.0.0.exe` to your desired folder
2. Run directly (no installation required)
3. All data is stored in the same folder

## Linux Installation

### AppImage (Universal)
```bash
chmod +x JunoCash-Wallet-1.0.0-arm64.AppImage
./JunoCash-Wallet-1.0.0-arm64.AppImage
```

### Debian/Ubuntu (.deb)
```bash
sudo dpkg -i junocash-wallet_1.0.0_arm64.deb
sudo apt-get install -f  # Fix dependencies
```

Launch from menu or terminal:
```bash
junocash-wallet
```

## First Launch

1. Start the application
2. Configure daemon settings:
   - Select network (mainnet/testnet)
   - Set RPC username and password
   - Adjust CPU thread count
3. Click "Start Daemon" button
4. Wait for daemon to start (may take a few minutes)
5. Create your wallet or load existing one

## Troubleshooting

### macOS Gatekeeper
- **Error**: "from an unidentified developer"
- **Solution**: Right-click → Open or System Settings → Security → "Open Anyway"

### Windows SmartScreen
- **Error**: "Windows protected your PC"
- **Solution**: "More info" → "Run anyway"

### Linux Permissions
- **Error**: AppImage not running
- **Solution**: Grant execute permission with `chmod +x`

### Daemon Startup Issues
- Port 8232 (mainnet) or 18232 (testnet) might be in use
- Firewall might be blocking daemon connection
- Ensure sufficient disk space in data directory

## Support

If you encounter issues:
- GitHub Issues: https://github.com/junocash/junocash-wallet/issues
- Discord: [JunoCash Community]
- Documentation: https://docs.junocash.com
