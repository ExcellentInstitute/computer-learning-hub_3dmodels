// =========================================================
// STATE & CONFIGURATION
// =========================================================
const FIREBASE_URL = 'https://firebasestorage.googleapis.com/v0/b/excellent-institute-vault.firebasestorage.app/o/vault%2Flab_data_3d.json?alt=media&token=b44afe29-a3a3-4911-a835-5e98eeaa8aec';

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

// System Variables
let sysTemp = 40;
let isThermalShutdown = false;
let isBooting = false;
let heatingInterval = null;
let desktopLoop = null;
let bootTimeout = null;

// =========================================================
// DOM ELEMENT MAPPING
// =========================================================
const UI = {
    selector: document.getElementById('component-selector'),
    title: document.getElementById('comp-title'),
    badge: document.getElementById('comp-badge'),
    desc: document.getElementById('comp-desc'),
    viewer3D: document.getElementById('component-3d-viewer'),
    
    // Monitor Layers
    screenBios: document.getElementById('screen-bios'),
    screenBoot: document.getElementById('screen-boot'),
    screenDesktop: document.getElementById('screen-desktop'),
    screenError: document.getElementById('screen-error'),
    gpuGlitch: document.getElementById('gpu-glitch'),
    
    // Text & LEDs
    biosText: document.getElementById('bios-text'),
    errorText: document.getElementById('error-text'),
    powerLed: document.getElementById('power-led'),
    
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
    startDesktopLoop();
    initiateBootSequence();
});

// =========================================================
// DATA FETCHING & 25-COMPONENT FALLBACK ENGINE
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
    updateInspector();
}

function generateAdvancedFallback() {
    return {
        'PSU': { title: '850W Power Supply', statusOn: 'DELIVERING', statusOff: 'NO POWER', descOn: 'Converting AC to DC voltage for the system.', descOff: 'Critical: System lost all power. Blackout.', model_url: '' },
        'CPU': { title: 'Central Processing Unit', statusOn: 'EXECUTING', statusOff: 'SOCKET EMPTY', descOn: 'Handling OS instructions and IPC routing.', descOff: 'Fatal Error: System freezes before POST.', model_url: '' },
        'RAM': { title: 'DDR5 Memory', statusOn: 'ALLOCATED', statusOff: 'NO MEMORY', descOn: 'Providing volatile storage for the OS.', descOff: 'Fatal Error: Memory Management BSOD.', model_url: '' },
        'GPU': { title: 'PCIe Graphics Card', statusOn: 'RENDERING', statusOff: 'NO SIGNAL', descOn: 'Pushing high-framerate pixel data.', descOff: 'Display Error: Monitor receives no video signal.', model_url: '' },
        'Fan': { title: 'CPU Cooling Fan', statusOn: '2400 RPM', statusOff: 'STOPPED', descOn: 'Dissipating thermal energy from the heatsink.', descOff: 'Warning: Cooling lost. Temperatures rising.', model_url: '' },
        'SSD': { title: 'NVMe M.2 Drive', statusOn: 'MOUNTED (C:\\)', statusOff: 'UNMOUNTED', descOn: 'Hosting the primary bootloader and OS.', descOff: 'Boot Error: Boot Device Not Found.', model_url: '' },
        'HDD': { title: 'Mechanical Hard Drive', statusOn: 'MOUNTED (D:\\)', statusOff: 'DISCONNECTED', descOn: 'Secondary mass storage archive.', descOff: 'Degraded: Secondary storage paths broken.', model_url: '' },
        'ODD': { title: 'Optical Disk Drive', statusOn: 'READY', statusOff: 'OFFLINE', descOn: 'Reading legacy CD/DVD media.', descOff: 'Non-critical: Disc media unavailable.', model_url: '' },
        'Chipset': { title: 'Motherboard Chipset', statusOn: 'ROUTING', statusOff: 'FAILED', descOn: 'Managing data flow between CPU and peripherals.', descOff: 'Fatal: I/O communication severed.', model_url: '' },
        'VRM': { title: 'VRM Heatsink', statusOn: 'STABLE', statusOff: 'OVERHEATING', descOn: 'Cooling the voltage regulator modules.', descOff: 'Warning: Power delivery unstable. CPU throttling.', model_url: '' },
        'CMOS': { title: 'CMOS Battery', statusOn: '3.3V', statusOff: 'DEAD', descOn: 'Powering volatile BIOS memory.', descOff: 'BIOS Error: CMOS Checksum invalid. Time reset.', model_url: '' },
        'TPM': { title: 'Security Module (TPM 2.0)', statusOn: 'SECURE', statusOff: 'MISSING', descOn: 'Providing hardware-level cryptographic keys.', descOff: 'OS Error: ExcellentOS requires TPM 2.0 to boot.', model_url: '' },
        'ATX24': { title: '24-pin Main Cable', statusOn: 'POWERED', statusOff: 'UNPLUGGED', descOn: 'Delivering primary 12V/5V/3.3V to the board.', descOff: 'Critical: Motherboard has no power.', model_url: '' },
        'EPS8': { title: '8-pin CPU Power', statusOn: 'DELIVERING', statusOff: 'UNPLUGGED', descOn: 'Delivering dedicated 12V power to the CPU.', descOff: 'Fatal: CPU receives no power. System halt.', model_url: '' },
        'SATA': { title: 'SATA Data Cable', statusOn: 'LINKED', statusOff: 'UNPLUGGED', descOn: 'Connecting the HDD to the motherboard.', descOff: 'Degraded: HDD communication lost.', model_url: '' },
        'NIC': { title: 'Network Card', statusOn: '1Gbps LINK', statusOff: 'OFFLINE', descOn: 'Handling wired TCP/IP packet routing.', descOff: 'Network: Wired LAN disconnected.', model_url: '' },
        'WiFi': { title: 'Wi-Fi/BT Module', statusOn: 'BROADCASTING', statusOff: 'DISABLED', descOn: 'Managing wireless networks and Bluetooth.', descOff: 'Network: Wireless connectivity lost.', model_url: '' },
        'SoundCard': { title: 'Dedicated Sound Card', statusOn: 'PROCESSING AUDIO', statusOff: 'SILENT', descOn: 'Rendering high-fidelity DAC audio.', descOff: 'Audio: System sound disabled.', model_url: '' },
        'CaptureCard': { title: 'Video Capture Card', statusOn: 'STANDBY', statusOff: 'UNPLUGGED', descOn: 'Handling HDMI passthrough recording.', descOff: 'Non-critical: Recording unavailable.', model_url: '' },
        'Riser': { title: 'PCIe Riser Cable', statusOn: 'LINKED (x16)', statusOff: 'SEVERED', descOn: 'Extending the GPU PCIe connection.', descOff: 'Display Error: GPU disconnected from bus. No signal.', model_url: '' },
        'RGB': { title: 'RGB Controller', statusOn: 'SYNCED', statusOff: 'DARK', descOn: 'Managing ARGB lighting profiles.', descOff: 'Aesthetic: System lights disabled.', model_url: '' },
        'WaterPump': { title: 'AIO Water Pump', statusOn: 'PUMPING', statusOff: 'STOPPED', descOn: 'Circulating liquid coolant over the CPU.', descOff: 'Warning: Liquid flow stopped. Extreme thermal risk.', model_url: '' },
        'M2Heatsink': { title: 'SSD Heatsink', statusOn: 'DISSIPATING', statusOff: 'REMOVED', descOn: 'Preventing NVMe thermal throttling.', descOff: 'Warning: SSD running hot, speeds reduced.', model_url: '' },
        'FrontPanel': { title: 'Front Panel I/O', statusOn: 'ACTIVE', statusOff: 'DISCONNECTED', descOn: 'Connecting power button and front USBs.', descOff: 'Non-critical: Case buttons disabled.', model_url: '' },
        'USB3': { title: 'USB 3.0 Header', statusOn: 'LINKED', statusOff: 'UNPLUGGED', descOn: 'Enabling high-speed external I/O.', descOff: 'Non-critical: Front USB ports dead.', model_url: '' }
    };
}

// =========================================================
// EVENT LISTENERS
// =========================================================
function setupEventListeners() {
    UI.selector.addEventListener('change', (e) => {
        selectedComponent = e.target.value;
        updateInspector();
    });

    const buttons = document.querySelectorAll('.cyber-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const compKey = btn.getAttribute('data-component');
            toggleHardware(compKey, btn);
        });
    });
}

// =========================================================
// HARDWARE PHYSICS & LOGIC
// =========================================================
function toggleHardware(key, btnElement) {
    plugStates[key] = !plugStates[key];
    const isPlugged = plugStates[key];

    if (isPlugged) {
        btnElement.classList.replace('unplugged', 'plugged');
    } else {
        btnElement.classList.replace('plugged', 'unplugged');
    }

    // Advanced Thermal Engine (Checks Fan AND WaterPump)
    if (key === 'PSU' || key === 'ATX24') {
        if (!plugStates['PSU'] || !plugStates['ATX24']) {
            clearInterval(heatingInterval);
            sysTemp = 25; 
            isThermalShutdown = false;
        } else if (!plugStates['Fan'] && !plugStates['WaterPump']) {
            sysTemp = 40;
            startThermalClimb(15); // Both dead = fast heat
        } else if (!plugStates['Fan'] || !plugStates['WaterPump']) {
            sysTemp = 40;
            startThermalClimb(6); // One dead = slow heat
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

    if (key === selectedComponent) updateInspector();

    // If power is restored, trigger boot sequence. Otherwise evaluate immediately.
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
// UI & MONITOR RENDER ENGINE
// =========================================================
function updateInspector() {
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

    if (data.model_url) {
        UI.viewer3D.setAttribute('src', data.model_url);
    } else {
        UI.viewer3D.removeAttribute('src'); 
    }
}

function initiateBootSequence() {
    if (!plugStates['PSU'] || !plugStates['ATX24'] || isThermalShutdown) {
        evaluateSystemState();
        return;
    }
    
    // Test for immediate fatal pre-POST errors
    if (!plugStates['CPU'] || !plugStates['EPS8'] || !plugStates['Chipset']) {
        evaluateSystemState();
        return;
    }

    isBooting = true;
    updateInspector();
    
    // Hide everything, show Boot Logo
    UI.screenBios.classList.add('hidden');
    UI.screenDesktop.classList.add('hidden');
    UI.screenError.classList.add('hidden');
    UI.gpuGlitch.classList.add('hidden');
    
    UI.screenBoot.classList.remove('hidden');
    UI.powerLed.className = 'power-led led-on';

    clearTimeout(bootTimeout);
    bootTimeout = setTimeout(() => {
        isBooting = false;
        updateInspector();
        evaluateSystemState();
    }, 2500); // 2.5 second boot logo delay
}

function evaluateSystemState() {
    if (isBooting) return; // Don't interrupt the boot sequence

    UI.screenBios.classList.add('hidden');
    UI.screenBoot.classList.add('hidden');
    UI.screenDesktop.classList.add('hidden');
    UI.screenError.classList.add('hidden');
    UI.gpuGlitch.classList.add('hidden');

    // 1. HARDWARE POWER LOSS
    if (!plugStates['PSU'] || !plugStates['ATX24']) {
        UI.powerLed.className = 'power-led led-off';
        return; 
    }

    // 2. NO SIGNAL (Monitor powered, but GPU/Riser severed)
    if (!plugStates['GPU'] || !plugStates['Riser']) {
        UI.powerLed.className = 'power-led led-error';
        UI.screenError.classList.remove('hidden');
        UI.screenError.style.backgroundColor = '#111';
        UI.errorText.style.color = '#555';
        UI.errorText.innerText = 'NO SIGNAL';
        UI.errorText.style.animation = 'pulse-text 2s infinite';
        return;
    }

    // 3. THERMAL MELTDOWN
    if (isThermalShutdown) {
        UI.powerLed.className = 'power-led led-error';
        UI.screenError.classList.remove('hidden');
        UI.screenError.style.background = 'radial-gradient(circle at center, rgba(255, 42, 95, 0.4), #000)';
        UI.errorText.style.color = 'var(--red-glow)';
        UI.errorText.innerHTML = 'FATAL: THERMAL TRIP DETECTED<br><br>CPU CORE EXCEEDED 110°C.<br>EMERGENCY HALT TRIGGERED.<br><br>Action: Reconnect cooling and power cycle.';
        UI.errorText.style.animation = 'none';
        return;
    }

    // 4. MEMORY BSOD
    if (!plugStates['RAM']) {
        UI.powerLed.className = 'power-led led-on';
        UI.screenError.classList.remove('hidden');
        UI.screenError.style.background = '#0033cc'; 
        UI.errorText.style.color = '#ffffff';
        UI.errorText.innerHTML = ':( <br><br>Your PC ran into a problem.<br><br>Stop code: MEMORY_MANAGEMENT';
        UI.errorText.style.animation = 'none';
        return;
    }

    // 5. HARDWARE FREEZE (CPU/Chipset Missing)
    if (!plugStates['CPU'] || !plugStates['EPS8'] || !plugStates['Chipset']) {
        UI.powerLed.className = 'power-led led-on';
        UI.screenError.classList.remove('hidden');
        UI.screenError.style.background = '#222';
        UI.errorText.style.color = '#fff';
        UI.errorText.innerHTML = 'SYSTEM HALT.<br>ERR_NO_PROCESSOR_OR_BUS_FOUND';
        UI.errorText.style.animation = 'none';
        return;
    }

    // 6. BIOS & OS BOOT ERRORS
    if (!plugStates['SSD']) {
        UI.powerLed.className = 'power-led led-on';
        UI.screenBios.classList.remove('hidden');
        UI.biosText.innerHTML = 'Excellent BIOS v4.0.1<br>CPU: Detected<br>Memory: OK<br><br>ERROR: Boot Device Not Found.<br>Please install an operating system.';
        return;
    }

    if (!plugStates['TPM']) {
        UI.powerLed.className = 'power-led led-on';
        UI.screenBios.classList.remove('hidden');
        UI.biosText.innerHTML = 'Excellent BIOS v4.0.1<br>CPU: Detected<br>Memory: OK<br><br>ERROR: Trusted Platform Module (TPM 2.0) not detected.<br>ExcellentOS requires TPM for secure boot.';
        return;
    }

    if (!plugStates['CMOS']) {
        UI.powerLed.className = 'power-led led-on';
        UI.screenBios.classList.remove('hidden');
        UI.biosText.innerHTML = 'Excellent BIOS v4.0.1<br><br>WARNING: CMOS Checksum Error.<br>CMOS Battery Voltage Low or Missing.<br>System Time has been reset.<br><br>Press F1 to Run SETUP';
        return;
    }

    // 7. DESKTOP OS (FULLY FUNCTIONAL)
    UI.powerLed.className = 'power-led led-on';
    UI.screenDesktop.classList.remove('hidden');

    // Minor Effects
    if (!plugStates['VRM']) {
        UI.gpuGlitch.classList.remove('hidden'); // Simulate power instability on screen
    }
}

// Background loop to animate desktop widgets
function startDesktopLoop() {
    desktopLoop = setInterval(() => {
        if (!plugStates['PSU'] || isThermalShutdown || !plugStates['CPU'] || !plugStates['RAM'] || !plugStates['SSD']) return;

        let cpuLoad = Math.floor(Math.random() * 12) + 2;
        if (!plugStates['VRM']) cpuLoad = 100; // Throttling simulation
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
