# 🚀 Uvah? Mobile App - Phase 2

A comprehensive React Native mobile app for township safety and location sharing.

## ✨ Features

### 🔐 Authentication
- **Phone Number Login** with OTP verification
- **User Registration** with emergency contact setup
- **JWT-based authentication** for secure API calls

### 🏠 Main App
- **Home Dashboard** with SOS and Check-in buttons
- **Emergency Contacts** management
- **Alert History** with filtering and status tracking
- **User Profile** with settings and preferences

### 🚨 Safety Features
- **Emergency SOS** with real-time location sharing
- **Check-in System** (Ngifikile) for regular location updates
- **Live Location Tracking** for emergency situations
- **WhatsApp/SMS Integration** for sharing emergency links

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ 
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)
- Backend API running (see backend-api/README.md)

### 1. Install Dependencies
```bash
cd mobile-app
npm install
```

### 2. Install React Native Dependencies
```bash
# For Android
npx react-native run-android

# For iOS (macOS only)
cd ios && pod install && cd ..
npx react-native run-ios
```

### 3. Configure Backend URL
Update the `BASE_URL` in the following files to match your backend:
- `src/screens/auth/LoginScreen.js`
- `src/screens/auth/RegisterScreen.js`
- `src/screens/main/HomeScreen.js`
- `src/screens/main/ProfileScreen.js`
- `src/screens/main/ContactsScreen.js`
- `src/screens/main/AlertsScreen.js`

**Default:** `http://192.168.0.100:8000`

### 4. Start Development Server
```bash
npm start
```

## 📱 App Structure

```
mobile-app/
├── src/
│   ├── navigation/
│   │   └── AppNavigator.js          # Main navigation structure
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.js       # Phone login + OTP
│   │   │   └── RegisterScreen.js    # User registration
│   │   └── main/
│   │       ├── HomeScreen.js        # Main dashboard
│   │       ├── ProfileScreen.js     # User profile & settings
│   │       ├── ContactsScreen.js    # Emergency contacts
│   │       └── AlertsScreen.js      # Alert history
│   └── components/                  # Reusable components (future)
├── App.js                           # Main app entry point
└── package.json                     # Dependencies
```

## 🔧 Development

### Adding New Screens
1. Create screen file in `src/screens/`
2. Add to navigation in `src/navigation/AppNavigator.js`
3. Update tab icons and labels as needed

### Styling
- Uses **StyleSheet** for consistent styling
- **Dark theme** optimized for township environments
- **Large buttons** and **clear text** for accessibility
- **Color scheme**: Dark (#111), Accent (#6cf), Danger (#e53935)

### API Integration
- **Fetch API** for HTTP requests
- **JWT tokens** for authentication (TODO: implement storage)
- **Error handling** with user-friendly alerts
- **Mock data** fallback for development

## 🚀 Next Steps (Phase 3)

### Real GPS Integration
- Implement `react-native-geolocation-service`
- Add location permissions handling
- Background location updates
- Battery optimization

### Push Notifications
- Firebase Cloud Messaging setup
- Emergency alert notifications
- Contact verification messages

### Offline Support
- Local data caching
- Offline alert creation
- Sync when online

### Enhanced UI/UX
- Custom icons and graphics
- Township-specific branding
- Accessibility improvements
- Performance optimization

## 🐛 Troubleshooting

### Common Issues

#### Metro Bundler Issues
```bash
# Clear cache
npx react-native start --reset-cache
```

#### Android Build Issues
```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

#### iOS Build Issues
```bash
cd ios
pod deintegrate
pod install
cd ..
npx react-native run-ios
```

#### Navigation Issues
- Ensure all screen imports are correct
- Check navigation prop passing
- Verify screen names match navigation routes

### Debug Mode
- Enable **Developer Menu** (shake device or Cmd+D)
- Use **React Native Debugger** for advanced debugging
- Check **Metro logs** for detailed error information

## 📋 Testing Checklist

### Authentication Flow
- [ ] Phone number input validation
- [ ] OTP sending and verification
- [ ] User registration with all fields
- [ ] Login with existing account
- [ ] Error handling for invalid inputs

### Main App Features
- [ ] SOS button functionality
- [ ] Check-in system
- [ ] Emergency contact management
- [ ] Alert history viewing
- [ ] Profile settings updates

### Navigation
- [ ] Tab navigation between screens
- [ ] Back button functionality
- [ ] Screen transitions
- [ ] Deep linking (future)

## 🔒 Security Notes

- **JWT tokens** should be stored securely (AsyncStorage for now)
- **API calls** include proper error handling
- **User data** validation on both client and server
- **Location data** privacy controls in settings

## 📞 Support

For development issues:
1. Check the troubleshooting section
2. Review React Native documentation
3. Check backend API status
4. Review console logs and Metro output

---

**Uvah? Mobile App** - Building safer communities through technology 🛡️
