import React, { useState } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useNavigationState } from '@react-navigation/native';
import { Portal } from 'react-native-paper';

import TabNavigator from './TabNavigator';
import CustomDrawerContent from './CustomDrawerContent';
import GlobalFAB from '../components/GlobalFAB';
import FABModals from '../components/FABModals';

const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  const [visibleModal, setVisibleModal] = useState(null);

  const handleFABAction = (type) => {
    setVisibleModal(type);
  };

  // SAFELY get current route name
  const routeName = useNavigationState(state => {
    try {
      const drawerRoute = state.routes[state.index]; // 'Home'
      const tabState = drawerRoute.state;

      if (tabState && tabState.routes && tabState.routes[tabState.index]) {
        return tabState.routes[tabState.index].name; // Chart or Table
      }

      return drawerRoute.name;
    } catch (err) {
      return ''; // Fallback
    }
  });

  const shouldShowFAB = routeName !== 'Login'; // Optional condition

  return (
    <>
      <Drawer.Navigator
        screenOptions={{ headerShown: false }}
        drawerContent={(props) => <CustomDrawerContent {...props} />}
      >
        <Drawer.Screen name="Home" component={TabNavigator} />
      </Drawer.Navigator>

      <Portal>
        {shouldShowFAB && (
          <>
            <GlobalFAB onSelectAction={handleFABAction} />
            <FABModals visibleModal={visibleModal} setVisibleModal={setVisibleModal} />
          </>
        )}
      </Portal>
    </>
  );
}
