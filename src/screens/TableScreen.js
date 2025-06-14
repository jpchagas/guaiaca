import React, { useContext, useState, useEffect } from 'react';
import { FlatList, View, Text } from 'react-native';
import { MonthContext } from '../store/MonthContext';

const data = [
  { id: '1', type: 'Expense', amount: 100, category: 'Food' },
  { id: '2', type: 'Income', amount: 500, category: 'Salary' },
];

export default function TableScreen() {
    const { month } = useContext(MonthContext);

  return (
    <FlatList
      data={data}
      keyExtractor={item => item.id}
      ListHeaderComponent={() => (
        <View style={{ flexDirection: 'row', padding: 10, backgroundColor: '#eee' }}>
          <Text style={{ flex: 1 }}>Type</Text>
          <Text style={{ flex: 1 }}>Amount</Text>
          <Text style={{ flex: 1 }}>Category</Text>
        </View>
      )}
      renderItem={({ item }) => (
        <View style={{ flexDirection: 'row', padding: 10 }}>
          <Text style={{ flex: 1 }}>{item.type}</Text>
          <Text style={{ flex: 1 }}>${item.amount}</Text>
          <Text style={{ flex: 1 }}>{item.category}</Text>
        </View>
      )}
    />
  );
}
