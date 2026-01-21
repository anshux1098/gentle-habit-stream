import React, { createContext, useContext, ReactNode } from 'react';
import { useHabitData } from '@/hooks/useHabitData';

type HabitContextType = ReturnType<typeof useHabitData>;

const HabitContext = createContext<HabitContextType | null>(null);

export function HabitProvider({ children }: { children: ReactNode }) {
  const habitData = useHabitData();

  return (
    <HabitContext.Provider value={habitData}>
      {children}
    </HabitContext.Provider>
  );
}

export function useHabits(): HabitContextType {
  const context = useContext(HabitContext);
  if (!context) {
    throw new Error('useHabits must be used within a HabitProvider');
  }
  return context;
}
