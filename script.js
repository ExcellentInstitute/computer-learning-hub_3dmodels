// =========================================================
// STATE & CONFIGURATION
// =========================================================
const FIREBASE_URL = 'https://firebasestorage.googleapis.com/v0/b/excellent-institute-vault.firebasestorage.app/o/vault%2Flab_data_3d.json?alt=media&token=b44afe29-a3a3-4911-a835-5e98eeaa8aec';

let dbData = {};
let selectedComponent = 'CPU';
let isFetching = true;

// Hardware Plug States (All default to true/plugged)
const plugStates = {
    'PSU': true,
    'CPU': true,
    'Fan': true,
    'RAM': true,
    'SSD': true,
    'HDD': true,
    'GPU': true,
    'NIC': true,
    'CMOS': true
};

// System Variables
let sysTemp = 40;
let isThermalShutdown = false;
let heatingInterval = null;
let desktopLoop = null;

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
    screenDesktop: document.getElementById('screen-desktop'),
    screenError: document.getElementById('screen-error'),
    gpuGlitch: document.getElementById('gpu-glitch'),
    
    // Text Areas
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
});

// =========================================================
// DATA FETCHING & FALLBACK ENGINE
// =========================================================
async function fetchHardwareData() {
    try {
        const cacheBusterUrl = `${FIREBASE_URL}&t=${new Date().getTime()}`;
        const response = await fetch(cacheBusterUrl);
        if (response.ok) {
            const serverData = await response.json();
            // Merge server data with our advanced fallback to ensure no missing keys
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
    evaluateSystemState();
}

function generateAdvancedFallback() {
    return {
        'PSU': { title: '850W Power Supply Unit (PSU)', statusOn: 'POWER DELIVERING', statusOff: 'NO POWER', descOn: 'Converting AC wall electricity into clean DC voltage for all motherboard components.', descOff: 'Critical: The system has lost all power. The motherboard is dead, and the monitor receives no signal.', model_url: '' },
        'CPU': { title: 'Central Processing Unit (CPU)', statusOn: 'EXECUTING', statusOff: 'SOCKET EMPTY', descOn: 'The primary processor is handling OS instructions, logic execution, and IPC routing.', descOff: 'Fatal Error: Without a CPU, the motherboard cannot POST. The system freezes completely before BIOS initialization.', model_url: '' },
        'Fan': { title: 'Thermal Cooling System', statusOn: 'COOLING (2400 RPM)', statusOff: 'FAN STOPPED', descOn: 'Active heat dissipation is maintaining stable core temperatures across the silicon die.', descOff: 'Warning: Active cooling lost. Thermal energy is rapidly building. If temperatures exceed 110°C, the CPU will trip a thermal shutdown to prevent melting.', model_url: '' },
        'RAM': { title: 'DDR5 Random Access Memory', statusOn: 'ALLOCATED', statusOff: 'NO MEMORY', descOn: 'Providing ultra-fast, volatile storage for the OS kernel and active desktop applications.', descOff: 'Fatal Error: The CPU has no workspace. The OS kernel immediately panics, triggering a Memory Management Blue Screen of Death (BSOD).', model_url: '' },
        'SSD': { title: 'NVMe M.2 Solid State Drive', statusOn: 'MOUNTED (C:\\)', statusOff: 'UNMOUNTED', descOn: 'High-speed PCIe storage hosting the primary bootloader and ExcellentOS system files.', descOff: 'Boot Error: The motherboard cannot locate an operating system. The BIOS halts with a "Boot Device Not Found" error.', model_url: '' },
        'HDD': { title: 'Mechanical Hard Drive (SATA)', statusOn: 'MOUNTED (D:\\)', statusOff: 'DISCONNECTED', descOn: 'Secondary mass storage spinning at 7200 RPM, holding archive files and heavy media.', descOff: 'Degraded: The OS remains functional via the SSD, but secondary archive paths are broken. Pagefile overflow may increase RAM usage.', model_url: '' },
        'GPU': { title: 'PCIe Graphics Processing Unit', statusOn: 'RENDERING (144Hz)', statusOff: 'NO SIGNAL', descOn: 'Processing complex 3D rasterization and pushing high-framerate pixel data to the display.', descOff: 'Display Error: The display pipeline is severed. The OS is technically still running in the background, but the monitor is completely blind.', model_url: '' },
        'NIC': { title: 'Gigabit Network Interface Card', statusOn: 'CONNECTED (1Gbps)', statusOff: 'OFFLINE', descOn: 'Handling TCP/IP packet routing, keeping the machine connected to the local LAN and external internet.', descOff: 'Isolated: The machine is fully functional but strictly offline. All web traffic, updates, and external API calls will fail.', model_url: '' },
        'CMOS': { title: 'CR2032 CMOS Battery', statusOn: 'VOLTAGE OK (3.3V)', statusOff: 'VOLTAGE DROP', descOn: 'Providing trickle power to the RTC (Real Time Clock) and volatile BIOS memory chips.', descOff: 'Warning: BIOS settings wiped. System time resets to factory defaults. The POST sequence halts requiring user F1 confirmation.', model_url: '' }
    };
}

// =========================================================
// EVENT LISTENERS
// =========================================================
function setupEventListeners() {
    // Dropdown change
    UI.selector.addEventListener('change', (e) => {
        selectedComponent = e.target.value;
        updateInspector();
    });

    // Motherboard Buttons
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

    // Update Button Visuals
    if (isPlugged) {
        btnElement.classList.replace('unplugged', 'plugged');
    } else {
        btnElement.classList.replace('plugged', 'unplugged');
    }

    // Thermal Engine
    if (key === 'PSU') {
        if (!isPlugged) {
            clearInterval(heatingInterval);
            sysTemp = 25; // Instant ambient cooldown
            isThermalShutdown = false;
        } else if (!plugStates['Fan']) {
            sysTemp = 40;
            startThermalClimb();
        }
    } else if (key === 'Fan') {
        if (!isPlugged && plugStates['PSU']) {
            startThermalClimb();
        } else {
            clearInterval(heatingInterval);
            sysTemp = 40; // Simulated cooling recovery
            isThermalShutdown = false;
        }
    }

    if (key === selectedComponent) updateInspector();
    evaluateSystemState();
}

function startThermalClimb() {
    clearInterval(heatingInterval);
    heatingInterval = setInterval(() => {
        sysTemp += 8; // Heats up fast
        if (sysTemp >= 110) {
            isThermalShutdown = true;
            clearInterval(heatingInterval);
            evaluateSystemState(); // Force crash
        }
    }, 1000);
}

// Background loop to animate desktop widgets
function startDesktopLoop() {
    desktopLoop = setInterval(() => {
        if (!plugStates['PSU'] || isThermalShutdown || !plugStates['CPU'] || !plugStates['RAM'] || !plugStates['SSD']) return;

        // CPU Load (Random fluctuation)
        let cpuLoad = Math.floor(Math.random() * 12) + 2;
        UI.widCpuBar.style.width = `${cpuLoad}%`;
        UI.widCpuVal.innerText = `${cpuLoad}%`;

        // RAM Usage (Spikes if HDD is missing, simulating lost pagefile)
        let ramUsage = plugStates['HDD'] ? 18 : 64; 
        UI.widRamBar.style.width = `${ramUsage}%`;
        UI.widRamVal.innerText = `${ramUsage}%`;
        UI.widRamBar.style.backgroundColor = plugStates['HDD'] ? 'var(--cyan-glow)' : 'var(--yellow-glow)';

        // Temperature (Slight fluctuation if normal)
        if (plugStates['Fan']) {
            let fluctuate = Math.floor(Math.random() * 3) + 38;
            UI.widTempVal.innerText = `${fluctuate}°C`;
            UI.widTempVal.className = 'wid-val temp-val';
        } else {
            UI.widTempVal.innerText = `${sysTemp}°C`;
            UI.widTempVal.className = 'wid-val temp-val temp-hot';
        }

        // Network Status
        if (plugStates['NIC']) {
            UI.widNetVal.innerText = '1GBPS LINK';
            UI.widNetVal.style.color = 'var(--cyan-glow)';
        } else {
            UI.widNetVal.innerText = 'OFFLINE';
            UI.widNetVal.style.color = 'var(--red-glow)';
        }
        
    }, 1500);
}

// =========================================================
// UI & MONITOR RENDER ENGINE
// =========================================================
function updateInspector() {
    if (isFetching) return;

    const data = dbData[selectedComponent] || {};
    const isPlugged = plugStates[selectedComponent];
    const isSystemDead = !plugStates['PSU'] || isThermalShutdown;
    
    UI.title.innerText = data.title || selectedComponent;
    
    // Typewriter effect reset
    UI.desc.style.animation = 'none';
    UI.desc.offsetHeight; // Trigger reflow
    UI.desc.innerText = isPlugged ? (data.descOn || '') : (data.descOff || '');
    UI.desc.style.animation = 'fadeIn 0.5s ease-in';

    let statusText = isPlugged ? (data.statusOn || 'ACTIVE') : (data.statusOff || 'DISCONNECTED');
    
    // Badge styling logic
    UI.badge.className = 'badge';
    if (!isPlugged || isSystemDead) {
        UI.badge.classList.add('badge-critical');
    } else if (selectedComponent === 'HDD' && !isPlugged) {
        UI.badge.classList.add('badge-warning'); // Degraded, not dead
    } else {
        UI.badge.classList.add('badge-active');
    }
    UI.badge.innerText = statusText;

    // Handle 3D Model URL
    if (data.model_url) {
        UI.viewer3D.setAttribute('src', data.model_url);
    } else {
        UI.viewer3D.removeAttribute('src'); // Defaults to grey box if missing
    }
}

function evaluateSystemState() {
    // Hide all layers first
    UI.screenBios.classList.add('hidden');
    UI.screenDesktop.classList.add('hidden');
    UI.screenError.classList.add('hidden');
    UI.gpuGlitch.classList.add('hidden');

    // 1. HARDWARE POWER LOSS
    if (!plugStates['PSU']) {
        UI.powerLed.className = 'power-led led-off';
        return; // Complete black screen
    }

    // 2. NO SIGNAL (Monitor has power from wall, but PC gives no video)
    if (!plugStates['GPU']) {
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
        UI.errorText.innerHTML = 'FATAL: THERMAL TRIP DETECTED<br><br>CPU CORE EXCEEDED 110°C.<br>EMERGENCY HALT TRIGGERED TO PREVENT SILICON DAMAGE.<br><br>Action: Reconnect cooling fan and power cycle.';
        UI.errorText.style.animation = 'none';
        return;
    }

    // 4. MEMORY BSOD
    if (!plugStates['RAM']) {
        UI.powerLed.className = 'power-led led-on';
        UI.screenError.classList.remove('hidden');
        UI.screenError.style.background = '#0033cc'; // Windows Blue
        UI.errorText.style.color = '#ffffff';
        UI.errorText.innerHTML = ':( <br><br>Your PC ran into a problem and needs to restart.<br><br>Stop code: MEMORY_MANAGEMENT<br>Address: 0x0000001A';
        UI.errorText.style.animation = 'none';
        return;
    }

    // 5. HARDWARE FREEZE (CPU Missing)
    if (!plugStates['CPU']) {
        UI.powerLed.className = 'power-led led-on';
        UI.screenError.classList.remove('hidden');
        UI.screenError.style.background = '#222';
        UI.errorText.style.color = '#fff';
        UI.errorText.innerHTML = 'SYSTEM HALT.<br>ERR_NO_PROCESSOR_FOUND';
        UI.errorText.style.animation = 'none';
        return;
    }

    // 6. BIOS BOOT ERRORS
    if (!plugStates['SSD']) {
        UI.powerLed.className = 'power-led led-on';
        UI.screenBios.classList.remove('hidden');
        UI.biosText.innerHTML = 'American Megatrends BIOS v4.0.1<br>CPU: Detected<br>Memory: OK<br><br>Auto-Detecting SATA/NVMe Ports...<br>Port 1: None<br>Port 2: None<br><br>ERROR: Boot Device Not Found.<br>Please install an operating system on your hard disk.';
        return;
    }

    if (!plugStates['CMOS']) {
        UI.powerLed.className = 'power-led led-on';
        UI.screenBios.classList.remove('hidden');
        UI.biosText.innerHTML = 'American Megatrends BIOS v4.0.1<br>CPU: Detected<br>Memory: OK<br><br>WARNING: CMOS Checksum Error.<br>CMOS Battery Voltage Low or Missing.<br>System Time and Date have been reset.<br><br>Press F1 to Run SETUP<br>Press F2 to load default values and continue.';
        return;
    }

    // 7. DESKTOP OS (FULLY FUNCTIONAL)
    UI.powerLed.className = 'power-led led-on';
    UI.screenDesktop.classList.remove('hidden');
}
