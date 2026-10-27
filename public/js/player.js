/**
 * NEURAL BREACH: SYNERGY 2026
 * Player Character & Silhouette Renderer
 * Original futuristic sci-fi hazmat exosuit with glowing visor,
 * walking cycle animations, fallen bio-beacons, and ethereal spectator ghosts.
 */

class PlayerRenderer {
  constructor() {
    this.walkAnimTime = 0;
  }

  update(dt) {
    this.walkAnimTime += dt * 8;
  }

  render(ctx, player, isLocal, localPlayerRole, teammates) {
    if (player.inVent) return; // Hidden in vent conduits

    ctx.save();
    ctx.translate(player.x, player.y);

    const isGhost = !player.isAlive;
    const canSeeGhost = isGhost && (!player.isAlive);

    // Living players cannot see dead ghosts
    if (isGhost) {
      ctx.globalAlpha = 0.45;
    }

    // Determine if Infiltrator indicator should be shown
    const isTeammateInfiltrator = localPlayerRole === 'infiltrator' && 
      teammates && teammates.some(t => t.id === player.id);

    // 1. Draw Directional Headlamp (subtle light cone)
    if (!isGhost) {
      ctx.save();
      ctx.rotate(player.angle);
      const lightGrad = ctx.createRadialGradient(0, 0, 10, 80, 0, 110);
      lightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
      lightGrad.addColorStop(0.5, 'rgba(0, 255, 204, 0.08)');
      lightGrad.addColorStop(1, 'rgba(0, 255, 204, 0.0)');
      ctx.fillStyle = lightGrad;
      ctx.beginPath();
      ctx.moveTo(10, -5);
      ctx.lineTo(120, -35);
      ctx.arc(0, 0, 120, -0.3, 0.3);
      ctx.lineTo(10, 5);
      ctx.fill();
      ctx.restore();
    }

    // 2. Character Body Rotation
    ctx.save();
    ctx.rotate(player.angle);

    // Ghost floating effect
    if (isGhost) {
      const floatY = Math.sin(this.walkAnimTime * 0.5) * 4;
      ctx.translate(0, floatY);
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 4, 16, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Walking leg animation
    const legOffset = isGhost ? 0 : Math.sin(this.walkAnimTime) * 6;

    // Left Boot
    ctx.fillStyle = '#1b2230';
    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = 1.5;
    ctx.fillRect(-10, -14 + legOffset, 8, 10);
    ctx.strokeRect(-10, -14 + legOffset, 8, 10);

    // Right Boot
    ctx.fillRect(-10, 4 - legOffset, 8, 10);
    ctx.strokeRect(-10, 4 - legOffset, 8, 10);

    // Life-Support Backpack Cell
    ctx.fillStyle = '#1e2838';
    ctx.strokeStyle = player.color;
    ctx.lineWidth = 1.5;
    ctx.fillRect(-18, -9, 8, 18);
    ctx.strokeRect(-18, -9, 8, 18);

    // Battery glow line
    ctx.fillStyle = isGhost ? '#88ffff' : '#00ffcc';
    ctx.fillRect(-16, -6, 4, 12);

    // Main Exosuit Torso
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.ellipse(-2, 0, 14, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    // Torso armor plate bevel
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.beginPath();
    ctx.ellipse(-3, -2, 10, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Helmet Dome
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(6, 0, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Glowing Panoramic Visor
    const visorGrad = ctx.createLinearGradient(6, -8, 16, 8);
    if (isGhost) {
      visorGrad.addColorStop(0, '#a5f3fc');
      visorGrad.addColorStop(1, '#06b6d4');
    } else {
      visorGrad.addColorStop(0, '#38bdf8');
      visorGrad.addColorStop(0.5, '#0284c7');
      visorGrad.addColorStop(1, '#0369a1');
    }
    ctx.fillStyle = visorGrad;
    ctx.beginPath();
    ctx.ellipse(11, 0, 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Visor Glare / Specular highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.ellipse(12, -3, 2, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shoulder Pauldrons
    ctx.fillStyle = '#334155';
    ctx.fillRect(-2, -14, 8, 4);
    ctx.fillRect(-2, 10, 8, 4);

    ctx.restore(); // Restore body rotation

    // 3. Nameplate & Overhead UI
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px "Segoe UI", sans-serif';

    // Local player highlight ring
    if (isLocal) {
      ctx.strokeStyle = localPlayerRole === 'infiltrator' ? 'rgba(255, 51, 85, 0.7)' : 'rgba(0, 255, 204, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Role tags are ONLY visible to the local player for themselves (and impostor teammates)
    let tag = isLocal ? ' (YOU)' : '';
    let textColor = '#ffffff';

    if (isLocal) {
      if (localPlayerRole === 'infiltrator') {
        tag = ' [IMPOSTOR]';
        textColor = '#ff3366';
      } else {
        tag = ' [CREWMATE]';
        textColor = '#00ffcc';
      }
    } else if (isTeammateInfiltrator) {
      tag = ' [IMPOSTOR ALLY]';
      textColor = '#ff3366';
    }

    const nameText = player.name + (player.isBot ? ' [BOT]' : '') + tag;
    const textWidth = ctx.measureText(nameText).width;

    // Name background badge
    ctx.fillStyle = 'rgba(10, 15, 25, 0.85)';
    ctx.fillRect(-textWidth / 2 - 6, -34, textWidth + 12, 16);

    ctx.fillStyle = textColor;
    ctx.fillText(nameText, 0, -22);

    // Ghost icon if eliminated
    if (isGhost) {
      ctx.font = '12px sans-serif';
      ctx.fillText('👻', 0, -38);
    }

    ctx.restore();
  }

  // Render Fallen Operative Bio-Beacon (Dead Body)
  renderDeadBody(ctx, body) {
    ctx.save();
    ctx.translate(body.x, body.y);

    // Pulsing SOS Beacon Ring
    const now = Date.now() / 400;
    const pulse = (Math.sin(now) + 1) / 2;
    ctx.strokeStyle = `rgba(255, 51, 85, ${0.4 + pulse * 0.5})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 20 + pulse * 14, 0, Math.PI * 2);
    ctx.stroke();

    // Blood / Hazard Spill
    ctx.fillStyle = 'rgba(255, 20, 60, 0.2)';
    ctx.beginPath();
    ctx.ellipse(2, 4, 18, 12, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Fallen Suit Lower Torso
    ctx.fillStyle = body.color || '#ff3366';
    ctx.beginPath();
    ctx.ellipse(-6, 2, 12, 10, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Fallen Helmet on Floor
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(10, -4, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Cracked Visor
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.ellipse(12, -4, 4, 6, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Bio-Beacon Spike in the center
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-2, -18, 4, 14);
    ctx.fillStyle = '#ff2255';
    ctx.beginPath();
    ctx.arc(0, -18, 5, 0, Math.PI * 2);
    ctx.fill();

    // Name Label
    ctx.fillStyle = '#ff6688';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`FALLEN: ${body.operativeName}`, 0, -26);

    ctx.restore();
  }
}

window.PlayerRenderer = PlayerRenderer;
