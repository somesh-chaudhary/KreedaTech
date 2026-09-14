import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// --- Import all the screens you have created ---
// IMPORTANT: Double-check that these paths are correct for your project structure.
import IntroScreen from './src/screens/IntroScreen';
import HomeScreen from './src/screens/HomeScreen';
import TestScreen from './src/screens/TestScreen'; // This is the "Select Test" screen
import TakeTestScreen from './src/screens/TakeTestScreen'; // This is the "Begin Your Test" instructions screen
import Leaderboard from './src/screens/Leaderboard';
import AnalyticsScreen from './src/screens/AnalyticsScreen';;
import ProfilePageScreen from './src/screens/ProfilePageScreen';
import LiveTestScreen from './src/screens/LiveTestScreen';
import RegistrationScreen from './src/screens/RegistrationScreen';

// Add ProfileScreen if you have created it
// import ProfileScreen from './src/screens/ProfileScreen'; 

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          // Set the first screen to be shown when the app opens
          initialRouteName="Intro" 
          // Hide the default header since you have custom headers in each screen
          screenOptions={{ headerShown: false }} 
        >
          {/* Add all your screens to the navigator here */}
          <Stack.Screen name="Intro" component={IntroScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Test" component={TestScreen} />
          <Stack.Screen name="TakeTest" component={TakeTestScreen} />
          <Stack.Screen name="Leaderboard" component={Leaderboard} />
          <Stack.Screen name="Analytics" component={AnalyticsScreen} />
          <Stack.Screen name="ProfilePage" component={ProfilePageScreen} />
          <Stack.Screen name="LiveTest" component={LiveTestScreen} />
          <Stack.Screen name="Register" component={RegistrationScreen} />
          
          
          {/* <Stack.Screen name="ProfileScreen" component={ProfileScreen} /> */}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;