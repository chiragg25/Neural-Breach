/**
 * NEURAL BREACH: SYNERGY 2026
 * Server Entry Point
 * Real-Time Multiplayer Networking Architecture
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const os = require('os');
const GameRoom = require('./lib/GameRoom');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

// Serve public static files with no-cache headers to prevent stale browser code
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// API endpoint for server info and network access
app.get('/api/info', (req, res) => {
  const networkInterfaces = os.networkInterfaces();
  const localIPs = [];

  for (const ifaceName in networkInterfaces) {
    for (const iface of networkInterfaces[ifaceName]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        localIPs.push(iface.address);
      }
    }
  }

  res.json({
    status: 'online',
    version: '1.0.0-SYNERGY2026',
    localIPs,
    port: PORT,
    activeRooms: rooms.size
  });
});

// Active game rooms map: roomCode -> GameRoom
const rooms = new Map();
// Socket ID to room code tracking
const socketToRoom = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

function getRoomForSocket(socket, roomCode) {
  const code = (roomCode || socketToRoom.get(socket.id) || '').toUpperCase().trim();
  return rooms.get(code);
}

io.on('connection', (socket) => {
  console.log(`[Socket Connected] ID: ${socket.id}`);

  // Create Room
  socket.on('create_room', ({ playerName, color, exhibitionMode }, callback) => {
    try {
      const code = generateRoomCode();
      const room = new GameRoom(code, io);
      rooms.set(code, room);

      if (exhibitionMode) {
        room.setExhibitionMode(true);
      }

      const res = room.addPlayer(socket, playerName, color);
      socketToRoom.set(socket.id, code);

      console.log(`[Room Created] Code: ${code} by ${playerName || socket.id}`);
      if (callback) callback({ success: true, roomCode: code, player: res.player });
    } catch (err) {
      console.error('Error creating room:', err);
      if (callback) callback({ success: false, message: 'Server error creating room' });
    }
  });

  // Join Room
  socket.on('join_room', ({ roomCode, playerName, color }, callback) => {
    try {
      const code = (roomCode || '').toUpperCase().trim();
      const room = rooms.get(code);

      if (!room) {
        if (callback) callback({ success: false, message: 'Room not found' });
        return;
      }

      // If room was pending cleanup due to temporary disconnect, cancel it
      if (room.cleanupTimer) {
        clearTimeout(room.cleanupTimer);
        room.cleanupTimer = null;
      }

      const res = room.addPlayer(socket, playerName, color);
      if (res.success) {
        socketToRoom.set(socket.id, code);
        console.log(`[Player Joined] ${res.player.name} joined room ${code}`);
        if (callback) callback({ success: true, roomCode: code, player: res.player });
      } else {
        if (callback) callback({ success: false, message: res.message });
      }
    } catch (err) {
      console.error('Error joining room:', err);
      if (callback) callback({ success: false, message: 'Server error joining room' });
    }
  });

  // Add AI Bot (for exhibition solo/duo demonstrations)
  socket.on('add_bot', ({ roomCode }) => {
    const room = getRoomForSocket(socket, roomCode);
    if (room && socket.id === room.hostId) {
      room.addBot();
    }
  });

  // Remove AI Bot
  socket.on('remove_bot', ({ roomCode, botId }) => {
    const room = getRoomForSocket(socket, roomCode);
    if (room && socket.id === room.hostId) {
      room.removeBot(botId);
    }
  });

  // Set Ready status (auto-toggles or sets explicitly)
  socket.on('set_ready', (data) => {
    const room = getRoomForSocket(socket, data ? data.roomCode : null);
    if (room) {
      const player = room.players.get(socket.id);
      if (player) {
        player.isReady = (data && data.isReady !== undefined) ? !!data.isReady : !player.isReady;
        room.broadcastLobbyUpdate();
      }
    }
  });

  // Update Player Color
  socket.on('update_color', ({ roomCode, color }) => {
    const room = getRoomForSocket(socket, roomCode);
    if (room) {
      room.updatePlayerColor(socket.id, color);
    }
  });

  // Toggle Exhibition Mode
  socket.on('toggle_exhibition', ({ roomCode, enabled }) => {
    const room = getRoomForSocket(socket, roomCode);
    if (room && socket.id === room.hostId) {
      room.setExhibitionMode(enabled);
    }
  });

  // Start Match
  socket.on('start_match', (data, callback) => {
    const room = getRoomForSocket(socket, data ? data.roomCode : null);
    if (!room) {
      if (callback) callback({ success: false, message: 'Room not found' });
      return;
    }
    const res = room.startGame(socket.id);
    if (callback) callback(res);
  });

  // Player Movement Synchronization
  socket.on('player_move', ({ roomCode, x, y, angle }) => {
    const room = getRoomForSocket(socket, roomCode);
    if (room) {
      room.updatePlayerPos(socket.id, x, y, angle);
    }
  });

  // Saboteur Neutralize / Eliminate Action
  socket.on('perform_kill', ({ roomCode, targetId }) => {
    const room = getRoomForSocket(socket, roomCode);
    if (room) {
      room.handleKill(socket.id, targetId);
    }
  });

  // Vent Conduit Actions
  socket.on('enter_vent', ({ roomCode, ventId }) => {
    const room = getRoomForSocket(socket, roomCode);
    if (room) {
      room.handleVentEnter(socket.id, ventId);
    }
  });

  socket.on('exit_vent', ({ roomCode, ventId, targetX, targetY }) => {
    const room = getRoomForSocket(socket, roomCode);
    if (room) {
      room.handleVentExit(socket.id, ventId, targetX, targetY);
    }
  });

  // Report Fallen Operative
  socket.on('report_body', ({ roomCode, bodyId }) => {
    const room = getRoomForSocket(socket, roomCode);
    if (room) {
      room.handleReport(socket.id, bodyId);
    }
  });

  // Emergency Tribunal Call
  socket.on('call_emergency', ({ roomCode }) => {
    const room = getRoomForSocket(socket, roomCode);
    if (room) {
      room.handleEmergencyMeeting(socket.id);
    }
  });

  // Cast Vote
  socket.on('cast_vote', ({ roomCode, targetId }) => {
    const room = getRoomForSocket(socket, roomCode);
    if (room) {
      room.handleVote(socket.id, targetId);
    }
  });

  // Trigger Sabotage
  socket.on('trigger_sabotage', ({ roomCode, sabotageType }) => {
    const room = getRoomForSocket(socket, roomCode);
    if (room) {
      room.handleSabotage(socket.id, sabotageType);
    }
  });

  // Resolve / Fix Sabotage
  socket.on('fix_sabotage', ({ roomCode, terminalType }) => {
    const room = getRoomForSocket(socket, roomCode);
    if (room) {
      room.handleSabotageFix(socket.id, terminalType);
    }
  });

  // Complete Assigned Task
  socket.on('complete_task', ({ roomCode, taskId }) => {
    const room = getRoomForSocket(socket, roomCode);
    if (room) {
      room.handleTaskComplete(socket.id, taskId);
    }
  });

  // Chat message in Meeting
  socket.on('send_chat', ({ roomCode, text, isGhost }) => {
    const room = getRoomForSocket(socket, roomCode);
    if (room) {
      const player = room.players.get(socket.id);
      if (player && text && text.trim().length > 0) {
        room.broadcastChat({
          senderId: socket.id,
          senderName: player.name,
          color: player.color,
          text: text.trim().substring(0, 100),
          isGhost: !player.isAlive || isGhost,
          isSystem: false
        });
      }
    }
  });

  // Return to Lobby after Match
  socket.on('return_to_lobby', ({ roomCode }) => {
    const room = getRoomForSocket(socket, roomCode);
    if (room && socket.id === room.hostId) {
      room.returnToLobby();
    }
  });

  // Disconnection handler
  socket.on('disconnect', () => {
    const roomCode = socketToRoom.get(socket.id);
    if (roomCode) {
      const room = rooms.get(roomCode);
      if (room) {
        room.removePlayer(socket.id);
        console.log(`[Player Disconnected] ${socket.id} from ${roomCode}`);
        
        // If room has no human players left, clean up after a 60-second grace period (supports page reloads & mobile screen lock)
        const remainingHumans = Array.from(room.players.values()).filter(p => !p.isBot);
        if (remainingHumans.length === 0) {
          if (room.cleanupTimer) clearTimeout(room.cleanupTimer);
          room.cleanupTimer = setTimeout(() => {
            const humansNow = Array.from(room.players.values()).filter(p => !p.isBot);
            if (humansNow.length === 0) {
              room.destroy();
              rooms.delete(roomCode);
              console.log(`[Room Destroyed] Cleaned up room ${roomCode} after grace period`);
            }
          }, 60000);
        }
      }
      socketToRoom.delete(socket.id);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`   NEURAL BREACH: SYNERGY 2026 - SERVER RUNNING     `);
  console.log(`   Local:   http://localhost:${PORT}                `);
  
  const networkInterfaces = os.networkInterfaces();
  for (const ifaceName in networkInterfaces) {
    for (const iface of networkInterfaces[ifaceName]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`   Network: http://${iface.address}:${PORT}         `);
      }
    }
  }
  console.log(`====================================================`);
});
