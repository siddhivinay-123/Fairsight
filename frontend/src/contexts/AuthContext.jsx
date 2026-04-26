import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  function signup(email, password) {
    if (import.meta.env.VITE_FIREBASE_API_KEY === 'your-api-key') {
      return new Promise(resolve => setTimeout(() => {
        const mockUser = { email, uid: 'mock-user-123' };
        setCurrentUser(mockUser);
        resolve({ user: mockUser });
      }, 800));
    }
    return createUserWithEmailAndPassword(auth, email, password);
  }

  function login(email, password) {
    if (import.meta.env.VITE_FIREBASE_API_KEY === 'your-api-key') {
      return new Promise(resolve => setTimeout(() => {
        const mockUser = { email, uid: 'mock-user-123' };
        setCurrentUser(mockUser);
        resolve({ user: mockUser });
      }, 800));
    }
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    if (import.meta.env.VITE_FIREBASE_API_KEY === 'your-api-key') {
      setCurrentUser(null);
      return Promise.resolve();
    }
    return signOut(auth);
  }

  useEffect(() => {
    if (import.meta.env.VITE_FIREBASE_API_KEY === 'your-api-key') {
      setLoading(false);
      return () => {};
    }

    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    login,
    signup,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
