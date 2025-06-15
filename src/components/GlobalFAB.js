import React, { useState } from 'react';
import { FAB } from 'react-native-paper';

export default function GlobalFAB({ onSelectAction }) {
  const [fabOpen, setFabOpen] = useState(false);

  return (
    <FAB.Group
      open={fabOpen}
      icon={fabOpen ? 'close' : 'plus'}
      actions={[
        { icon: 'file-upload', label: 'Import File', onPress: () => onSelectAction('file') },
        { icon: 'cash', label: 'Add Transaction', onPress: () => onSelectAction('transaction') },
      ]}
      onStateChange={({ open }) => setFabOpen(open)}
    />
  );
}
