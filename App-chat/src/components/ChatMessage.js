import React from 'react';
import styled from 'styled-components';

const MessageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.isMine ? 'flex-end' : 'flex-start'};
  margin: 10px 0;
`;

const MessageBubble = styled.div`
  max-width: 70%;
  padding: 10px 15px;
  border-radius: 15px;
  background-color: ${props => props.isMine ? '#E6FAEC' : '#FFFFFF'};
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;

const MessageText = styled.p`
  margin: 0;
  font-size: 14px;
  color: #333;
`;

const DealCompleteText = styled.p`
  margin: 0;
  font-size: 12px;
  color: #666;
  text-decoration: underline;
  text-align: center;
`;

const MessageImage = styled.img`
  max-width: 200px;
  max-height: 200px;
  border-radius: 10px;
  margin-top: 5px;
`;

const TimeText = styled.span`
  font-size: 12px;
  color: #999;
  margin-top: 5px;
  display: block;
`;

function ChatMessage({ isMine, message, imageUrl, time, isDealComplete }) {
  if (isDealComplete) {
    return (
      <MessageContainer isMine={false}>
        <DealCompleteText>{message}</DealCompleteText>
        <TimeText>{time}</TimeText>
      </MessageContainer>
    );
  }

  return (
    <MessageContainer isMine={isMine}>
      <MessageBubble isMine={isMine}>
        {message && <MessageText>{message}</MessageText>}
        {imageUrl && <MessageImage src={imageUrl} alt="Chat" />}
        <TimeText>{time}</TimeText>
      </MessageBubble>
    </MessageContainer>
  );
}

export default ChatMessage;