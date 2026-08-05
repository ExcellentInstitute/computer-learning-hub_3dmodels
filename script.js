// =========================================================
// STATE & CONFIGURATION
// =========================================================
const FIREBASE_URL = 'https://firebasestorage.googleapis.com/v0/b/excellent-institute-vault.firebasestorage.app/o/vault%2Flab_data_3d.json?alt=media&token=b44afe29-a3a3-4911-a835-5e98eeaa8aec';
const REPO_URL = 'https://excellentinstitute.github.io/computer-learning-hub_3dmodels/';

let dbData = {};
let selectedComponent = 'CPU';
let isFetching = true;

// 25 Component Hardware Plug States (Default to ON)
const plugStates = {
    'PSU': true, 'CPU': true, 'RAM': true, 'GPU': true, 'Fan': true,
    'SSD': true, 'HDD': true, 'ODD': true, 'Chipset': true, 'VRM': true,
    'CMOS': true, 'TPM': true, 'ATX24': true, 'EPS8': true, 'SATA': true,
    'NIC': true, 'WiFi': true, 'SoundCard': true, 'CaptureCard': true, 'Riser': true,
    'RGB': true, 'WaterPump': true, 'M2Heatsink': true, 'FrontPanel': true, 'USB3': true
};

const powerComponents = ['PSU', 'ATX24', 'EPS8', 'CMOS'];

// Perfected 3D Viewing Angles for the Volumetric Tower
const componentViewingAngles = {
    'FrontPanel': 0, 'USB3': 0, 'ODD': 0,
    'PSU': -75, 'CPU': -75, 'RAM': -75, 'GPU': -75, 'WaterPump': -75,
    'Fan': -75, 'SSD': -75, 'HDD': -75, 'Chipset': -75, 'VRM': -75,
    'CMOS': -75, 'TPM': -75, 'ATX24': -75, 'EPS8': -75, 'SATA': -75,
    'NIC': -75, 'WiFi': -75, 'SoundCard': -75, 'CaptureCard': -75,
    'Riser': -75, 'RGB': -75, 'M2Heatsink': -75
};

// System & Animation Variables
let sysTemp = 40;
let isThermalShutdown = false;
let isBooting = false;
let heatingInterval = null;
let desktopLoop = null;
let bootTimeout = null;
let zoomTimeout = null;

let isDraggingTower = false;
let startX = 0;
let currentRotation = -35; 

// =========================================================
// DOM ELEMENT MAPPING
// =========================================================
const UI = {
    selector: document.getElementById('component-selector'),
    title: document.getElementById('comp-title'),
    badge: document.getElementById('comp-badge'),
    desc: document.getElementById('comp-desc'),
    viewer3D: document.getElementById('component-3d-viewer'),
    
    // Isolated Volumetric 3D Tower Elements
    towerContainer: document.getElementById('pc-tower-container'),
    tower3D: document.getElementById('pc-tower'),
    sparkContainer: document.getElementById('global-spark-container'),
    sparkEmitter: document.getElementById('internal-spark-emitter'),
    
    // Monitor Layers (Static & Crisp)
    screenBios: document.getElementById('screen-bios'),
    screenBoot: document.getElementById('screen-boot'),
    screenDesktop: document.getElementById('screen-desktop'),
    screenError: document.getElementById('screen-error'),
    gpuGlitch: document.getElementById('gpu-glitch'),
    
    // Text & LEDs
    biosText: document.getElementById('bios-text'),
    errorText: document.getElementById('error-text'),
    powerLed: document.getElementById('power-led'),
    towerPowerLed: document.getElementById('tower-power-led'),
    
    // Desktop Widgets
    widCpuBar: document.getElementById('wid-cpu-bar'),
    widCpuVal: document.getElementById('wid-cpu-val'),
    widRamBar: document.getElementById('wid-ram-bar'),
    widRamVal: document.getElementById('wid-ram-val'),
    widTempVal: document.getElementById('wid-temp-val'),
    widNetVal: document.getElementById('wid-net-val')
};

// =========================================================
// INITIALIZATION
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    fetchHardwareData();
    setupEventListeners();
    setupTowerRotation();
    startDesktopLoop();
    initiateBootSequence();
});

// =========================================================
// DATA FETCHING & PRE-CONFIGURED GLB URLS
// =========================================================
async function fetchHardwareData() {
    try {
        const cacheBusterUrl = `${FIREBASE_URL}&t=${new Date().getTime()}`;
        const response = await fetch(cacheBusterUrl);
        if (response.ok) {
            const serverData = await response.json();
            dbData = { ...generateAdvancedFallback(), ...serverData };
        } else {
            dbData = generateAdvancedFallback();
        }
    } catch (error) {
        console.error("Firebase fetch failed, loading local logic engine.", error);
        dbData = generateAdvancedFallback();
    }
    isFetching = false;
    updateInspector(false); 
}

function generateAdvancedFallback() {
    return {
        'PSU': { title: '850W Power Supply', statusOn: 'DELIVERING', statusOff: 'NO POWER', descOn: 'Converting AC to DC voltage for the system.', descOff: 'Critical: System lost all power. Blackout.', model_url: `${REPO_URL}psu.glb` },
        'CPU': { title: 'Central Processing Unit', statusOn: 'EXECUTING', statusOff: 'SOCKET EMPTY', descOn: 'Handling OS instructions and IPC routing.', descOff: 'Fatal Error: System freezes before POST.', model_url: `${REPO_URL}cpu.glb` },
        'RAM': { title: 'DDR5 Memory', statusOn: 'ALLOCATED', statusOff: 'NO MEMORY', descOn: 'Providing volatile storage for the OS.', descOff: 'Fatal Error: Memory Management BSOD.', model_url: `${REPO_URL}ram.glb` },
        'GPU': { title: 'PCIe Graphics Card', statusOn: 'RENDERING', statusOff: 'NO SIGNAL', descOn: 'Pushing high-framerate pixel data.', descOff: 'Display Error: Monitor receives no video signal.', model_url: `${REPO_URL}gpu.glb` },
        'Fan': { title: 'RGB Cooling Fan', statusOn: '1800 RPM', statusOff: 'STOPPED', descOn: 'Exhausting ambient heat from the chassis.', descOff: 'Warning: Airflow reduced. Ambient temp rising.', model_url: `${REPO_URL}fan.glb` },
        'SSD': { title: 'NVMe M.2 Drive', statusOn: 'MOUNTED (C:\\)', statusOff: 'UNMOUNTED', descOn: 'Hosting the primary bootloader and OS.', descOff: 'Boot Error: Boot Device Not Found.', model_url: `${REPO_URL}ssd.glb` },
        'HDD': { title: 'Mechanical Hard Drive', statusOn: 'MOUNTED (D:\\)', statusOff: 'DISCONNECTED', descOn: 'Secondary mass storage archive.', descOff: 'Degraded: Secondary storage paths broken.', model_url: `${REPO_URL}hdd.glb` },
        'ODD': { title: 'Optical Disk Drive', statusOn: 'READY', statusOff: 'OFFLINE', descOn: 'Reading legacy CD/DVD media.', descOff: 'Non-critical: Disc media unavailable.', model_url: `${REPO_URL}odd.glb` },
        'Chipset': { title: 'Motherboard Chipset', statusOn: 'ROUTING', statusOff: 'FAILED', descOn: 'Managing data flow between CPU and peripherals.', descOff: 'Fatal: I/O communication severed.', model_url: `${REPO_URL}chipset.glb` },
        'VRM': { title: 'VRM Heatsink', statusOn: 'STABLE', statusOff: 'OVERHEATING', descOn: 'Cooling the voltage regulator modules.', descOff: 'Warning: Power delivery unstable. CPU throttling.', model_url: `${REPO_URL}vrm.glb` },
        'CMOS': { title: 'CMOS Battery', statusOn: '3.3V', statusOff: 'DEAD', descOn: 'Powering volatile BIOS memory.', descOff: 'BIOS Error: CMOS Checksum invalid. Time reset.', model_url: `${REPO_URL}cmos.glb` },
        'TPM': { title: 'Security Module (TPM 2.0)', statusOn: 'SECURE', statusOff: 'MISSING', descOn: 'Providing hardware-level cryptographic keys.', descOff: 'OS Error: ExcellentOS requires TPM 2.0 to boot.', model_url: `${REPO_URL}tpm.glb` },
        'ATX24': { title: '24-pin Main Cable', statusOn: 'POWERED', statusOff: 'UNPLUGGED', descOn: 'Delivering primary 12V/5V/3.3V to the board.', descOff: 'Critical: Motherboard has no power.', model_url: `${REPO_URL}atx24.glb` },
        'EPS8': { title: '8-pin CPU Power', statusOn: 'DELIVERING', statusOff: 'UNPLUGGED', descOn: 'Delivering dedicated 12V power to the CPU.', descOff: 'Fatal: CPU receives no power. System halt.', model_url: `${REPO_URL}eps8.glb` },
        'SATA': { title: 'SATA Data Cable', statusOn: 'LINKED', statusOff: 'UNPLUGGED', descOn: 'Connecting the HDD to the motherboard.', descOff: 'Degraded: HDD communication lost.', model_url: `${REPO_URL}sata.glb` },
        'NIC': { title: 'Network Card', statusOn: '1Gbps LINK', statusOff: 'OFFLINE', descOn: 'Handling wired TCP/IP packet routing.', descOff: 'Network: Wired LAN disconnected.', model_url: `${REPO_URL}nic.glb` },
        'WiFi': { title: 'Wi-Fi/BT Module', statusOn: 'BROADCASTING', statusOff: 'DISABLED', descOn: 'Managing wireless networks and Bluetooth.', descOff: 'Network: Wireless connectivity lost.', model_url: `${REPO_URL}wifi.glb` },
        'SoundCard': { title: 'Dedicated Sound Card', statusOn: 'PROCESSING AUDIO', statusOff: 'SILENT', descOn: 'Rendering high-fidelity DAC audio.', descOff: 'Audio: System sound disabled.', model_url: `${REPO_URL}soundcard.glb` },
        'CaptureCard': { title: 'Video Capture Card', statusOn: 'STANDBY', statusOff: 'UNPLUGGED', descOn: 'Handling HDMI passthrough recording.', descOff: 'Non-critical: Recording unavailable.', model_url: `${REPO_URL}capturecard.glb` },
        'Riser': { title: 'PCIe Riser Cable', statusOn: 'LINKED (x16)', statusOff: 'SEVERED', descOn: 'Extending the GPU PCIe connection.', descOff: 'Display Error: GPU disconnected from bus. No signal.', model_url: `${REPO_URL}riser.glb` },
        'RGB': { title: 'RGB Controller', statusOn: 'SYNCED', statusOff: 'DARK', descOn: 'Managing ARGB lighting profiles.', descOff: 'Aesthetic: System lights disabled.', model_url: `${REPO_URL}rgb.glb` },
        'WaterPump': { title: 'AIO Liquid Cooler', statusOn: 'PUMPING', statusOff: 'STOPPED', descOn: 'Circulating liquid coolant over the CPU.', descOff: 'Warning: Liquid flow stopped. Extreme thermal risk.', model_url: `${REPO_URL}waterpump.glb` },
        'M2Heatsink': { title: 'SSD Heatsink', statusOn: 'DISSIPATING', statusOff: 'REMOVED', descOn: 'Preventing NVMe thermal throttling.', descOff: 'Warning: SSD running hot, speeds reduced.', model_url: `${REPO_URL}m2heatsink.glb` },
        'FrontPanel': { title: 'Front Panel I/O', statusOn: 'ACTIVE', statusOff: 'DISCONNECTED', descOn: 'Connecting power button and front USBs.', descOff: 'Non-critical: Case buttons disabled.', model_url: `${REPO_URL}frontpanel.glb` },
        'USB3': { title: 'USB 3.0 Header', statusOn: 'LINKED', statusOff: 'UNPLUGGED', descOn: 'Enabling high-speed external I/O.', descOff: 'Non-critical: Front USB ports dead.', model_url: `${REPO_URL}usb3.glb` }
    };
}

// =========================================================
// INTERACTIVE TOWER ROTATION (MOUSE & TOUCH)
// =========================================================
function setupTowerRotation() {
    const startDrag = (e) => {
        isDraggingTower = true;
        startX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
        UI.tower3D.style.transition = 'none'; 
    };

    const doDrag = (e) => {
        if (!isDraggingTower) return;
        e.preventDefault();
        const currentX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
        const diff = currentX - startX;
        UI.tower3D.style.transform = `rotateY(${currentRotation + (diff * 0.5)}deg)`;
    };

    const stopDrag = (e) => {
        if (!isDraggingTower) return;
        isDraggingTower = false;
        const endX = e.type.includes('mouse') ? e.pageX : e.changedTouches[0].pageX;
        currentRotation += (endX - startX) * 0.5;
        UI.tower3D.style.transition = 'transform 0.5s ease'; 
    };

    UI.towerContainer.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', doDrag);
    window.addEventListener('mouseup', stopDrag);

    UI.towerContainer.addEventListener('touchstart', startDrag, {passive: false});
    window.addEventListener('touchmove', doDrag, {passive: false});
    window.addEventListener('touchend', stopDrag);
}

// =========================================================
// EVENT LISTENERS & SYNCHRONIZATION
// =========================================================
function setupEventListeners() {
    UI.selector.addEventListener('change', (e) => {
        selectedComponent = e.target.value;
        updateInspector(true); 
    });

    const buttons = document.querySelectorAll('.cyber-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const compKey = btn.getAttribute('data-component');
            selectedComponent = compKey;
            UI.selector.value = compKey;
            
            toggleHardware(compKey, btn);
            updateInspector(true);
        });
    });
}

// =========================================================
// ISOLATED TOWER ZOOM (Does NOT affect Monitor/Desk)
// =========================================================
function triggerCinematicZoom(key) {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Scale ONLY the isolated right-side 3D tower wrapper
    UI.towerContainer.style.transition = 'transform 1.2s cubic-bezier(0.2, 0.8, 0.2, 1)';
    UI.towerContainer.style.transform = 'scale(1.4) translateX(-20px)';
    
    // Rotate the tower dynamically to face the part
    const targetAngle = componentViewingAngles[key] !== undefined ? componentViewingAngles[key] : -35;
    currentRotation = targetAngle;
    UI.tower3D.style.transform = `rotateY(${currentRotation}deg)`;

    clearTimeout(zoomTimeout);
    zoomTimeout = setTimeout(() => {
        UI.towerContainer.style.transform = 'scale(1) translateX(0)';
        document.querySelectorAll('.xray-highlight').forEach(z => z.classList.remove('xray-highlight'));
        
        // Graceful rotation reset
        currentRotation = -35;
        UI.tower3D.style.transform = `rotateY(${currentRotation}deg)`;
    }, 6000); 
}

function highlightPhysicalZone(key) {
    document.querySelectorAll('.xray-highlight').forEach(z => z.classList.remove('xray-highlight'));
    
    const targetZone = document.getElementById(`zone-${key}`);
    if (targetZone) {
        targetZone.classList.add('xray-highlight');
    }
}

// =========================================================
// HIGH-TECH SPARK PARTICLE ENGINE
// =========================================================
function spawnInternalSparks() {
    if (!UI.sparkEmitter) return;
    
    const rect = UI.sparkEmitter.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const sparkCount = Math.floor(Math.random() * 15) + 20; 
    
    for(let i = 0; i < sparkCount; i++) {
        let spark = document.createElement('div');
        spark.className = 'spark';
        spark.style.left = centerX + 'px';
        spark.style.top = centerY + 'px';
        
        let tx = (Math.random() - 0.5) * 500 + 'px'; 
        let ty = (Math.random() - 0.8) * 500 + 'px'; 
        
        spark.style.setProperty('--tx', tx);
        spark.style.setProperty('--ty', ty);
        
        UI.sparkContainer.appendChild(spark);
        
        setTimeout(() => {
            if (spark.parentNode) spark.parentNode.removeChild(spark);
        }, 800);
    }
}

// =========================================================
// HARDWARE PHYSICS & LOGIC
// =========================================================
function toggleHardware(key, btnElement) {
    plugStates[key] = !plugStates[key];
    const isPlugged = plugStates[key];

    if (!isPlugged) {
        btnElement.classList.replace('plugged', 'unplugged');
        if (powerComponents.includes(key)) spawnInternalSparks();
    } else {
        btnElement.classList.replace('unplugged', 'plugged');
    }

    if (key === 'PSU' || key === 'ATX24') {
        if (!plugStates['PSU'] || !plugStates['ATX24']) {
            clearInterval(heatingInterval);
            sysTemp = 25; 
            isThermalShutdown = false;
        } else if (!plugStates['Fan'] && !plugStates['WaterPump']) {
            sysTemp = 40;
            startThermalClimb(15);
        } else if (!plugStates['Fan'] || !plugStates['WaterPump']) {
            sysTemp = 40;
            startThermalClimb(6); 
        }
    } else if (key === 'Fan' || key === 'WaterPump') {
        if ((!plugStates['Fan'] || !plugStates['WaterPump']) && plugStates['PSU'] && plugStates['ATX24']) {
            let heatRate = (!plugStates['Fan'] && !plugStates['WaterPump']) ? 15 : 6;
            startThermalClimb(heatRate);
        } else if (plugStates['Fan'] && plugStates['WaterPump']) {
            clearInterval(heatingInterval);
            sysTemp = 40; 
            isThermalShutdown = false;
        }
    }

    if ((key === 'PSU' || key === 'ATX24' || key === 'FrontPanel') && plugStates['PSU'] && plugStates['ATX24']) {
        initiateBootSequence();
    } else {
        evaluateSystemState();
    }
}

function startThermalClimb(rate) {
    clearInterval(heatingInterval);
    heatingInterval = setInterval(() => {
        sysTemp += rate; 
        if (sysTemp >= 110) {
            isThermalShutdown = true;
            clearInterval(heatingInterval);
            evaluateSystemState(); 
        }
    }, 1000);
}

// =========================================================
// UI & GLB RENDER ENGINE
// =========================================================
function updateInspector(shouldZoom) {
    if (isFetching) return;

    const data = dbData[selectedComponent] || {};
    const isPlugged = plugStates[selectedComponent];
    const isSystemDead = !plugStates['PSU'] || !plugStates['ATX24'] || isThermalShutdown;
    
    UI.title.innerText = data.title || selectedComponent;
    
    UI.desc.style.animation = 'none';
    UI.desc.offsetHeight; 
    UI.desc.innerText = isPlugged ? (data.descOn || '') : (data.descOff || '');
    UI.desc.style.animation = 'fadeIn 0.5s ease-in';

    let statusText = isPlugged ? (data.statusOn || 'ACTIVE') : (data.statusOff || 'DISCONNECTED');
    
    UI.badge.className = 'badge';
    if (!isPlugged || isSystemDead) {
        UI.badge.classList.add('badge-critical');
    } else if (['HDD', 'ODD', 'NIC', 'WiFi', 'SoundCard', 'RGB', 'FrontPanel', 'USB3'].includes(selectedComponent) && !isPlugged) {
        UI.badge.classList.add('badge-warning'); 
    } else {
        UI.badge.classList.add('badge-active');
    }
    
    if (isBooting) {
        UI.badge.innerText = 'BOOTING...';
        UI.badge.classList.replace('badge-active', 'badge-booting');
    } else {
        UI.badge.innerText = statusText;
    }

    // Handles the GLB models dynamically based on selection from GitHub Repo
    if (data.model_url) {
        UI.viewer3D.setAttribute('src', data.model_url);
    } else {
        UI.viewer3D.removeAttribute('src'); 
    }
    
    highlightPhysicalZone(selectedComponent);
    
    if(shouldZoom) {
        triggerCinematicZoom(selectedComponent);
    }
}

// =========================================================
// FIXED BOOT SEQUENCE & SCREEN TRANSITIONS
// =========================================================
function initiateBootSequence() {
    // If core power is missing, fail immediately
    if (!plugStates['PSU'] || !plugStates['ATX24'] || isThermalShutdown) {
        evaluateSystemState();
        return;
    }
    
    // If CPU/Chipset is missing, fail immediately
    if (!plugStates['CPU'] || !plugStates['EPS8'] || !plugStates['Chipset']) {
        evaluateSystemState();
        return;
    }

    isBooting = true;
    updateInspector(false);
    
    // Hide all screens
    UI.screenBios.classList.add('hidden');
    UI.screenDesktop.classList.add('hidden');
    UI.screenError.classList.add('hidden');
    if (UI.gpuGlitch) UI.gpuGlitch.classList.add('hidden');
    
    // Show Boot Screen
    UI.screenBoot.classList.remove('hidden');
    UI.powerLed.className = 'power-led led-on';
    if (UI.towerPowerLed && plugStates['FrontPanel']) UI.towerPowerLed.style.borderColor = 'var(--cyan-glow)';

    // Wait 3 seconds, then evaluate the system state to transition to Desktop or BIOS
    clearTimeout(bootTimeout);
    bootTimeout = setTimeout(() => {
        isBooting = false;
        evaluateSystemState(); // This will swap out the Boot screen for the real result
        updateInspector(false);
    }, 3000); 
}

function evaluateSystemState() {
    if (isBooting) return; 

    // Hide everything to start fresh
    UI.screenBios.classList.add('hidden');
    UI.screenBoot.classList.add('hidden');
    UI.screenDesktop.classList.add('hidden');
    UI.screenError.classList.add('hidden');
    if (UI.gpuGlitch) UI.gpuGlitch.classList.add('hidden');
    
    if (UI.towerPowerLed) UI.towerPowerLed.style.borderColor = '#334155';

    // 1. NO POWER
    if (!plugStates['PSU'] || !plugStates['ATX24']) {
        UI.powerLed.className = 'power-led led-off';
        return; 
    }
    
    if (plugStates['FrontPanel'] && UI.towerPowerLed) UI.towerPowerLed.style.borderColor = 'var(--cyan-glow)';

    // 2. NO GPU (No Display Signal)
    if (!plugStates['GPU'] || !plugStates['Riser']) {
        UI.powerLed.className = 'power-led led-error';
        UI.screenError.classList.remove('hidden');
        UI.errorText.style.color = '#fff';
        UI.errorText.innerText = 'NO SIGNAL';
        UI.errorText.style.animation = 'pulse-text 2s infinite';
        return;
    }

    // 3. OVERHEATING
    if (isThermalShutdown) {
        UI.powerLed.className = 'power-led led-error';
        if (UI.towerPowerLed) UI.towerPowerLed.style.borderColor = 'var(--red-glow)';
        UI.screenError.classList.remove('hidden');
        UI.errorText.style.color = 'var(--red-glow)';
        UI.errorText.innerHTML = 'FATAL: THERMAL TRIP DETECTED<br><br>CPU CORE EXCEEDED 110°C.<br>EMERGENCY HALT TRIGGERED.<br><br>Action: Reconnect cooling and power cycle.';
        UI.errorText.style.animation = 'none';
        return;
    }

    // 4. MISSING RAM
    if (!plugStates['RAM']) {
        UI.powerLed.className = 'power-led led-on';
        UI.screenError.classList.remove('hidden');
        UI.errorText.style.color = '#3b82f6';
        UI.errorText.innerHTML = ':( <br><br>Your PC ran into a problem.<br><br>Stop code: MEMORY_MANAGEMENT';
        UI.errorText.style.animation = 'none';
        return;
    }

    // 5. MISSING CPU/BOARD POWER
    if (!plugStates['CPU'] || !plugStates['EPS8'] || !plugStates['Chipset']) {
        UI.powerLed.className = 'power-led led-on';
        UI.screenError.classList.remove('hidden');
        UI.errorText.style.color = '#ef4444';
        UI.errorText.innerHTML = 'SYSTEM HALT.<br>ERR_NO_PROCESSOR_OR_BUS_FOUND';
        UI.errorText.style.animation = 'none';
        return;
    }

    // 6. MISSING STORAGE (BIOS)
    if (!plugStates['SSD']) {
        UI.powerLed.className = 'power-led led-on';
        UI.screenBios.classList.remove('hidden');
        UI.biosText.innerHTML = 'Excellent BIOS v4.0.1<br>CPU: Detected<br>Memory: OK<br><br>ERROR: Boot Device Not Found.<br>Please install an operating system.';
        return;
    }

    // 7. MISSING TPM (BIOS)
    if (!plugStates['TPM']) {
        UI.powerLed.className = 'power-led led-on';
        UI.screenBios.classList.remove('hidden');
        UI.biosText.innerHTML = 'Excellent BIOS v4.0.1<br>CPU: Detected<br>Memory: OK<br><br>ERROR: Trusted Platform Module (TPM 2.0) not detected.<br>ExcellentOS requires TPM for secure boot.';
        return;
    }

    // 8. MISSING CMOS (BIOS)
    if (!plugStates['CMOS']) {
        UI.powerLed.className = 'power-led led-on';
        UI.screenBios.classList.remove('hidden');
        UI.biosText.innerHTML = 'Excellent BIOS v4.0.1<br><br>WARNING: CMOS Checksum Error.<br>CMOS Battery Voltage Low or Missing.<br>System Time has been reset.<br><br>Press F1 to Run SETUP';
        return;
    }

    // 9. PERFECT BOOT -> SHOW DESKTOP
    UI.powerLed.className = 'power-led led-on';
    UI.screenDesktop.classList.remove('hidden');
    
    // Aesthetic Glitch if VRM missing but still boots
    if (!plugStates['VRM'] && UI.gpuGlitch) {
        UI.gpuGlitch.classList.remove('hidden'); 
    }
}

// Background loop to animate desktop widgets
function startDesktopLoop() {
    desktopLoop = setInterval(() => {
        if (!plugStates['PSU'] || isThermalShutdown || !plugStates['CPU'] || !plugStates['RAM'] || !plugStates['SSD']) return;

        let cpuLoad = Math.floor(Math.random() * 12) + 2;
        if (!plugStates['VRM']) cpuLoad = 100; 
        UI.widCpuBar.style.width = `${cpuLoad}%`;
        UI.widCpuVal.innerText = `${cpuLoad}%`;

        let ramUsage = plugStates['HDD'] ? 18 : 64; 
        UI.widRamBar.style.width = `${ramUsage}%`;
        UI.widRamVal.innerText = `${ramUsage}%`;
        UI.widRamBar.style.backgroundColor = plugStates['HDD'] ? 'var(--cyan-glow)' : 'var(--yellow-glow)';

        if (plugStates['Fan'] && plugStates['WaterPump']) {
            let fluctuate = Math.floor(Math.random() * 3) + 38;
            UI.widTempVal.innerText = `${fluctuate}°C`;
            UI.widTempVal.className = 'wid-val temp-val';
        } else {
            UI.widTempVal.innerText = `${sysTemp}°C`;
            UI.widTempVal.className = 'wid-val temp-val temp-hot';
        }

        if (plugStates['NIC'] || plugStates['WiFi']) {
            UI.widNetVal.innerText = plugStates['NIC'] ? '1GBPS LINK' : 'WI-FI CONNECTED';
            UI.widNetVal.style.color = 'var(--cyan-glow)';
        } else {
            UI.widNetVal.innerText = 'OFFLINE';
            UI.widNetVal.style.color = 'var(--red-glow)';
        }
    }, 1500);
}
