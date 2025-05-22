import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

const InputContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 8px 8px 8px;
  background: #fff;
  border-top: 1px solid #eee;
`;
const Plus = styled.div`
  font-size: 24px;
  color: #bbb;
  margin-right: 8px;
  cursor: pointer;
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
  display: none;
`;
const BottomMenu = styled.div`
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 8px;
`;
const MenuBtn = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  border: none;
  background: none;
  cursor: pointer;
`;
const MenuIcon = styled.div`
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

function ChatInput({ onSend, onSendImage, onDealComplete }) {
  const [value, setValue] = useState('');
  const fileInputRef = useRef();

  const handleSend = (e) => {
    e.preventDefault();
    if (value.trim()) {
      onSend(value);
      setValue('');
    }
  };
  const handleAlbumClick = () => {
    fileInputRef.current.click();
  };
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const storageRef = ref(storage, `chat-images/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      onSendImage(url);
    }
    e.target.value = '';
  };
  return (
    <div>
      <InputContainer>
        <Plus>+</Plus>
        <form onSubmit={handleSend} style={{ flex: 1, display: 'flex' }}>
          <Input
            type="text"
            placeholder="메시지 보내기"
            value={value}
            onChange={e => setValue(e.target.value)}
          />
          <SendBtn type="submit">전송</SendBtn>
        </form>
        <MenuBtn onClick={onDealComplete}>
          <MenuIcon bg="#4BE18A">
            <span role="img" aria-label="paw" style={{ fontSize: 28 }}>🐾</span>
          </MenuIcon>
        </MenuBtn>
      </InputContainer>
      <BottomMenu>
        <MenuBtn onClick={handleAlbumClick}>
          <MenuIcon bg="#FFB07B">
            <span role="img" aria-label="album" style={{ fontSize: 28 }}>🖼️</span>
          </MenuIcon>
          <MenuLabel>앨범</MenuLabel>
        </MenuBtn>
        <input
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <MenuBtn onClick={onDealComplete}>
          <MenuIcon bg="#4BE18A">
            <span role="img" aria-label="paw" style={{ fontSize: 28 }}>🐾</span>
          </MenuIcon>
          <MenuLabel>거래완료</MenuLabel>
        </MenuBtn>
      </BottomMenu>
    </div>
  );
}

export default ChatInput;