import 'react-native-gesture-handler';

/**
 * @format
 */

import {AppRegistry} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import {name as appName} from './app.json';
import {handleBackgroundRemoteMessage} from './src/services/notificationService';

messaging().setBackgroundMessageHandler(handleBackgroundRemoteMessage);

AppRegistry.registerComponent(appName, () => App);
