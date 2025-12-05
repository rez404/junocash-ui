# JunoCash Daemon Binaries

This directory contains the JunoCash daemon binaries that will be bundled with the wallet application.

## Required Files

Place the compiled JunoCash daemon binaries in this directory:

### macOS
- `junocashd` - macOS executable (ARM64 or Universal)

### Windows
- `junocashd.exe` - Windows executable (x64 or ARM64)

### Linux
- `junocashd` - Linux executable (x64 or ARM64)

## Binary Permissions

Make sure the binaries have execute permissions:

```bash
chmod +x bin/junocashd
```

## Build Process

When you run the build commands, electron-builder will automatically copy these binaries to:

- **macOS**: `JunoCash Wallet.app/Contents/Resources/bin/`
- **Windows**: `resources/bin/`
- **Linux**: `resources/bin/`

## Development vs Production

- **Development**: The wallet looks for binaries at `<project-root>/bin/junocashd`
- **Production**: The wallet looks for binaries at `<app-resources>/bin/junocashd`

## Note

If the daemon binary is not found, the wallet will show an error when trying to start the daemon.
You can still use the wallet in daemon-less mode by connecting to an external daemon.

## Where to get binaries

Build the JunoCash daemon from source or download from the official JunoCash releases.

The binaries should match your target platform architecture.
