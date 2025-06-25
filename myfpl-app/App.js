import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from './screens/HomeScreen';
import TeamScreen from './screens/TeamScreen';
import { FplProvider } from './contexts/FplContext';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <FplProvider>
      <NavigationContainer>
        <Tab.Navigator initialRouteName="Home">
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Team" component={TeamScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </FplProvider>
  );
}
