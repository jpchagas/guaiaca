import React, { useContext, useState, useEffect } from 'react';
import { View, Text, Dimensions} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { MonthContext } from '../store/MonthContext';

export default function ChartScreen() {
    const { month } = useContext(MonthContext);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 16, marginBottom: 10 }}>Chart for {month}</Text>
      <LineChart
        data={{
          labels: ['W1', 'W2', 'W3', 'W4'],
          datasets: [{ data: [200, 450, 300, 500] }]
        }}
        width={Dimensions.get('window').width - 32}
        height={220}
        yAxisSuffix="$"
        chartConfig={{
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(0, 150, 136, ${opacity})`,
        }}
        style={{ borderRadius: 16 }}
      />
    </View>
  );
}
