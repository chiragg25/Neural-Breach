# NEURAL BREACH: SYNERGY 2026
### A Real-Time Multiplayer Online Social-Deduction Simulation
**Created for MGM SYNERGY 2026 Technology Exhibition**

---

## 🚀 Overview

**NEURAL BREACH: SYNERGY 2026** is an original real-time multiplayer social-deduction game set inside the **Aetheria Deep-Space Bio-Neural Research Facility (Sector-07)**.

Players join the same online game room and control original sci-fi cybernetic hazmat operatives. At match start, players are secretly assigned roles by an authoritative server:
- **RESEARCH OPERATIVES**: Complete calibration tasks around the station, maintain critical life-support/quantum systems against sabotage, and identify hidden saboteurs during Emergency Tribunals.
- **INFILTRATORS**: Rogue cybernetic saboteurs disguised as operatives. Infiltrators stalk operatives in isolated corridors, eliminate them quietly, crawl through ventilation ducts, and trigger station emergencies.

---

## 🌟 Key Features

1. **True Real-Time Multiplayer Networking**:
   - Built on a client-server architecture with Node.js, Express, and Socket.IO.
   - Smooth 60 FPS interpolated player movement across multiple computers and mobile devices.
   - Server-authoritative role assignment, task tracking, sabotage timers, and voting tally to prevent client manipulation.

2. **Exhibition-Ready Mode (MGM SYNERGY 2026)**:
   - **Autonomous AI Bot Support**: Visitors can immediately test the game alone or in pairs—clicking "Add AI Bot" fills the room with autonomous bots that walk, perform tasks, report bodies, participate in meeting chat, and vote!
   - **Accelerated Exhibition Preset**: 3-minute matches, 10s cooldowns, and automatic return to lobby.
   - **Local Wi-Fi Network Access**: Shows the host's LAN IP address (`http://192.168.x.x:3000`) so smartphones and tablets in the booth can connect instantly via room code.
   - **Interactive 30-Second Tutorial Modal**: Explains faction goals and controls for quick visitor onboarding.

3. **8 Interactive Mini-Game Tasks**:
   - **Circuit Matrix**: Connect matching color conduits across terminals.
   - **Quantum Core Calibration**: Adjust slider to lock frequency with station resonance wave.
   - **Security Cypher**: 5-digit digital keypad passcode entry.
   - **Bio-Sample Centrifuge**: Detect and sterilize anomalous biological vials.
   - **Memory Reboot**: Sequential memory reproduction.
   - **Deep-Space Array Alignment**: Rotate directional satellite dish dial to achieve 100% signal lock.
   - **Atmospheric Pressure Valve**: Pneumatic valve balancing in green optimal zone.
   - **Biometric Decontamination Scan**: Laser sweep diagnostic inside the scanner pod.

4. **Dynamic Sabotage Systems**:
   - **Quantum Core Meltdown (Critical Emergency)**: 35-second emergency countdown siren. Requires two operatives at separate terminals (Quantum Core & Life Support) to engage palm overrides simultaneously!
   - **Power Grid Blackout**: Dims station lighting, casting a dynamic flashlight beam cone around the player. Restored at Sub-Power Grid circuit breakers.
   - **Comms Array Jamming**: Blinds navigation radar and task beacons until tuned at Comms.
   - **Security Bulkhead Lockdown**: Doors slam shut and lock for 12 seconds.

5. **Security CCTV Camera Surveillance**:
   - Operatives in Security & CCTV can monitor 4 live camera feeds (Central Nexus, West Concourse, East Concourse, and Vault Passage) to catch Infiltrators red-handed!

6. **Procedural Web Audio API Sound Synthesizer**:
   - 100% self-contained audio engine with zero external MP3 dependencies:
     - Emergency klaxon alarm siren
     - Laser elimination punch & zap
     - Footstep vibrations & door slides
     - Task success chimes & error buzzers
     - Meeting gavel call
     - Victory fanfare and defeat synth drone

7. **Spectator Ghost Mode**:
   - Eliminated players become translucent holographic ghosts who can fly through walls, complete their remaining tasks to help Operatives win, and chat in the ghost channel.

---

## 🎮 Controls

| Action | Desktop / Keyboard | Mobile / Tablet Touchscreen |
| :--- | :--- | :--- |
| **Move** | `W`, `A`, `S`, `D` or `Arrow Keys` | Virtual Joystick (Lower-Left Zone) |
| **Interact / Task** | `E` key | On-Screen `USE` Button |
| **Report Body** | `R` key | On-Screen `REPORT` Button |
| **Neutralize (Infiltrator)** | `Q` key | On-Screen `NEUTRALIZE` Button |
| **Sabotage Menu** | On-Screen Button | On-Screen `SABOTAGE` Button |
| **Vent Conduit** | `Spacebar` | On-Screen `VENT` Button |
| **Emergency Tribunal** | Central Nexus Console | On-Screen `EMERGENCY` Button |

---

## 🛠️ Installation & Running

### Requirements
- Node.js (v18+ or v24+)
- npm

### 1. Start Server
From the project folder:
```powershell
node server.js
```

### 2. Access the Game
- **Local Machine**: Open your browser at `http://localhost:3000`
- **Other Devices on Same Wi-Fi (Laptops, Tablets, Phones)**:
  Open `http://<YOUR_LOCAL_IP>:3000` (The server console and the start screen will display the exact IP address).

### 3. Quick Exhibition Demonstration
1. Click **Create Room** on the host screen.
2. In the lobby, click **Add AI Bot** 3 or 4 times to fill the room with autonomous units.
3. Click **Launch Match**.
4. Test movement, interactive tasks, emergency reporting, discussions in chat, and voting!

---

## 🏛️ Station Map Layout (Sector-07)

```
        [ Security & CCTV ] -------- [ Maintenance Vault ] -------- [ Bio-Synthetics Lab ]
                |                                                              |
        [ Sub-Power Grid ] --------- [  CENTRAL NEXUS  ] ---------- [   Comms Array    ]
                |                     (Spawn & Tribunal)                       |
        [  Quantum Core  ] ---------------------------------------- [ Life Support & O2]
```

---

## 🏆 Win Conditions

- **OPERATIVES WIN**:
  1. Complete 100% of station research calibration tasks, OR
  2. Identify and eject all Infiltrators during tribunals.

- **INFILTRATORS WIN**:
  1. Eliminate enough Operatives so that living Infiltrators equal or outnumber living Operatives, OR
  2. Allow a Critical Quantum Core Meltdown timer to reach 0.

---

*Developed for MGM SYNERGY 2026.*
