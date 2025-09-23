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
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: #fff;
  padding: 24px;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  text-align: center;
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
  
  &:hover {
    color: #333;
  }
`;

const ProfileImage = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: ${props => props.profileImage ? `url(${props.profileImage}) center/cover` : props.backgroundColor};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  font-weight: bold;
  margin: 0 auto 16px;
`;

const UserName = styled.h2`
  margin: 0 0 8px 0;
  font-size: 20px;
  color: #333;
`;

const UserId = styled.p`
  margin: 0 0 16px 0;
  color: #666;
  font-size: 14px;
`;

const UserInfo = styled.div`
  text-align: left;
  margin-top: 16px;
`;

const InfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
  
  &:last-child {
    border-bottom: none;
  }
`;

const InfoLabel = styled.span`
  color: #666;
  font-size: 14px;
`;

const InfoValue = styled.span`
  color: #333;
  font-size: 14px;
  font-weight: 500;
`;

const ActionButton = styled.button`
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  margin-top: 16px;
  
  &:hover {
    background-color: #0056b3;
  }
`;

function UserProfileModal({ user, onClose, onBlockUser }) {
  if (!user) return null;

  const handleBlockUser = () => {
    if (onBlockUser) {
      onBlockUser(user.userId);
    }
    onClose();
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>×</CloseButton>
        
        <ProfileImage 
          backgroundColor={user.profileColor}
          profileImage={user.profileImage}
        >
          {user.name.slice(0, 2)}
        </ProfileImage>
        
        <UserName>{user.name}</UserName>
        <UserId>ID: {user.userId}</UserId>
        
        <UserInfo>
          <InfoItem>
            <InfoLabel>가입일</InfoLabel>
            <InfoValue>{user.joinDate || '2024년 1월'}</InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>상태</InfoLabel>
            <InfoValue>{user.status || '온라인'}</InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>평점</InfoLabel>
            <InfoValue>{user.rating || '4.5/5.0'}</InfoValue>
          </InfoItem>
        </UserInfo>
        
        <ActionButton onClick={handleBlockUser}>
          사용자 차단
        </ActionButton>
      </ModalContent>
    </ModalOverlay>
  );
}

export default UserProfileModal;
