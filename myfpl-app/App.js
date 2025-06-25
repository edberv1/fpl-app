import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen';
import TeamScreen from './screens/TeamScreen';
import SuggestionScreen from './screens/SuggestionScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Team" component={TeamScreen} />
        <Stack.Screen name="Suggestions" component={SuggestionScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
