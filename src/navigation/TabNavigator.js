import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ChartScreen from '../screens/ChartScreen';
import TableScreen from '../screens/TableScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Chart" component={ChartScreen} />
      <Tab.Screen name="Table" component={TableScreen} />
    </Tab.Navigator>
  );
}