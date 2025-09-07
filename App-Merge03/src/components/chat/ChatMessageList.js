import React, { useState } from 'react';

const ChatMessageList = ({ messages }) => {
  const [selectedImage, setSelectedImage] = useState(null);

  // 프로필 이미지 생성 함수
  const getProfileImage = (userId) => {
    const colors = ['#007bff', '#28a745', '#dc3545', '#ffc107', '#17a2b8', '#6f42c1'];
    const colorIndex = (userId || 'unknown').charCodeAt(0) % colors.length;
    return colors[colorIndex];
  };

  // 사용자 이름 생성 함수
  const getUserName = (userId) => {
    return `사용자${(userId || 'unknown').slice(-4)}`;
  };

  // 이미지 클릭 핸들러
  const handleImageClick = (imageUrl) => {
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
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {messages.map((msg, idx) => {
          console.log('메시지 데이터:', msg); // 각 메시지 데이터 확인
          
          // 거래완료 메시지 처리
          if (msg.type === 'dealComplete') {
            return (
              <div
                key={idx}
                style={{
                  fontSize: '12px',
                  color: '#666',
                  textDecoration: 'underline',
                  display: 'block',
                  textAlign: 'center',
                  margin: '8px 0',
                  width: '100%'
                }}
              >
                {msg.text}
              </div>
            );
          }

          const isMe = msg.sender === 'me';
          const profileColor = getProfileImage(msg.userId);
          const userName = getUserName(msg.userId);

          // 일반 메시지 처리
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                flexDirection: isMe ? 'row-reverse' : 'row',
                alignItems: 'flex-end',
                gap: '8px'
              }}
            >
              {/* 상대방 프로필 (내 메시지가 아닐 때만 표시) */}
              {!isMe && (
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: profileColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    flexShrink: 0,
                    cursor: 'pointer',
                    transition: 'transform 0.2s'
                  }}
                >
                  {userName.slice(0, 2)}
                </div>
              )}
              
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '60%'
                }}
              >
                {/* 상대방 이름 (내 메시지가 아닐 때만 표시) */}
                {!isMe && (
                  <div style={{
                    fontSize: '12px',
                    color: '#666',
                    marginBottom: '4px',
                    fontWeight: 500
                  }}>
                    {userName}
                  </div>
                )}
                
                {msg.type === 'image' ? (
                  <img
                    src={msg.image}
                    alt="img"
                    onClick={() => handleImageClick(msg.image || '')}
                    style={{
                      maxWidth: '180px',
                      maxHeight: '180px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'transform 0.2s'
                    }}
                  />
                ) : (
                  <div
                    style={{
                      background: isMe ? '#E6FAEC' : '#eee',
                      color: '#222',
                      borderRadius: '16px',
                      padding: '10px 16px',
                      maxWidth: '100%',
                      wordBreak: 'break-all',
                      fontSize: '16px'
                    }}
                  >
                    {msg.text}
                  </div>
                )}
                <div style={{
                  fontSize: '12px',
                  color: '#bbb',
                  marginTop: '4px'
                }}>
                  {msg.time}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 이미지 확대 모달 */}
      {selectedImage && (
        <div
          onClick={handleCloseModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            cursor: 'pointer'
          }}
        >
          <button
            onClick={handleCloseModal}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              zIndex: 1001
            }}
          >
            ×
          </button>
          <img
            src={selectedImage}
            alt="확대된 이미지"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              borderRadius: '8px',
              objectFit: 'contain'
            }}
          />
        </div>
      )}
    </>
  );
};

export default ChatMessageList;
