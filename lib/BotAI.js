/**
 * NEURAL BREACH: SYNERGY 2026
 * Autonomous Bot AI for Exhibition Demonstrations
 * Operatives simulate task completion & reporting.
 * Infiltrators simulate stalking, isolated eliminations & fake tasks.
 */

const { TERMINALS, ROOMS } = require('./MapData');

const BOT_NAMES = [
  'Atlas-9', 'Nova-Core', 'Vesper-3', 'Echo-Prime', 
  'Orion-7', 'Aegis-4', 'Helix-X', 'Zephyr-2', 'Cygnus-5'
];

const BOT_COLORS = [
  '#00ffcc', '#ff3366', '#ffaa00', '#3399ff', 
  '#cc33ff', '#00ff66', '#ffea00', '#ffffff'
];

class BotAI {
  constructor(room, botId, name, color) {
    this.room = room;
    this.id = botId;
    this.name = name;
    this.color = color;
    this.isBot = true;

    this.targetX = 1200;
    this.targetY = 900;
    this.speed = 175; // pixels/sec
    this.state = 'idle'; // 'idle', 'walking', 'tasking', 'stalking'
    this.taskTimer = 0;
    this.idleTimer = 0;
    this.currentTargetTerminal = null;
    this.assignedTasks = [];
    this.completedTasks = [];

    this.chatPresets = [
      "I was in Bio-Lab sorting samples.",
      "Just finished Circuit Matrix in Power.",
      "Didn't see anyone in Reactor.",
      "I was heading to Comms Array.",
      "Everything seemed quiet near Maintenance.",
      "Skip for now, not enough proof.",
      "I saw someone running near Central Nexus."
    ];
  }

  initTasks(allTasks) {
    // Pick 3-4 tasks for this bot
    const taskIds = allTasks.map(t => t.id);
    const shuffled = [...taskIds].sort(() => 0.5 - Math.random());
    this.assignedTasks = shuffled.slice(0, 4);
    this.completedTasks = [];
  }

  update(dt, playerObj) {
    if (this.room.gameState !== 'playing' || !playerObj.isAlive) return;

    // Check for nearby bodies if operative
    if (playerObj.role === 'operative') {
      for (const body of this.room.deadBodies) {
        const dx = body.x - playerObj.x;
        const dy = body.y - playerObj.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 120) {
          // Report body
          this.room.handleReport(this.id, body.id);
          return;
        }
      }
    }

    // Infiltrator logic: seek kill if isolated
    if (playerObj.role === 'infiltrator' && playerObj.killCooldown <= 0) {
      // Find closest living operative
      let closestTarget = null;
      let minDist = 9999;
      for (const [otherId, other] of this.room.players) {
        if (otherId === this.id || !other.isAlive || other.role === 'infiltrator') continue;
        const dist = Math.hypot(other.x - playerObj.x, other.y - playerObj.y);
        if (dist < minDist) {
          minDist = dist;
          closestTarget = other;
        }
      }

      if (closestTarget && minDist < 90) {
        // Perform kill
        this.room.handleKill(this.id, closestTarget.id);
        this.pickNewDestination();
        return;
      } else if (closestTarget && minDist < 250) {
        // Move towards target
        this.targetX = closestTarget.x;
        this.targetY = closestTarget.y;
        this.state = 'stalking';
      }
    }

    // Tasking / Wandering State Machine
    if (this.state === 'tasking') {
      this.taskTimer -= dt;
      if (this.taskTimer <= 0) {
        // Finish task
        if (this.currentTargetTerminal && playerObj.role === 'operative') {
          if (!this.completedTasks.includes(this.currentTargetTerminal.id)) {
            this.completedTasks.push(this.currentTargetTerminal.id);
            this.room.handleTaskComplete(this.id, this.currentTargetTerminal.id);
          }
        }
        this.currentTargetTerminal = null;
        this.pickNewDestination();
      }
      return;
    }

    if (this.state === 'idle') {
      this.idleTimer -= dt;
      if (this.idleTimer <= 0) {
        this.pickNewDestination();
      }
      return;
    }

    // Move towards targetX, targetY
    const dx = this.targetX - playerObj.x;
    const dy = this.targetY - playerObj.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 15) {
      // Reached destination
      if (this.currentTargetTerminal) {
        this.state = 'tasking';
        this.taskTimer = 2.5 + Math.random() * 2.0; // 2.5 - 4.5 seconds
      } else {
        this.state = 'idle';
        this.idleTimer = 1.0 + Math.random() * 2.0;
      }
    } else {
      const step = Math.min(dist, this.speed * dt);
      const nx = playerObj.x + (dx / dist) * step;
      const ny = playerObj.y + (dy / dist) * step;

      // Update position
      this.room.updatePlayerPos(this.id, nx, ny, Math.atan2(dy, dx));
    }
  }

  pickNewDestination() {
    // If has uncompleted tasks, head to one
    const uncompleted = this.assignedTasks.filter(id => !this.completedTasks.includes(id));
    if (uncompleted.length > 0 && Math.random() < 0.75) {
      const targetId = uncompleted[Math.floor(Math.random() * uncompleted.length)];
      const term = TERMINALS.find(t => t.id === targetId);
      if (term) {
        this.currentTargetTerminal = term;
        this.targetX = term.x + (Math.random() * 40 - 20);
        this.targetY = term.y + (Math.random() * 40 - 20);
        this.state = 'walking';
        return;
      }
    }

    // Otherwise wander to a random room
    const randomRoom = ROOMS[Math.floor(Math.random() * ROOMS.length)];
    this.currentTargetTerminal = null;
    this.targetX = randomRoom.x + Math.random() * (randomRoom.w - 80) + 40;
    this.targetY = randomRoom.y + Math.random() * (randomRoom.h - 80) + 40;
    this.state = 'walking';
  }

  handleMeetingDiscussion() {
    // Send 1 or 2 bot messages during discussion
    setTimeout(() => {
      if (this.room.gameState === 'meeting' || this.room.gameState === 'voting') {
        const msg = this.chatPresets[Math.floor(Math.random() * this.chatPresets.length)];
        this.room.broadcastChat({
          senderId: this.id,
          senderName: this.name,
          color: this.color,
          text: msg,
          isSystem: false,
          isGhost: false
        });
      }
    }, 2000 + Math.random() * 5000);
  }

  handleMeetingVote() {
    // Cast a vote after 4 to 12 seconds
    const delay = 4000 + Math.random() * 8000;
    setTimeout(() => {
      if (this.room.gameState === 'voting') {
        // Pick living player or skip
        const livingPlayers = Array.from(this.room.players.values()).filter(p => p.isAlive);
        if (Math.random() < 0.4 || livingPlayers.length <= 2) {
          this.room.handleVote(this.id, 'skip');
        } else {
          // Vote for someone other than self
          const others = livingPlayers.filter(p => p.id !== this.id);
          if (others.length > 0) {
            const target = others[Math.floor(Math.random() * others.length)];
            this.room.handleVote(this.id, target.id);
          } else {
            this.room.handleVote(this.id, 'skip');
          }
        }
      }
    }, delay);
  }
}

module.exports = { BotAI, BOT_NAMES, BOT_COLORS };
