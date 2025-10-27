import React, { useState } from 'react';
import styled from 'styled-components';

const PlusButtonContainer = styled.div`
  position: relative;
`;

const PlusButton = styled.button`
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MenuContainer = styled.div`
  position: absolute;
  bottom: 50px;
  left: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const MenuButton = styled.button`
  width: 50px;
  height: 50px;
  border: none;
  border-radius: 50%;
  background-color: ${props => props.color};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 20px;
`;

const MenuLabel = styled.span`
  font-size: 12px;
  text-align: center;
  margin-top: 5px;
`;

function PlusButton({ onDealClick }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <PlusButtonContainer>
      <PlusButton onClick={() => setShowMenu(!showMenu)}>
        +
      </PlusButton>
      
      {showMenu && (
        <MenuContainer>
          <div>
            <MenuButton color="#FFA500">
              📷
            </MenuButton>
            <MenuLabel>앨범</MenuLabel>
          </div>
          <div>
            <MenuButton color="#FFD700">
              📸
            </MenuButton>
            <MenuLabel>카메라</MenuLabel>
          </div>
          <div>
            <MenuButton color="#E6FAEC" onClick={onDealClick}>
              ✓
            </MenuButton>
            <MenuLabel>거래완료</MenuLabel>
          </div>
        </MenuContainer>
      )}
    </PlusButtonContainer>
  );
}

export default PlusButton;