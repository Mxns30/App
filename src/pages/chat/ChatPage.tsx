import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, storage, functions as fbFunctions } from '../../config/firebase';
import { httpsCallable } from 'firebase/functions';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../contexts/AuthContext';
import ChatInput from '../../components/chat/ChatInput';
import ChatMessageList from '../../components/chat/ChatMessageList';
import DealCompleteModal from '../../components/chat/DealCompleteModal';
import { useSchool } from '../../contexts/SchoolContext';

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
  const { currentSchool } = useSchool();
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
  const backfillTriedRef = useRef<boolean>(false);

  // 최근 메시지에서 마지막 장소/시간 추출
  const extractLastPlace = (messageList: Message[]): string | null => {
    const stripTimeTokens = (s: string) => s
      .replace(/(오전|오후)?\s*\d{1,2}\s*시\s*(\d{1,2})?\s*분?/g, ' ')
      .replace(/(\d{1,2})\s*[:시]\s*(\d{1,2})/g, ' ');
    const stripLeadingFillers = (s: string) => s.replace(/^(그럼|그러면|근데|그런데|일단|우선|혹시|자|그냥|오늘|내일|모레|이따가|잠시후)\s*/,'');
    const stripParticles = (s: string) => s
      .replace(/에서/g, ' ')
      .replace(/(?:으로|로)/g, ' ')
      .replace(/\b에\b/g, ' ');
    const normalizePlace = (s: string) => stripParticles(stripTimeTokens(stripLeadingFillers(s))).replace(/\s+/g, ' ').trim();

    // 장소 핵심 패턴: 마지막으로 보이는 장소 키워드 덩어리
    // 확장: '본관' 및 일반적인 건물 접미사(관|건물|센터|홀|기숙사)
    const corePlaceRegex = /([가-힣A-Za-z0-9·\s]{0,30}?(?:역|정문|후문|캠퍼스|대학교|대|도서관|카페|공원|광장|본관|관|건물|센터|홀|기숙사))(?:\s*(?:앞|근처|입구|출구\s*\d{1,2}번))?/g;

    for (let i = messageList.length - 1; i >= 0; i--) {
      const m = messageList[i];
      const text = (m && m.type === 'text' && m.text ? String(m.text) : '').trim();
      if (!text) continue;

      // 1) 라벨 기반
      const label = text.match(/(?:장소|어디|만날?\s*곳)\s*[:：]\s*([^\n]+)/);
      if (label && label[1]) {
        let candidate = normalizePlace(label[1]);
        const matches = Array.from(candidate.matchAll(corePlaceRegex));
        if (matches.length > 0) return normalizePlace(matches[matches.length - 1][1]);
        if (candidate) return candidate; // 라벨 뒤에 바로 장소만 온 경우
      }

      // 2) "...에서 만나/보/거래" 형태(다양한 변형 포함) -> '에서' 앞이 장소
      const meet = text.match(/([^\n]{2,40})에서\s*(?:만나|만날까요|보자|보죠|보시죠|보|봐|봬|뵈|뵙|뵙죠|뵐까요|뵙니다|거래)/);
      if (meet && meet[1]) {
        let candidate = normalizePlace(meet[1]);
        const matches = Array.from(candidate.matchAll(corePlaceRegex));
        if (matches.length > 0) return normalizePlace(matches[matches.length - 1][1]);
        if (candidate) return candidate;
      }

      // 3) 문장 내 장소 키워드 패턴 스캔 (여러 개면 마지막 것 선택)
      const matches = Array.from(text.matchAll(corePlaceRegex));
      if (matches.length > 0) {
        const picked = normalizePlace(matches[matches.length - 1][0] || '');
        if (picked) return picked;
      }
    }
    return null;
  };

  const extractLastTime = (messageList: Message[]): string | null => {
    const getMessageDate = (m: any): Date => {
      const t = m?.timestamp as any;
      if (!t) return new Date();
      if (t instanceof Date) return t;
      if (typeof t?.toDate === 'function') return t.toDate();
      return new Date();
    };

    const inferAmPm = (explicit: string | undefined, hour12: number, text: string, context: Date): '오전' | '오후' => {
      if (explicit === '오전' || explicit === '오후') return explicit;
      const lower = text.toLowerCase();
      if (/(아침|새벽|am\b)/i.test(text)) return '오전';
      if (/(저녁|밤|야간|pm\b)/i.test(text)) return '오후';
      if (/(이따|좀\s*뒤|조금\s*뒤|오늘)/.test(text)) {
        return context.getHours() < 12 ? '오전' : '오후';
      }
      // 기본: 메시지 시각의 반나절과 동일하게 추정
      return context.getHours() < 12 ? '오전' : '오후';
    };

    for (let i = messageList.length - 1; i >= 0; i--) {
      const m = messageList[i];
      const text = (m && m.type === 'text' && m.text ? String(m.text) : '').trim();
      if (!text) continue;
      const ctx = getMessageDate(m);

      // 패턴 A: (오전|오후)? HH 시 (MM 분)?
      const ra = /(오전|오후)?\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분?)?/;
      const ma = text.match(ra);
      if (ma) {
        const ampm = inferAmPm(ma[1] as any, parseInt(ma[2], 10), text, ctx);
        const hh = parseInt(ma[2], 10);
        const mm = ma[3] ? parseInt(ma[3], 10) : NaN;
        return `${ampm} ${hh}시${Number.isFinite(mm) ? ` ${mm}분` : ''}`;
      }

      // 패턴 B: HH:MM 또는 HH:MM형
      const rb = /(\d{1,2})\s*[:]\s*(\d{1,2})/;
      const mb = text.match(rb);
      if (mb) {
        const hh = parseInt(mb[1], 10);
        const mm = parseInt(mb[2], 10);
        const ampm = inferAmPm(undefined, hh, text, ctx);
        return `${ampm} ${hh}시 ${mm}분`;
      }
    }
    return null;
  };

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

  // 방 진입 시 읽음 처리 (lastReadAt)
  useEffect(() => {
    const markRead = async () => {
      if (!roomId || !userId) return;
      try {
        await updateDoc(doc(db, 'chatRooms', roomId), {
          [`lastReadAt.${userId}`]: serverTimestamp(),
        });
      } catch (e) {
        // ignore
      }
    };
    markRead();
    const onFocus = () => markRead();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [roomId, userId]);

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
            participantNames: { [userId]: userName },
            school: currentSchool || null,
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

          // 레거시 방에 school 필드가 없으면 현재 스쿨로 보정
          if (!roomData.school && currentSchool) {
            try {
              await updateDoc(roomRef, { school: currentSchool });
            } catch (e) {
              // ignore
            }
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

      // 메시지 갱신 시 읽음 처리
      try {
        if (roomId && userId) {
          await updateDoc(doc(db, 'chatRooms', roomId), {
            [`lastReadAt.${userId}`]: serverTimestamp(),
          });
        }
      } catch {}

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

  // 요약 생성 시에도 하단으로 스크롤
  useEffect(() => {
    if (roomInfo && (roomInfo as any).summary) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [roomInfo]);

  // 방이 완료이거나 양측 완료로 추정되는데 요약이 없다면, 새로고침/재진입 시 자동 백필
  useEffect(() => {
    if (!roomId || !roomInfo) return;
    const hasSummary = !!(roomInfo.summary && (roomInfo.summary.place || roomInfo.summary.time));
    if (hasSummary) return;
    if (!messages || messages.length === 0) return;
    if (backfillTriedRef.current) return;

    backfillTriedRef.current = true;
    (async () => {
      try {
        // 완료 조건 판별: status=completed 또는 dealCompletedBy에 2명 이상, 또는 메시지에 서로 다른 유저의 dealComplete 2개 이상
        const statusCompleted = roomInfo.status === 'completed';
        const byMap = (roomInfo.dealCompletedBy && typeof roomInfo.dealCompletedBy === 'object') ? roomInfo.dealCompletedBy : {};
        const byCount = Object.values(byMap).filter(Boolean).length;
        const uniqueDealUsers = Array.from(new Set(messages.filter(m => m.type === 'dealComplete').map(m => m.userId)));
        const dealLikelyCompleted = statusCompleted || byCount >= 2 || uniqueDealUsers.length >= 2;
        if (!dealLikelyCompleted) return;

        let place = extractLastPlace(messages);
        let timeText = extractLastTime(messages);

        // LLM 요약 시도 (실패 시 정규식 결과 사용)
        try {
          const summarize = httpsCallable(fbFunctions, 'summarizeTrade');
          const llm = await summarize({ messages, postTitle });
          const d: any = llm.data || {};
          if (d && d.ok) {
            place = d.place || place;
            timeText = d.time || timeText;
          }
        } catch (e) {
          // ignore LLM failure
        }
        const summary: any = {
          generatedAt: serverTimestamp(),
          generatedBy: userId,
        };
        if (place) summary.place = place;
        if (timeText) summary.time = timeText;

        await updateDoc(doc(db, 'chatRooms', roomId), { summary });
        // 옵티미스틱 업데이트로 즉시 표시
        setRoomInfo((prev: any) => (prev ? { ...prev, summary } : prev));
      } catch (e) {
        console.error('요약 자동 백필 실패:', e);
      }
    })();
  }, [roomId, roomInfo, messages, postTitle, userId]);

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

        // 거래 요약 생성 및 저장
        try {
          let place = extractLastPlace(messages);
          let timeText = extractLastTime(messages);

          // LLM 요약 시도 (실패 시 정규식 결과 사용)
          try {
            const summarize = httpsCallable(fbFunctions, 'summarizeTrade');
            const llm = await summarize({ messages, postTitle });
            const d: any = llm.data || {};
            if (d && d.ok) {
              place = d.place || place;
              timeText = d.time || timeText;
            }
          } catch (e) {
            // ignore LLM failure
          }

          const summary: any = {
            generatedAt: serverTimestamp(),
            generatedBy: userId,
          };
          if (place) summary.place = place;
          if (timeText) summary.time = timeText;

          await updateDoc(roomRef, { summary });
        } catch (e) {
          console.error('요약 저장 실패:', e);
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
          onClick={() => navigate('/chat')}
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

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
        <ChatMessageList messages={messages} />
        {roomInfo && roomInfo.summary && (
          <div style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 8, padding: 12, marginTop: 12 }}>
            {roomInfo.summary.place && (
              <div style={{ fontSize: 14, color: '#111827' }}>거래 장소: {roomInfo.summary.place}</div>
            )}
            {roomInfo.summary.time && (
              <div style={{ fontSize: 14, color: '#111827' }}>거래 시간: {roomInfo.summary.time}</div>
            )}
          </div>
        )}
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
