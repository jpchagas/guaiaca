import React, { useContext } from 'react';
import { View, Text, Button } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { Picker } from '@react-native-picker/picker';
import { MonthContext } from '../store/MonthContext';
import { AuthContext } from '../store/AuthContext'

export default function CustomDrawerContent(props) {
  const { month, setMonth } = useContext(MonthContext);
  const { logout } = useContext(AuthContext);

  return (
    <DrawerContentScrollView {...props}>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
          Filter by Month
        </Text>
        <Picker selectedValue={month} onValueChange={setMonth}>
          {[
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December',
          ].map((m, i) => (
            <Picker.Item key={i} label={m} value={m} />
          ))}
        </Picker>

        <View style={{ marginTop: 40 }}>
          <Button title="Logout" onPress={logout} />
        </View>
      </View>
    </DrawerContentScrollView>
  );
}
