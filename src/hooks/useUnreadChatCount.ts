import { useEffect, useState } from 'react';
import { collection, doc, getCountFromServer, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useSchool } from '../contexts/SchoolContext';

export function useUnreadChatCount(): number {
  const { currentUser } = useAuth();
  const { currentSchool } = useSchool();
  const userId = currentUser?.uid || '';
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) {
      setCount(0);
      return;
    }

    const roomsRef = collection(db, 'chatRooms');
    const q = query(roomsRef, where('participants', 'array-contains', userId));

    let cancelled = false;
    const unsub = onSnapshot(q, async (snap) => {
      try {
        let total = 0;
        const rooms = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as any) }))
          .filter((r) => !r.deleted)
          .filter((r) => (currentSchool ? r.school === currentSchool : true));

        for (const room of rooms) {
          const lastRead = room.lastReadAt && room.lastReadAt[userId] ? room.lastReadAt[userId] : null;
          const messagesRef = collection(db, 'chatRooms', room.id, 'messages');
          let mq;
          if (lastRead) {
            mq = query(messagesRef, where('timestamp', '>', lastRead));
          } else {
            // 처음인 경우: 방 생성 이후 모든 메시지를 미확인으로 간주
            mq = query(messagesRef);
          }
          const agg = await getCountFromServer(mq);
          total += agg.data().count || 0;
        }
        if (!cancelled) setCount(total);
      } catch {
        if (!cancelled) setCount(0);
      }
    });

    return () => { cancelled = true; unsub(); };
  }, [userId, currentSchool]);

  return count;
}


