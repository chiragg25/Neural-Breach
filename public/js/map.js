/**
 * NEURAL BREACH: SYNERGY 2026
 * Map Environment & Rendering Engine
 * Setting: Aetheria Bio-Neural Facility (Sector-07)
 */

class MapRenderer {
  constructor() {
    this.width = 2400;
    this.height = 1800;

    // Room definitions matching server
    this.rooms = [
      { id: 'nexus', name: 'Central Nexus', x: 900, y: 650, w: 600, h: 500, color: '#101c2b', floorStyle: 'nexus' },
      { id: 'reactor', name: 'Quantum Core', x: 200, y: 1100, w: 550, h: 550, color: '#1a0d24', floorStyle: 'reactor' },
      { id: 'lifesupport', name: 'Life Support & O2', x: 1650, y: 1100, w: 550, h: 550, color: '#0d221c', floorStyle: 'life' },
      { id: 'biolab', name: 'Bio-Synthetics Lab', x: 1650, y: 150, w: 550, h: 500, color: '#0a1d24', floorStyle: 'bio' },
      { id: 'power', name: 'Sub-Power Grid', x: 200, y: 550, w: 500, h: 450, color: '#261b0c', floorStyle: 'power' },
      { id: 'security', name: 'Security & CCTV', x: 200, y: 150, w: 500, h: 350, color: '#1a1012', floorStyle: 'sec' },
      { id: 'comms', name: 'Comms Array', x: 1700, y: 700, w: 500, h: 350, color: '#0f1d1b', floorStyle: 'comms' },
      { id: 'vault', name: 'Maintenance Vault', x: 950, y: 150, w: 500, h: 400, color: '#15151e', floorStyle: 'vault' },

      // Corridors
      { id: 'corr_west', name: 'West Conduit', x: 680, y: 800, w: 240, h: 200, isCorridor: true, color: '#0d131a' },
      { id: 'corr_east', name: 'East Conduit', x: 1480, y: 800, w: 240, h: 200, isCorridor: true, color: '#0d131a' },
      { id: 'corr_north', name: 'North Corridor', x: 1100, y: 530, w: 200, h: 140, isCorridor: true, color: '#0d131a' },
      { id: 'corr_southwest', name: 'Reactor Passage', x: 600, y: 1150, w: 320, h: 180, isCorridor: true, color: '#0d131a' },
      { id: 'corr_southeast', name: 'Life Support Way', x: 1480, y: 1150, w: 200, h: 180, isCorridor: true, color: '#0d131a' },
      { id: 'corr_sec_pwr', name: 'Security Tunnel', x: 380, y: 480, w: 140, h: 90, isCorridor: true, color: '#0d131a' },
      { id: 'corr_bio_comms', name: 'Bio-Comms Branch', x: 1850, y: 630, w: 150, h: 90, isCorridor: true, color: '#0d131a' },
      { id: 'corr_vault_sec', name: 'Upper West Duct', x: 680, y: 250, w: 290, h: 140, isCorridor: true, color: '#0d131a' },
      { id: 'corr_vault_bio', name: 'Upper East Duct', x: 1430, y: 250, w: 240, h: 140, isCorridor: true, color: '#0d131a' },
    ];

    this.terminals = [
      { id: 'term_emergency', type: 'emergency', roomId: 'nexus', name: 'Emergency Tribunal Console', x: 1200, y: 880, radius: 45, icon: '🚨' },
      { id: 'task_circuit', type: 'task', taskType: 'circuit', roomId: 'power', name: 'Circuit Matrix Rewire', x: 350, y: 700, radius: 40, icon: '⚡' },
      { id: 'task_quantum', type: 'task', taskType: 'quantum', roomId: 'reactor', name: 'Quantum Core Calibration', x: 350, y: 1350, radius: 40, icon: '⚛️' },
      { id: 'task_cypher', type: 'task', taskType: 'cypher', roomId: 'security', name: 'Security Cypher Key', x: 350, y: 250, radius: 40, icon: '🔢' },
      { id: 'task_biosample', type: 'task', taskType: 'biosample', roomId: 'biolab', name: 'Bio-Sample Centrifuge', x: 1800, y: 300, radius: 40, icon: '🧪' },
      { id: 'task_memory', type: 'task', taskType: 'memory', roomId: 'vault', name: 'Substation Memory Reboot', x: 1200, y: 250, radius: 40, icon: '💾' },
      { id: 'task_antenna', type: 'task', taskType: 'antenna', roomId: 'comms', name: 'Deep-Space Array Alignment', x: 2000, y: 800, radius: 40, icon: '📡' },
      { id: 'task_pressure', type: 'task', taskType: 'pressure', roomId: 'lifesupport', name: 'Atmospheric Pressure Valve', x: 2000, y: 1350, radius: 40, icon: '🎛️' },
      { id: 'task_bioscan', type: 'task', taskType: 'bioscan', roomId: 'biolab', name: 'Biometric Decontamination Scan', x: 2050, y: 450, radius: 45, icon: '🩺' },
      
      // Sabotage Terminals
      { id: 'sab_meltdown_a', type: 'meltdown_a', roomId: 'reactor', name: 'Reactor Coolant Override A', x: 550, y: 1450, radius: 40, icon: '⚠️' },
      { id: 'sab_meltdown_b', type: 'meltdown_b', roomId: 'lifesupport', name: 'Atmosphere Purge Override B', x: 1800, y: 1450, radius: 40, icon: '⚠️' },
      { id: 'sab_blackout', type: 'blackout_fix', roomId: 'power', name: 'Power Grid Circuit Breaker', x: 580, y: 700, radius: 40, icon: '💡' },
      { id: 'sab_comms', type: 'comms_fix', roomId: 'comms', name: 'Comms Frequency Restorer', x: 1850, y: 920, radius: 40, icon: '📶' },

      // CCTV Terminal
      { id: 'security_cctv', type: 'cctv', roomId: 'security', name: 'CCTV Security Station', x: 580, y: 250, radius: 40, icon: '📹' }
    ];

    this.vents = [
      { id: 'vent_reactor', roomId: 'reactor', x: 300, y: 1200 },
      { id: 'vent_security', roomId: 'security', x: 300, y: 400 },
      { id: 'vent_power', roomId: 'power', x: 600, y: 900 },
      { id: 'vent_nexus', roomId: 'nexus', x: 1400, y: 1050 },
      { id: 'vent_vault', roomId: 'vault', x: 1350, y: 250 },
      { id: 'vent_biolab', roomId: 'biolab', x: 2100, y: 250 },
      { id: 'vent_comms', roomId: 'comms', x: 2100, y: 950 },
      { id: 'vent_lifesupport', roomId: 'lifesupport', x: 2100, y: 1550 }
    ];

    this.doors = [
      { id: 'door_nexus_west', x: 900, y: 880, w: 20, h: 100, state: 0 },
      { id: 'door_nexus_east', x: 1480, y: 880, w: 20, h: 100, state: 0 },
      { id: 'door_nexus_north', x: 1180, y: 650, w: 100, h: 20, state: 0 },
      { id: 'door_reactor', x: 740, y: 1230, w: 20, h: 100, state: 0 },
      { id: 'door_lifesupport', x: 1640, y: 1230, w: 20, h: 100, state: 0 }
    ];

    this.walls = [
      { x: 150, y: 100, w: 2150, h: 30 },
      { x: 150, y: 1700, w: 2150, h: 30 },
      { x: 150, y: 100, w: 30, h: 1630 },
      { x: 2270, y: 100, w: 30, h: 1630 },
      { x: 180, y: 480, w: 200, h: 20 },
      { x: 500, y: 480, w: 200, h: 20 },
      { x: 680, y: 120, w: 20, h: 130 },
      { x: 680, y: 390, w: 20, h: 110 },
      { x: 180, y: 980, w: 520, h: 20 },
      { x: 680, y: 550, w: 20, h: 250 },
      { x: 730, y: 1100, w: 20, h: 130 },
      { x: 730, y: 1330, w: 20, h: 320 },
      { x: 200, y: 1080, w: 550, h: 20 },
      { x: 950, y: 120, w: 20, h: 420 },
      { x: 1430, y: 120, w: 20, h: 420 },
      { x: 950, y: 530, w: 150, h: 20 },
      { x: 1300, y: 530, w: 150, h: 20 },
      { x: 1650, y: 120, w: 20, h: 130 },
      { x: 1650, y: 390, w: 20, h: 260 },
      { x: 1650, y: 630, w: 200, h: 20 },
      { x: 2000, y: 630, w: 200, h: 20 },
      { x: 1700, y: 700, w: 20, h: 350 },
      { x: 1700, y: 1030, w: 500, h: 20 },
      { x: 1650, y: 1100, w: 20, h: 130 },
      { x: 1650, y: 1330, w: 20, h: 320 },
      { x: 1650, y: 1080, w: 550, h: 20 },
      { x: 900, y: 650, w: 200, h: 20 },
      { x: 1300, y: 650, w: 200, h: 20 },
      { x: 900, y: 650, w: 20, h: 230 },
      { x: 900, y: 980, w: 20, h: 170 },
      { x: 1480, y: 650, w: 20, h: 230 },
      { x: 1480, y: 980, w: 20, h: 170 },
      { x: 900, y: 1130, w: 600, h: 20 },
      { x: 1160, y: 840, w: 80, h: 80 },
      { x: 420, y: 1320, w: 100, h: 100 },
      { x: 1880, y: 1320, w: 90, h: 90 }
    ];

    this.animTime = 0;
  }

  update(dt, players, doorsLocked) {
    this.animTime += dt;

    // Update doors animation
    for (const door of this.doors) {
      if (doorsLocked) {
        // Slam shut
        door.state = Math.max(0, door.state - dt * 4);
      } else {
        // Open if any player near
        let playerNear = false;
        for (const p of players) {
          if (!p.isAlive) continue;
          const cx = door.x + door.w / 2;
          const cy = door.y + door.h / 2;
          if (Math.hypot(p.x - cx, p.y - cy) < 85) {
            playerNear = true;
            break;
          }
        }
        if (playerNear) {
          door.state = Math.min(1, door.state + dt * 3);
        } else {
          door.state = Math.max(0, door.state - dt * 3);
        }
      }
    }
  }

  // Check collision for player movement
  checkCollision(px, py, radius, doorsLocked) {
    // Check perimeter walls
    for (const w of this.walls) {
      const closestX = Math.max(w.x, Math.min(px, w.x + w.w));
      const closestY = Math.max(w.y, Math.min(py, w.y + w.h));
      const dist = Math.hypot(px - closestX, py - closestY);
      if (dist < radius) return true;
    }

    // Check doors if locked or closed
    for (const d of this.doors) {
      if (doorsLocked || d.state < 0.6) {
        const closestX = Math.max(d.x, Math.min(px, d.x + d.w));
        const closestY = Math.max(d.y, Math.min(py, d.y + d.h));
        const dist = Math.hypot(px - closestX, py - closestY);
        if (dist < radius) return true;
      }
    }

    return false;
  }

  render(ctx, camera, localPlayer, activeSabotage, doorsLocked) {
    ctx.save();

    // 1. Draw Space Void Background
    ctx.fillStyle = '#060a12';
    ctx.fillRect(camera.x - 200, camera.y - 200, camera.viewWidth + 400, camera.viewHeight + 400);

    // Subtle twinkling starfield in deep-space exterior
    const t = this.animTime * 0.5;
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 40; i++) {
      const sx = (i * 137.5) % 2500;
      const sy = (i * 249.7) % 2000;
      const alpha = 0.2 + 0.3 * Math.sin(t + i);
      ctx.globalAlpha = alpha;
      ctx.fillRect(sx, sy, 2, 2);
    }
    ctx.globalAlpha = 1.0;

    // 2. Draw Rooms Floor Grid
    for (const room of this.rooms) {
      ctx.fillStyle = room.color;
      ctx.fillRect(room.x, room.y, room.w, room.h);

      // Tech Grid Pattern
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      const step = 40;
      ctx.beginPath();
      for (let x = room.x; x <= room.x + room.w; x += step) {
        ctx.moveTo(x, room.y);
        ctx.lineTo(x, room.y + room.h);
      }
      for (let y = room.y; y <= room.y + room.h; y += step) {
        ctx.moveTo(room.x, y);
        ctx.lineTo(room.x + room.w, y);
      }
      ctx.stroke();

      // Atmospheric Floor Features
      if (room.floorStyle === 'nexus') {
        // Holographic projector ring
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 255, 204, 0.25)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(1200, 900, 140, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(0, 255, 204, 0.15)';
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.arc(1200, 900, 180 + Math.sin(this.animTime * 2) * 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (room.floorStyle === 'reactor') {
        // Quantum pulsing rings
        const pulse = (Math.sin(this.animTime * 3) + 1) / 2;
        ctx.fillStyle = `rgba(180, 50, 255, ${0.1 + pulse * 0.15})`;
        ctx.beginPath();
        ctx.arc(470, 1370, 120, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(210, 80, 255, 0.4)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(470, 1370, 70, 0, Math.PI * 2);
        ctx.stroke();
      } else if (room.floorStyle === 'power') {
        // Yellow hazard caution stripes
        ctx.strokeStyle = 'rgba(255, 200, 0, 0.12)';
        ctx.lineWidth = 6;
        for (let i = 0; i < room.w; i += 50) {
          ctx.beginPath();
          ctx.moveTo(room.x + i, room.y);
          ctx.lineTo(room.x + i + 30, room.y + 40);
          ctx.stroke();
        }
      } else if (room.floorStyle === 'life') {
        // Emerald Life Support air rings
        ctx.strokeStyle = 'rgba(0, 255, 120, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(1925, 1365, 80, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Room Name Label
      if (!room.isCorridor) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(room.name.toUpperCase(), room.labelX || (room.x + room.w / 2), room.labelY || (room.y + 40));
      }
    }

    // 3. Draw Vents
    for (const v of this.vents) {
      ctx.save();
      ctx.fillStyle = '#1e2430';
      ctx.strokeStyle = '#3d4d65';
      ctx.lineWidth = 2;
      ctx.fillRect(v.x - 18, v.y - 18, 36, 36);
      ctx.strokeRect(v.x - 18, v.y - 18, 36, 36);

      // Vent slats
      ctx.strokeStyle = '#00ffcc';
      ctx.lineWidth = 1.5;
      for (let s = -10; s <= 10; s += 6) {
        ctx.beginPath();
        ctx.moveTo(v.x - 12, v.y + s);
        ctx.lineTo(v.x + 12, v.y + s);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 4. Draw Walls & Partitions
    for (const w of this.walls) {
      // Wall Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(w.x + 4, w.y + 4, w.w, w.h);

      // Wall Body
      ctx.fillStyle = '#222b3d';
      ctx.fillRect(w.x, w.y, w.w, w.h);

      // Metallic Top Bevel
      ctx.fillStyle = '#34435e';
      ctx.fillRect(w.x, w.y, w.w, Math.min(w.h, 6));

      // Neon Conduit Line
      ctx.strokeStyle = 'rgba(0, 255, 204, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(w.x + 1, w.y + 1, w.w - 2, w.h - 2);
    }

    // 5. Draw Doors
    for (const d of this.doors) {
      ctx.save();
      const openOffset = (1 - d.state);

      if (doorsLocked) {
        ctx.fillStyle = '#ff2a4b'; // Emergency Lockdown Red
      } else {
        ctx.fillStyle = '#3b4c68';
      }

      if (d.w > d.h) {
        // Horizontal sliding door
        const partW = (d.w / 2) * openOffset;
        ctx.fillRect(d.x, d.y, partW, d.h);
        ctx.fillRect(d.x + d.w - partW, d.y, partW, d.h);
      } else {
        // Vertical sliding door
        const partH = (d.h / 2) * openOffset;
        ctx.fillRect(d.x, d.y, d.w, partH);
        ctx.fillRect(d.x, d.y + d.h - partH, d.w, partH);
      }

      // Warning indicator light
      ctx.fillStyle = doorsLocked ? '#ff0033' : (d.state > 0.5 ? '#00ff66' : '#ffaa00');
      ctx.beginPath();
      ctx.arc(d.x + d.w / 2, d.y + d.h / 2, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // 6. Draw Terminals & Consoles
    for (const term of this.terminals) {
      ctx.save();
      const isAssigned = localPlayer && localPlayer.assignedTasks && 
        localPlayer.assignedTasks.some(t => t.id === term.id && !t.completed);
      
      const isCriticalMeltdown = activeSabotage && activeSabotage.type === 'meltdown' && 
        (term.id === 'sab_meltdown_a' || term.id === 'sab_meltdown_b');

      const isBlackoutTerm = activeSabotage && activeSabotage.type === 'blackout' && term.id === 'sab_blackout';
      const isCommsTerm = activeSabotage && activeSabotage.type === 'comms' && term.id === 'sab_comms';

      const needsAttention = isCriticalMeltdown || isBlackoutTerm || isCommsTerm;

      // Base Console Pedestal
      ctx.fillStyle = '#18202d';
      ctx.strokeStyle = needsAttention ? '#ff3344' : (isAssigned ? '#ffea00' : '#45597a');
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.arc(term.x, term.y, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Pulsing Beacon Ring
      if (isAssigned || needsAttention) {
        const pulse = (Math.sin(this.animTime * 5) + 1) / 2;
        ctx.strokeStyle = needsAttention ? `rgba(255, 50, 70, ${0.4 + pulse * 0.5})` : `rgba(255, 230, 0, ${0.4 + pulse * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(term.x, term.y, 28 + pulse * 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Terminal Icon / Emoji
      ctx.font = '18px "Segoe UI Emoji", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(term.icon, term.x, term.y);

      // Terminal Name Tag
      ctx.fillStyle = needsAttention ? '#ff4455' : (isAssigned ? '#ffee44' : '#99bbdd');
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(term.name, term.x, term.y + 34);

      ctx.restore();
    }

    ctx.restore();
  }

  // Draw Dynamic Darkness / Flashlight when Power Grid Blackout is Active
  renderLighting(ctx, camera, localPlayer, isBlackout) {
    if (!isBlackout || !localPlayer) return;

    ctx.save();
    // Create darkness canvas mask
    const cx = localPlayer.x;
    const cy = localPlayer.y;

    // Dark ambient fog
    const gradient = ctx.createRadialGradient(cx, cy, 30, cx, cy, 220);
    gradient.addColorStop(0, 'rgba(10, 15, 25, 0.0)');
    gradient.addColorStop(0.4, 'rgba(10, 15, 25, 0.4)');
    gradient.addColorStop(0.85, 'rgba(8, 12, 20, 0.92)');
    gradient.addColorStop(1, 'rgba(5, 8, 15, 0.98)');

    ctx.fillStyle = gradient;
    ctx.fillRect(camera.x, camera.y, camera.viewWidth, camera.viewHeight);

    // Flashlight cone along player angle
    const angle = localPlayer.angle || 0;
    const coneDist = 280;
    const coneWidth = 0.55; // radians

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, coneDist, angle - coneWidth, angle + coneWidth);
    ctx.closePath();
    ctx.clip();

    // Clear inside flashlight
    const flashGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, coneDist);
    flashGrad.addColorStop(0, 'rgba(255, 255, 220, 0.15)');
    flashGrad.addColorStop(0.7, 'rgba(255, 240, 180, 0.05)');
    flashGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = flashGrad;
    ctx.fill();

    ctx.restore();
    ctx.restore();
  }
}

window.MapRenderer = MapRenderer;
