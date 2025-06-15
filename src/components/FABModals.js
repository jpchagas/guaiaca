import React, { useState } from 'react';
import { Modal, View, Text, TextInput, Button, StyleSheet, Switch, Platform, TouchableOpacity } from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import * as DocumentPicker from 'expo-document-picker';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';



export default function FABModals({ visibleModal, setVisibleModal }) {
  const [amount, setAmount] = useState('');
  const [fileName, setFileName] = useState('');
  const [transactionType, setTransactionType] = useState('');
  const [description, setDescription] = useState('');
  const [origin, setOrigin] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [cardName, setCardName] = useState('');
  const [parcelNumber, setParcelNumber] = useState('');
  const [totalParcels, setTotalParcels] = useState('');
  const [status, setStatus] = useState(false);


  const closeModal = () => {
    setAmount('');
    setFileName('');
    setTransactionType('');
    setDescription('');
    setOrigin('');
    setCategory('');
    setPaymentMethod('');
    setCardName('');
    setParcelNumber('');
    setTotalParcels('');
    setStatus('');
    setVisibleModal(null);
  };

const handleSave = async () => {
  try {
    if (visibleModal === 'file') {
      if (!fileName.trim()) return alert('Please enter a file name');

      await addDoc(collection(db, 'transactions'), {
        type: 'file',
        amount: 0,
        fileName,
        timestamp: serverTimestamp(),
      });

    } else if (visibleModal === 'transaction') {
      // Validate required fields
      if (!amount) return alert('Please enter an amount');
      if (!transactionType) return alert('Please select a transaction type');
      if (!description.trim()) return alert('Please enter a description');
      if (!origin.trim()) return alert('Please enter origin');
      if (!category) return alert('Please select a category');
      if (!paymentMethod) return alert('Please select a payment method');

      if (paymentMethod === 'creditCard') {
        if (!cardName.trim()) return alert('Please enter card name');
        if (!parcelNumber) return alert('Please enter parcel number');
        if (!totalParcels) return alert('Please enter total parcels');
      }

      await addDoc(collection(db, 'transactions'), {
        type: 'transaction',
        transactionType,
        description,
        amount: parseFloat(amount),
        origin,
        category,
        paymentMethod,
        cardName: paymentMethod === 'creditCard' ? cardName : '',
        parcelNumber: paymentMethod === 'creditCard' ? parseInt(parcelNumber) : null,
        totalParcels: paymentMethod === 'creditCard' ? parseInt(totalParcels) : null,
        status,
        timestamp: serverTimestamp(),
      });
    }

    alert('Saved successfully!');
    closeModal();
  } catch (error) {
    console.error('Error saving transaction:', error);
    alert('Failed to save.');
  }
};

  const renderForm = () => {
    if (visibleModal === 'transaction') {
    return (
      <>
        <Text style={styles.title}>Add Transaction</Text>

        {/* Transaction Type */}
        <Text style={styles.label}>Transaction Type</Text>
        <Picker
          selectedValue={transactionType}
          onValueChange={setTransactionType}
        >
          <Picker.Item label="Select type" value="" />
          <Picker.Item label="Income" value="income" />
          <Picker.Item label="Expenses" value="expenses" />
          <Picker.Item label="Investment" value="investment" />
        </Picker>

        {/* Description */}
        <TextInput
          style={styles.input}
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
        />

        {/* Amount */}
        <TextInput
          style={styles.input}
          placeholder="Amount"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />

        {/* Origin */}
        <TextInput
          style={styles.input}
          placeholder="Origin (Partner or Home)"
          value={origin}
          onChangeText={setOrigin}
        />

        {/* Category */}
        <Text style={styles.label}>Category</Text>
        <Picker
          selectedValue={category}
          onValueChange={setCategory}
        >
          <Picker.Item label="Select category" value="" />
          <Picker.Item label="Restaurant" value="restaurant" />
          <Picker.Item label="Supermarket" value="supermarket" />
          <Picker.Item label="Transport" value="transport" />
          <Picker.Item label="Shopping" value="shopping" />
        </Picker>

        {/* Payment Method */}
        <Text style={styles.label}>Payment Method</Text>
        <Picker
          selectedValue={paymentMethod}
          onValueChange={setPaymentMethod}
        >
          <Picker.Item label="Select method" value="" />
          <Picker.Item label="Money" value="money" />
          <Picker.Item label="Credit Card" value="creditCard" />
        </Picker>

        {/* Credit Card Fields */}
        {paymentMethod === 'creditCard' && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Card Name"
              value={cardName}
              onChangeText={setCardName}
            />
            <TextInput
              style={styles.input}
              placeholder="Parcel Number (e.g., 1)"
              keyboardType="numeric"
              value={parcelNumber}
              onChangeText={setParcelNumber}
            />
            <TextInput
              style={styles.input}
              placeholder="Total Parcels (e.g., 12)"
              keyboardType="numeric"
              value={totalParcels}
              onChangeText={setTotalParcels}
            />
          </>
        )}

        {/* Status */}
        <View style={styles.statusContainer}>
          <Text style={styles.label}>Paid?</Text>
          <Switch
            value={status}
            onValueChange={setStatus}
          />
        </View>

        <Button title="Save" onPress={handleSave} />
      </>
    );
    }

    if (visibleModal === 'file') {
      return (
        <>
          <Text style={styles.title}>Import File</Text>
          <TextInput
            style={styles.input}
            placeholder="File name (e.g., data.csv)"
            value={fileName}
            onChangeText={setFileName}
          />
          <Button title="Upload" onPress={handleSave} />
        </>
      );
    }

    return null;
  };

  return (
    <Modal
      visible={!!visibleModal}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          {renderForm()}
          <Button title="Cancel" onPress={closeModal} color="#999" />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)'
  },
  modalBox: {
    width: '85%', backgroundColor: 'white', borderRadius: 10, padding: 20
  },
  title: {
    fontSize: 18, fontWeight: 'bold', marginBottom: 15
  },
  input: {
    borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 6, marginBottom: 15
  }
});
