import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  username: string;
  role: 'admin' | 'staff';
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>({
    id: '1',
    username: 'admin',
    role: 'admin',
    name: 'Admin Owner'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Auth check bypassed since login/signup functionality is removed
  }, []);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = async () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
