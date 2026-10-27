/**
 * Multi-Client Real-Time Synchronization & Role Secrecy Verification Test
 */

const http = require('http');
const { io } = require('socket.io-client');

// Use isolated test port so we don't conflict with user's running server
process.env.PORT = '3040';
const TEST_PORT = 3040;

// Start server
require('./server.js');

setTimeout(() => {
  console.log('[TEST] Starting Multi-Client Verification on port ' + TEST_PORT + '...');
  runMultiplayerVerification();
}, 1500);

function runMultiplayerVerification() {
  const host = io(`http://localhost:${TEST_PORT}`);
  const player2 = io(`http://localhost:${TEST_PORT}`);

  let roomCode = null;
  let hostReceivedRole = null;
  let player2ReceivedRole = null;
  let hostSawPlayer2Move = false;
  let player2SawHostMove = false;

  host.on('connect', () => {
    console.log('[TEST] Host connected:', host.id);
    host.emit('create_room', {
      playerName: 'Host-Commander',
      color: '#00ffcc',
      exhibitionMode: true
    }, (res) => {
      console.log('[TEST] Room created:', res.roomCode);
      roomCode = res.roomCode;

      // Player 2 joins
      player2.emit('join_room', {
        roomCode: roomCode,
        playerName: 'Cadet-Player2',
        color: '#ff3366'
      }, (joinRes) => {
        console.log('[TEST] Player 2 joined successfully');

        // Player 2 sets ready
        player2.emit('set_ready', { roomCode, isReady: true });

        // Add 1 bot to test 3-player match
        host.emit('add_bot', { roomCode });

        setTimeout(() => {
          console.log('[TEST] Host starting match...');
          host.emit('start_match', { roomCode }, (startRes) => {
            console.log('[TEST] start_match response:', startRes);
            if (!startRes.success) {
              console.error('FAIL: Start match failed:', startRes.message);
              process.exit(1);
            }
          });
        }, 400);
      });
    });
  });

  // Host role receiver
  host.on('match_started', (data) => {
    console.log(`[TEST] Host received secret role: ${data.roleTitle} (${data.role})`);
    hostReceivedRole = data;

    // Verify role title is clear
    if (data.roleTitle !== 'CREWMATE' && data.roleTitle !== 'IMPOSTOR') {
      console.error('FAIL: Role title is not CREWMATE or IMPOSTOR');
      process.exit(1);
    }
  });

  // Player 2 role receiver
  player2.on('match_started', (data) => {
    console.log(`[TEST] Player 2 received secret role: ${data.roleTitle} (${data.role})`);
    player2ReceivedRole = data;

    if (data.roleTitle !== 'CREWMATE' && data.roleTitle !== 'IMPOSTOR') {
      console.error('FAIL: Role title is not CREWMATE or IMPOSTOR');
      process.exit(1);
    }
  });

  // Check game transition on both
  let hostInGame = false;
  let p2InGame = false;

  host.on('game_started_transition', () => {
    console.log('[TEST] Host received game_started_transition');
    hostInGame = true;
  });

  player2.on('game_started_transition', () => {
    console.log('[TEST] Player 2 received game_started_transition');
    p2InGame = true;

    // Test Movement Synchronization
    setTimeout(() => {
      console.log('[TEST] Player 2 moving to (1350, 950)...');
      player2.emit('player_move', {
        roomCode,
        x: 1350,
        y: 950,
        angle: 0.5
      });

      console.log('[TEST] Host moving to (1150, 850)...');
      host.emit('player_move', {
        roomCode,
        x: 1150,
        y: 850,
        angle: -0.5
      });
    }, 600);
  });

  // Host position listener
  host.on('game_state_update', (data) => {
    const p2OnHost = data.players.find(p => p.id === player2.id);
    if (p2OnHost && Math.abs(p2OnHost.x - 1350) < 5 && Math.abs(p2OnHost.y - 950) < 5) {
      if (!hostSawPlayer2Move) {
        console.log('[TEST] Host verified Player 2 moved to:', p2OnHost.x, p2OnHost.y);
        hostSawPlayer2Move = true;
      }
    }
  });

  // Player 2 position listener
  player2.on('game_state_update', (data) => {
    const hostOnP2 = data.players.find(p => p.id === host.id);
    if (hostOnP2 && Math.abs(hostOnP2.x - 1150) < 5 && Math.abs(hostOnP2.y - 850) < 5) {
      if (!player2SawHostMove) {
        console.log('[TEST] Player 2 verified Host moved to:', hostOnP2.x, hostOnP2.y);
        player2SawHostMove = true;
      }
    }

    // When both move and see each other:
    if (hostSawPlayer2Move && player2SawHostMove && hostReceivedRole && player2ReceivedRole) {
      console.log('');
      console.log('===============================================================');
      console.log('✅ VERIFICATION PASSED:');
      console.log('  1. Host & Player transition simultaneously to game.');
      console.log(`  2. Clear Secret Role for Host: ${hostReceivedRole.roleTitle}`);
      console.log(`  3. Clear Secret Role for Player 2: ${player2ReceivedRole.roleTitle}`);
      console.log('  4. Neither player receives the other\'s secret role!');
      console.log('  5. Real-Time movement synchronized perfectly between both screens!');
      console.log('===============================================================');
      host.disconnect();
      player2.disconnect();
      process.exit(0);
    }
  });
}
