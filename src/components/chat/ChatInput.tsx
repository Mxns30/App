import React, { useRef, useState } from 'react';
import styled from 'styled-components';

const InputContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 8px 8px 8px;
  background: #fff;
  border-top: 1px solid #eee;
  flex-shrink: 0;
  position: sticky;
  bottom: 0;
  z-index: 10;
`;
const Plus = styled.button`
  font-size: 24px;
  color: #bbb;
  margin-right: 8px;
  cursor: pointer;
  background: none;
  border: none;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
`;
const Input = styled.input`
  flex: 1;
  border: none;
  background: #f5f5f5;
  border-radius: 20px;
  padding: 10px 16px;
  margin-right: 8px;
  font-size: 16px;
  outline: none;
`;
const SendBtn = styled.button`
  background: #4BE18A;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  font-size: 16px;
  font-weight: bold;
`;
const BottomMenu = styled.div`
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 8px;
  padding: 8px 0;
  background: #fff;
  border-top: 1px solid #eee;
  animation: slideUp 0.2s;
  flex-shrink: 0;

  @keyframes slideUp {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;
const MenuBtn = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  border: none;
  background: none;
  cursor: pointer;
`;
const MenuIcon = styled.div<{ bg: string }>`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: ${props => props.bg};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
`;
const MenuLabel = styled.div`
  font-size: 14px;
  color: #888;
`;

interface ChatInputProps {
  onSend: (text: string) => void;
  onSendImageFile: (file: File) => void;
  onDealComplete: () => void;
}

function ChatInput({ onSend, onSendImageFile, onDealComplete }: ChatInputProps) {
  const [value, setValue] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSend(value);
      setValue('');
    }
  };
  
  const handleAlbumClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        console.log('이미지 파일 선택됨:', file.name);
        onSendImageFile(file);
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
      <InputContainer>
        <Plus type="button" onClick={handlePlusClick}>+</Plus>
        <form onSubmit={handleSend} style={{ flex: 1, display: 'flex' }}>
          <Input
            type="text"
            placeholder="메시지를 입력하세요"
            value={value}
            onChange={e => setValue(e.target.value)}
            onClick={handleInputClick}
          />
          <SendBtn type="submit">🐾</SendBtn>
        </form>
      </InputContainer>
      {showMenu && (
        <BottomMenu>
          <MenuBtn onClick={handleAlbumClick}>
            <MenuIcon bg="#FFB07B">
              <span role="img" aria-label="album" style={{ fontSize: 28 }}>🖼️</span>
            </MenuIcon>
            <MenuLabel>앨범</MenuLabel>
          </MenuBtn>
          <MenuBtn onClick={onDealComplete}>
            <MenuIcon bg="#4BE18A">
              <span role="img" aria-label="paw" style={{ fontSize: 28 }}>🐾</span>
            </MenuIcon>
            <MenuLabel>거래완료</MenuLabel>
          </MenuBtn>
        </BottomMenu>
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
}

export default ChatInput;
