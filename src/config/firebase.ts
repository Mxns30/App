import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyC8mg2Eo8X8yTDJKq3RrentkkNAI0XIXmo",
  authDomain: "smartit-8683f.firebaseapp.com",
  projectId: "smartit-8683f",
  storageBucket: "smartit-8683f.appspot.com", // ✅ ".app" → ".app**spot**.com" 으로 수정
  messagingSenderId: "110088565970",
  appId: "1:110088565970:web:0cc297838d708f6463e90b",
  measurementId: "G-JGD3RTRYJS"
};

// ✅ app 먼저 초기화
const app = initializeApp(firebaseConfig);

// ✅ 그다음 Analytics 실행
const analytics = getAnalytics(app);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// 개발 환경에서만 에뮬레이터 연결 (현재 에뮬레이터가 실행되지 않으므로 주석 처리)
// if (process.env.NODE_ENV === 'development') {
//   connectAuthEmulator(auth, 'http://localhost:9099');
//   connectFirestoreEmulator(db, 'localhost', 8080);
//   connectStorageEmulator(storage, 'localhost', 9199);
// }

export { auth, db, storage };