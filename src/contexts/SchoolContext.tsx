import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

interface SchoolContextType {
  currentSchool: string | null;
  setSchool: (school: string | null) => void;
  clearSchool: () => void;
}

const SchoolContext = createContext<SchoolContextType>({} as SchoolContextType);

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSchool, setCurrentSchool] = useState<string | null>(() => {
    try {
      return localStorage.getItem('currentSchool') || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (currentSchool) {
        localStorage.setItem('currentSchool', currentSchool);
      } else {
        localStorage.removeItem('currentSchool');
      }
    } catch {
      // ignore persistence errors
    }
  }, [currentSchool]);

  const value = useMemo<SchoolContextType>(() => ({
    currentSchool,
    setSchool: setCurrentSchool,
    clearSchool: () => setCurrentSchool(null),
  }), [currentSchool]);

  return (
    <SchoolContext.Provider value={value}>
      {children}
    </SchoolContext.Provider>
  );
};

export const useSchool = () => useContext(SchoolContext);


