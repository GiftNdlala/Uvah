import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { navigationRef } from '../utils/navigationRef';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isDemoMode } from '../api/client';
import { NotificationsProvider } from '../context/NotificationsContext';
import { FriendLocationsProvider } from '../context/FriendLocationsContext';
import NotificationsPanel from '../components/NotificationsPanel';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/main/HomeScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import ContactsScreen from '../screens/main/ContactsScreen';
import AlertsScreen from '../screens/main/AlertsScreen';
import FriendsMapScreen from '../screens/main/FriendsMapScreen';
import FriendDetailScreen from '../screens/main/FriendDetailScreen';
import AlertDetailScreen from '../screens/main/AlertDetailScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import EditEmergencyContactScreen from '../screens/main/EditEmergencyContactScreen';
import ScreenShell from '../components/ScreenShell';
import { palette, typography } from '../theme/tokens';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: palette.bg,
    text: palette.text,
    card: palette.surface,
    border: palette.border,
    primary: palette.accent,
  },
};

const TAB_ICON_MAP = {
  Home: 'home',
  Friends: 'people',
  Map: 'map',
  Alerts: 'warning',
  Profile: 'person-circle',
};

const MainTabNavigator = () => {
  const insets = useSafeAreaInsets();

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: [
            styles.tabBar,
            {
              height: styles.tabBar.height + insets.bottom,
              paddingBottom: styles.tabBar.paddingBottom + insets.bottom,
            },
          ],
          tabBarActiveTintColor: palette.accent,
          tabBarInactiveTintColor: palette.textMuted,
          tabBarLabelStyle: styles.tabLabel,
          tabBarItemStyle: styles.tabItem,
          tabBarIconStyle: styles.tabIcon,
          tabBarLabelPosition: 'below-icon',
          tabBarIcon: ({ color, size }) => (
            <Icon name={TAB_ICON_MAP[route.name]} size={size} color={color} />
          ),
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Friends" component={ContactsScreen} />
        <Tab.Screen name="Map" component={FriendsMapScreen} />
        <Tab.Screen name="Alerts" component={AlertsScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
      <NotificationsPanel />
    </>
  );
};

const AppNavigator = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('uvah_access_token');
        const demo = await isDemoMode();
        setIsAuthenticated(Boolean(token) || demo);
      } catch (_) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <ScreenShell>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={palette.accent} />
          <Text style={styles.loadingText}>Loading Uvah</Text>
        </View>
      </ScreenShell>
    );
  }

  return (
    <NavigationContainer
      theme={navTheme}
      ref={navigationRef}
      onStateChange={async () => {
        try {
          const token = await AsyncStorage.getItem('uvah_access_token');
          const demo = await isDemoMode();
          setIsAuthenticated(Boolean(token) || demo);
        } catch (_) {}
      }}
    >
      <NotificationsProvider enabled={isAuthenticated}>
      <FriendLocationsProvider enabled={isAuthenticated}>
      <Stack.Navigator initialRouteName={isAuthenticated ? 'MainApp' : 'Login'} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="MainApp" component={MainTabNavigator} />
        <Stack.Screen name="FriendDetail" component={FriendDetailScreen} options={{ headerShown: true, title: 'Friend Detail' }} />
        <Stack.Screen name="AlertDetail" component={AlertDetailScreen} options={{ headerShown: true, title: 'Alert Detail' }} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: true, title: 'Edit Profile' }} />
        <Stack.Screen name="EditEmergencyContact" component={EditEmergencyContactScreen} options={{ headerShown: true, title: 'Emergency Contact' }} />
      </Stack.Navigator>
      </FriendLocationsProvider>
      </NotificationsProvider>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    height: 70,
    paddingTop: 8,
    paddingBottom: 11,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    backgroundColor: '#0a1728',
  },
  tabItem: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 2,
    paddingBottom: 2,
  },
  tabIcon: {
    marginTop: 0,
    marginBottom: 0,
  },
  tabLabel: {
    fontSize: 12,
    fontFamily: typography.heading,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: palette.text,
    fontFamily: typography.heading,
    fontSize: 16,
  },
});

export default AppNavigator;
