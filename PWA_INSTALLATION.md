# masterPOS PWA Installation Guide

This guide explains how to install and use masterPOS as a Progressive Web App (PWA).

## 🚀 Quick Installation

### Option 1: Web Browser Installation

1. **Open masterPOS in your browser**
   - Chrome, Edge, Firefox, or Safari
   - Navigate to your masterPOS URL

2. **Install the App**
   - **Chrome/Edge**: Click the install icon (⊕) in the address bar, or click the three dots menu → "Install masterPOS"
   - **Firefox**: Click the address bar icon or Menu → "Install this site as an app"
   - **Safari**: Share menu → "Add to Home Screen"

3. **Launch the App**
   - Find "masterPOS" in your applications menu
   - Launch like any native app

### Option 2: Mobile Installation

1. **Android (Chrome)**
   - Open masterPOS in Chrome
   - Tap the menu (⋮) → "Add to Home Screen"
   - Tap "Add" to confirm

2. **iOS (Safari)**
   - Open masterPOS in Safari
   - Tap the Share button (□↗)
   - Tap "Add to Home Screen"
   - Tap "Add" to confirm

## ✨ PWA Features

### Offline Support
- Works without internet connection
- Automatic caching of app resources
- Local data persistence

### Native-like Experience
- Runs in full-screen mode
- Landscape-optimized for POS terminals
- Fast loading and smooth performance

### Automatic Updates
- App updates automatically in background
- No manual update process required

## 🛠️ Development Setup

### Build the PWA

```bash
# Install dependencies
npm install

# Generate icons (if needed)
npm run generate-icons

# Build for production
npm run build

# Preview the built app
npm run preview
```

### Test PWA Features

1. **Build the app**: `npm run build`
2. **Serve the app**: `npm run preview`
3. **Open in browser**: Navigate to `http://localhost:4173`
4. **Test installation**: Look for browser install prompts
5. **Test offline**: Disconnect internet and verify app still works

### PWA Audit

Use Chrome DevTools to audit PWA compliance:

1. Open Chrome DevTools (F12)
2. Go to "Lighthouse" tab
3. Select "Progressive Web App" category
4. Click "Generate report"

## 📱 Supported Platforms

### Desktop
- ✅ Windows 10/11 (Chrome, Edge)
- ✅ macOS (Chrome, Safari, Firefox)
- ✅ Linux (Chrome, Firefox)

### Mobile
- ✅ Android 5.0+ (Chrome, Firefox)
- ✅ iOS 11.3+ (Safari)

### POS Terminals
- ✅ Android-based POS systems
- ✅ Windows-based POS systems
- ✅ Web-based terminal interfaces

## 🔧 Configuration

### Manifest Settings

The PWA manifest is configured in `public/manifest.json` with:

- **Display**: Standalone (full-screen)
- **Orientation**: Landscape-primary (optimized for POS)
- **Theme**: Dark slate theme matching app design
- **Icons**: Multiple sizes for different devices

### Service Worker

Automatic service worker handles:

- **Caching**: App shell and resources
- **Updates**: Background app updates
- **Offline**: Offline functionality
- **Fonts**: Google Fonts caching

## 🚨 Troubleshooting

### Installation Issues

**Problem**: Install button not showing
- **Solution**: Ensure HTTPS or localhost
- **Check**: Manifest.json is accessible
- **Verify**: Service worker is registered

**Problem**: App not working offline
- **Solution**: Clear browser cache and reinstall
- **Check**: Service worker is active in DevTools

### Performance Issues

**Problem**: Slow loading
- **Solution**: Check network caching
- **Optimize**: Image sizes and compression

## 📋 Requirements

### Server Requirements
- **HTTPS**: Required for PWA features (except localhost)
- **Web Server**: Any static file server
- **Headers**: Proper MIME types for manifest.json

### Browser Requirements
- **Modern browsers**: Chrome 67+, Firefox 63+, Safari 11.1+, Edge 79+
- **Service Workers**: Required for offline functionality
- **Web App Manifest**: Required for installation

## 🎯 Best Practices

### For POS Usage
1. **Install on device**: Better performance than browser tab
2. **Use landscape mode**: Optimized for POS terminals
3. **Keep app updated**: Allow automatic updates
4. **Test offline**: Ensure offline functionality works

### For Users
1. **Pin to taskbar/dock**: Easy access
2. **Create desktop shortcut**: Quick launching
3. **Regular usage**: Keep app cached and updated

## 📞 Support

For PWA-related issues:
1. Check browser compatibility
2. Verify HTTPS setup
3. Test with latest browser version
4. Clear cache and reinstall if needed

---

**Note**: This PWA is optimized for Point of Sale terminals and retail environments with landscape orientation and offline-first design.