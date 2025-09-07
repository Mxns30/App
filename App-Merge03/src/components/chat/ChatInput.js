import React, { useRef, useState } from 'react';

const ChatInput = ({ onSend, onSendImage, onDealComplete }) => {
  const [value, setValue] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const fileInputRef = useRef(null);

  const handleSend = (e) => {
    e.preventDefault();
    if (value.trim()) {
      onSend(value);
      setValue('');
    }
  };
  
  const handleAlbumClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        console.log('이미지 파일 선택됨:', file.name);
        
        // FileReader를 사용해 base64로 변환
        const reader = new FileReader();
        reader.onload = async () => {
          const base64Image = reader.result;
          console.log('이미지를 base64로 변환 완료');
          onSendImage(base64Image);
          console.log('onSendImage 호출 완료');
        };
        reader.readAsDataURL(file);
        
      } catch (error) {
        console.error('이미지 처리 실패:', error);
        alert('이미지 처리에 실패했습니다.');
      }
    }
    e.target.value = '';
  };

  const handlePlusClick = () => {
    const newShowMenu = !showMenu;
    setShowMenu(newShowMenu);
    
    // 메뉴가 나타날 때 화면을 아래로 스크롤
    if (newShowMenu) {
      setTimeout(() => {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    }
  };

  const handleInputClick = () => {
    if (showMenu) {
      setShowMenu(false);
    }
  };

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 8px 8px 8px',
        background: '#fff',
        borderTop: '1px solid #eee',
        flexShrink: 0,
        position: 'sticky',
        bottom: 0,
        zIndex: 10
      }}>
        <button
          type="button"
          onClick={handlePlusClick}
          style={{
            fontSize: '24px',
            color: '#bbb',
            marginRight: '8px',
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            outline: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          +
        </button>
        <form onSubmit={handleSend} style={{ flex: 1, display: 'flex' }}>
          <input
            type="text"
            placeholder="메시지를 입력하세요"
            value={value}
            onChange={e => setValue(e.target.value)}
            onClick={handleInputClick}
            style={{
              flex: 1,
              border: 'none',
              background: '#f5f5f5',
              borderRadius: '20px',
              padding: '10px 16px',
              marginRight: '8px',
              fontSize: '16px',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            style={{
              background: '#4BE18A',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            🐾
          </button>
        </form>
      </div>
      {showMenu && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '24px',
          marginTop: '8px',
          padding: '8px 0',
          background: '#fff',
          borderTop: '1px solid #eee',
          animation: 'slideUp 0.2s',
          flexShrink: 0
        }}>
          <button
            onClick={handleAlbumClick}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              border: 'none',
              background: 'none',
              cursor: 'pointer'
            }}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#FFB07B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '4px'
            }}>
              <span role="img" aria-label="album" style={{ fontSize: 28 }}>🖼️</span>
            </div>
            <div style={{
              fontSize: '14px',
              color: '#888'
            }}>
              앨범
            </div>
          </button>
          <button
            onClick={onDealComplete}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              border: 'none',
              background: 'none',
              cursor: 'pointer'
            }}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#4BE18A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '4px'
            }}>
              <span role="img" aria-label="paw" style={{ fontSize: 28 }}>🐾</span>
            </div>
            <div style={{
              fontSize: '14px',
              color: '#888'
            }}>
              거래완료
            </div>
          </button>
        </div>
      )}
      <input
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        ref={fileInputRef}
        onChange={handleFileChange}
      />
    </div>
  );
};

export default ChatInput;
