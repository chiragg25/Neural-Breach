/**
 * NEURAL BREACH: SYNERGY 2026
 * Core Client Engine & Game Loop
 */

class GameEngine {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.socket = io();
    this.localPlayerId = this.socket.id || null;

    this.roomCode = null;
    this.localPlayerRole = 'operative';
    this.teammates = [];
    this.assignedTasks = [];
    this.taskProgress = { completed: 0, total: 0, percent: 0 };

    this.players = [];
    this.deadBodies = [];
    this.activeSabotage = null;
    this.doorsLocked = false;
    this.killCooldown = 0;

    // Camera
    this.camera = {
      x: 1200,
      y: 900,
      targetX: 1200,
      targetY: 900,
      viewWidth: window.innerWidth,
      viewHeight: window.innerHeight
    };

    // Subsystems
    this.mapRenderer = new window.MapRenderer();
    this.playerRenderer = new window.PlayerRenderer();
    this.ui = new window.UIManager(this);
    this.tasks = new window.TaskManager(this);

    // Controls state
    this.keys = {};
    this.joystick = { active: false, dx: 0, dy: 0, startX: 0, startY: 0 };
    this.moveSpeed = 220; // pixels per second
    this.lastMoveSend = 0;
    this.lastFrame = performance.now();

    // Resize handling
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.bindInputs();
    this.bindSocketEvents();

    // Start loop
    requestAnimationFrame((t) => this.loop(t));
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.camera.viewWidth = window.innerWidth;
    this.camera.viewHeight = window.innerHeight;
  }

  bindInputs() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;

      if (e.key.toLowerCase() === 'e') this.handleActionUse();
      if (e.key.toLowerCase() === 'r') this.handleActionReport();
      if (e.key.toLowerCase() === 'q') this.handleActionKill();
      if (e.code === 'Space') this.handleActionVent();
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    // Mobile Virtual Joystick
    const joyZone = document.getElementById('virtual-joystick-zone');
    const joyKnob = document.getElementById('joystick-knob');
    if (joyZone && joyKnob) {
      const handleTouchStart = (e) => {
        const touch = e.touches[0];
        const rect = joyZone.getBoundingClientRect();
        this.joystick.active = true;
        this.joystick.startX = touch.clientX;
        this.joystick.startY = touch.clientY;
      };

      const handleTouchMove = (e) => {
        if (!this.joystick.active) return;
        const touch = e.touches[0];
        let dx = touch.clientX - this.joystick.startX;
        let dy = touch.clientY - this.joystick.startY;
        const dist = Math.hypot(dx, dy);
        const maxDist = 45;

        if (dist > maxDist) {
          dx = (dx / dist) * maxDist;
          dy = (dy / dist) * maxDist;
        }

        joyKnob.style.transform = `translate(${dx}px, ${dy}px)`;
        this.joystick.dx = dx / maxDist;
        this.joystick.dy = dy / maxDist;
      };

      const handleTouchEnd = () => {
        this.joystick.active = false;
        this.joystick.dx = 0;
        this.joystick.dy = 0;
        joyKnob.style.transform = `translate(0px, 0px)`;
      };

      joyZone.addEventListener('touchstart', handleTouchStart);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }
  }

  bindSocketEvents() {
    this.socket.on('connect', () => {
      this.localPlayerId = this.socket.id;
    });

    this.socket.on('lobby_update', (data) => {
      this.ui.updateLobby(data, this.localPlayerId);
    });

    // Room-wide match transition: forces both host and player to transition simultaneously
    this.socket.on('game_started_transition', (data) => {
      this.ui.showScreen('game');
      if (data && data.totalAssignedTasks) {
        this.taskProgress = { completed: 0, total: data.totalAssignedTasks, percent: 0 };
      }
    });

    // Secret role assignment (only the local player receives this event)
    this.socket.on('match_started', (data) => {
      this.localPlayerRole = data.role;
      this.assignedTasks = data.assignedTasks || [];
      this.teammates = data.infiltratorTeammates || [];
      this.taskProgress = { completed: 0, total: data.totalAssignedTasks, percent: 0 };

      // Initialize local player position to assigned spawn point
      if (data.spawnX !== undefined && data.spawnY !== undefined) {
        let local = this.getLocalPlayer();
        if (local) {
          local.x = data.spawnX;
          local.y = data.spawnY;
        }
        this.camera.x = data.spawnX - this.camera.viewWidth / 2;
        this.camera.y = data.spawnY - this.camera.viewHeight / 2;
      }

      this.ui.showScreen('game');
      this.ui.showRoleReveal(this.localPlayerRole, this.teammates, data.impostorCount || 1);
    });

    // Authoritative synchronized game state
    this.socket.on('game_state_update', (data) => {
      this.deadBodies = data.deadBodies || [];
      this.activeSabotage = data.activeSabotage || null;
      this.doorsLocked = !!data.doorsLocked;

      if (!data.players) return;

      const receivedIds = new Set();
      for (const sp of data.players) {
        receivedIds.add(sp.id);
        let p = this.players.find(item => item.id === sp.id);

        if (!p) {
          // New player entity
          p = {
            id: sp.id,
            name: sp.name,
            color: sp.color,
            x: sp.x,
            y: sp.y,
            angle: sp.angle,
            isAlive: sp.isAlive,
            inVent: sp.inVent,
            killCooldown: sp.killCooldown,
            targetX: sp.x,
            targetY: sp.y,
            targetAngle: sp.angle
          };
          this.players.push(p);
        } else {
          // Update properties
          p.name = sp.name;
          p.color = sp.color;
          p.isAlive = sp.isAlive;
          p.inVent = sp.inVent;

          if (sp.id === this.localPlayerId) {
            // Local player: only snap if large deviation (e.g. teleport to tribunal or match start)
            const dist = Math.hypot(p.x - sp.x, p.y - sp.y);
            if (dist > 120) {
              p.x = sp.x;
              p.y = sp.y;
              p.angle = sp.angle;
            }
            if (sp.killCooldown !== undefined) {
              this.killCooldown = sp.killCooldown;
            }
          } else {
            // Remote player: set interpolation target for 60fps smoothing
            p.targetX = sp.x;
            p.targetY = sp.y;
            p.targetAngle = sp.angle;
          }
        }
      }

      // Remove any players who disconnected
      this.players = this.players.filter(p => receivedIds.has(p.id));
    });

    this.socket.on('task_progress_update', (data) => {
      this.taskProgress = data;
    });

    this.socket.on('task_completed_ack', ({ taskId }) => {
      const t = this.assignedTasks.find(task => task.id === taskId);
      if (t) t.completed = true;
    });

    this.socket.on('sabotage_triggered', (data) => {
      this.activeSabotage = data;
    });

    this.socket.on('sabotage_resolved', () => {
      this.activeSabotage = null;
      window.soundSystem.stopAlarmSiren();
    });

    this.socket.on('meltdown_terminal_state', (data) => {
      if (this.activeSabotage && this.activeSabotage.type === 'meltdown') {
        this.activeSabotage.resolvedA = data.resolvedA;
        this.activeSabotage.resolvedB = data.resolvedB;
      }
    });

    this.socket.on('meeting_started', (data) => {
      this.tasks.closeTask();
      this.ui.openMeeting(data, this.localPlayerId);
    });

    this.socket.on('voting_phase_started', (data) => {
      this.ui.renderMeetingRoster(this.players, this.localPlayerId, true);
    });

    this.socket.on('vote_cast', ({ voterId }) => {
      const p = this.players.find(pl => pl.id === voterId);
      if (p) p.hasVoted = true;
      this.ui.renderMeetingRoster(this.players, this.localPlayerId, true);
    });

    this.socket.on('voting_results', (data) => {
      this.ui.showEjectionCinematic(data);
    });

    this.socket.on('return_to_game', () => {
      this.ui.showScreen('game');
    });

    this.socket.on('chat_message', (msg) => {
      this.ui.addChatMessage(msg);
    });

    this.socket.on('player_eliminated_fx', ({ x, y }) => {
      window.soundSystem.playKillSound();
    });

    this.socket.on('eliminated', ({ killerName }) => {
      window.soundSystem.playKillSound();
    });

    this.socket.on('game_over', (data) => {
      this.tasks.closeTask();
      this.ui.showGameOver(data.winner, data.reason, data.players);
    });

    this.socket.on('returned_to_lobby', () => {
      this.ui.showScreen('lobby');
    });
  }

  // Room Actions
  createRoom(playerName, exhibitionMode) {
    this.socket.emit('create_room', { playerName, exhibitionMode }, (res) => {
      if (res.success) {
        this.roomCode = res.roomCode;
        if (res.player) {
          this.localPlayerId = res.player.id;
        }
        this.ui.showScreen('lobby');
      } else {
        alert(res.message);
      }
    });
  }

  joinRoom(roomCode, playerName) {
    this.socket.emit('join_room', { roomCode, playerName }, (res) => {
      if (res.success) {
        this.roomCode = res.roomCode;
        if (res.player) {
          this.localPlayerId = res.player.id;
        }
        this.ui.showScreen('lobby');
      } else {
        alert(res.message);
      }
    });
  }

  toggleReady() {
    const local = this.getLocalPlayer();
    if (local) {
      this.socket.emit('set_ready', {
        roomCode: this.roomCode,
        isReady: !local.isReady
      });
    }
  }

  startMatch() {
    this.socket.emit('start_match', { roomCode: this.roomCode }, (res) => {
      if (!res.success) {
        alert(res.message);
      }
    });
  }

  addBot() {
    this.socket.emit('add_bot', { roomCode: this.roomCode });
  }

  removeBot(botId) {
    this.socket.emit('remove_bot', { roomCode: this.roomCode, botId });
  }

  toggleExhibition(enabled) {
    this.socket.emit('toggle_exhibition', { roomCode: this.roomCode, enabled });
  }

  cycleNextColor() {
    const local = this.getLocalPlayer();
    if (!local) return;
    const colors = ['#00ffcc', '#ff3366', '#ffaa00', '#3399ff', '#cc33ff', '#00ff66', '#ffea00', '#ff66cc'];
    const currentIdx = colors.indexOf(local.color);
    const nextColor = colors[(currentIdx + 1) % colors.length];
    this.socket.emit('update_color', { roomCode: this.roomCode, color: nextColor });
  }

  getLocalPlayer() {
    return this.players.find(p => p.id === this.localPlayerId);
  }

  // In-Game Player Actions
  handleActionUse() {
    const local = this.getLocalPlayer();
    if (!local || !local.isAlive) return;

    // Find closest terminal
    let nearest = null;
    let minDist = 75;

    for (const term of this.mapRenderer.terminals) {
      const dist = Math.hypot(term.x - local.x, term.y - local.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = term;
      }
    }

    if (nearest) {
      if (nearest.type === 'emergency') {
        this.handleActionEmergency();
      } else {
        this.tasks.openTask(nearest);
      }
    }
  }

  handleActionReport() {
    const local = this.getLocalPlayer();
    if (!local || !local.isAlive) return;

    // Check distance to bodies
    for (const body of this.deadBodies) {
      if (Math.hypot(body.x - local.x, body.y - local.y) < 110) {
        this.socket.emit('report_body', {
          roomCode: this.roomCode,
          bodyId: body.id
        });
        return;
      }
    }
  }

  handleActionKill() {
    const local = this.getLocalPlayer();
    if (!local || !local.isAlive || this.localPlayerRole !== 'infiltrator') return;
    if (this.killCooldown > 0) return;

    // Find nearest living operative
    let nearest = null;
    let minDist = 100;

    for (const p of this.players) {
      if (p.id === this.localPlayerId || !p.isAlive) continue;
      // Do not kill fellow infiltrator
      if (this.teammates.some(t => t.id === p.id)) continue;

      const dist = Math.hypot(p.x - local.x, p.y - local.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = p;
      }
    }

    if (nearest) {
      this.socket.emit('perform_kill', {
        roomCode: this.roomCode,
        targetId: nearest.id
      });
    }
  }

  handleActionVent() {
    const local = this.getLocalPlayer();
    if (!local || !local.isAlive || this.localPlayerRole !== 'infiltrator') return;

    if (local.inVent) {
      // Exit vent
      const vent = this.mapRenderer.vents.find(v => v.id === local.currentVentId) || this.mapRenderer.vents[0];
      this.socket.emit('exit_vent', {
        roomCode: this.roomCode,
        ventId: vent.id,
        targetX: vent.x + 30,
        targetY: vent.y + 30
      });
      window.soundSystem.playVentWhoosh();
    } else {
      // Enter nearest vent
      const vent = this.mapRenderer.vents.find(v => Math.hypot(v.x - local.x, v.y - local.y) < 70);
      if (vent) {
        this.socket.emit('enter_vent', {
          roomCode: this.roomCode,
          ventId: vent.id
        });
        window.soundSystem.playVentWhoosh();
      }
    }
  }

  handleActionEmergency() {
    const local = this.getLocalPlayer();
    if (!local || !local.isAlive) return;
    this.socket.emit('call_emergency', { roomCode: this.roomCode });
  }

  triggerSabotage(type) {
    this.socket.emit('trigger_sabotage', {
      roomCode: this.roomCode,
      sabotageType: type
    });
  }

  castVote(targetId) {
    this.socket.emit('cast_vote', {
      roomCode: this.roomCode,
      targetId: targetId
    });
  }

  sendChat(text) {
    const local = this.getLocalPlayer();
    this.socket.emit('send_chat', {
      roomCode: this.roomCode,
      text: text,
      isGhost: local ? !local.isAlive : false
    });
  }

  // Main 60 FPS Update & Render Loop
  loop(timestamp) {
    const dt = Math.min(0.1, (timestamp - this.lastFrame) / 1000);
    this.lastFrame = timestamp;

    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    const local = this.getLocalPlayer();
    if (!local) return;

    // Subsystem updates
    this.mapRenderer.update(dt, this.players, this.doorsLocked);
    this.playerRenderer.update(dt);

    // Smoothly interpolate all remote players toward their target network positions
    for (const p of this.players) {
      if (p.id !== this.localPlayerId) {
        if (p.targetX !== undefined && p.targetY !== undefined) {
          const lerpFactor = Math.min(1, dt * 18);
          p.x += (p.targetX - p.x) * lerpFactor;
          p.y += (p.targetY - p.y) * lerpFactor;
        }
        if (p.targetAngle !== undefined) {
          p.angle = p.targetAngle;
        }
      }
    }

    // Movement calculation
    let mx = 0;
    let my = 0;

    if (this.keys['w'] || this.keys['arrowup']) my -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) my += 1;
    if (this.keys['a'] || this.keys['arrowleft']) mx -= 1;
    if (this.keys['d'] || this.keys['arrowright']) mx += 1;

    if (this.joystick.active) {
      mx = this.joystick.dx;
      my = this.joystick.dy;
    }

    const len = Math.hypot(mx, my);
    if (len > 0.05 && local.isAlive && !local.inVent) {
      const normX = mx / Math.max(1, len);
      const normY = my / Math.max(1, len);
      const speed = this.moveSpeed * dt;

      const newX = local.x + normX * speed;
      const newY = local.y + normY * speed;
      const angle = Math.atan2(normY, normX);

      // Check wall & locked door collision (ghosts ignore walls!)
      const isGhost = !local.isAlive;
      let blockedX = !isGhost && this.mapRenderer.checkCollision(newX, local.y, 18, this.doorsLocked);
      let blockedY = !isGhost && this.mapRenderer.checkCollision(local.x, newY, 18, this.doorsLocked);

      if (!blockedX) local.x = newX;
      if (!blockedY) local.y = newY;
      local.angle = angle;

      // Throttle network sync to 30ms
      const now = performance.now();
      if (now - this.lastMoveSend > 30) {
        this.socket.emit('player_move', {
          roomCode: this.roomCode,
          x: local.x,
          y: local.y,
          angle: local.angle
        });
        this.lastMoveSend = now;
      }
    }

    // Camera follow lerp
    this.camera.targetX = local.x - this.camera.viewWidth / 2;
    this.camera.targetY = local.y - this.camera.viewHeight / 2;
    this.camera.x += (this.camera.targetX - this.camera.x) * 0.12;
    this.camera.y += (this.camera.targetY - this.camera.y) * 0.12;

    // Update HUD alerts & prompts
    this.ui.updateHUD(
      this.taskProgress,
      this.killCooldown,
      this.activeSabotage,
      this.doorsLocked,
      local
    );
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    this.ctx.translate(-this.camera.x, -this.camera.y);

    const local = this.getLocalPlayer();

    // 1. Render Station Map
    this.mapRenderer.render(
      this.ctx,
      this.camera,
      local,
      this.activeSabotage,
      this.doorsLocked
    );

    // 2. Render Fallen Operative Bodies
    for (const body of this.deadBodies) {
      this.playerRenderer.renderDeadBody(this.ctx, body);
    }

    // 3. Render Players
    for (const player of this.players) {
      const isLocal = player.id === this.localPlayerId;
      this.playerRenderer.render(
        this.ctx,
        player,
        isLocal,
        this.localPlayerRole,
        this.teammates
      );
    }

    // 4. Render Dynamic Darkness / Flashlight (when Blackout is active)
    const isBlackout = this.activeSabotage && this.activeSabotage.type === 'blackout';
    this.mapRenderer.renderLighting(this.ctx, this.camera, local, isBlackout);

    this.ctx.restore();
  }
}

// Bootstrap Game on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.game = new GameEngine();
});
