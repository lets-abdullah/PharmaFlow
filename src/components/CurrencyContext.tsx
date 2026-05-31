import React, { createContext, useContext, useState, useEffect } from 'react';

type CurrencyType = 'USD' | 'PKR';

interface CurrencyContextType {
  currency: CurrencyType;
  setCurrency: (currency: CurrencyType) => void;
  formatCurrency: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyType>(() => {
    const saved = localStorage.getItem('pharma_currency');
    return (saved as CurrencyType) || 'USD';
  });

  const setCurrency = (curr: CurrencyType) => {
    setCurrencyState(curr);
    localStorage.setItem('pharma_currency', curr);
  };

  const formatCurrency = (amount: number) => {
    if (currency === 'USD') {
      return `$${amount.toFixed(2)}`;
    } else {
      return `Rs ${amount.toFixed(2)}`;
    }
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
