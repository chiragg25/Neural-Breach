/**
 * NEURAL BREACH: SYNERGY 2026
 * Interactive Mini-Game Tasks & Terminal Interfaces
 * All 8 research calibration tasks + sabotage fix interfaces + CCTV viewer.
 */

class TaskManager {
  constructor(game) {
    this.game = game;
    this.currentTask = null;
    this.modalEl = document.getElementById('task-modal');
    this.containerEl = document.getElementById('task-container');
    this.titleEl = document.getElementById('task-title');
    this.closeBtn = document.getElementById('task-close-btn');

    this.closeBtn.addEventListener('click', () => this.closeTask());
  }

  openTask(terminal) {
    if (this.currentTask) return;
    this.currentTask = terminal;
    this.modalEl.classList.remove('hidden');
    this.titleEl.textContent = terminal.name;
    this.containerEl.innerHTML = '';

    window.soundSystem.playClick();

    switch (terminal.taskType || terminal.type) {
      case 'circuit':
        this.initCircuitTask();
        break;
      case 'quantum':
        this.initQuantumTask();
        break;
      case 'cypher':
        this.initCypherTask();
        break;
      case 'biosample':
        this.initBioSampleTask();
        break;
      case 'memory':
        this.initMemoryTask();
        break;
      case 'antenna':
        this.initAntennaTask();
        break;
      case 'pressure':
        this.initPressureTask();
        break;
      case 'bioscan':
        this.initBioScanTask();
        break;
      // Sabotages
      case 'blackout_fix':
        this.initBlackoutFix();
        break;
      case 'comms_fix':
        this.initCommsFix();
        break;
      case 'meltdown_a':
      case 'meltdown_b':
        this.initMeltdownOverride(terminal.type);
        break;
      case 'cctv':
        this.initCCTVStation();
        break;
      default:
        this.closeTask();
    }
  }

  closeTask() {
    this.modalEl.classList.add('hidden');
    this.containerEl.innerHTML = '';
    this.currentTask = null;
  }

  completeCurrentTask() {
    window.soundSystem.playTaskSuccess();
    const completedTaskId = this.currentTask.id;
    
    // Animate success banner
    const banner = document.createElement('div');
    banner.className = 'task-success-banner';
    banner.innerHTML = '<h2>PROTOCOL COMPLETE ✓</h2>';
    this.containerEl.appendChild(banner);

    setTimeout(() => {
      this.closeTask();
      this.game.socket.emit('complete_task', {
        roomCode: this.game.roomCode,
        taskId: completedTaskId
      });
    }, 900);
  }

  // 1. Circuit Matrix Rewire
  initCircuitTask() {
    const colors = ['#ff3366', '#00ffcc', '#ffaa00', '#3399ff'];
    const leftOrder = [0, 1, 2, 3];
    const rightOrder = [2, 0, 3, 1]; // shuffled
    const connections = {}; // leftIdx -> rightIdx
    let activeDrag = null;

    const html = `
      <div class="circuit-task">
        <canvas id="circuit-canvas" width="480" height="320"></canvas>
        <div class="circuit-hint">Connect matching colored neural conduits across terminals</div>
      </div>
    `;
    this.containerEl.innerHTML = html;

    const canvas = document.getElementById('circuit-canvas');
    const ctx = canvas.getContext('2d');

    const draw = (mouseX, mouseY) => {
      ctx.clearRect(0, 0, 480, 320);

      // Left Nodes
      leftOrder.forEach((colorIdx, i) => {
        const y = 60 + i * 65;
        ctx.fillStyle = colors[colorIdx];
        ctx.beginPath();
        ctx.arc(40, y, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Right Nodes
      rightOrder.forEach((colorIdx, i) => {
        const y = 60 + i * 65;
        ctx.fillStyle = colors[colorIdx];
        ctx.beginPath();
        ctx.arc(440, y, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Existing Connections
      for (const [leftI, rightI] of Object.entries(connections)) {
        const lIdx = parseInt(leftI);
        const rIdx = parseInt(rightI);
        const y1 = 60 + lIdx * 65;
        const y2 = 60 + rIdx * 65;
        ctx.strokeStyle = colors[leftOrder[lIdx]];
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(40, y1);
        ctx.bezierCurveTo(200, y1, 280, y2, 440, y2);
        ctx.stroke();
      }

      // Dragging Wire
      if (activeDrag !== null) {
        const y1 = 60 + activeDrag * 65;
        ctx.strokeStyle = colors[leftOrder[activeDrag]];
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(40, y1);
        ctx.lineTo(mouseX, mouseY);
        ctx.stroke();
      }
    };

    draw(0, 0);

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: (clientX - rect.left) * (480 / rect.width),
        y: (clientY - rect.top) * (320 / rect.height)
      };
    };

    const onDown = (e) => {
      e.preventDefault();
      const { x, y } = getPos(e);
      leftOrder.forEach((_, i) => {
        const ny = 60 + i * 65;
        if (Math.hypot(x - 40, y - ny) < 25) {
          activeDrag = i;
          delete connections[i];
          window.soundSystem.playClick();
        }
      });
      draw(x, y);
    };

    const onMove = (e) => {
      if (activeDrag === null) return;
      e.preventDefault();
      const { x, y } = getPos(e);
      draw(x, y);
    };

    const onUp = (e) => {
      if (activeDrag === null) return;
      e.preventDefault();
      const lastX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
      const lastY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
      const rect = canvas.getBoundingClientRect();
      const x = (lastX - rect.left) * (480 / rect.width);
      const y = (lastY - rect.top) * (320 / rect.height);

      let matched = false;
      rightOrder.forEach((colorIdx, i) => {
        const ny = 60 + i * 65;
        if (Math.hypot(x - 440, y - ny) < 30) {
          if (colorIdx === leftOrder[activeDrag]) {
            connections[activeDrag] = i;
            matched = true;
            window.soundSystem.playClick();
          } else {
            window.soundSystem.playTaskFail();
          }
        }
      });

      activeDrag = null;
      draw(0, 0);

      if (Object.keys(connections).length === 4) {
        this.completeCurrentTask();
      }
    };

    canvas.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    canvas.addEventListener('touchstart', onDown);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onUp);
  }

  // 2. Quantum Core Frequency Calibration
  initQuantumTask() {
    const targetFreq = 4;
    let currentFreq = 1;

    const html = `
      <div class="quantum-task">
        <canvas id="quantum-canvas" width="480" height="200"></canvas>
        <div class="slider-control">
          <label>CALIBRATE HARMONIC RESONANCE (TARGET: 4.0 GHz)</label>
          <input type="range" id="freq-slider" min="1" max="8" step="0.1" value="1" />
          <span id="freq-val">1.0 GHz</span>
        </div>
      </div>
    `;
    this.containerEl.innerHTML = html;

    const canvas = document.getElementById('quantum-canvas');
    const ctx = canvas.getContext('2d');
    const slider = document.getElementById('freq-slider');
    const valText = document.getElementById('freq-val');

    let animId;
    let t = 0;

    const renderWave = () => {
      ctx.clearRect(0, 0, 480, 200);

      // Target Wave (Cyan dashed)
      ctx.strokeStyle = 'rgba(0, 255, 204, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      for (let x = 0; x < 480; x++) {
        const y = 100 + Math.sin((x * targetFreq * 0.05) + t) * 45;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Current Wave (Neon Magenta)
      ctx.strokeStyle = Math.abs(currentFreq - targetFreq) < 0.2 ? '#00ff66' : '#ff3388';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = 0; x < 480; x++) {
        const y = 100 + Math.sin((x * currentFreq * 0.05) + t) * 45;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      t += 0.08;
      animId = requestAnimationFrame(renderWave);
    };

    renderWave();

    slider.addEventListener('input', (e) => {
      currentFreq = parseFloat(e.target.value);
      valText.textContent = `${currentFreq.toFixed(1)} GHz`;

      if (Math.abs(currentFreq - targetFreq) < 0.15) {
        cancelAnimationFrame(animId);
        valText.textContent = `LOCKED 4.0 GHz!`;
        valText.style.color = '#00ff66';
        this.completeCurrentTask();
      }
    });
  }

  // 3. Security Cypher Key
  initCypherTask() {
    const code = `${Math.floor(10000 + Math.random() * 90000)}`;
    let input = '';

    const html = `
      <div class="cypher-task">
        <div class="keycard-display">
          <div class="keycard-header">SECURITY PASSCODE</div>
          <div class="keycard-code">${code}</div>
        </div>
        <div class="keypad-container">
          <div class="keypad-screen" id="keypad-screen">_ _ _ _ _</div>
          <div class="keypad-grid">
            ${[1,2,3,4,5,6,7,8,9,'C',0,'OK'].map(k => `
              <button class="keypad-btn" data-val="${k}">${k}</button>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    this.containerEl.innerHTML = html;

    const screen = document.getElementById('keypad-screen');
    const buttons = this.containerEl.querySelectorAll('.keypad-btn');

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        window.soundSystem.playClick();
        const val = btn.getAttribute('data-val');
        if (val === 'C') {
          input = '';
        } else if (val === 'OK') {
          if (input === code) {
            screen.textContent = 'ACCESS GRANTED';
            screen.style.color = '#00ff66';
            this.completeCurrentTask();
          } else {
            screen.textContent = 'ERROR';
            screen.style.color = '#ff3344';
            window.soundSystem.playTaskFail();
            setTimeout(() => {
              input = '';
              screen.textContent = '_ _ _ _ _';
              screen.style.color = '#00ffcc';
            }, 600);
          }
          return;
        } else {
          if (input.length < 5) {
            input += val;
          }
        }
        screen.textContent = input.padEnd(5, '_');
      });
    });
  }

  // 4. Bio-Sample Centrifuge
  initBioSampleTask() {
    const samples = [
      { id: 1, color: '#38bdf8', anomalous: false },
      { id: 2, color: '#38bdf8', anomalous: false },
      { id: 3, color: '#f43f5e', anomalous: true }, // Anomalous mutated vial
      { id: 4, color: '#38bdf8', anomalous: false }
    ];

    const html = `
      <div class="biosample-task">
        <div class="biosample-desc">Select and neutralize the mutated biological sample vial:</div>
        <div class="samples-row">
          ${samples.map(s => `
            <div class="sample-vial" data-id="${s.id}" data-anomalous="${s.anomalous}">
              <div class="vial-fluid" style="background: ${s.color};"></div>
              <div class="vial-label">SAMPLE #${s.id}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    this.containerEl.innerHTML = html;

    const vials = this.containerEl.querySelectorAll('.sample-vial');
    vials.forEach(v => {
      v.addEventListener('click', () => {
        const isAnomalous = v.getAttribute('data-anomalous') === 'true';
        if (isAnomalous) {
          v.classList.add('sterilized');
          v.querySelector('.vial-fluid').style.background = '#00ff66';
          this.completeCurrentTask();
        } else {
          window.soundSystem.playTaskFail();
          v.classList.add('shake');
          setTimeout(() => v.classList.remove('shake'), 400);
        }
      });
    });
  }

  // 5. Substation Memory Reboot (Simon Says)
  initMemoryTask() {
    const sequence = [0, 2, 1, 3];
    let playerIdx = 0;
    let isShowing = true;

    const html = `
      <div class="memory-task">
        <div class="memory-status" id="mem-status">OBSERVE MEMORY SEQUENCE...</div>
        <div class="memory-grid">
          <button class="mem-node" data-id="0" style="background:#ff3366"></button>
          <button class="mem-node" data-id="1" style="background:#00ffcc"></button>
          <button class="mem-node" data-id="2" style="background:#ffaa00"></button>
          <button class="mem-node" data-id="3" style="background:#3399ff"></button>
        </div>
      </div>
    `;
    this.containerEl.innerHTML = html;

    const nodes = this.containerEl.querySelectorAll('.mem-node');
    const statusEl = document.getElementById('mem-status');

    const flashNode = (nodeIdx, duration = 350) => {
      return new Promise(resolve => {
        nodes[nodeIdx].classList.add('active');
        window.soundSystem.playClick();
        setTimeout(() => {
          nodes[nodeIdx].classList.remove('active');
          setTimeout(resolve, 150);
        }, duration);
      });
    };

    const playSequence = async () => {
      isShowing = true;
      statusEl.textContent = 'OBSERVE SEQUENCE...';
      await new Promise(r => setTimeout(r, 600));
      for (const idx of sequence) {
        await flashNode(idx);
      }
      isShowing = false;
      statusEl.textContent = 'REPEAT SEQUENCE:';
    };

    playSequence();

    nodes.forEach(node => {
      node.addEventListener('click', () => {
        if (isShowing) return;
        const id = parseInt(node.getAttribute('data-id'));
        flashNode(id, 200);

        if (id === sequence[playerIdx]) {
          playerIdx++;
          if (playerIdx === sequence.length) {
            statusEl.textContent = 'SEQUENCE VERIFIED!';
            statusEl.style.color = '#00ff66';
            this.completeCurrentTask();
          }
        } else {
          statusEl.textContent = 'DESYNC! RETRYING...';
          statusEl.style.color = '#ff3344';
          window.soundSystem.playTaskFail();
          playerIdx = 0;
          setTimeout(playSequence, 800);
        }
      });
    });
  }

  // 6. Deep-Space Array Alignment
  initAntennaTask() {
    const targetAngle = 135;
    let currentAngle = 0;

    const html = `
      <div class="antenna-task">
        <div class="antenna-display">
          <div class="dish-ring" id="dish-dial">
            <div class="dish-pointer"></div>
          </div>
        </div>
        <div class="antenna-feedback">
          <div id="signal-strength">SIGNAL LOCK: 0%</div>
          <input type="range" id="antenna-slider" min="0" max="360" value="0">
        </div>
      </div>
    `;
    this.containerEl.innerHTML = html;

    const dial = document.getElementById('dish-dial');
    const signal = document.getElementById('signal-strength');
    const slider = document.getElementById('antenna-slider');

    slider.addEventListener('input', (e) => {
      currentAngle = parseInt(e.target.value);
      dial.style.transform = `rotate(${currentAngle}deg)`;

      const diff = Math.abs(currentAngle - targetAngle);
      const matchPct = Math.max(0, 100 - Math.round((diff / 180) * 100));
      signal.textContent = `SIGNAL LOCK: ${matchPct}%`;

      if (diff < 8) {
        signal.textContent = `SIGNAL ACQUIRED (100%)!`;
        signal.style.color = '#00ff66';
        this.completeCurrentTask();
      }
    });
  }

  // 7. Atmospheric Pressure Valve
  initPressureTask() {
    let pressure = 20;
    const targetMin = 45;
    const targetMax = 75;
    let holdTime = 0;

    const html = `
      <div class="pressure-task">
        <div class="gauge-container">
          <div class="gauge-target"></div>
          <div class="gauge-fill" id="pressure-fill" style="height: 20%;"></div>
        </div>
        <button class="valve-btn" id="valve-btn">PUMP VALVE</button>
        <div class="valve-status" id="valve-status">Keep gauge in green zone for 2.5 seconds</div>
      </div>
    `;
    this.containerEl.innerHTML = html;

    const fill = document.getElementById('pressure-fill');
    const btn = document.getElementById('valve-btn');
    const status = document.getElementById('valve-status');

    btn.addEventListener('click', () => {
      window.soundSystem.playClick();
      pressure = Math.min(100, pressure + 14);
      fill.style.height = `${pressure}%`;
    });

    const interval = setInterval(() => {
      pressure = Math.max(0, pressure - 1.8);
      fill.style.height = `${pressure}%`;

      if (pressure >= targetMin && pressure <= targetMax) {
        holdTime += 0.1;
        fill.style.background = '#00ff66';
        status.textContent = `STABILIZING: ${(2.5 - holdTime).toFixed(1)}s`;
        if (holdTime >= 2.5) {
          clearInterval(interval);
          status.textContent = 'PRESSURE STABILIZED!';
          status.style.color = '#00ff66';
          this.completeCurrentTask();
        }
      } else {
        holdTime = 0;
        fill.style.background = '#ff3366';
      }
    }, 100);
  }

  // 8. Biometric Decontamination Scan
  initBioScanTask() {
    let progress = 0;

    const html = `
      <div class="bioscan-task">
        <div class="scanner-pod">
          <div class="laser-beam" id="scan-laser"></div>
          <div class="scanner-avatar">🧬</div>
        </div>
        <div class="scanner-status" id="scan-status">STAND BY FOR DECONTAMINATION</div>
        <button class="scanner-btn" id="scan-start-btn">BEGIN SCAN</button>
      </div>
    `;
    this.containerEl.innerHTML = html;

    const laser = document.getElementById('scan-laser');
    const status = document.getElementById('scan-status');
    const btn = document.getElementById('scan-start-btn');

    btn.addEventListener('click', () => {
      btn.disabled = true;
      laser.style.display = 'block';

      const interval = setInterval(() => {
        progress += 4;
        status.textContent = `DECONTAMINATING: ${progress}%`;
        laser.style.top = `${progress}%`;

        if (progress >= 100) {
          clearInterval(interval);
          status.textContent = 'BIO-SIGNATURE STERILE ✓';
          status.style.color = '#00ff66';
          this.completeCurrentTask();
        }
      }, 100);
    });
  }

  // S敵BOTA G E   F I X E S
  // Blackout Circuit Breakers
  initBlackoutFix() {
    const switches = [false, false, false, false];

    const html = `
      <div class="sab-fix-task">
        <h2>POWER GRID SUB-STATION BREAKERS</h2>
        <div class="breakers-grid">
          ${switches.map((_, i) => `
            <div class="breaker-slot">
              <button class="breaker-switch" data-id="${i}">OFF</button>
            </div>
          `).join('')}
        </div>
        <div class="hint">Flip all circuit breakers to ON</div>
      </div>
    `;
    this.containerEl.innerHTML = html;

    const btns = this.containerEl.querySelectorAll('.breaker-switch');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'));
        switches[id] = !switches[id];
        btn.textContent = switches[id] ? 'ON' : 'OFF';
        btn.classList.toggle('active', switches[id]);
        window.soundSystem.playClick();

        if (switches.every(s => s)) {
          window.soundSystem.playTaskSuccess();
          this.game.socket.emit('fix_sabotage', {
            roomCode: this.game.roomCode,
            terminalType: 'blackout_fix'
          });
          this.closeTask();
        }
      });
    });
  }

  // Comms Frequency Restorer
  initCommsFix() {
    let dialed = false;

    const html = `
      <div class="sab-fix-task">
        <h2>COMMS FREQUENCY ALIGNER</h2>
        <div class="radio-static" id="radio-screen">STATIC INTERFERENCE ACTIVE</div>
        <button class="action-btn" id="clear-static-btn">TUNE FREQUENCY</button>
      </div>
    `;
    this.containerEl.innerHTML = html;

    const btn = document.getElementById('clear-static-btn');
    const screen = document.getElementById('radio-screen');

    btn.addEventListener('click', () => {
      window.soundSystem.playClick();
      screen.textContent = 'SIGNAL FREQUENCY RESTORED';
      screen.style.color = '#00ff66';
      window.soundSystem.playTaskSuccess();
      this.game.socket.emit('fix_sabotage', {
        roomCode: this.game.roomCode,
        terminalType: 'comms_fix'
      });
      setTimeout(() => this.closeTask(), 500);
    });
  }

  // Meltdown Emergency Override
  initMeltdownOverride(type) {
    const html = `
      <div class="sab-fix-task">
        <h2 style="color:#ff3344">CRITICAL MELTDOWN OVERRIDE</h2>
        <div class="palm-scanner" id="palm-btn">
          <div class="palm-icon">✋</div>
          <div>HOLD TO OVERRIDE</div>
        </div>
        <div class="hint">Both Overrides A & B must be engaged to stop core detonation!</div>
      </div>
    `;
    this.containerEl.innerHTML = html;

    const palmBtn = document.getElementById('palm-btn');
    let held = false;

    palmBtn.addEventListener('click', () => {
      if (held) return;
      held = true;
      palmBtn.classList.add('holding');
      window.soundSystem.playClick();
      this.game.socket.emit('fix_sabotage', {
        roomCode: this.game.roomCode,
        terminalType: type
      });
      palmBtn.innerHTML = '<div>OVERRIDE ENGAGED ✓</div>';
      setTimeout(() => this.closeTask(), 800);
    });
  }

  // CCTV Camera Security Console
  initCCTVStation() {
    const cameras = [
      { id: 'cam_nexus', name: 'CAM 1: Central Nexus Hub', x: 1200, y: 750 },
      { id: 'cam_west_corr', name: 'CAM 2: West Concourse', x: 800, y: 900 },
      { id: 'cam_east_corr', name: 'CAM 3: East Concourse', x: 1600, y: 900 },
      { id: 'cam_north_vault', name: 'CAM 4: Vault Passage', x: 1200, y: 480 }
    ];
    let selectedCam = 0;

    const html = `
      <div class="cctv-task">
        <div class="cctv-header">
          <span id="cctv-cam-title">${cameras[0].name}</span>
          <span class="live-rec">● LIVE REC</span>
        </div>
        <canvas id="cctv-canvas" width="480" height="280"></canvas>
        <div class="cctv-buttons">
          ${cameras.map((c, i) => `
            <button class="cctv-btn ${i === 0 ? 'active' : ''}" data-idx="${i}">CAM ${i+1}</button>
          `).join('')}
        </div>
      </div>
    `;
    this.containerEl.innerHTML = html;

    const canvas = document.getElementById('cctv-canvas');
    const ctx = canvas.getContext('2d');
    const title = document.getElementById('cctv-cam-title');
    const btns = this.containerEl.querySelectorAll('.cctv-btn');

    btns.forEach(b => {
      b.addEventListener('click', () => {
        window.soundSystem.playClick();
        btns.forEach(btn => btn.classList.remove('active'));
        b.classList.add('active');
        selectedCam = parseInt(b.getAttribute('data-idx'));
        title.textContent = cameras[selectedCam].name;
      });
    });

    let animId;
    const renderCCTV = () => {
      ctx.fillStyle = '#0a1017';
      ctx.fillRect(0, 0, 480, 280);

      const cam = cameras[selectedCam];
      
      // Draw simulated camera view from that location
      ctx.save();
      ctx.translate(240 - cam.x, 140 - cam.y);

      // Render players near camera
      for (const p of this.game.players) {
        if (!p.isAlive || p.inVent) continue;
        if (Math.hypot(p.x - cam.x, p.y - cam.y) < 260) {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // Scanline static overlay
      ctx.fillStyle = 'rgba(0, 255, 204, 0.05)';
      for (let y = 0; y < 280; y += 4) {
        ctx.fillRect(0, y, 480, 1.5);
      }

      animId = requestAnimationFrame(renderCCTV);
    };

    renderCCTV();

    // Clean up on close
    const origClose = this.closeTask.bind(this);
    this.closeTask = () => {
      cancelAnimationFrame(animId);
      origClose();
    };
  }
}

window.TaskManager = TaskManager;
