import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { doc, getDoc } from 'firebase/firestore';
import PetsIcon from '@mui/icons-material/Pets';
import { db } from '../../config/firebase';

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const MessageRow = styled.div<{ $isMe: boolean }>`
  display: flex;
  flex-direction: ${props => props.$isMe ? 'row-reverse' : 'row'};
  align-items: flex-end;
  gap: 8px;
`;

const ProfileImage = styled.div<{ profileImage?: string }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${props => props.profileImage ? `url(${props.profileImage}) center/cover` : '#C8E6C9'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2E7D32;
  font-size: 14px;
  font-weight: bold;
  flex-shrink: 0;
  cursor: pointer;
  transition: transform 0.2s;
  
  &:hover {
    transform: scale(1.1);
  }
`;

const MessageContent = styled.div<{ $isMe: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.$isMe ? 'flex-end' : 'flex-start'};
  max-width: 60%;
`;

const UserName = styled.div`
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
  font-weight: 500;
`;

const Bubble = styled.div<{ $isMe: boolean }>`
  background: ${props => props.$isMe ? '#E6FAEC' : '#eee'};
  color: #222;
  border-radius: 16px;
  padding: 10px 16px;
  max-width: 100%;
  word-break: break-all;
  font-size: 16px;
`;

const Time = styled.div`
  font-size: 12px;
  color: #bbb;
  margin-top: 4px;
`;

const Img = styled.img`
  max-width: 180px;
  max-height: 180px;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.2s;
  
  &:hover {
    transform: scale(1.05);
  }
`;

const DealCompleteText = styled.div`
  font-size: 12px;
  color: #666;
  text-decoration: underline;
  display: block;
  text-align: center;
  margin: 8px 0;
  width: 100%;
`;

// 이미지 확대 모달
const ImageModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  cursor: pointer;
`;

const ModalImage = styled.img`
  max-width: 90%;
  max-height: 90%;
  border-radius: 8px;
  object-fit: contain;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  z-index: 1001;
`;

interface Message {
  id?: string;
  type: string;
  text?: string;
  image?: string;
  time: string;
  userId?: string;
  sender: string;
  userName?: string;
}

interface ChatMessageListProps {
  messages: Message[];
}

function ChatMessageList({ messages }: ChatMessageListProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [profileCache, setProfileCache] = useState<{ [uid: string]: string | undefined }>({});

  // 사용자 이름 표시: 우선 메시지에 포함된 userName 사용, 없으면 userId 그대로 표시
  const getDisplayName = (msg: Message) => {
    if (typeof msg.userName === 'string' && msg.userName.trim().length > 0) return msg.userName;
    if (msg.userId) return msg.userId;
    return 'unknown';
  };

  // 필요한 사용자들의 프로필 사진을 캐싱
  useEffect(() => {
    const loadProfiles = async () => {
      const uids = Array.from(new Set(messages.map(m => m.userId).filter(Boolean))) as string[];
      const toFetch = uids.filter(uid => !(uid in profileCache));
      if (toFetch.length === 0) return;
      const entries = await Promise.all(toFetch.map(async (uid) => {
        try {
          const snap = await getDoc(doc(db, 'users', uid));
          if (snap.exists()) {
            const d = snap.data() as any;
            return [uid, d.photoUrl as string | undefined] as [string, string | undefined];
          }
        } catch {}
        return [uid, undefined] as [string, string | undefined];
      }));
      setProfileCache(prev => {
        const next = { ...prev };
        entries.forEach(([uid, url]) => { next[uid] = url; });
        return next;
      });
    };
    loadProfiles();
  }, [messages]);

  // 이미지 클릭 핸들러
  const handleImageClick = (imageUrl: string) => {
    console.log('이미지 클릭됨:', imageUrl);
    setSelectedImage(imageUrl);
  };

  // 모달 닫기 핸들러
  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  // 디버깅용 로그
  console.log('ChatMessageList messages:', messages);

  return (
    <>
      <List>
        {messages.map((msg, idx) => {
          console.log('메시지 데이터:', msg); // 각 메시지 데이터 확인
          
          // 거래완료 메시지 처리
          if (msg.type === 'dealComplete') {
            return (
              <DealCompleteText key={idx}>
                {msg.text}
              </DealCompleteText>
            );
          }

          const isMe = msg.sender === 'me';
          const displayName = getDisplayName(msg);
          const profileUrl = msg.userId ? profileCache[msg.userId] : undefined;

          // 일반 메시지 처리
          return (
            <MessageRow key={idx} $isMe={isMe}>
              {/* 상대방 프로필 (내 메시지가 아닐 때만 표시) */}
              {!isMe && (
                <ProfileImage profileImage={profileUrl}>
                  {!profileUrl && (
                    <PetsIcon sx={{ fontSize: 18, color: '#2E7D32' }} />
                  )}
                </ProfileImage>
              )}
              
              <MessageContent $isMe={isMe}>
                {/* 상대방 이름 (내 메시지가 아닐 때만 표시) */}
                {!isMe && <UserName>{displayName}</UserName>}
                
                {msg.type === 'image' ? (
                  <Img 
                    src={msg.image} 
                    alt="img" 
                    onClick={() => handleImageClick(msg.image || '')}
                  />
                ) : (
                  <Bubble $isMe={isMe}>{msg.text}</Bubble>
                )}
                <Time>{msg.time}</Time>
              </MessageContent>
            </MessageRow>
          );
        })}
      </List>

      {/* 이미지 확대 모달 */}
      {selectedImage && (
        <ImageModal onClick={handleCloseModal}>
          <CloseButton onClick={handleCloseModal}>×</CloseButton>
          <ModalImage 
            src={selectedImage} 
            alt="확대된 이미지" 
            onClick={(e) => e.stopPropagation()}
          />
        </ImageModal>
      )}
    </>
  );
}

export default ChatMessageList;
