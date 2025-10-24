import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// import { getAnalytics } from 'firebase/analytics';

// 팀 Firebase 프로젝트
const firebaseConfig = {
  apiKey: "AIzaSyB7uwzD_vTHrG9CgnusVZU82BQmkNR9aY0",
  authDomain: "smartit-ae7f9.firebaseapp.com",
  projectId: "smartit-ae7f9",
  storageBucket: "smartit-ae7f9.firebasestorage.app",
  messagingSenderId: "968067019239",
  appId: "1:968067019239:web:a23379502e4378c6cf0d42"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
// Analytics 비활성화 (API 키 문제로 인해)
// try { getAnalytics(app); } catch(e){}

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// 실제 Firebase 프로덕션 환경 사용
console.log('🌐 Firebase 프로덕션 환경 연결 중...');
console.log('프로젝트 ID:', firebaseConfig.projectId);
console.log('Auth 도메인:', firebaseConfig.authDomain);

// Firebase 연결 상태 모니터링
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log('Firebase 사용자 인증됨:', user.uid);
  } else {
    console.log('Firebase 사용자 인증 해제됨');
  }
});

export { auth, db, storage };
