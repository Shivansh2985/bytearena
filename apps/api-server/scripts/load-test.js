import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import { WebSocket } from "k6/websockets";


import { check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 }, // Ramp-up to 100 users
    { duration: '1m', target: 250 },  // Ramp-up to 250 users
    { duration: '2m', target: 250 },  // Maintain 250 users (Chaos Phase)
    { duration: '30s', target: 0 },   // Ramp-down
  ],
};

// Target Realtime Server
const WS_URL = __ENV.WS_URL || 'ws://localhost:8080';
const CONTEST_ID = __ENV.CONTEST_ID || 'load-test-contest-1';

export default function () {
  const userId = `vu-${randomString(8)}`;
  // Connect via Engine.IO format
  const url = `${WS_URL}/socket.io/?EIO=4&transport=websocket&userId=${userId}`;

  const ws = new WebSocket(url);
  
  let heartbeatInterval;
  let chaosInterval;
  let sequenceNumber = 0;

  ws.addEventListener('open', () => {
    // Socket.IO handshake requires sending "40" to connect to default namespace
    ws.send('40');

    // Simulate joining a contest
    setTimeout(() => {
      ws.send(`42["join-contest","${CONTEST_ID}"]`);
    }, 1000);

    // Heartbeat every 25s
    heartbeatInterval = setInterval(() => {
      ws.send(`42["heartbeat"]`);
    }, 25000);

    // Simulate random suspicious behavior to test Backpressure
    setInterval(() => {
      if (Math.random() < 0.1) { // 10% chance every 10s
        sequenceNumber++;
        ws.send(`42["proctor:event",{"contestId":"${CONTEST_ID}","eventType":"tab_switch","description":"Tab changed","severity":"CRITICAL","seq":${sequenceNumber}}]`);
      } else if (Math.random() < 0.2) {
        sequenceNumber++;
        ws.send(`42["proctor:event",{"contestId":"${CONTEST_ID}","eventType":"low_light","description":"Lighting poor","severity":"WARNING","seq":${sequenceNumber}}]`);
      }
    }, 10000);

    // 20% Chaos testing (Disconnect/Reconnect simulation)
    chaosInterval = setInterval(() => {
      if (Math.random() < 0.2) {
        ws.close();
      }
    }, 15000);
  });

  ws.addEventListener('message', (e) => {
    // Engine.IO heartbeat ping (2), respond with pong (3)
    if (e.data === '2') {
      ws.send('3');
    }
  });

  ws.addEventListener('close', () => {
    clearInterval(heartbeatInterval);
    clearInterval(chaosInterval);
  });
}
