import { createContext, useState, ReactNode } from 'react';

type UserContextType = {
  username: string;
  setUsername: (username: string) => void;
};

export const UserContext = createContext<UserContextType>({
  username: "",
  setUsername: () => {},
});

type UserProviderProps = {
  children: ReactNode;
};

export const UserProvider = ({ children }: UserProviderProps) => {
  const [username, setUsername] = useState("");

  return (
    <UserContext.Provider value={{ username, setUsername }}>
      {children}
    </UserContext.Provider>
  );
};