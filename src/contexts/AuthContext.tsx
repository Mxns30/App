import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

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

  // 이메일 형식에서 사용자 ID 추출
  const extractUserId = (email: string | null): string => {
    if (!email) return 'anonymous';
    if (email.includes('@chungchunmarket.com')) {
      return email.split('@')[0];
    }
    return email.split('@')[0]; // 일반 이메일의 경우도 처리
  };

  // 사용자 정보를 Firestore에 저장
  const saveUserInfo = async (user: User, userId: string) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // 새 사용자 정보 저장
        await setDoc(userRef, {
          userId: userId,
          email: user.email,
          displayName: userId, // 사용자 ID를 displayName으로 사용
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        });
        console.log('✅ 사용자 정보 저장 완료:', userId);
      } else {
        // 기존 사용자 로그인 시간 업데이트
        await setDoc(userRef, {
          lastLoginAt: new Date().toISOString()
        }, { merge: true });
        console.log('✅ 사용자 로그인 시간 업데이트:', userId);
      }
    } catch (error) {
      console.error('❌ 사용자 정보 저장 실패:', error);
    }
  };

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
      
      // 사용자 ID 추출
      const userId = extractUserId(email);
      
      // 사용자 프로필 업데이트 (displayName 설정)
      await updateProfile(result.user, {
        displayName: userId
      });
      
      // 사용자 정보를 Firestore에 저장
      await saveUserInfo(result.user, userId);
      
      console.log('=== 회원가입 성공 ===');
      console.log('사용자 ID:', result.user.uid);
      console.log('사용자 이메일:', result.user.email);
      console.log('추출된 사용자 ID:', userId);
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // 사용자 ID 추출 및 정보 저장
        const userId = extractUserId(user.email);
        await saveUserInfo(user, userId);
      }
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
