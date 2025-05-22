import { io } from 'socket.io-client';

const socket = io('http://localhost:4000'); // 서버 주소에 맞게 수정

export default socket; 