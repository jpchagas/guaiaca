import React, { useState } from 'react';
import { Modal, View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import * as DocumentPicker from 'expo-document-picker';


export default function FABModals({ visibleModal, setVisibleModal }) {
  const [amount, setAmount] = useState('');
  const [fileName, setFileName] = useState('');

  const closeModal = () => {
    setAmount('');
    setFileName('');
    setVisibleModal(null);
  };

  const handleSave = async () => {
    try {
      if (visibleModal === 'file') {
        if (!fileName.trim()) return alert('Please enter a file name');
      } else if (!amount) {
        return alert('Please enter an amount');
      }

      await addDoc(collection(db, 'transactions'), {
        type: visibleModal,
        amount: visibleModal === 'file' ? 0 : parseFloat(amount),
        fileName: visibleModal === 'file' ? fileName : '',
        timestamp: serverTimestamp()
      });

      alert('Saved successfully!');
      closeModal();
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Failed to save.');
    }
  };

  const renderForm = () => {
    if (visibleModal === 'expense' || visibleModal === 'earn') {
      return (
        <>
          <Text style={styles.title}>Add {visibleModal === 'expense' ? 'Expense' : 'Earn'}</Text>
          <TextInput
            style={styles.input}
            placeholder="Amount"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
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
