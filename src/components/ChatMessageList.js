import React from 'react';
import styled from 'styled-components';

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;
const MessageRow = styled.div`
  display: flex;
  flex-direction: ${props => props.isMe ? 'row-reverse' : 'row'};
  align-items: flex-end;
`;
const Bubble = styled.div`
  background: ${props => props.isMe ? '#E6FAEC' : '#eee'};
  color: #222;
  border-radius: 16px;
  padding: 10px 16px;
  max-width: 60%;
  word-break: break-all;
  font-size: 16px;
  margin: 0 8px;
`;
const Time = styled.div`
  font-size: 12px;
  color: #bbb;
  margin: 0 8px;
  align-self: flex-end;
`;
const Img = styled.img`
  max-width: 180px;
  max-height: 180px;
  border-radius: 12px;
  margin: 0 8px;
`;

function ChatMessageList({ messages }) {
  return (
    <List>
      {messages.map((msg, idx) => (
        <MessageRow key={idx} isMe={msg.sender === 'me'}>
          {msg.type === 'image' ? (
            <Img src={msg.image} alt="img" />
          ) : (
            <Bubble isMe={msg.sender === 'me'}>{msg.text}</Bubble>
          )}
          <Time>{msg.time}</Time>
        </MessageRow>
      ))}
    </List>
  );
}

export default ChatMessageList; 