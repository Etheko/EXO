import React, { useContext, createContext, ReactNode } from 'react';
import { ErrorCode } from '../utils/errorCodes';

interface ErrorContextType {
  showError: (errorCode: ErrorCode, message?: string) => void;
  clearError: () => void;
}

const ErrorContext = createContext<ErrorContextType | null>(null);

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

interface ErrorProviderProps {
  children: ReactNode;
  showError: (errorCode: ErrorCode, message?: string) => void;
  clearError: () => void;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ 
  children, 
  showError, 
  clearError 
}) => {
  return React.createElement(
    ErrorContext.Provider,
    { value: { showError, clearError } },
    children
  );
}; 