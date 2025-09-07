import { v4 as uuidv4 } from 'uuid';

// 게시물 기반 채팅방 ID 생성
export const generateRoomIdFromPost = (postId, sellerId, buyerId) => {
  // 정렬하여 항상 같은 순서로 ID 생성 (같은 게시물, 같은 사용자 조합이면 항상 같은 채팅방)
  const sortedIds = [sellerId, buyerId].sort();
  return `${postId}_${sortedIds[0]}_${sortedIds[1]}`;
};

// 일반 채팅방 ID 생성
export const generateGeneralRoomId = () => {
  return uuidv4();
};

// 게시물에서 채팅 시작 URL 생성
export const createChatUrlFromPost = (postId, sellerId, buyerId) => {
  const roomId = generateRoomIdFromPost(postId, sellerId, buyerId);
  return `/chat/${roomId}?postId=${postId}&sellerId=${sellerId}`;
};

// 일반 채팅방 URL 생성
export const createGeneralChatUrl = () => {
  const roomId = generateGeneralRoomId();
  return `/chat/${roomId}`;
};

// 채팅방 타입 확인
export const getChatRoomType = (roomId) => {
  if (roomId.includes('_')) {
    return 'post_chat';
  }
  return 'general_chat';
};

// 게시물 정보 추출
export const extractPostInfo = (roomId) => {
  if (roomId.includes('_')) {
    const parts = roomId.split('_');
    if (parts.length >= 3) {
      return {
        postId: parts[0],
        sellerId: parts[1],
        buyerId: parts[2]
      };
    }
  }
  return null;
};
