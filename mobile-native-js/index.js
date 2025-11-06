/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Polyfill for URL (required by Supabase)
import 'react-native-url-polyfill/auto';

AppRegistry.registerComponent(appName, () => App);
