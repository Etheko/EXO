import React, { createContext, useState, useContext, ReactNode } from 'react';

type CursorState = 'default' | 'hovering';

interface CursorContextType {
    cursorState: CursorState;
    setCursorState: (state: CursorState) => void;
}

const CursorContext = createContext<CursorContextType | undefined>(undefined);

export const CursorProvider = ({ children }: { children: ReactNode }) => {
    const [cursorState, setCursorState] = useState<CursorState>('default');

    return (
        <CursorContext.Provider value={{ cursorState, setCursorState }}>
            {children}
        </CursorContext.Provider>
    );
};

export const useCursor = () => {
    const context = useContext(CursorContext);
    if (!context) {
        throw new Error('useCursor must be used within a CursorProvider');
    }
    return context;
}; 