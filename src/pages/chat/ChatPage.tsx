import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../../config/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../contexts/AuthContext';
import ChatInput from '../../components/chat/ChatInput';
import ChatMessageList from '../../components/chat/ChatMessageList';
import DealCompleteModal from '../../components/chat/DealCompleteModal';

interface Message {
  id?: string;
  type: string;
  text?: string;
  image?: string;
  time: string;
  timestamp: Date;
  userId: string;
  sender: string;
  roomId?: string;
  userName?: string;
}

const ChatPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const postId = searchParams.get('postId');
  const sellerId = searchParams.get('sellerId');
  const [messages, setMessages] = useState<Message[]>([]);
  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [userNameCache, setUserNameCache] = useState<{ [uid: string]: string }>({});
  const [postTitle, setPostTitle] = useState<string>('');
  const [postUnavailable, setPostUnavailable] = useState<boolean>(false);

  const userId = currentUser?.uid || 'anonymous';
  const userName = currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : '익명');
  const [showDealModal, setShowDealModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Unsubscribe refs for Firestore listeners
  const messagesUnsubRef = useRef<null | (() => void)>(null);
  const roomUnsubRef = useRef<null | (() => void)>(null);
  const lastInitRoomIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!currentUser) navigate('/');
  }, [currentUser, navigate]);

  useEffect(() => {
    if (!roomId) navigate('/chat');
  }, [roomId, navigate]);

  // 채팅방 정보 실시간 감시
  useEffect(() => {
    if (!roomId) return;

    console.log('🔌 채팅방 정보 감시 시작:', roomId);
    const roomRef = doc(db, "chatRooms", roomId);
    
    const unsubscribe = onSnapshot(roomRef, (doc) => {
      if (doc.exists()) {
        const roomData = doc.data();
        setRoomInfo(roomData);
        console.log('📋 채팅방 정보 업데이트:', roomData);
      } else {
        console.log('❌ 채팅방이 존재하지 않음:', roomId);
        navigate('/chat');
      }
    });

    roomUnsubRef.current = unsubscribe;

    return () => {
      console.log('🔌 채팅방 정보 감시 종료');
      roomUnsubRef.current?.();
      roomUnsubRef.current = null;
    };
  }, [roomId, navigate]);

  useEffect(() => {
    const createOrJoinRoom = async () => {
      if (!roomId || !userId) return;

      try {
        const roomRef = doc(db, "chatRooms", roomId);
        const roomDoc = await getDoc(roomRef);

        if (!roomDoc.exists()) {
          const participants = [userId];
          if (postId && sellerId && !participants.includes(sellerId)) participants.push(sellerId);

          const roomData: any = {
            createdAt: serverTimestamp(),
            participants,
            lastMessage: null,
            updatedAt: serverTimestamp(),
            createdBy: userId,
            status: 'active',
            participantNames: { [userId]: userName }
          };

          if (postId && sellerId) {
            roomData.postId = postId;
            roomData.sellerId = sellerId;
            roomData.buyerId = userId;
            roomData.type = 'post_chat';
            roomData.participantNames[sellerId] = sellerId; // 초기값은 UID, 이후 표시 시 보정
          } else {
            roomData.type = 'general_chat';
          }

          await setDoc(roomRef, roomData);
          console.log('새 채팅방 생성됨:', roomId);
        } else {
          const roomData = roomDoc.data();
          const currentParticipants = roomData.participants || [];

          if (!currentParticipants.includes(userId)) {
            const updatedParticipants = [...currentParticipants, userId];
            const updatedParticipantNames = { ...roomData.participantNames, [userId]: userName };
            
            await updateDoc(roomRef, {
              participants: updatedParticipants,
              participantNames: updatedParticipantNames,
              updatedAt: serverTimestamp(),
            });
            console.log('기존 채팅방에 참여자 추가:', roomId);
          } else {
            console.log('이미 참여 중인 채팅방:', roomId);
          }
        }
      } catch (error) {
        console.error('채팅방 생성/참여 중 에러:', error);
      }
    };

    // Guard: initialize once per roomId
    if (lastInitRoomIdRef.current === roomId) return;
    lastInitRoomIdRef.current = roomId || null;

    if (roomId && userId) createOrJoinRoom();
  }, [roomId, userId, postId, sellerId, userName]);

  // 게시물 제목 가져오기
  useEffect(() => {
    const fetchTitle = async () => {
      if (!postId) return;
      try {
        if (postId.includes('_')) {
          const [seller, docId] = postId.split('_');
          const postRef = doc(db, 'posts', seller, 'userPosts', docId);
          const snap = await getDoc(postRef);
          if (snap.exists()) {
            const data = snap.data() as any;
            setPostTitle(data.title || data.postTitle || '');
            setPostUnavailable(false);
          } else {
            setPostTitle('삭제된 게시물 입니다.');
            setPostUnavailable(true);
          }
        } else {
          setPostTitle('삭제된 게시물 입니다.');
          setPostUnavailable(true);
        }
      } catch (e) {
        setPostTitle('삭제된 게시물 입니다.');
        setPostUnavailable(true);
      }
    };
    fetchTitle();
  }, [postId]);

  useEffect(() => {
    if (!roomId) return;

    // Close previous listener before opening a new one
    console.log('🔌 Closing previous messages listener');
    messagesUnsubRef.current?.();

    const messagesRef = collection(db, "chatRooms", roomId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    console.log('🔌 Setting up new messages listener for room:', roomId);
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const messageList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          userId: data.userId || 'unknown',
          sender: data.userId === userId ? 'me' : 'other',
          userName: userNameCache[data.userId] || data.userName
        } as Message;
      });
      setMessages(messageList);

      // 누락된 사용자 이름 캐시 채우기
      const uniqueUids = Array.from(new Set(messageList.map(m => m.userId).filter(Boolean))) as string[];
      const toFetch = uniqueUids.filter(uid => !(uid in userNameCache));
      if (toFetch.length > 0) {
        const entries = await Promise.all(toFetch.map(async (uid) => {
          try {
            const userRef = doc(db, 'users', uid);
            const snap = await getDoc(userRef);
            if (snap.exists()) {
              const d = snap.data() as any;
              return [uid, d.userId || d.displayName || uid] as [string, string];
            }
          } catch (e) {
            // ignore
          }
          return [uid, uid] as [string, string];
        }));
        setUserNameCache(prev => {
          const next = { ...prev };
          entries.forEach(([uid, name]) => { next[uid] = name; });
          return next;
        });
        // 메시지에 표시 이름 주입
        setMessages(prev => prev.map(m => ({ ...m, userName: (m.userId && (entries.find(e => e[0] === m.userId)?.[1])) || m.userName })));
      }
    });

    messagesUnsubRef.current = unsubscribe;

    return () => {
      console.log('🔌 Cleaning up messages listener');
      messagesUnsubRef.current?.();
      messagesUnsubRef.current = null;
    };
  }, [roomId, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text || !roomId) return;

    console.log('📤 메시지 전송 시작:', { text, roomId, userId });

    try {
      const msg: Message = {
        type: 'text',
        text,
        time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        timestamp: new Date(),
        userId,
        sender: 'me',
        userName,
      };

      console.log('📝 Firebase에 메시지 저장 중...', msg);
      const messagesRef = collection(db, "chatRooms", roomId, "messages");
      const docRef = await addDoc(messagesRef, {
        ...msg,
        timestamp: serverTimestamp()
      });
      console.log('✅ Firebase 저장 완료:', docRef.id);

      // 채팅방의 마지막 메시지 업데이트
      const roomRef = doc(db, "chatRooms", roomId);
      await updateDoc(roomRef, {
        lastMessage: {
          text: msg.text,
          timestamp: serverTimestamp(),
          userId: msg.userId,
          userName: msg.userName
        },
        updatedAt: serverTimestamp()
      });

      console.log('✅ 채팅방 정보 업데이트 완료');
    } catch (error) {
      console.error('❌ 메시지 전송 중 에러:', error);
      alert('메시지 전송 실패. 다시 시도하세요.');
    }
  };

  const handleSendImageFile = async (file: File) => {
    if (!file || !roomId) return;

    try {
      // Storage 업로드
      const path = `chat/${roomId}/${Date.now()}_${file.name}`;
      const fileRef = storageRef(storage, path);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);

      const msg: Message = {
        type: 'image',
        image: url,
        time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        timestamp: new Date(),
        userId,
        sender: 'me',
        userName,
      };

      const messagesRef = collection(db, "chatRooms", roomId, "messages");
      await addDoc(messagesRef, { ...msg, timestamp: serverTimestamp() });

      await updateDoc(doc(db, "chatRooms", roomId), {
        lastMessage: { text: '[이미지]', timestamp: serverTimestamp(), userId: msg.userId, userName: msg.userName },
        updatedAt: serverTimestamp()
      });
      console.log('✅ 이미지 업로드 및 전송 완료');
    } catch (error) {
      console.error('이미지 전송 중 에러:', error);
      alert('이미지 전송 실패.');
    }
  };

  const handleDealComplete = async () => {
    if (!roomId) return;

    try {
      const dealCompleteMsg: Message = {
        type: 'dealComplete',
        text: `${userName}님이 [거래완료]를 눌렀어요!`,
        time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        timestamp: new Date(),
        userId,
        sender: 'me',
        userName,
      };

      const messagesRef = collection(db, "chatRooms", roomId, "messages");
      await addDoc(messagesRef, {
        ...dealCompleteMsg,
        timestamp: serverTimestamp()
      });

      // 내 거래완료 의사 표시에 기록
      const roomRef = doc(db, "chatRooms", roomId);
      await updateDoc(roomRef, {
        lastMessage: {
          text: dealCompleteMsg.text,
          timestamp: serverTimestamp(),
          userId: dealCompleteMsg.userId,
          userName: dealCompleteMsg.userName
        },
        updatedAt: serverTimestamp(),
        [`dealCompletedBy.${userId}`]: true,
      });

      // 최신 방 정보 조회하여 양측 확인 여부 판단
      const latest = await getDoc(roomRef);
      const data = latest.data() || {} as any;
      const expectedParticipants: string[] = (data.sellerId && data.buyerId)
        ? [data.sellerId, data.buyerId]
        : Array.isArray(data.participants) ? data.participants : [];
      const bothConfirmed = expectedParticipants.length >= 2 && expectedParticipants.every((uid: string) => data.dealCompletedBy && data.dealCompletedBy[uid]);

      if (bothConfirmed) {
        // 방 상태 완료 처리
        await updateDoc(roomRef, { status: 'completed', updatedAt: serverTimestamp() });

        // 연결된 게시물 상태도 완료로 업데이트
        const composedPostId: string | null = (data.postId || postId) || null;
        if (composedPostId && composedPostId.includes('_')) {
          const [seller, docId] = composedPostId.split('_');
          try {
            const postRef = doc(db, 'posts', seller, 'userPosts', docId);
            await updateDoc(postRef, { status: 'completed' });
          } catch (e) {
            console.error('게시물 상태 업데이트 실패:', e);
          }
        }

        setTimeout(() => alert('두 분 모두 거래완료로 확인되어 거래가 확정되었습니다.'), 100);
      } else {
        setTimeout(() => alert('내 거래완료가 전송됐어요. 상대의 확인을 기다리는 중입니다.'), 100);
      }
    } catch (error) {
      console.error('거래완료 메시지 저장 중 에러:', error);
      alert('거래가 완료되었습니다!');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#fff' }}>
      <div style={{
        height: 56,
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid #eee',
        padding: '0 16px',
        fontWeight: 700,
        fontSize: 20,
        justifyContent: 'space-between',
        backgroundColor: '#fff'
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 20,
            cursor: 'pointer',
            color: '#75757C',
            fontWeight: 'bold'
          }}
        >
          &lt;
        </button>
        <div>
          {roomInfo ? (
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: (postTitle === '삭제된 게시물 입니다.' || roomInfo.type === 'post_chat' && !postTitle) ? '#d32f2f' : undefined,
                  textDecoration: (postTitle === '삭제된 게시물 입니다.' || roomInfo.type === 'post_chat' && !postTitle) ? 'line-through' : undefined
                }}
              >
                {postTitle || (roomInfo.type === 'post_chat' ? '삭제된 게시물 입니다.' : '채팅방')}
              </div>
              {roomInfo.type === 'post_chat' && (
                <div style={{ fontSize: '12px', color: '#666' }}>
                  참여자: {Object.values(roomInfo.participantNames || {}).join(', ')}
                </div>
              )}
              {roomInfo.status === 'completed' && (
                <div style={{ fontSize: '12px', color: '#4CAF50', fontWeight: 'bold' }}>
                  거래완료
                </div>
              )}
              {roomInfo.status !== 'completed' && roomInfo.dealCompletedBy && roomInfo.dealCompletedBy[userId] && (
                <div style={{ fontSize: '12px', color: '#ff9800', fontWeight: 'bold' }}>
                  상대 확인 대기
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold' }}>채팅방 로딩 중...</div>
            </div>
          )}
        </div>
        <div style={{ width: '60px' }}></div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
        <ChatMessageList messages={messages} />
        <div ref={messagesEndRef} />
      </div>

      <ChatInput onSend={handleSend} onSendImageFile={handleSendImageFile} onDealComplete={() => setShowDealModal(true)} />

      {showDealModal && (
        <DealCompleteModal
          onClose={() => setShowDealModal(false)}
          onDealComplete={handleDealComplete}
        />
      )}
    </div>
  );
};

export default ChatPage;
