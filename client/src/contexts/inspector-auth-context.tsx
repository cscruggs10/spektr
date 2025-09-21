import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Inspector {
  id: number;
  user_id: number;
  bio?: string;
  rating?: number;
  active: boolean;
  language: string;
  created_at: string;
  user: {
    id: number;
    username: string;
    password: string;
    name: string;
    role: string;
    created_at: string;
  };
}

interface InspectorAuthContextType {
  isAuthenticated: boolean;
  inspector: Inspector | null;
  login: (inspector: Inspector) => void;
  logout: () => void;
}

const InspectorAuthContext = createContext<InspectorAuthContextType | undefined>(undefined);

export function InspectorAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inspector, setInspector] = useState<Inspector | null>(null);

  useEffect(() => {
    // Check if inspector is already logged in (from localStorage)
    const savedInspector = localStorage.getItem('spektr-inspector-auth');
    if (savedInspector) {
      try {
        const parsedInspector = JSON.parse(savedInspector);
        setIsAuthenticated(true);
        setInspector(parsedInspector);
      } catch (error) {
        // If parsing fails, clear localStorage
        localStorage.removeItem('spektr-inspector-auth');
      }
    }
  }, []);

  const login = (inspectorData: Inspector) => {
    setIsAuthenticated(true);
    setInspector(inspectorData);
    localStorage.setItem('spektr-inspector-auth', JSON.stringify(inspectorData));
  };

  const logout = () => {
    setIsAuthenticated(false);
    setInspector(null);
    localStorage.removeItem('spektr-inspector-auth');
  };

  return (
    <InspectorAuthContext.Provider value={{ isAuthenticated, inspector, login, logout }}>
      {children}
    </InspectorAuthContext.Provider>
  );
}

export function useInspectorAuth() {
  const context = useContext(InspectorAuthContext);
  if (context === undefined) {
    throw new Error('useInspectorAuth must be used within an InspectorAuthProvider');
  }
  return context;
}