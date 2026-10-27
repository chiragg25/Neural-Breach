/**
 * NEURAL BREACH: SYNERGY 2026
 * Map Geometry, Rooms, Terminals, Vents, and Security Cameras
 * Setting: Aetheria Bio-Neural Research Facility (Sector-07)
 */

const MAP_WIDTH = 2400;
const MAP_HEIGHT = 1800;

// Room definitions with bounding boxes and atmospheric themes
const ROOMS = [
  { id: 'nexus', name: 'Central Nexus', x: 900, y: 650, w: 600, h: 500, color: '#1a2736', labelX: 1200, labelY: 900 },
  { id: 'reactor', name: 'Quantum Core', x: 200, y: 1100, w: 550, h: 550, color: '#2a1a36', labelX: 475, labelY: 1375 },
  { id: 'lifesupport', name: 'Life Support & O2', x: 1650, y: 1100, w: 550, h: 550, color: '#1a332a', labelX: 1925, labelY: 1375 },
  { id: 'biolab', name: 'Bio-Synthetics Lab', x: 1650, y: 150, w: 550, h: 500, color: '#162e38', labelX: 1925, labelY: 400 },
  { id: 'power', name: 'Sub-Power Grid', x: 200, y: 550, w: 500, h: 450, color: '#332914', labelX: 450, labelY: 775 },
  { id: 'security', name: 'Security & CCTV', x: 200, y: 150, w: 500, h: 350, color: '#261b1b', labelX: 450, labelY: 325 },
  { id: 'comms', name: 'Comms Array', x: 1700, y: 700, w: 500, h: 350, color: '#182b26', labelX: 1950, labelY: 875 },
  { id: 'vault', name: 'Maintenance Vault', x: 950, y: 150, w: 500, h: 400, color: '#22222b', labelX: 1200, labelY: 350 },
  
  // Corridors
  { id: 'corr_west', name: 'West Conduit', x: 680, y: 800, w: 240, h: 200, isCorridor: true },
  { id: 'corr_east', name: 'East Conduit', x: 1480, y: 800, w: 240, h: 200, isCorridor: true },
  { id: 'corr_north', name: 'North Corridor', x: 1100, y: 530, w: 200, h: 140, isCorridor: true },
  { id: 'corr_southwest', name: 'Reactor Passage', x: 600, y: 1150, w: 320, h: 180, isCorridor: true },
  { id: 'corr_southeast', name: 'Life Support Way', x: 1480, y: 1150, w: 200, h: 180, isCorridor: true },
  { id: 'corr_sec_pwr', name: 'Security Tunnel', x: 380, y: 480, w: 140, h: 90, isCorridor: true },
  { id: 'corr_bio_comms', name: 'Bio-Comms Branch', x: 1850, y: 630, w: 150, h: 90, isCorridor: true },
  { id: 'corr_vault_sec', name: 'Upper West Duct', x: 680, y: 250, w: 290, h: 140, isCorridor: true },
  { id: 'corr_vault_bio', name: 'Upper East Duct', x: 1430, y: 250, w: 240, h: 140, isCorridor: true },
];

// Interactive Terminals (Tasks & Sabotages & Emergency)
const TERMINALS = [
  // Nexus
  { id: 'term_emergency', type: 'emergency', roomId: 'nexus', name: 'Emergency Tribunal Console', x: 1200, y: 880, radius: 45 },
  
  // Tasks
  { id: 'task_circuit', type: 'task', taskType: 'circuit', roomId: 'power', name: 'Circuit Matrix Rewire', x: 350, y: 700, radius: 40 },
  { id: 'task_quantum', type: 'task', taskType: 'quantum', roomId: 'reactor', name: 'Quantum Core Calibration', x: 350, y: 1350, radius: 40 },
  { id: 'task_cypher', type: 'task', taskType: 'cypher', roomId: 'security', name: 'Security Cypher Key', x: 350, y: 250, radius: 40 },
  { id: 'task_biosample', type: 'task', taskType: 'biosample', roomId: 'biolab', name: 'Bio-Sample Centrifuge', x: 1800, y: 300, radius: 40 },
  { id: 'task_memory', type: 'task', taskType: 'memory', roomId: 'vault', name: 'Substation Memory Reboot', x: 1200, y: 250, radius: 40 },
  { id: 'task_antenna', type: 'task', taskType: 'antenna', roomId: 'comms', name: 'Deep-Space Array Alignment', x: 2000, y: 800, radius: 40 },
  { id: 'task_pressure', type: 'task', taskType: 'pressure', roomId: 'lifesupport', name: 'Atmospheric Pressure Valve', x: 2000, y: 1350, radius: 40 },
  { id: 'task_bioscan', type: 'task', taskType: 'bioscan', roomId: 'biolab', name: 'Biometric Decontamination Scan', x: 2050, y: 450, radius: 45 },
  
  // Sabotage Resolution Terminals
  { id: 'sab_meltdown_a', type: 'meltdown_a', roomId: 'reactor', name: 'Reactor Coolant Override A', x: 550, y: 1450, radius: 40 },
  { id: 'sab_meltdown_b', type: 'meltdown_b', roomId: 'lifesupport', name: 'Atmosphere Purge Override B', x: 1800, y: 1450, radius: 40 },
  { id: 'sab_blackout', type: 'blackout_fix', roomId: 'power', name: 'Power Grid Circuit Breaker', x: 580, y: 700, radius: 40 },
  { id: 'sab_comms', type: 'comms_fix', roomId: 'comms', name: 'Comms Frequency Restorer', x: 1850, y: 920, radius: 40 },
  
  // CCTV Station
  { id: 'security_cctv', type: 'cctv', roomId: 'security', name: 'CCTV Security Station', x: 580, y: 250, radius: 40 }
];

// Infiltrator Vent Conduits
const VENTS = [
  { id: 'vent_reactor', roomId: 'reactor', x: 300, y: 1200, connectsTo: ['vent_security', 'vent_power'] },
  { id: 'vent_security', roomId: 'security', x: 300, y: 400, connectsTo: ['vent_reactor', 'vent_vault'] },
  { id: 'vent_power', roomId: 'power', x: 600, y: 900, connectsTo: ['vent_reactor', 'vent_nexus'] },
  { id: 'vent_nexus', roomId: 'nexus', x: 1400, y: 1050, connectsTo: ['vent_power', 'vent_lifesupport'] },
  { id: 'vent_vault', roomId: 'vault', x: 1350, y: 250, connectsTo: ['vent_security', 'vent_biolab'] },
  { id: 'vent_biolab', roomId: 'biolab', x: 2100, y: 250, connectsTo: ['vent_vault', 'vent_comms'] },
  { id: 'vent_comms', roomId: 'comms', x: 2100, y: 950, connectsTo: ['vent_biolab', 'vent_lifesupport'] },
  { id: 'vent_lifesupport', roomId: 'lifesupport', x: 2100, y: 1550, connectsTo: ['vent_comms', 'vent_nexus'] }
];

// Security CCTV Cameras (Coverage Nodes)
const CCTV_CAMERAS = [
  { id: 'cam_nexus', name: 'Central Nexus Hub', x: 1200, y: 750, range: 350 },
  { id: 'cam_west_corr', name: 'West Concourse', x: 800, y: 900, range: 250 },
  { id: 'cam_east_corr', name: 'East Concourse', x: 1600, y: 900, range: 250 },
  { id: 'cam_north_vault', name: 'Vault Passage', x: 1200, y: 480, range: 280 }
];

// Doors that can be locked during sabotage
const DOORS = [
  { id: 'door_nexus_west', x: 900, y: 880, w: 20, h: 100, locked: false, normalOpen: true },
  { id: 'door_nexus_east', x: 1480, y: 880, w: 20, h: 100, locked: false, normalOpen: true },
  { id: 'door_nexus_north', x: 1180, y: 650, w: 100, h: 20, locked: false, normalOpen: true },
  { id: 'door_reactor', x: 740, y: 1230, w: 20, h: 100, locked: false, normalOpen: true },
  { id: 'door_lifesupport', x: 1640, y: 1230, w: 20, h: 100, locked: false, normalOpen: true }
];

// Obstacle / Wall collision segments for server & client collision detection
// Each wall is an AABB box: { x, y, w, h }
const WALLS = [
  // Outer Station Perimeter
  { x: 150, y: 100, w: 2150, h: 30 },
  { x: 150, y: 1700, w: 2150, h: 30 },
  { x: 150, y: 100, w: 30, h: 1630 },
  { x: 2270, y: 100, w: 30, h: 1630 },

  // Internal Room Dividers & Partitions
  // Security Room walls
  { x: 180, y: 480, w: 200, h: 20 },
  { x: 500, y: 480, w: 200, h: 20 },
  { x: 680, y: 120, w: 20, h: 130 },
  { x: 680, y: 390, w: 20, h: 110 },

  // Power Room walls
  { x: 180, y: 980, w: 520, h: 20 },
  { x: 680, y: 550, w: 20, h: 250 },

  // Reactor walls
  { x: 730, y: 1100, w: 20, h: 130 },
  { x: 730, y: 1330, w: 20, h: 320 },
  { x: 200, y: 1080, w: 550, h: 20 },

  // Maintenance Vault walls
  { x: 950, y: 120, w: 20, h: 420 },
  { x: 1430, y: 120, w: 20, h: 420 },
  { x: 950, y: 530, w: 150, h: 20 },
  { x: 1300, y: 530, w: 150, h: 20 },

  // Bio-Lab walls
  { x: 1650, y: 120, w: 20, h: 130 },
  { x: 1650, y: 390, w: 20, h: 260 },
  { x: 1650, y: 630, w: 200, h: 20 },
  { x: 2000, y: 630, w: 200, h: 20 },

  // Comms Room walls
  { x: 1700, y: 700, w: 20, h: 350 },
  { x: 1700, y: 1030, w: 500, h: 20 },

  // Life Support walls
  { x: 1650, y: 1100, w: 20, h: 130 },
  { x: 1650, y: 1330, w: 20, h: 320 },
  { x: 1650, y: 1080, w: 550, h: 20 },

  // Central Nexus Borders
  { x: 900, y: 650, w: 200, h: 20 },
  { x: 1300, y: 650, w: 200, h: 20 },
  { x: 900, y: 650, w: 20, h: 230 },
  { x: 900, y: 980, w: 20, h: 170 },
  { x: 1480, y: 650, w: 20, h: 230 },
  { x: 1480, y: 980, w: 20, h: 170 },
  { x: 900, y: 1130, w: 600, h: 20 },

  // Interior Decor & Pillars
  { x: 1160, y: 840, w: 80, h: 80 }, // Central Holographic Table
  { x: 420, y: 1320, w: 100, h: 100 }, // Quantum Reactor Core Ring
  { x: 1880, y: 1320, w: 90, h: 90 }  // Life Support Air Scrubber
];

module.exports = {
  MAP_WIDTH,
  MAP_HEIGHT,
  ROOMS,
  TERMINALS,
  VENTS,
  CCTV_CAMERAS,
  DOORS,
  WALLS
};
