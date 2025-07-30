import React, { createContext, useContext, useState } from 'react';

type Location = { latitude: number; longitude: number } | null;

const LocationContext = createContext<{
  location: Location;
  setLocation: (loc: Location) => void;
}>({
  location: null,
  setLocation: () => {},
});

export const useLocation = () => useContext(LocationContext);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState<Location>(null);
  return (
    <LocationContext.Provider value={{ location, setLocation }}>
      {children}
    </LocationContext.Provider>
  );
}; 