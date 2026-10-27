/**
 * NEURAL BREACH: SYNERGY 2026
 * User Interface & Exhibition Presentation Layer
 * Lobby, HUD, Minimap, Sabotage Wheel, Meetings, Voting, and Victory Overlays
 */

class UIManager {
  constructor(game) {
    this.game = game;
    this.initElements();
    this.bindEvents();
  }

  initElements() {
    // Screens
    this.screenStart = document.getElementById('screen-start');
    this.screenLobby = document.getElementById('screen-lobby');
    this.screenGame = document.getElementById('screen-game');
    this.screenMeeting = document.getElementById('screen-meeting');
    this.screenEjection = document.getElementById('screen-ejection');
    this.screenGameOver = document.getElementById('screen-gameover');

    // Modals
    this.modalHowToPlay = document.getElementById('modal-how-to-play');
    this.sabotageWheel = document.getElementById('sabotage-wheel');

    // Inputs & Buttons on Start
    this.btnCreate = document.getElementById('btn-create-room');
    this.btnJoin = document.getElementById('btn-join-room');
    this.btnHowToPlay = document.getElementById('btn-how-to-play');
    this.inputPlayerName = document.getElementById('player-name-input');
    this.inputRoomCode = document.getElementById('room-code-input');
    this.networkInfo = document.getElementById('network-info-pill');

    // Lobby UI
    this.lobbyCodeDisplay = document.getElementById('lobby-room-code');
    this.lobbyPlayerList = document.getElementById('lobby-players-list');
    this.btnReady = document.getElementById('btn-lobby-ready');
    this.btnStartMatch = document.getElementById('btn-lobby-start');
    this.btnAddBot = document.getElementById('btn-lobby-add-bot');
    this.checkExhibition = document.getElementById('check-exhibition-mode');
    this.lobbyStatusMsg = document.getElementById('lobby-status-msg');

    // HUD Elements
    this.taskProgressBar = document.getElementById('hud-task-fill');
    this.taskProgressText = document.getElementById('hud-task-text');
    this.roleBanner = document.getElementById('role-reveal-banner');
    this.sabotageAlertBanner = document.getElementById('sabotage-alert-banner');
    this.btnActionUse = document.getElementById('btn-action-use');
    this.btnActionReport = document.getElementById('btn-action-report');
    this.btnActionKill = document.getElementById('btn-action-kill');
    this.btnActionSabotage = document.getElementById('btn-action-sabotage');
    this.btnActionVent = document.getElementById('btn-action-vent');
    this.btnCallEmergency = document.getElementById('btn-action-emergency');

    // Meeting UI
    this.meetingTitle = document.getElementById('meeting-title');
    this.meetingSubtitle = document.getElementById('meeting-subtitle');
    this.meetingTimer = document.getElementById('meeting-timer');
    this.meetingRoster = document.getElementById('meeting-roster');
    this.chatMessages = document.getElementById('chat-messages');
    this.chatInput = document.getElementById('chat-input');
    this.btnSendChat = document.getElementById('btn-send-chat');

    // Ejection Cinematic
    this.ejectionText = document.getElementById('ejection-text');
    this.ejectionSubtext = document.getElementById('ejection-subtext');

    // Game Over
    this.gameOverTitle = document.getElementById('gameover-title');
    this.gameOverReason = document.getElementById('gameover-reason');
    this.gameOverRoster = document.getElementById('gameover-roster');
  }

  bindEvents() {
    // Start Screen
    this.btnCreate.addEventListener('click', () => {
      window.soundSystem.playClick();
      const name = this.inputPlayerName.value.trim() || 'Operative-1';
      this.game.createRoom(name, this.checkExhibition.checked);
    });

    this.btnJoin.addEventListener('click', () => {
      window.soundSystem.playClick();
      const name = this.inputPlayerName.value.trim() || 'Operative-2';
      const code = this.inputRoomCode.value.trim().toUpperCase();
      if (!code) {
        alert('Please enter a 4-letter Room Code.');
        return;
      }
      this.game.joinRoom(code, name);
    });

    this.btnHowToPlay.addEventListener('click', () => {
      window.soundSystem.playClick();
      this.modalHowToPlay.classList.remove('hidden');
    });

    document.getElementById('btn-close-how-to-play').addEventListener('click', () => {
      window.soundSystem.playClick();
      this.modalHowToPlay.classList.add('hidden');
    });

    // Lobby Ready & Start
    this.btnReady.addEventListener('click', () => {
      window.soundSystem.playClick();
      this.game.toggleReady();
    });

    this.btnStartMatch.addEventListener('click', () => {
      window.soundSystem.playClick();
      this.game.startMatch();
    });

    this.btnAddBot.addEventListener('click', () => {
      window.soundSystem.playClick();
      this.game.addBot();
    });

    this.checkExhibition.addEventListener('change', (e) => {
      this.game.toggleExhibition(e.target.checked);
    });

    // Room Code 1-Click Copy
    this.lobbyCodeDisplay.addEventListener('click', () => {
      navigator.clipboard.writeText(this.lobbyCodeDisplay.textContent);
      const orig = this.lobbyCodeDisplay.textContent;
      this.lobbyCodeDisplay.textContent = 'COPIED!';
      setTimeout(() => this.lobbyCodeDisplay.textContent = orig, 1200);
    });

    // HUD Action Buttons
    this.btnActionUse.addEventListener('click', () => this.game.handleActionUse());
    this.btnActionReport.addEventListener('click', () => this.game.handleActionReport());
    this.btnActionKill.addEventListener('click', () => this.game.handleActionKill());
    this.btnActionSabotage.addEventListener('click', () => this.toggleSabotageWheel());
    this.btnActionVent.addEventListener('click', () => this.game.handleActionVent());
    this.btnCallEmergency.addEventListener('click', () => this.game.handleActionEmergency());

    // Sabotage Wheel Options
    document.querySelectorAll('.sabotage-option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        window.soundSystem.playClick();
        const type = btn.getAttribute('data-type');
        this.game.triggerSabotage(type);
        this.sabotageWheel.classList.add('hidden');
      });
    });

    document.getElementById('btn-close-sabotage').addEventListener('click', () => {
      this.sabotageWheel.classList.add('hidden');
    });

    // Meeting Chat
    this.btnSendChat.addEventListener('click', () => this.sendChatMessage());
    this.chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.sendChatMessage();
    });

    // Quick Chat Buttons
    document.querySelectorAll('.quick-chat-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        this.chatInput.value = pill.textContent;
        this.sendChatMessage();
      });
    });

    // Fetch network IP for exhibition visitors
    fetch('/api/info')
      .then(res => res.json())
      .then(data => {
        if (data.localIPs && data.localIPs.length > 0) {
          this.networkInfo.textContent = `Local Network: http://${data.localIPs[0]}:${data.port}`;
        }
      })
      .catch(() => {});
  }

  showScreen(screenName) {
    [this.screenStart, this.screenLobby, this.screenGame, 
     this.screenMeeting, this.screenEjection, this.screenGameOver].forEach(s => s.classList.add('hidden'));

    switch (screenName) {
      case 'start': this.screenStart.classList.remove('hidden'); break;
      case 'lobby': this.screenLobby.classList.remove('hidden'); break;
      case 'game': this.screenGame.classList.remove('hidden'); break;
      case 'meeting': this.screenMeeting.classList.remove('hidden'); break;
      case 'ejection': this.screenEjection.classList.remove('hidden'); break;
      case 'gameover': this.screenGameOver.classList.remove('hidden'); break;
    }
  }

  updateLobby(data, localPlayerId) {
    this.lobbyCodeDisplay.textContent = data.code;
    this.lobbyPlayerList.innerHTML = '';

    const isHost = data.hostId === localPlayerId;
    this.btnStartMatch.classList.toggle('hidden', !isHost);
    this.btnAddBot.classList.toggle('hidden', !isHost);
    this.checkExhibition.disabled = !isHost;
    this.checkExhibition.checked = !!data.settings.exhibitionMode;

    data.players.forEach(p => {
      const isLocal = p.id === localPlayerId;
      const card = document.createElement('div');
      card.className = `lobby-player-card ${p.isReady ? 'ready' : ''} ${isLocal ? 'local-player' : ''}`;
      card.innerHTML = `
        <div class="player-color-dot" style="background: ${p.color};"></div>
        <div class="player-info">
          <div class="player-name">${p.name} ${p.isHost ? '👑 (HOST)' : ''} ${p.isBot ? '🤖' : ''}</div>
          <div class="player-status">${p.isReady ? 'STATUS: READY' : 'WAITING...'}</div>
        </div>
        ${isLocal ? '<button class="color-cycle-btn">COLOR</button>' : ''}
        ${isHost && p.isBot ? `<button class="bot-remove-btn" data-bot="${p.id}">✕</button>` : ''}
      `;

      if (isLocal) {
        card.querySelector('.color-cycle-btn').addEventListener('click', () => {
          this.game.cycleNextColor();
        });
      }

      if (isHost && p.isBot) {
        card.querySelector('.bot-remove-btn').addEventListener('click', () => {
          this.game.removeBot(p.id);
        });
      }

      this.lobbyPlayerList.appendChild(card);
    });

    const localPlayer = data.players.find(p => p.id === localPlayerId);
    if (localPlayer) {
      this.btnReady.textContent = localPlayer.isReady ? 'CANCEL READY' : 'READY UP ✓';
      this.btnReady.classList.toggle('ready-active', localPlayer.isReady);
    }

    if (isHost) {
      this.btnStartMatch.disabled = !data.canStart;
      this.lobbyStatusMsg.textContent = data.canStart 
        ? 'Ready to launch! Click "LAUNCH MATCH" to begin.' 
        : `Requires at least ${data.settings.minPlayers} players in room to begin.`;
    } else {
      this.lobbyStatusMsg.textContent = 'Waiting for host to launch the match...';
    }
  }

  showRoleReveal(role, teammates, impostorCount = 1) {
    this.roleBanner.classList.remove('hidden', 'role-operative', 'role-infiltrator', 'fade-out');
    const isImpostor = role === 'infiltrator';
    this.roleBanner.classList.add(isImpostor ? 'role-infiltrator' : 'role-operative');

    // Update Persistent HUD Role Pill (Top-Left)
    const rolePill = document.getElementById('hud-role-pill');
    const roleIcon = document.getElementById('hud-role-icon');
    const roleText = document.getElementById('hud-role-text');
    const roleSub = document.getElementById('hud-role-sub');

    if (rolePill) {
      rolePill.className = `hud-role-pill ${isImpostor ? 'imposter' : 'crewmate'}`;
      if (roleIcon) roleIcon.textContent = isImpostor ? '🔪' : '🛡️';
      if (roleText) roleText.textContent = isImpostor ? 'IMPOSTOR' : 'CREWMATE';
      if (roleSub) roleSub.textContent = isImpostor ? 'Sabotage & Eliminate' : 'Tasks & Survival';
    }

    const title = isImpostor ? 'YOU ARE AN IMPOSTOR' : 'YOU ARE A CREWMATE';
    const subTitle = isImpostor ? '[FACILITY SABOTEUR]' : '[RESEARCH OPERATIVE]';
    const icon = isImpostor ? '🔪' : '🛡️';

    const mission = isImpostor 
      ? `Eliminate the crewmates before tasks are completed.<br>Sabotage station systems, crawl through vents, and deceive the crew.`
      : `There ${impostorCount > 1 ? `are ${impostorCount} Impostors` : 'is 1 Impostor'} among us.<br>Complete all assigned tasks or identify and vote out the Impostor!`;

    const partnerInfo = (isImpostor && teammates && teammates.length > 0)
      ? `<div class="team-partners">FELLOW IMPOSTOR(S): ${teammates.map(t => t.name).join(', ')}</div>`
      : '';

    this.roleBanner.innerHTML = `
      <div class="role-reveal-box">
        <span class="role-big-icon">${icon}</span>
        <h1>${title}</h1>
        <div class="role-faction-subtitle">${subTitle}</div>
        <div class="role-mission-box">
          <p>${mission}</p>
          ${partnerInfo}
        </div>
      </div>
    `;

    // Dramatic Audio Stinger
    if (isImpostor) {
      window.soundSystem.playKillSound();
    } else {
      window.soundSystem.playTaskSuccess();
    }

    setTimeout(() => {
      this.roleBanner.classList.add('fade-out');
      setTimeout(() => this.roleBanner.classList.add('hidden'), 600);
    }, 4500);

    // Show/hide Infiltrator HUD buttons (strictly on client side)
    this.btnActionKill.classList.toggle('hidden', !isImpostor);
    this.btnActionSabotage.classList.toggle('hidden', !isImpostor);
    this.btnActionVent.classList.toggle('hidden', !isImpostor);
  }

  updateHUD(taskProgress, killCooldown, activeSabotage, doorsLocked, localPlayer) {
    // Task Progress
    this.taskProgressBar.style.width = `${taskProgress.percent}%`;
    this.taskProgressText.textContent = `FACILITY PROTOCOL PROGRESS: ${taskProgress.completed}/${taskProgress.total} (${taskProgress.percent}%)`;

    // Infiltrator Kill Cooldown
    if (localPlayer && localPlayer.role === 'infiltrator') {
      if (killCooldown > 0) {
        this.btnActionKill.disabled = true;
        this.btnActionKill.innerHTML = `NEUTRALIZE (${Math.ceil(killCooldown)}s)`;
      } else {
        this.btnActionKill.disabled = false;
        this.btnActionKill.innerHTML = `NEUTRALIZE (READY)`;
      }
    }

    // Sabotage Alert Banner
    if (activeSabotage) {
      this.sabotageAlertBanner.classList.remove('hidden');
      if (activeSabotage.type === 'meltdown') {
        this.sabotageAlertBanner.className = 'sabotage-alert meltdown';
        this.sabotageAlertBanner.innerHTML = `
          ⚠️ CRITICAL REACTOR MELTDOWN IN: ${activeSabotage.timer}s ⚠️
          <br><span>Overrides: Core A [${activeSabotage.resolvedA ? '✓' : '✗'}] | Life Support B [${activeSabotage.resolvedB ? '✓' : '✗'}]</span>
        `;
        window.soundSystem.startAlarmSiren();
      } else if (activeSabotage.type === 'blackout') {
        this.sabotageAlertBanner.className = 'sabotage-alert blackout';
        this.sabotageAlertBanner.innerHTML = `💡 POWER GRID BLACKOUT — Substation Circuit Breakers Tripped!`;
      } else if (activeSabotage.type === 'comms') {
        this.sabotageAlertBanner.className = 'sabotage-alert comms';
        this.sabotageAlertBanner.innerHTML = `📶 COMMS JAMMED — Navigation & Task Radar Blinded!`;
      }
    } else if (doorsLocked) {
      this.sabotageAlertBanner.classList.remove('hidden');
      this.sabotageAlertBanner.className = 'sabotage-alert doors';
      this.sabotageAlertBanner.innerHTML = `🔒 SECURITY BULKHEADS LOCKED — Conduits Sealed!`;
    } else {
      this.sabotageAlertBanner.classList.add('hidden');
      window.soundSystem.stopAlarmSiren();
    }
  }

  toggleSabotageWheel() {
    this.sabotageWheel.classList.toggle('hidden');
    window.soundSystem.playClick();
  }

  openMeeting(data, localPlayerId) {
    this.showScreen('meeting');
    window.soundSystem.playMeetingGavel();

    if (data.trigger === 'report') {
      this.meetingTitle.textContent = '🚨 FALLEN OPERATIVE DISCOVERED 🚨';
      this.meetingSubtitle.textContent = `Reported by ${data.callerName} | Fallen: ${data.targetName}`;
    } else {
      this.meetingTitle.textContent = '⚠️ EMERGENCY TRIBUNAL CONVENED ⚠️';
      this.meetingSubtitle.textContent = `Convened by ${data.callerName}`;
    }

    this.chatMessages.innerHTML = '';
    this.renderMeetingRoster(data.players, localPlayerId, false);
  }

  updateMeetingTimer(seconds, phase) {
    this.meetingTimer.textContent = `${phase.toUpperCase()}: ${Math.ceil(seconds)}s`;
  }

  renderMeetingRoster(players, localPlayerId, isVotingPhase) {
    this.meetingRoster.innerHTML = '';
    const localPlayer = players.find(p => p.id === localPlayerId);
    const canVote = localPlayer && localPlayer.isAlive && isVotingPhase;

    players.forEach(p => {
      const card = document.createElement('div');
      card.className = `meeting-player-card ${p.isAlive ? 'alive' : 'dead'} ${p.hasVoted ? 'voted' : ''}`;
      card.innerHTML = `
        <div class="player-dot" style="background: ${p.color};"></div>
        <div class="name">${p.name} ${!p.isAlive ? '💀' : ''}</div>
        <div class="vote-badge">${p.hasVoted ? 'VOTED ✓' : ''}</div>
      `;

      if (canVote && p.isAlive) {
        card.classList.add('clickable');
        card.addEventListener('click', () => {
          window.soundSystem.playClick();
          this.game.castVote(p.id);
        });
      }

      this.meetingRoster.appendChild(card);
    });

    // Skip Vote Button
    if (canVote) {
      const skipCard = document.createElement('div');
      skipCard.className = 'meeting-player-card skip-vote-card clickable';
      skipCard.innerHTML = `<div class="name">⏩ SKIP VOTE</div>`;
      skipCard.addEventListener('click', () => {
        window.soundSystem.playClick();
        this.game.castVote('skip');
      });
      this.meetingRoster.appendChild(skipCard);
    }
  }

  sendChatMessage() {
    const text = this.chatInput.value.trim();
    if (!text) return;
    this.chatInput.value = '';
    this.game.sendChat(text);
  }

  addChatMessage(msg) {
    const div = document.createElement('div');
    div.className = `chat-entry ${msg.isGhost ? 'ghost-chat' : ''} ${msg.isSystem ? 'system-chat' : ''}`;
    div.innerHTML = `
      <span class="chat-sender" style="color: ${msg.color};">${msg.senderName}:</span>
      <span class="chat-text">${msg.text}</span>
    `;
    this.chatMessages.appendChild(div);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  showEjectionCinematic(data) {
    this.showScreen('ejection');

    if (data.tie || !data.ejected) {
      this.ejectionText.textContent = 'NO ONE WAS EJECTED';
      this.ejectionSubtext.textContent = '(Tie vote or majority skipped)';
    } else {
      this.ejectionText.textContent = `${data.ejected.name} WAS EJECTED INTO DEEP SPACE`;
      this.ejectionSubtext.textContent = data.wasInfiltrator 
        ? 'They were an INFILTRATOR. Station security restored.' 
        : 'They were an innocent OPERATIVE.';
    }
  }

  showGameOver(winner, reason, players) {
    this.showScreen('gameover');
    const isOperatives = winner === 'operatives';

    if (isOperatives) {
      window.soundSystem.playVictory();
    } else {
      window.soundSystem.playDefeat();
    }

    this.gameOverTitle.textContent = isOperatives ? 'OPERATIVES SECURED THE FACILITY' : 'INFILTRATORS COMPROMISED THE FACILITY';
    this.gameOverTitle.className = isOperatives ? 'title-operatives' : 'title-infiltrators';
    this.gameOverReason.textContent = reason;

    this.gameOverRoster.innerHTML = '';
    players.forEach(p => {
      const div = document.createElement('div');
      div.className = 'summary-row';
      div.innerHTML = `
        <span style="color:${p.color}">● ${p.name}</span>
        <span class="role-tag ${p.role}">${p.role.toUpperCase()}</span>
        <span>${p.isAlive ? 'SURVIVED' : 'FALLEN'}</span>
      `;
      this.gameOverRoster.appendChild(div);
    });
  }
}

window.UIManager = UIManager;
