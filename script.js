// =========================================================
// CONFIGURATION & STATE
// =========================================================
const FIREBASE_URL = 'https://firebasestorage.googleapis.com/v0/b/excellent-institute-vault.firebasestorage.app/o/vault%2Flab_data_3d.json?alt=media&token=b44afe29-a3a3-4911-a835-5e98eeaa8aec';

let dbData = {};
let selectedComponent = 'CPU';
let isFetching = true;

// Hardware Plug States
const plugStates = {
    'PSU': true,
    'CPU': true,
    'RAM': true,
    'GPU': true,
    'Cooling Fan': true,
    'SSD': true
};

// Map HTML data attributes to JSON keys
const keyMap = {
    'Fan': 'Cooling Fan'
};

// Thermal States
let sysTemp = 40;
let isThermalShutdown = false;
let heatTimer = null;

// DOM Elements
const elSelector = document.getElementById('component-selector');
const elTitle = document.getElementById('comp-title');
const elBadge = document.getElementById('comp-badge');
const elDesc = document.getElementById('comp-desc');
const elTemp = document.getElementById('temp-value');
const el3DViewer = document.getElementById('component-3d-viewer');

const elScreenContent = document.getElementById('screen-content');
const elSystemLog = document.getElementById('system-log');
const elPowerLed = document.getElementById('power-led');
const elGlitch = document.getElementById('glitch-overlay');

// =========================================================
// INITIALIZATION
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    fetchHardwareData();
    setupEventListeners();
});

// =========================================================
// DATA FETCHING
// =========================================================
async function fetchHardwareData() {
    try {
        // Cache buster to ensure fresh JSON is always downloaded
        const cacheBusterUrl = `${FIREBASE_URL}&t=${new Date().getTime()}`;
        const response = await fetch(cacheBusterUrl);
        
        if (response.ok) {
            dbData = await response.json();
            isFetching = false;
            updateUI();
            updateMonitor();
        } else {
            loadFallbackData();
        }
    } catch (error) {
        console.error("Firebase fetch failed, loading fallback...", error);
        loadFallbackData();
    }
}

function loadFallbackData() {
    dbData = {
        'PSU': { title: 'Power Supply Unit', statusOn: 'HEALTHY', statusOff: 'CRITICAL FAILURE', descOn: 'Converting wall electricity into usable voltage.', descOff: 'CHAIN REACTION: You ripped out the power! Massive voltage drop detected.', model_url: '' },
        'CPU': { title: 'Central Processing Unit', statusOn: 'PROCESSING', statusOff: 'SYSTEM HALTED', descOn: "The 'Brain' is executing instructions.", descOff: 'Brain removed! The motherboard instantly halted.', model_url: '' },
        'RAM': { title: 'Random Access Memory', statusOn: 'ACTIVE', statusOff: 'FATAL CRASH', descOn: 'Holding temporary high-speed data.', descOff: 'Short-term memory wiped! The OS instantly crashed.', model_url: '' },
        'GPU': { title: 'Graphics Processing Unit', statusOn: 'RENDERING', statusOff: 'NO SIGNAL', descOn: 'Rendering complex 3D geometry.', descOff: 'Display pipeline severed! Running blind.', model_url: '' },
        'Cooling Fan': { title: 'Thermal Cooling System', statusOn: 'COOLING', statusOff: 'OVERHEATING', descOn: 'Dissipating thermal energy.', descOff: 'Cooling lost! Violently overheating.', model_url: '' },
        'SSD': { title: 'NVMe Solid State Drive', statusOn: 'MOUNTED', statusOff: 'BOOT FAILURE', descOn: 'High-speed non-volatile storage.', descOff: 'Storage vanished! Cannot find the boot sector.', model_url: '' }
    };
    isFetching = false;
    updateUI();
    updateMonitor();
}

// =========================================================
// EVENT LISTENERS
// =========================================================
function setupEventListeners() {
    // Dropdown change
    elSelector.addEventListener('change', (e) => {
        let val = e.target.value;
        selectedComponent = keyMap[val] || val;
        updateUI();
    });

    // Motherboard Buttons
    const buttons = document.querySelectorAll('.cyber-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            let compKey = btn.getAttribute('data-component');
            let actualKey = keyMap[compKey] || compKey;
            toggleComponent(actualKey, btn);
        });
    });
}

// =========================================================
// CORE LOGIC & INTERACTION
// =========================================================
function toggleComponent(key, btnElement) {
    // Toggle state
    plugStates[key] = !plugStates[key];
    const isPlugged = plugStates[key];

    // Visual Button Toggle
    if (isPlugged) {
        btnElement.classList.remove('unplugged');
        btnElement.classList.add('plugged');
    } else {
        btnElement.classList.remove('plugged');
        btnElement.classList.add('unplugged');
    }

    // Thermal / Power Logic
    if (key === 'PSU') {
        if (!isPlugged) {
            stopHeating();
            sysTemp = 25;
            isThermalShutdown = false;
        } else if (!plugStates['Cooling Fan']) {
            sysTemp = 40;
            startHeating();
        }
    } else if (key === 'Cooling Fan') {
        if (!isPlugged && plugStates['PSU']) {
            startHeating();
        } else {
            stopHeating();
            sysTemp = 40;
            isThermalShutdown = false;
        }
    }

    // If the toggled component is currently selected in the dropdown, update the panel
    if (key === selectedComponent) {
        updateUI();
    }
    
    // Always update the monitor screen based on global system state
    updateMonitor();
}

function startHeating() {
    stopHeating();
    heatTimer = setInterval(() => {
        sysTemp += 12;
        elTemp.innerText = `${sysTemp}°C`;
        elTemp.className = 'temp-hot';
        
        if (sysTemp >= 110) {
            isThermalShutdown = true;
            stopHeating();
            updateMonitor();
            updateUI();
        }
    }, 800);
}

function stopHeating() {
    if (heatTimer) clearInterval(heatTimer);
    elTemp.className = 'temp-normal';
    elTemp.innerText = `${sysTemp}°C`;
}

// =========================================================
// UI UPDATES
// =========================================================
function updateUI() {
    if (isFetching) return;

    const data = dbData[selectedComponent] || {};
    const isPlugged = plugStates[selectedComponent];

    // Check if system is completely dead
    const isSystemDead = !plugStates['PSU'] || isThermalShutdown;
    
    // Title & Description
    elTitle.innerText = data.title || selectedComponent;
    elDesc.innerText = isPlugged ? (data.descOn || '') : (data.descOff || '');

    // Badge Logic
    let statusText = isPlugged ? (data.statusOn || 'ACTIVE') : (data.statusOff || 'DISCONNECTED');
    let isCritical = !isPlugged || isSystemDead;

    elBadge.innerText = statusText;
    if (isCritical) {
        elBadge.className = 'badge badge-critical';
    } else {
        elBadge.className = 'badge badge-active';
    }

    // Update Temperature Display
    elTemp.innerText = `${sysTemp}°C`;
    if (sysTemp > 70) elTemp.className = 'temp-hot';
    else elTemp.className = 'temp-normal';

    // 3D Model Injection
    const modelUrl = data.model_url || '';
    if (modelUrl) {
        el3DViewer.setAttribute('src', modelUrl);
        el3DViewer.style.display = 'block';
    } else {
        el3DViewer.removeAttribute('src');
    }
}

// =========================================================
// DYNAMIC MONITOR SCREEN ENGINE
// =========================================================
function updateMonitor() {
    // Reset classes
    elScreenContent.className = 'screen-content';
    elGlitch.classList.add('hidden');

    // Hierarchy of system failures
    if (!plugStates['PSU']) {
        // Complete Power Loss
        elScreenContent.classList.add('state-off');
        elSystemLog.innerText = '';
        elPowerLed.className = 'power-led led-off';
        
    } else if (isThermalShutdown) {
        // Overheating Trip
        elScreenContent.classList.add('state-thermal');
        elSystemLog.innerHTML = 'THERMAL TRIP DETECTED.<br><br>SYSTEM HALTED TO PREVENT FIRE.<br>CPU LIMIT: 110°C EXCEEDED.<br><br>Reconnect cooling fan to reboot.';
        elPowerLed.className = 'power-led led-on';
        elGlitch.classList.remove('hidden');

    } else if (!plugStates['GPU']) {
        // Display Severed
        elScreenContent.classList.add('state-nosignal');
        elSystemLog.innerText = 'NO SIGNAL';
        elPowerLed.className = 'power-led led-on';

    } else if (!plugStates['RAM']) {
        // Memory Crash
        elScreenContent.classList.add('state-bsod');
        elSystemLog.innerHTML = ':( <br><br>MEMORY_MANAGEMENT<br><br>Your PC ran into a problem and needs to restart.';
        elPowerLed.className = 'power-led led-on';

    } else if (!plugStates['CPU']) {
        // CPU Removed (Freeze)
        elScreenContent.classList.add('state-normal');
        elSystemLog.innerText = 'SYSTEM FREEZE DETECTED\nNO INSTRUCTION SET FOUND.';
        // Apply a visual freeze effect
        elScreenContent.style.filter = 'grayscale(1) contrast(2)';
        elPowerLed.className = 'power-led led-on';

    } else if (!plugStates['SSD']) {
        // Storage Lost
        elScreenContent.classList.add('state-off');
        elScreenContent.style.backgroundColor = '#000';
        elScreenContent.style.color = '#fff';
        elSystemLog.innerText = 'Boot Device Not Found.\nPlease install an operating system on your hard disk.';
        elPowerLed.className = 'power-led led-on';

    } else {
        // System Normal
        elScreenContent.classList.add('state-normal');
        elScreenContent.style.filter = 'none';
        
        // Generate dynamic normal text
        let tempWarning = sysTemp > 70 ? `\n[WARN] CPU Temp High: ${sysTemp}°C` : '';
        elSystemLog.innerText = `EXCELLENTOS v1.0.9 RUNNING...\n\nAll hardware mounted securely.\nMemory OK.\nGraphics Pipeline Active.${tempWarning}`;
        elPowerLed.className = 'power-led led-on';
    }
}
