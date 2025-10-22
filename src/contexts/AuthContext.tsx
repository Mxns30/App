import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '../config/firebase';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<any>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Firebase 연결 테스트
  useEffect(() => {
    console.log('=== Firebase 연결 테스트 ===');
    console.log('Auth 객체:', auth);
    console.log('Auth 앱 이름:', auth.app.name);
    console.log('Auth 설정:', auth.config);
    console.log('현재 사용자:', auth.currentUser);
    console.log('에뮬레이터 설정:', auth.emulatorConfig);
    console.log('프로젝트 ID:', auth.app.options.projectId);
    console.log('API 키:', auth.app.options.apiKey);
    console.log('Auth 도메인:', auth.app.options.authDomain);
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email: string, password: string) => {
    try {
      console.log('=== 회원가입 시작 ===');
      console.log('이메일:', email);
      console.log('Firebase Auth 상태:', auth.app.name);
      console.log('네트워크 상태:', navigator.onLine);
      console.log('Auth 객체:', auth);
      
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log('=== 회원가입 성공 ===');
      console.log('사용자 ID:', result.user.uid);
      console.log('사용자 이메일:', result.user.email);
      return result;
    } catch (error: any) {
      console.error('=== 회원가입 실패 ===');
      console.error('오류 코드:', error.code);
      console.error('오류 메시지:', error.message);
      console.error('전체 오류:', error);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    login,
    signup,
    loginWithGoogle,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
