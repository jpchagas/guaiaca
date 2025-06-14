import React, { createContext, useState } from 'react';

export const MonthContext = createContext();

export const MonthProvider = ({ children }) => {
  const [month, setMonth] = useState('June'); // Default month

  return (
    <MonthContext.Provider value={{ month, setMonth }}>
      {children}
    </MonthContext.Provider>
  );
};
