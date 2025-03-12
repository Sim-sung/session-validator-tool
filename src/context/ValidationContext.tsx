import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ValidationRule, ValidationResult, Session } from '@/types/validation';

interface ValidationContextType {
  rules: ValidationRule[];
  results: ValidationResult[];
  setRules: (rules: ValidationRule[]) => void;
  setResults: (results: ValidationResult[]) => void;
}

const ValidationContext = createContext<ValidationContextType | undefined>(undefined);

interface ValidationProviderProps {
  children: ReactNode;
}

export const ValidationProvider: React.FC<ValidationProviderProps> = ({ children }) => {
  const [rules, setRules] = useState<ValidationRule[]>([]);
  const [results, setResults] = useState<ValidationResult[]>([]);

  const value: ValidationContextType = {
    rules,
    results,
    setRules,
    setResults,
  };

  return (
    <ValidationContext.Provider value={value}>
      {children}
    </ValidationContext.Provider>
  );
};

export const useValidation = () => {
  const context = useContext(ValidationContext);
  if (!context) {
    throw new Error('useValidation must be used within a ValidationProvider');
  }
  return context;
};
