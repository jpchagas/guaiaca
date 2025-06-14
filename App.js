import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import TabNavigator from './src/navigation/TabNavigator';
import { Provider as PaperProvider } from 'react-native-paper';
import DrawerNavigator from './src/navigation/DrawerNavigator';
import LoginScreen from './src/screens/LoginScreen';
import { MonthProvider } from './src/store/MonthContext';
import { AuthProvider, AuthContext } from './src/store/AuthContext';
import GlobalFAB from './src/components/GlobalFAB';

export default function App() {
  return (
    <PaperProvider>
      <AuthProvider>
        <MonthProvider>
          <NavigationContainer>
            <Main />
          </NavigationContainer>
        </MonthProvider>
      </AuthProvider>
    </PaperProvider>
  );
}

function Main() {
  const { user } = React.useContext(AuthContext);
  return user ? <DrawerNavigator /> : <LoginScreen />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
