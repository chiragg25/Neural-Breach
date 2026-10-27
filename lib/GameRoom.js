/**
 * NEURAL BREACH: SYNERGY 2026
 * Authoritative Server Game Room State Machine
 */

const { TERMINALS, ROOMS, WALLS, DOORS } = require('./MapData');
const { BotAI, BOT_NAMES, BOT_COLORS } = require('./BotAI');

const SPAWN_POINTS = [
  { x: 1100, y: 800 }, { x: 1200, y: 770 }, { x: 1300, y: 800 },
  { x: 1350, y: 900 }, { x: 1300, y: 1000 }, { x: 1200, y: 1030 },
  { x: 1100, y: 1000 }, { x: 1050, y: 900 }, { x: 1150, y: 900 }, { x: 1250, y: 900 }
];

const AVAILABLE_COLORS = [
  '#00ffcc', // Cyan
  '#ff3366', // Crimson
  '#ffaa00', // Amber
  '#3399ff', // Cobalt
  '#cc33ff', // Violet
  '#00ff66', // Emerald
  '#ffea00', // Solar
  '#ff66cc', // Rose
  '#a0aab8', // Platinum
  '#ff4400'  // Magma
];

class GameRoom {
  constructor(code, io) {
    this.code = code;
    this.io = io;
    this.hostId = null;
    this.gameState = 'lobby'; // 'lobby', 'countdown', 'playing', 'meeting', 'voting', 'ejection', 'gameover'
    
    this.settings = {
      maxPlayers: 10,
      minPlayers: 2, // Low for testing & exhibition fast starts
      infiltratorCount: 1, // 1 for <=6 players, 2 for >=7 players
      exhibitionMode: false,
      killCooldown: 20, // seconds
      discussionTime: 15,
      votingTime: 20,
      emergencyMeetingsPerPlayer: 1
    };

    this.players = new Map(); // socketId -> Player
    this.bots = new Map();    // botId -> BotAI
    this.deadBodies = [];     // Array of dead operative markers
    this.activeSabotage = null; // { type, timer, maxTimer, resolvedA, resolvedB }
    this.sabotageCooldown = 15;
    this.doorsLocked = false;
    this.doorTimer = 0;

    // Meeting state
    this.meeting = {
      trigger: null, // 'report' | 'emergency'
      callerName: null,
      targetName: null,
      timer: 0,
      phase: null, // 'discussion' | 'voting'
      votes: new Map(), // voterId -> targetId | 'skip'
      ejectedPlayer: null,
      wasInfiltrator: false,
      tie: false
    };

    // Tasks tracking
    this.totalAssignedTasks = 0;
    this.totalCompletedTasks = 0;

    // Game loop timer
    this.lastTick = Date.now();
    this.intervalId = setInterval(() => this.tick(), 50); // 20 Hz server tick
  }

  setExhibitionMode(enabled) {
    this.settings.exhibitionMode = enabled;
    if (enabled) {
      this.settings.killCooldown = 12;
      this.settings.discussionTime = 10;
      this.settings.votingTime = 15;
    } else {
      this.settings.killCooldown = 20;
      this.settings.discussionTime = 15;
      this.settings.votingTime = 20;
    }
    this.broadcastLobbyUpdate();
  }

  addPlayer(socket, name, requestedColor) {
    if (this.players.size >= this.settings.maxPlayers) {
      return { success: false, message: 'Room is full' };
    }
    if (this.gameState !== 'lobby') {
      return { success: false, message: 'Match already in progress' };
    }

    if (!this.hostId) {
      this.hostId = socket.id;
    }

    // Assign color
    const takenColors = Array.from(this.players.values()).map(p => p.color);
    let color = requestedColor;
    if (!color || takenColors.includes(color)) {
      color = AVAILABLE_COLORS.find(c => !takenColors.includes(c)) || AVAILABLE_COLORS[0];
    }

    const player = {
      id: socket.id,
      name: (name || `Operative-${this.players.size + 1}`).substring(0, 14),
      color: color,
      isHost: socket.id === this.hostId,
      isReady: socket.id === this.hostId, // Host auto-ready
      isAlive: true,
      role: 'operative', // Assigned on game start
      x: 1200,
      y: 900,
      angle: 0,
      vx: 0,
      vy: 0,
      killCooldown: 0,
      assignedTasks: [],
      completedTasks: [],
      emergenciesRemaining: this.settings.emergencyMeetingsPerPlayer,
      inVent: false,
      currentVentId: null,
      isBot: false
    };

    this.players.set(socket.id, player);
    socket.join(this.code);

    this.broadcastLobbyUpdate();
    return { success: true, player };
  }

  addBot() {
    if (this.players.size >= this.settings.maxPlayers || this.gameState !== 'lobby') return;

    const botId = `bot_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const takenColors = Array.from(this.players.values()).map(p => p.color);
    const color = AVAILABLE_COLORS.find(c => !takenColors.includes(c)) || BOT_COLORS[0];
    const takenNames = Array.from(this.players.values()).map(p => p.name);
    const availableName = BOT_NAMES.find(n => !takenNames.includes(n)) || `Unit-${Math.floor(Math.random()*900)+100}`;

    const bot = new BotAI(this, botId, availableName, color);
    this.bots.set(botId, bot);

    const playerObj = {
      id: botId,
      name: availableName,
      color: color,
      isHost: false,
      isReady: true,
      isAlive: true,
      role: 'operative',
      x: 1200,
      y: 900,
      angle: 0,
      vx: 0,
      vy: 0,
      killCooldown: 0,
      assignedTasks: [],
      completedTasks: [],
      emergenciesRemaining: 1,
      inVent: false,
      currentVentId: null,
      isBot: true
    };

    this.players.set(botId, playerObj);
    this.broadcastLobbyUpdate();
  }

  removeBot(botId) {
    if (this.bots.has(botId)) {
      this.bots.delete(botId);
      this.players.delete(botId);
      this.broadcastLobbyUpdate();
    }
  }

  removePlayer(socketId) {
    const wasHost = socketId === this.hostId;
    this.players.delete(socketId);
    this.bots.delete(socketId);

    // If host left, elect new host
    if (wasHost && this.players.size > 0) {
      // Find first non-bot player
      const nextHuman = Array.from(this.players.values()).find(p => !p.isBot);
      if (nextHuman) {
        this.hostId = nextHuman.id;
        nextHuman.isHost = true;
      } else {
        const first = Array.from(this.players.values())[0];
        this.hostId = first.id;
        first.isHost = true;
      }
    }

    if (this.gameState === 'lobby') {
      this.broadcastLobbyUpdate();
    } else if (this.gameState === 'playing' || this.gameState === 'meeting' || this.gameState === 'voting') {
      // Check if win condition triggered by disconnect
      this.checkWinConditions();
      this.broadcastGameState();
    }
  }

  setPlayerReady(socketId, isReady) {
    const player = this.players.get(socketId);
    if (player && this.gameState === 'lobby') {
      player.isReady = isReady;
      this.broadcastLobbyUpdate();
    }
  }

  updatePlayerColor(socketId, color) {
    const player = this.players.get(socketId);
    if (!player || this.gameState !== 'lobby') return;
    const taken = Array.from(this.players.values()).some(p => p.id !== socketId && p.color === color);
    if (!taken) {
      player.color = color;
      this.broadcastLobbyUpdate();
    }
  }

  broadcastLobbyUpdate() {
    const playerList = Array.from(this.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      color: p.color,
      isHost: p.isHost,
      isReady: p.isReady,
      isBot: p.isBot
    }));

    this.io.to(this.code).emit('lobby_update', {
      code: this.code,
      hostId: this.hostId,
      players: playerList,
      settings: this.settings,
      canStart: this.canStartMatch()
    });
  }

  canStartMatch() {
    return this.players.size >= this.settings.minPlayers;
  }

  startGame(requestingSocketId) {
    if (requestingSocketId !== this.hostId) return { success: false, message: 'Only host can start' };
    if (!this.canStartMatch()) return { success: false, message: `Requires at least ${this.settings.minPlayers} players to begin` };

    // Auto-ready all players on launch
    for (const p of this.players.values()) {
      p.isReady = true;
    }

    this.gameState = 'playing';
    this.deadBodies = [];
    this.activeSabotage = null;
    this.sabotageCooldown = 15;
    this.doorsLocked = false;
    this.totalAssignedTasks = 0;
    this.totalCompletedTasks = 0;

    // Assign roles randomly
    const playerArray = Array.from(this.players.values());
    const count = playerArray.length;
    let infiltratorCount = this.settings.infiltratorCount;
    if (count >= 7) infiltratorCount = 2;
    if (count < 3) infiltratorCount = 1; // 1 saboteur minimum

    // Shuffle
    const shuffled = [...playerArray].sort(() => 0.5 - Math.random());
    const infiltrators = shuffled.slice(0, infiltratorCount);

    // Get all available task definitions
    const taskTerminals = TERMINALS.filter(t => t.type === 'task');

    playerArray.forEach((p, idx) => {
      const isInfiltrator = infiltrators.some(inf => inf.id === p.id);
      p.role = isInfiltrator ? 'infiltrator' : 'operative';
      p.isAlive = true;
      p.inVent = false;
      p.currentVentId = null;
      p.killCooldown = this.settings.killCooldown;
      p.emergenciesRemaining = this.settings.emergencyMeetingsPerPlayer;

      // Assign position in spawn circle in Central Nexus
      const spawn = SPAWN_POINTS[idx % SPAWN_POINTS.length];
      p.x = spawn.x;
      p.y = spawn.y;
      p.angle = 0;

      // Assign 4 distinct tasks to each player
      const shuffledTasks = [...taskTerminals].sort(() => 0.5 - Math.random());
      p.assignedTasks = shuffledTasks.slice(0, 4).map(t => ({
        id: t.id,
        name: t.name,
        taskType: t.taskType,
        roomId: t.roomId,
        x: t.x,
        y: t.y,
        completed: false
      }));
      p.completedTasks = [];

      // Only count operative tasks toward global task completion
      if (p.role === 'operative') {
        this.totalAssignedTasks += p.assignedTasks.length;
      }

      // Initialize bot tasks if bot
      if (p.isBot && this.bots.has(p.id)) {
        this.bots.get(p.id).initTasks(taskTerminals);
      }
    });

    // 1. First broadcast game transition to all clients in the room
    this.io.to(this.code).emit('game_started_transition', {
      totalAssignedTasks: this.totalAssignedTasks,
      impostorCount: infiltrators.length
    });

    // 2. Secretly notify each individual player of their own role (ONLY that player receives it!)
    for (const p of this.players.values()) {
      if (!p.isBot) {
        this.io.to(p.id).emit('match_started', {
          role: p.role,
          roleTitle: p.role === 'infiltrator' ? 'IMPOSTOR' : 'CREWMATE',
          spawnX: p.x,
          spawnY: p.y,
          assignedTasks: p.assignedTasks,
          infiltratorTeammates: p.role === 'infiltrator' 
            ? infiltrators.filter(inf => inf.id !== p.id).map(inf => ({ id: inf.id, name: inf.name, color: inf.color }))
            : [],
          totalAssignedTasks: this.totalAssignedTasks,
          impostorCount: infiltrators.length
        });
      }
    }

    this.broadcastChat({
      senderId: 'system',
      senderName: 'SYSTEM PROTOCOL',
      color: '#00ffcc',
      text: 'Match initiated. All operatives report to designated research terminals.',
      isSystem: true
    });

    this.broadcastGameState();
    return { success: true };
  }

  updatePlayerPos(socketId, x, y, angle) {
    const player = this.players.get(socketId);
    if (!player || this.gameState !== 'playing' || !player.isAlive) return;

    // Gentle boundary clamping within map
    player.x = Math.max(160, Math.min(2260, x));
    player.y = Math.max(120, Math.min(1680, y));
    player.angle = angle;
  }

  handleKill(infiltratorId, targetId) {
    if (this.gameState !== 'playing') return;
    const killer = this.players.get(infiltratorId);
    const target = this.players.get(targetId);

    if (!killer || killer.role !== 'infiltrator' || !killer.isAlive) return;
    if (!target || !target.isAlive || target.role === 'infiltrator') return;
    if (killer.killCooldown > 0) return;

    // Check distance (max 100 px)
    const dist = Math.hypot(killer.x - target.x, killer.y - target.y);
    if (dist > 110) return;

    // Execute kill
    target.isAlive = false;
    killer.killCooldown = this.settings.killCooldown;

    // Spawn dead body marker
    const body = {
      id: `body_${Date.now()}_${target.id}`,
      operativeId: target.id,
      operativeName: target.name,
      color: target.color,
      x: target.x,
      y: target.y,
      timestamp: Date.now()
    };
    this.deadBodies.push(body);

    // Notify killer and target
    const targetSocket = this.io.sockets.sockets.get(target.id);
    if (targetSocket) {
      targetSocket.emit('eliminated', { killerName: killer.name });
    }

    // Play kill audio trigger for nearby players or dead player
    this.io.to(this.code).emit('player_eliminated_fx', { x: target.x, y: target.y });

    // Check win conditions
    if (!this.checkWinConditions()) {
      this.broadcastGameState();
    }
  }

  handleVentEnter(infiltratorId, ventId) {
    const player = this.players.get(infiltratorId);
    if (!player || player.role !== 'infiltrator' || !player.isAlive || this.gameState !== 'playing') return;
    player.inVent = true;
    player.currentVentId = ventId;
  }

  handleVentExit(infiltratorId, ventId, targetX, targetY) {
    const player = this.players.get(infiltratorId);
    if (!player || player.role !== 'infiltrator' || !player.isAlive || this.gameState !== 'playing') return;
    player.inVent = false;
    player.currentVentId = null;
    player.x = targetX;
    player.y = targetY;
  }

  handleReport(reporterId, bodyId) {
    if (this.gameState !== 'playing') return;
    const reporter = this.players.get(reporterId);
    if (!reporter || !reporter.isAlive) return;

    const bodyIndex = this.deadBodies.findIndex(b => b.id === bodyId);
    if (bodyIndex === -1) return;

    const body = this.deadBodies[bodyIndex];
    this.deadBodies = []; // Clear bodies for meeting

    this.startMeeting('report', reporter.name, body.operativeName);
  }

  handleEmergencyMeeting(callerId) {
    if (this.gameState !== 'playing') return;
    const caller = this.players.get(callerId);
    if (!caller || !caller.isAlive || caller.emergenciesRemaining <= 0) return;
    if (this.activeSabotage) return; // Cannot call emergency during critical sabotage

    caller.emergenciesRemaining--;
    this.deadBodies = []; // Clear bodies
    this.startMeeting('emergency', caller.name, null);
  }

  startMeeting(trigger, callerName, targetName) {
    this.gameState = 'meeting';
    this.activeSabotage = null; // Clear sabotage during meeting
    this.doorsLocked = false;

    this.meeting = {
      trigger,
      callerName,
      targetName,
      timer: this.settings.discussionTime,
      phase: 'discussion',
      votes: new Map(),
      ejectedPlayer: null,
      wasInfiltrator: false,
      tie: false
    };

    // Teleport living players to Central Nexus
    let idx = 0;
    for (const p of this.players.values()) {
      p.inVent = false;
      p.currentVentId = null;
      if (p.isAlive) {
        const spawn = SPAWN_POINTS[idx % SPAWN_POINTS.length];
        p.x = spawn.x;
        p.y = spawn.y;
        idx++;
      }
    }

    // Trigger AI bots to participate in chat
    for (const bot of this.bots.values()) {
      bot.handleMeetingDiscussion();
    }

    this.io.to(this.code).emit('meeting_started', {
      trigger,
      callerName,
      targetName,
      discussionTime: this.settings.discussionTime,
      votingTime: this.settings.votingTime,
      players: Array.from(this.players.values()).map(p => ({
        id: p.id,
        name: p.name,
        color: p.color,
        isAlive: p.isAlive,
        isBot: p.isBot
      }))
    });
  }

  transitionToVoting() {
    this.meeting.phase = 'voting';
    this.meeting.timer = this.settings.votingTime;

    // Trigger bots to vote
    for (const bot of this.bots.values()) {
      bot.handleMeetingVote();
    }

    this.io.to(this.code).emit('voting_phase_started', {
      timer: this.settings.votingTime
    });
  }

  handleVote(voterId, targetId) {
    if (this.gameState !== 'meeting' || this.meeting.phase !== 'voting') return;
    const voter = this.players.get(voterId);
    if (!voter || !voter.isAlive) return;

    this.meeting.votes.set(voterId, targetId);

    // Broadcast that this player has voted (without revealing choice yet)
    this.io.to(this.code).emit('vote_cast', {
      voterId: voterId
    });

    // Check if all living players have voted
    const livingCount = Array.from(this.players.values()).filter(p => p.isAlive).length;
    if (this.meeting.votes.size >= livingCount) {
      this.concludeVoting();
    }
  }

  concludeVoting() {
    this.gameState = 'ejection';
    const voteCounts = {};
    let skipCount = 0;

    for (const [voterId, targetId] of this.meeting.votes.entries()) {
      if (targetId === 'skip') {
        skipCount++;
      } else {
        voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
      }
    }

    // Find highest
    let maxVotes = 0;
    let candidate = null;
    let isTie = false;

    for (const [targetId, count] of Object.entries(voteCounts)) {
      if (count > maxVotes) {
        maxVotes = count;
        candidate = targetId;
        isTie = false;
      } else if (count === maxVotes) {
        isTie = true;
      }
    }

    let ejected = null;
    let wasInfiltrator = false;

    if (skipCount >= maxVotes || isTie || !candidate) {
      this.meeting.tie = true;
      this.meeting.ejectedPlayer = null;
    } else {
      ejected = this.players.get(candidate);
      if (ejected) {
        ejected.isAlive = false;
        wasInfiltrator = ejected.role === 'infiltrator';
        this.meeting.ejectedPlayer = {
          id: ejected.id,
          name: ejected.name,
          color: ejected.color,
          role: ejected.role
        };
        this.meeting.wasInfiltrator = wasInfiltrator;
      }
    }

    // Detailed vote map for results reveal
    const voteDetails = [];
    for (const [voterId, targetId] of this.meeting.votes.entries()) {
      const voter = this.players.get(voterId);
      const target = targetId === 'skip' ? { name: 'Skip Vote' } : this.players.get(targetId);
      if (voter) {
        voteDetails.push({
          voterId,
          voterName: voter.name,
          voterColor: voter.color,
          targetId,
          targetName: target ? target.name : 'Unknown'
        });
      }
    }

    this.io.to(this.code).emit('voting_results', {
      ejected: this.meeting.ejectedPlayer,
      wasInfiltrator,
      tie: this.meeting.tie,
      voteDetails,
      skipCount
    });

    // After 6 seconds of ejection cinematic, return to game or finish
    setTimeout(() => {
      if (!this.checkWinConditions()) {
        this.gameState = 'playing';
        this.io.to(this.code).emit('return_to_game');
        this.broadcastGameState();
      }
    }, 6000);
  }

  handleSabotage(infiltratorId, sabotageType) {
    if (this.gameState !== 'playing') return;
    const player = this.players.get(infiltratorId);
    if (!player || player.role !== 'infiltrator' || !player.isAlive) return;
    if (this.sabotageCooldown > 0 || this.activeSabotage) return;

    if (sabotageType === 'meltdown') {
      this.activeSabotage = {
        type: 'meltdown',
        timer: 35, // 35 seconds to avert explosion
        maxTimer: 35,
        resolvedA: false,
        resolvedB: false
      };
      this.sabotageCooldown = 30;
      this.io.to(this.code).emit('sabotage_triggered', {
        type: 'meltdown',
        timer: 35
      });
    } else if (sabotageType === 'blackout') {
      this.activeSabotage = {
        type: 'blackout',
        timer: 45,
        maxTimer: 45
      };
      this.sabotageCooldown = 25;
      this.io.to(this.code).emit('sabotage_triggered', {
        type: 'blackout'
      });
    } else if (sabotageType === 'comms') {
      this.activeSabotage = {
        type: 'comms',
        timer: 40,
        maxTimer: 40
      };
      this.sabotageCooldown = 25;
      this.io.to(this.code).emit('sabotage_triggered', {
        type: 'comms'
      });
    } else if (sabotageType === 'doors') {
      this.doorsLocked = true;
      this.doorTimer = 12; // 12 seconds lockdown
      this.sabotageCooldown = 20;
      this.io.to(this.code).emit('sabotage_triggered', {
        type: 'doors',
        duration: 12
      });
    }
  }

  handleSabotageFix(playerId, terminalType) {
    if (!this.activeSabotage) return;

    if (this.activeSabotage.type === 'blackout' && terminalType === 'blackout_fix') {
      this.activeSabotage = null;
      this.io.to(this.code).emit('sabotage_resolved', { type: 'blackout' });
    } else if (this.activeSabotage.type === 'comms' && terminalType === 'comms_fix') {
      this.activeSabotage = null;
      this.io.to(this.code).emit('sabotage_resolved', { type: 'comms' });
    } else if (this.activeSabotage.type === 'meltdown') {
      if (terminalType === 'meltdown_a') this.activeSabotage.resolvedA = true;
      if (terminalType === 'meltdown_b') this.activeSabotage.resolvedB = true;

      if (this.activeSabotage.resolvedA && this.activeSabotage.resolvedB) {
        this.activeSabotage = null;
        this.io.to(this.code).emit('sabotage_resolved', { type: 'meltdown' });
      } else {
        this.io.to(this.code).emit('meltdown_terminal_state', {
          resolvedA: this.activeSabotage.resolvedA,
          resolvedB: this.activeSabotage.resolvedB
        });
      }
    }
  }

  handleTaskComplete(playerId, taskId) {
    const player = this.players.get(playerId);
    if (!player || !player.isAlive) return;

    const task = player.assignedTasks.find(t => t.id === taskId);
    if (task && !task.completed) {
      task.completed = true;
      player.completedTasks.push(taskId);

      if (player.role === 'operative') {
        this.totalCompletedTasks++;
      }

      const socket = this.io.sockets.sockets.get(playerId);
      if (socket) {
        socket.emit('task_completed_ack', { taskId });
      }

      this.io.to(this.code).emit('task_progress_update', {
        completed: this.totalCompletedTasks,
        total: this.totalAssignedTasks,
        percent: this.totalAssignedTasks > 0 ? Math.round((this.totalCompletedTasks / this.totalAssignedTasks) * 100) : 0
      });

      this.checkWinConditions();
    }
  }

  broadcastChat(msgObj) {
    this.io.to(this.code).emit('chat_message', msgObj);
  }

  checkWinConditions() {
    if (this.gameState === 'lobby' || this.gameState === 'gameover') return false;

    const livingPlayers = Array.from(this.players.values()).filter(p => p.isAlive);
    const livingInfiltrators = livingPlayers.filter(p => p.role === 'infiltrator').length;
    const livingOperatives = livingPlayers.filter(p => p.role === 'operative').length;

    // 1. All Infiltrators eliminated
    if (livingInfiltrators === 0) {
      this.triggerGameOver('operatives', 'All Infiltrators have been identified and neutralized!');
      return true;
    }

    // 2. Task Protocol 100% Completed
    if (this.totalAssignedTasks > 0 && this.totalCompletedTasks >= this.totalAssignedTasks) {
      this.triggerGameOver('operatives', 'All Station Calibration Protocols completed! Station secured.');
      return true;
    }

    // 3. Infiltrators equal or outnumber living Operatives
    if (livingInfiltrators >= livingOperatives) {
      this.triggerGameOver('infiltrators', 'Infiltrators have compromised station security.');
      return true;
    }

    return false;
  }

  triggerGameOver(winner, reason) {
    this.gameState = 'gameover';
    this.activeSabotage = null;

    const playersSummary = Array.from(this.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      color: p.color,
      role: p.role,
      isAlive: p.isAlive
    }));

    this.io.to(this.code).emit('game_over', {
      winner,
      reason,
      players: playersSummary
    });

    // Auto-return to lobby after 10 seconds (exhibition friendly)
    setTimeout(() => {
      this.returnToLobby();
    }, 10000);
  }

  returnToLobby() {
    this.gameState = 'lobby';
    this.deadBodies = [];
    this.activeSabotage = null;
    this.doorsLocked = false;

    for (const p of this.players.values()) {
      p.isAlive = true;
      p.role = 'operative';
      p.isReady = p.isHost || p.isBot;
      p.assignedTasks = [];
      p.completedTasks = [];
    }

    this.broadcastLobbyUpdate();
    this.io.to(this.code).emit('returned_to_lobby');
  }

  tick() {
    const now = Date.now();
    const dt = (now - this.lastTick) / 1000;
    this.lastTick = now;

    // Update Bot AI
    for (const [botId, bot] of this.bots.entries()) {
      const p = this.players.get(botId);
      if (p) {
        bot.update(dt, p);
      }
    }

    if (this.gameState === 'playing') {
      // Decrease kill cooldowns
      for (const p of this.players.values()) {
        if (p.role === 'infiltrator' && p.killCooldown > 0) {
          p.killCooldown = Math.max(0, p.killCooldown - dt);
        }
      }

      // Sabotage cooldown
      if (this.sabotageCooldown > 0) {
        this.sabotageCooldown = Math.max(0, this.sabotageCooldown - dt);
      }

      // Door lockdown timer
      if (this.doorsLocked) {
        this.doorTimer -= dt;
        if (this.doorTimer <= 0) {
          this.doorsLocked = false;
          this.io.to(this.code).emit('doors_unlocked');
        }
      }

      // Active sabotage timer
      if (this.activeSabotage && this.activeSabotage.type === 'meltdown') {
        this.activeSabotage.timer -= dt;
        if (this.activeSabotage.timer <= 0) {
          // Meltdown explodes! Infiltrator victory!
          this.triggerGameOver('infiltrators', 'Critical Meltdown: Quantum Core exploded!');
          return;
        }
      }

      this.broadcastGameState();
    } else if (this.gameState === 'meeting') {
      this.meeting.timer -= dt;
      if (this.meeting.timer <= 0) {
        if (this.meeting.phase === 'discussion') {
          this.transitionToVoting();
        } else if (this.meeting.phase === 'voting') {
          this.concludeVoting();
        }
      }
    }
  }

  broadcastGameState() {
    const playersData = Array.from(this.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      color: p.color,
      x: p.x,
      y: p.y,
      angle: p.angle,
      isAlive: p.isAlive,
      inVent: p.inVent,
      killCooldown: p.killCooldown
    }));

    this.io.to(this.code).emit('game_state_update', {
      players: playersData,
      deadBodies: this.deadBodies,
      activeSabotage: this.activeSabotage ? {
        type: this.activeSabotage.type,
        timer: Math.ceil(this.activeSabotage.timer),
        resolvedA: this.activeSabotage.resolvedA,
        resolvedB: this.activeSabotage.resolvedB
      } : null,
      doorsLocked: this.doorsLocked
    });
  }

  destroy() {
    clearInterval(this.intervalId);
  }
}

module.exports = GameRoom;
