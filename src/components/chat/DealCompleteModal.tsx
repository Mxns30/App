import React from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalContent = styled.div`
  background-color: #fff;
  padding: 20px;
  border-radius: 10px;
  width: 80%;
  max-width: 300px;
`;

const ModalTitle = styled.h2`
  text-align: center;
  margin-bottom: 20px;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
`;

const Button = styled.button<{ isYes: boolean }>`
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 5px;
  background-color: ${props => props.isYes ? '#E6FAEC' : '#f5f5f5'};
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.isYes ? '#d4f5dc' : '#e0e0e0'};
  }
`;

interface DealCompleteModalProps {
  onClose: () => void;
  onDealComplete: () => void;
}

function DealCompleteModal({ onClose, onDealComplete }: DealCompleteModalProps) {
  const handleYesClick = () => {
    if (onDealComplete) {
      onDealComplete();
    }
    onClose();
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <ModalTitle>거래를 완료하시겠습니까?</ModalTitle>
        <ButtonContainer>
          <Button isYes={true} onClick={handleYesClick}>Yes</Button>
          <Button isYes={false} onClick={onClose}>No</Button>
        </ButtonContainer>
      </ModalContent>
    </ModalOverlay>
  );
}

export default DealCompleteModal;
