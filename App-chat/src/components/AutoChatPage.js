import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { v4 as uuidv4 } from 'uuid';

// 게시물 기반 채팅방 ID 생성 함수
const generateRoomIdFromPost = (postId, sellerId, buyerId) => {
  const sortedIds = [sellerId, buyerId].sort();
  return `${postId}_${sortedIds[0]}_${sortedIds[1]}`;
};

const AutoChatPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleAutoChat = async () => {
      try {
        // URL 파라미터에서 정보 추출
        const urlParams = new URLSearchParams(window.location.search);
        const postId = urlParams.get('postId');
        const sellerId = urlParams.get('sellerId');
        const buyerId = urlParams.get('buyerId');

        // 필수 파라미터 확인
        if (!postId || !sellerId || !buyerId) {
          throw new Error('필수 파라미터가 누락되었습니다.');
        }

        // 현재 사용자 ID 가져오기 (로컬 스토리지에서)
        const currentUserId = localStorage.getItem('userId') || Date.now().toString();
        if (!localStorage.getItem('userId')) {
          localStorage.setItem('userId', currentUserId);
        }

        // 게시물 기반 채팅방 ID 생성
        const roomId = generateRoomIdFromPost(postId, sellerId, buyerId);
        
        console.log('채팅방 ID 생성:', roomId);
        console.log('게시물 정보:', { postId, sellerId, buyerId });

        // 기존 채팅방이 있는지 확인
        const roomRef = doc(db, "chatRooms", roomId);
        const roomDoc = await getDoc(roomRef);
        
        if (roomDoc.exists()) {
          console.log('기존 채팅방 발견, 입장:', roomId);
          // 기존 채팅방이 있으면 바로 입장
          navigate(`/chat/${roomId}?postId=${postId}&sellerId=${sellerId}`);
        } else {
          console.log('새 채팅방 생성:', roomId);
          // 채팅방이 없으면 새로 생성
          const roomData = {
            createdAt: serverTimestamp(),
            participants: [buyerId, sellerId],
            postId: postId,
            sellerId: sellerId,
            buyerId: buyerId,
            type: 'post_chat',
            lastMessage: null
          };

          await setDoc(roomRef, roomData);
          console.log('새 채팅방 생성 완료:', roomId);
          
          // 생성된 채팅방으로 이동
          navigate(`/chat/${roomId}?postId=${postId}&sellerId=${sellerId}`);
        }
      } catch (error) {
        console.error('자동 채팅방 생성 중 에러:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    handleAutoChat();
  }, [navigate]);

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h2>오류가 발생했습니다</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>{error}</p>
        <button 
          onClick={() => navigate('/')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      padding: '20px',
      textAlign: 'center'
    }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #007bff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 10px'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
      <h2>채팅방으로 이동 중...</h2>
      <p style={{ color: '#666' }}>잠시만 기다려주세요.</p>
    </div>
  );
};

export default AutoChatPage;

