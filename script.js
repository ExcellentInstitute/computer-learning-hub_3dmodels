/**
 * ============================================================================
 * EXCELLENT INSTITUTE - VOLUMETRIC HARDWARE LAB ENGINE
 * ============================================================================
 * Architecture: True 3D Volumetric System Logic
 * Description: Manages DOM states, 3D transformations, thermal physics,
 *              and boot sequence validation for the 25-component physical simulation.
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// GLOBAL CONFIGURATION & STATE MANAGEMENT
// ----------------------------------------------------------------------------
const FIREBASE_URL = 'https://firebasestorage.googleapis.com/v0/b/excellent-institute-vault.firebasestorage.app/o/vault%2Flab_data_3d.json?alt=media&token=b44afe29-a3a3-4911-a835-5e98eeaa8aec';
const REPO_URL = 'https://excellentinstitute.github.io/computer-learning-hub_3dmodels/';

let dbData = {};
let selectedComponent = 'CPU';
let isFetching = true;

// Active Hardware States (True = Plugged In, False = Removed)
const plugStates = {
    'PSU': true, 
    'CPU': true, 
    'RAM': true, 
    'GPU': true, 
    'Fan': true,
    'SSD': true, 
    'HDD': true, 
    'ODD': true, 
    'Chipset': true, 
    'VRM': true,
    'CMOS': true, 
    'TPM': true, 
    'ATX24': true, 
    'EPS8': true, 
    'SATA': true,
    'NIC': true, 
    'WiFi': true, 
    'SoundCard': true, 
    'CaptureCard': true, 
    'Riser': true,
    'RGB': true, 
    'WaterPump': true, 
    'M2Heatsink': true, 
    'FrontPanel': true, 
    'USB3': true
};

// Critical power delivery chain
const powerComponents = ['PSU', 'ATX24', 'EPS8', 'CMOS'];

// Perfected 3D viewing angles mapping for cinematic camera rig
const componentViewingAngles = {
    'FrontPanel': 0, 
    'USB3': 0, 
    'ODD': 0,
    'PSU': -75, 
    'CPU': -75, 
    'RAM': -75, 
    'GPU': -75, 
    'WaterPump': -75,
    'Fan': -75, 
    'SSD': -75, 
    'HDD': -75, 
    'Chipset': -75, 
    'VRM': -75,
    'CMOS': -75, 
    'TPM': -75, 
    'ATX24': -75, 
    'EPS8': -75, 
    'SATA': -75,
    'NIC': -75, 
    'WiFi': -75, 
    'SoundCard': -75, 
    'CaptureCard': -75,
    'Riser': -75, 
    'RGB': -75, 
    'M2Heatsink': -75
};

// Dynamic Physics and System Variables
let sysTemp = 40;
let isThermalShutdown = false;
let isBooting = false;
let heatingInterval = null;
let desktopLoop = null;
let bootTimeout = null;
let zoomTimeout = null;

// Manual 3D Camera Controls
let isDraggingTower = false;
let startX = 0;
let currentRotation = -35; 

// ----------------------------------------------------------------------------
// EXHAUSTIVE DOM MAPPING
// ----------------------------------------------------------------------------
const UI = {
    // Left-Side Static Monitor Array
    screenBios: document.getElementById('screen-bios'),
    screenBoot: document.getElementById('screen-boot'),
    screenDesktop: document.getElementById('screen-desktop'),
    screenError: document.getElementById('screen-error'),
    gpuGlitch: document.getElementById('gpu-glitch'),
    biosText: document.getElementById('bios-text'),
    errorText: document.getElementById('error-text'),
    powerLed: document.getElementById('power-led'),
    
    // Left-Side Static Desktop Widgets
    widCpuBar: document.getElementById('wid-cpu-bar'),
    widCpuVal: document.getElementById('wid-cpu-val'),
    widRamBar: document.getElementById('wid-ram-bar'),
    widRamVal: document.getElementById('wid-ram-val'),
    widTempVal: document.getElementById('wid-temp-val'),
    widNetVal: document.getElementById('wid-net-val'),

    // Right-Side Volumetric 3D Tower Elements
    towerContainer: document.getElementById('pc-tower-container'),
    tower3D: document.getElementById('pc-tower'),
    sparkContainer: document.getElementById('global-spark-container'),
    sparkEmitter: document.getElementById('internal-spark-emitter'),
    towerPowerBtn: document.getElementById('tower-power-btn'),
    pumpLcdScreen: document.querySelector('.pump-lcd-screen'),
    pumpLcdText: document.querySelector('.pump-lcd-text'),
    
    // Bottom Inspector Panel
    selector: document.getElementById('component-selector'),
    title: document.getElementById('comp-title'),
    badge: document.getElementById('comp-badge'),
    desc: document.getElementById('comp-desc'),
    viewer3D: document.getElementById('component-3d-viewer'),
};

// ----------------------------------------------------------------------------
// LIFECYCLE INITIALIZATION
// ----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    fetchHardwareData();
    setupEventListeners();
    setupTowerRotation();
    startDesktopLoop();
    initiateBootSequence();
});

// ----------------------------------------------------------------------------
// DATA LAYER (Fetch & Fallback Generation)
// ----------------------------------------------------------------------------
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
        console.warn("External data fetch blocked or failed. Initializing localized engine.", error);
        dbData = generateAdvancedFallback();
    }
    
    isFetching = false;
    updateInspector(false); 
}

function generateAdvancedFallback() {
    return {
        'PSU': { 
            title: '850W 80+ Gold Power Supply', 
            statusOn: 'DELIVERING 12V', 
            statusOff: 'NO POWER', 
            descOn: 'Converting AC to DC voltage for the entire system.', 
            descOff: 'Critical: System has lost all power. Blackout condition.', 
            model_url: `${REPO_URL}psu.glb` 
        },
        'CPU': { 
            title: 'Central Processing Unit', 
            statusOn: 'EXECUTING IPC', 
            statusOff: 'SOCKET EMPTY', 
            descOn: 'Handling OS instructions and IPC routing via the motherboard.', 
            descOff: 'Fatal Error: System freezes before POST can initiate.', 
            model_url: `${REPO_URL}cpu.glb` 
        },
        'RAM': { 
            title: 'DDR5 Trident Memory', 
            statusOn: 'ALLOCATED (64GB)', 
            statusOff: 'NO MEMORY', 
            descOn: 'Providing ultra-fast volatile storage for the OS scheduler.', 
            descOff: 'Fatal Error: Memory Management BSOD triggered.', 
            model_url: `${REPO_URL}ram.glb` 
        },
        'GPU': { 
            title: 'GeForce RTX 4090', 
            statusOn: 'RENDERING', 
            statusOff: 'NO SIGNAL', 
            descOn: 'Pushing high-framerate pixel data to the display output.', 
            descOff: 'Display Error: Monitor receives no video signal from PCIe bus.', 
            model_url: `${REPO_URL}gpu.glb` 
        },
        'Fan': { 
            title: 'ARGB Cooling Fans (x9)', 
            statusOn: '1800 RPM', 
            statusOff: 'STOPPED', 
            descOn: 'Exhausting ambient heat from the volumetric chassis.', 
            descOff: 'Warning: Airflow reduced. Ambient case temperature rising.', 
            model_url: `${REPO_URL}fan.glb` 
        },
        'SSD': { 
            title: 'NVMe M.2 Drive', 
            statusOn: 'MOUNTED (C:\\)', 
            statusOff: 'UNMOUNTED', 
            descOn: 'Hosting the primary bootloader and ExcellentOS.', 
            descOff: 'Boot Error: Boot Device Not Found on PCIe lanes.', 
            model_url: `${REPO_URL}ssd.glb` 
        },
        'HDD': { 
            title: 'Mechanical Hard Drive Array', 
            statusOn: 'MOUNTED (D:\\)', 
            statusOff: 'DISCONNECTED', 
            descOn: 'Secondary mass storage archive in the rear chamber.', 
            descOff: 'Degraded: Secondary storage paths broken.', 
            model_url: `${REPO_URL}hdd.glb` 
        },
        'ODD': { 
            title: 'Optical Disk Drive', 
            statusOn: 'READY', 
            statusOff: 'OFFLINE', 
            descOn: 'Reading legacy CD/DVD media from the front bay.', 
            descOff: 'Non-critical: Disc media capabilities unavailable.', 
            model_url: `${REPO_URL}odd.glb` 
        },
        'Chipset': { 
            title: 'Motherboard Chipset', 
            statusOn: 'ROUTING DATA', 
            statusOff: 'FAILED', 
            descOn: 'Managing data flow between the CPU and external peripherals.', 
            descOff: 'Fatal: I/O communication severed entirely.', 
            model_url: `${REPO_URL}chipset.glb` 
        },
        'VRM': { 
            title: 'VRM Volumetric Heatsink', 
            statusOn: 'STABLE', 
            statusOff: 'OVERHEATING', 
            descOn: 'Cooling the voltage regulator modules delivering CPU power.', 
            descOff: 'Warning: Power delivery unstable. CPU throttling heavily.', 
            model_url: `${REPO_URL}vrm.glb` 
        },
        'CMOS': { 
            title: 'CMOS Battery', 
            statusOn: '3.3V DETECTED', 
            statusOff: 'DEAD', 
            descOn: 'Powering volatile BIOS memory chips.', 
            descOff: 'BIOS Error: CMOS Checksum invalid. System Time reset.', 
            model_url: `${REPO_URL}cmos.glb` 
        },
        'TPM': { 
            title: 'Security Module (TPM 2.0)', 
            statusOn: 'SECURE', 
            statusOff: 'MISSING', 
            descOn: 'Providing hardware-level cryptographic keys.', 
            descOff: 'OS Error: ExcellentOS requires TPM 2.0 to boot securely.', 
            model_url: `${REPO_URL}tpm.glb` 
        },
        'ATX24': { 
            title: '24-pin Main ATX Cable', 
            statusOn: 'POWERED', 
            statusOff: 'UNPLUGGED', 
            descOn: 'Delivering primary 12V/5V/3.3V to the motherboard PCB.', 
            descOff: 'Critical: Motherboard lacks primary power.', 
            model_url: `${REPO_URL}atx24.glb` 
        },
        'EPS8': { 
            title: '8-pin CPU Power Cable', 
            statusOn: 'DELIVERING', 
            statusOff: 'UNPLUGGED', 
            descOn: 'Delivering dedicated 12V power directly to the CPU socket.', 
            descOff: 'Fatal: CPU receives no power. System halt.', 
            model_url: `${REPO_URL}eps8.glb` 
        },
        'SATA': { 
            title: 'SATA Data Cable', 
            statusOn: 'LINKED', 
            statusOff: 'UNPLUGGED', 
            descOn: 'Connecting the HDD cage to the motherboard I/O.', 
            descOff: 'Degraded: HDD communication lost.', 
            model_url: `${REPO_URL}sata.glb` 
        },
        'NIC': { 
            title: '10GbE Network Card', 
            statusOn: '10Gbps LINK', 
            statusOff: 'OFFLINE', 
            descOn: 'Handling high-speed wired TCP/IP packet routing.', 
            descOff: 'Network: Wired LAN disconnected.', 
            model_url: `${REPO_URL}nic.glb` 
        },
        'WiFi': { 
            title: 'Wi-Fi 6E Module', 
            statusOn: 'BROADCASTING', 
            statusOff: 'DISABLED', 
            descOn: 'Managing wireless networks and Bluetooth connectivity.', 
            descOff: 'Network: Wireless connectivity lost.', 
            model_url: `${REPO_URL}wifi.glb` 
        },
        'SoundCard': { 
            title: 'Dedicated Sound Card', 
            statusOn: 'PROCESSING AUDIO', 
            statusOff: 'SILENT', 
            descOn: 'Rendering high-fidelity DAC audio for the system.', 
            descOff: 'Audio: System sound disabled.', 
            model_url: `${REPO_URL}soundcard.glb` 
        },
        'CaptureCard': { 
            title: 'Video Capture Card', 
            statusOn: 'STANDBY', 
            statusOff: 'UNPLUGGED', 
            descOn: 'Handling HDMI passthrough for external recording.', 
            descOff: 'Non-critical: Recording features unavailable.', 
            model_url: `${REPO_URL}capturecard.glb` 
        },
        'Riser': { 
            title: 'PCIe 4.0 Riser Cable', 
            statusOn: 'LINKED (x16)', 
            statusOff: 'SEVERED', 
            descOn: 'Extending the GPU PCIe connection for vertical mounting.', 
            descOff: 'Display Error: GPU disconnected from PCIe bus. No signal.', 
            model_url: `${REPO_URL}riser.glb` 
        },
        'RGB': { 
            title: 'ARGB Controller Hub', 
            statusOn: 'SYNCED', 
            statusOff: 'DARK', 
            descOn: 'Managing addressable lighting profiles across all fans.', 
            descOff: 'Aesthetic: System lights disabled.', 
            model_url: `${REPO_URL}rgb.glb` 
        },
        'WaterPump': { 
            title: 'AIO Liquid Cooler Pump', 
            statusOn: 'PUMPING LIQUID', 
            statusOff: 'STOPPED', 
            descOn: 'Circulating liquid coolant over the CPU IHS.', 
            descOff: 'Warning: Liquid flow stopped. Extreme thermal risk.', 
            model_url: `${REPO_URL}waterpump.glb` 
        },
        'M2Heatsink': { 
            title: 'M.2 SSD Thermal Shield', 
            statusOn: 'DISSIPATING', 
            statusOff: 'REMOVED', 
            descOn: 'Preventing NVMe thermal throttling under heavy loads.', 
            descOff: 'Warning: SSD running extremely hot, speeds reduced.', 
            model_url: `${REPO_URL}m2heatsink.glb` 
        },
        'FrontPanel': { 
            title: 'Front Panel I/O Headers', 
            statusOn: 'ACTIVE', 
            statusOff: 'DISCONNECTED', 
            descOn: 'Connecting physical power button and chassis USBs to motherboard.', 
            descOff: 'Non-critical: Case buttons physically disabled.', 
            model_url: `${REPO_URL}frontpanel.glb` 
        },
        'USB3': { 
            title: 'USB 3.2 Gen 2 Header', 
            statusOn: 'LINKED', 
            statusOff: 'UNPLUGGED', 
            descOn: 'Enabling high-speed external front I/O.', 
            descOff: 'Non-critical: Front Type-C and USB ports dead.', 
            model_url: `${REPO_URL}usb3.glb` 
        }
    };
}

// ----------------------------------------------------------------------------
// INTERACTIVE TOWER ROTATION MECHANICS
// ----------------------------------------------------------------------------
function setupTowerRotation() {
    const startDrag = (event) => {
        isDraggingTower = true;
        // Normalize touch vs mouse
        startX = event.type.includes('mouse') ? event.pageX : event.touches[0].pageX;
        
        // Remove transition to allow instant 1:1 following of the cursor
        UI.tower3D.style.transition = 'none'; 
    };

    const doDrag = (event) => {
        if (!isDraggingTower) return;
        event.preventDefault();
        
        const currentX = event.type.includes('mouse') ? event.pageX : event.touches[0].pageX;
        const diff = currentX - startX;
        
        // Apply differential rotation on the Y-axis dynamically
        UI.tower3D.style.transform = `rotateY(${currentRotation + (diff * 0.5)}deg)`;
    };

    const stopDrag = (event) => {
        if (!isDraggingTower) return;
        isDraggingTower = false;
        
        const endX = event.type.includes('mouse') ? event.pageX : event.changedTouches[0].pageX;
        
        // Save the new rotation state
        currentRotation += (endX - startX) * 0.5;
        
        // Restore smooth easing transition
        UI.tower3D.style.transition = 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)'; 
    };

    // Attach to the container (not just the tower) for better UX
    UI.towerContainer.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', doDrag);
    window.addEventListener('mouseup', stopDrag);

    // Mobile touch equivalents
    UI.towerContainer.addEventListener('touchstart', startDrag, { passive: false });
    window.addEventListener('touchmove', doDrag, { passive: false });
    window.addEventListener('touchend', stopDrag);
}

// ----------------------------------------------------------------------------
// EVENT LISTENERS & SYNCHRONIZATION
// ----------------------------------------------------------------------------
function setupEventListeners() {
    
    // Select Dropdown Listener
    UI.selector.addEventListener('change', (event) => {
        selectedComponent = event.target.value;
        updateInspector(true); 
    });

    // Motherboard Grid Button Listeners
    const buttons = document.querySelectorAll('.cyber-btn');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const compKey = button.getAttribute('data-component');
            
            // Sync selection dropdown
            selectedComponent = compKey;
            UI.selector.value = compKey;
            
            // Execute hardware physical removal/insertion logic
            toggleHardware(compKey, button);
            
            // Update the UI panel and trigger zoom
            updateInspector(true);
        });
    });
}

// ----------------------------------------------------------------------------
// VOLUMETRIC TOWER CINEMATIC ZOOM
// ----------------------------------------------------------------------------
function triggerCinematicZoom(componentKey) {
    // Ensure viewport is scrolled to the top to prevent bounding box issues
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Isolate the scale to the wrapper, keeping the left-side monitor untouched
    UI.towerContainer.style.transition = 'transform 1.2s cubic-bezier(0.2, 0.8, 0.2, 1)';
    UI.towerContainer.style.transform = 'scale(1.45) translateX(-25px)';
    
    // Auto-rotate the chassis to face the newly selected physical component
    const targetAngle = componentViewingAngles[componentKey] !== undefined ? componentViewingAngles[componentKey] : -35;
    currentRotation = targetAngle;
    UI.tower3D.style.transform = `rotateY(${currentRotation}deg)`;

    // Automatically zoom out after 6 seconds
    clearTimeout(zoomTimeout);
    zoomTimeout = setTimeout(() => {
        UI.towerContainer.style.transform = 'scale(1) translateX(0)';
        
        // Remove highlight glows globally safely
        const highlightedElements = document.querySelectorAll('.xray-highlight');
        highlightedElements.forEach(element => {
            element.classList.remove('xray-highlight');
        });
        
        // Return tower to default aesthetic angle
        currentRotation = -35;
        UI.tower3D.style.transform = `rotateY(${currentRotation}deg)`;
    }, 6000); 
}

function highlightPhysicalZone(componentKey) {
    // Scrub existing highlights
    const highlightedElements = document.querySelectorAll('.xray-highlight');
    highlightedElements.forEach(element => {
        element.classList.remove('xray-highlight');
    });
    
    // Apply highlight strictly to the targeted DOM element ID
    const targetZone = document.getElementById(`zone-${componentKey}`);
    if (targetZone) {
        targetZone.classList.add('xray-highlight');
    }
}

// ----------------------------------------------------------------------------
// PHYSICS ENGINE: SPARKS
// ----------------------------------------------------------------------------
function spawnInternalSparks() {
    if (!UI.sparkEmitter) return;
    
    // Spawn between 20 to 35 sparks dynamically
    const sparkCount = Math.floor(Math.random() * 15) + 20; 
    
    for(let i = 0; i < sparkCount; i++) {
        let spark = document.createElement('div');
        spark.className = 'spark';
        
        // Origins relative to the 3D spark emitter div inside the PSU
        spark.style.left = '0px';
        spark.style.top = '0px';
        
        // Random trajectory vectors
        let tx = (Math.random() - 0.5) * 350 + 'px'; 
        let ty = (Math.random() - 0.5) * 350 + 'px'; 
        
        spark.style.setProperty('--tx', tx);
        spark.style.setProperty('--ty', ty);
        
        // Append strictly to the 3D space
        UI.sparkEmitter.appendChild(spark);
        
        // Garbage collection
        setTimeout(() => {
            if (spark.parentNode) {
                spark.parentNode.removeChild(spark);
            }
        }, 800);
    }
}

// ----------------------------------------------------------------------------
// HARDWARE PHYSICS & THERMAL LOGIC
// ----------------------------------------------------------------------------
function toggleHardware(key, buttonElement) {
    // Invert hardware plug state
    plugStates[key] = !plugStates[key];
    const isPlugged = plugStates[key];

    // Handle button classes and visual power cut effects
    if (!isPlugged) {
        buttonElement.classList.replace('plugged', 'unplugged');
        
        // If it's a critical power component being ripped out, spawn sparks
        if (powerComponents.includes(key)) {
            spawnInternalSparks();
        }
        
        // If fans are disabled, physically stop the CSS spin animations via parent class
        if (key === 'Fan') {
            UI.tower3D.classList.add('power-off');
        }
        
        // Instantly kill boot timeouts if parts are removed mid-boot
        isBooting = false;
        clearTimeout(bootTimeout);
        
    } else {
        buttonElement.classList.replace('unplugged', 'plugged');
        
        // Restart fan animations if re-plugged
        if (key === 'Fan' && plugStates['PSU'] && plugStates['ATX24']) {
            UI.tower3D.classList.remove('power-off');
        }
    }

    // Thermal Math Logic
    if (key === 'PSU' || key === 'ATX24') {
        // If power is completely cut, thermals normalize
        if (!plugStates['PSU'] || !plugStates['ATX24']) {
            clearInterval(heatingInterval);
            sysTemp = 25; 
            isThermalShutdown = false;
            UI.tower3D.classList.add('power-off'); // Kills fan animations due to no power
        } 
        // If power is restored but cooling is broken, start rapid heating
        else if (!plugStates['Fan'] && !plugStates['WaterPump']) {
            sysTemp = 40;
            startThermalClimb(15);
            UI.tower3D.classList.remove('power-off');
        } 
        // If power is restored but one cooling element is broken, heat slowly
        else if (!plugStates['Fan'] || !plugStates['WaterPump']) {
            sysTemp = 40;
            startThermalClimb(6); 
            UI.tower3D.classList.remove('power-off');
        }
    } else if (key === 'Fan' || key === 'WaterPump') {
        // Evaluate cooling failure while system has power
        if ((!plugStates['Fan'] || !plugStates['WaterPump']) && plugStates['PSU'] && plugStates['ATX24']) {
            let heatRate = (!plugStates['Fan'] && !plugStates['WaterPump']) ? 15 : 6;
            startThermalClimb(heatRate);
        } 
        // Evaluate cooling restored
        else if (plugStates['Fan'] && plugStates['WaterPump']) {
            clearInterval(heatingInterval);
            sysTemp = 40; 
            isThermalShutdown = false;
        }
    }

    // Determine immediate state transitions
    if (isPlugged && (key === 'PSU' || key === 'ATX24' || key === 'FrontPanel') && plugStates['PSU'] && plugStates['ATX24']) {
        initiateBootSequence();
    } else {
        evaluateSystemState();
    }
}

function startThermalClimb(ratePerSecond) {
    clearInterval(heatingInterval);
    
    heatingInterval = setInterval(() => {
        sysTemp += ratePerSecond; 
        
        // Critical Trip Point
        if (sysTemp >= 110) {
            isThermalShutdown = true;
            clearInterval(heatingInterval);
            evaluateSystemState(); // Force UI update to show thermal crash
        }
    }, 1000);
}

// ----------------------------------------------------------------------------
// INSPECTOR PANEL LOGIC
// ----------------------------------------------------------------------------
function updateInspector(shouldZoom) {
    if (isFetching) return;

    const currentData = dbData[selectedComponent] || {};
    const isPlugged = plugStates[selectedComponent];
    const isSystemDead = !plugStates['PSU'] || !plugStates['ATX24'] || isThermalShutdown;
    
    // Inject Titles and Descriptions
    UI.title.innerText = currentData.title || selectedComponent;
    
    // Reset CSS animation cleanly
    UI.desc.style.animation = 'none';
    UI.desc.offsetHeight; 
    UI.desc.innerText = isPlugged ? (currentData.descOn || '') : (currentData.descOff || '');
    UI.desc.style.animation = 'fadeIn 0.5s ease-in';

    // Status Badge Logic
    let statusText = isPlugged ? (currentData.statusOn || 'ACTIVE') : (currentData.statusOff || 'DISCONNECTED');
    
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

    // Set 3D GLB Model URL dynamically into the model-viewer
    if (currentData.model_url) {
        UI.viewer3D.setAttribute('src', currentData.model_url);
    } else {
        UI.viewer3D.removeAttribute('src'); 
    }
    
    // Manage physical DOM highlighting
    highlightPhysicalZone(selectedComponent);
    
    if(shouldZoom) {
        triggerCinematicZoom(selectedComponent);
    }
}

// ----------------------------------------------------------------------------
// MONITOR BOOT & SYSTEM EVALUATION LOGIC
// ----------------------------------------------------------------------------
function initiateBootSequence() {
    // Validate immediate catastrophic failures before attempting boot
    if (!plugStates['PSU'] || !plugStates['ATX24'] || isThermalShutdown) {
        evaluateSystemState();
        return;
    }
    
    if (!plugStates['CPU'] || !plugStates['EPS8'] || !plugStates['Chipset']) {
        evaluateSystemState();
        return;
    }

    // Lock boot state
    isBooting = true;
    updateInspector(false);
    
    // Hide all generic screens
    UI.screenBios.classList.add('hidden');
    UI.screenDesktop.classList.add('hidden');
    UI.screenError.classList.add('hidden');
    if (UI.gpuGlitch) UI.gpuGlitch.classList.add('hidden');
    
    // Expose boot logo sequence
    UI.screenBoot.classList.remove('hidden');
    
    // Set LED aesthetics
    UI.powerLed.className = 'power-led led-on';
    if (UI.towerPowerBtn && plugStates['FrontPanel']) {
        UI.towerPowerBtn.style.borderColor = 'var(--cyan-glow)';
        UI.towerPowerBtn.style.boxShadow = '0 0 10px var(--cyan-glow)';
    }

    // 3 Second Timeout before evaluating successful post
    clearTimeout(bootTimeout);
    bootTimeout = setTimeout(() => {
        isBooting = false;
        evaluateSystemState(); 
        updateInspector(false);
    }, 3000); 
}

function evaluateSystemState() {
    // Normalize UI screens
    UI.screenBios.classList.add('hidden');
    UI.screenBoot.classList.add('hidden');
    UI.screenDesktop.classList.add('hidden');
    UI.screenError.classList.add('hidden');
    if (UI.gpuGlitch) UI.gpuGlitch.classList.add('hidden');
    
    // Reset Power LEDs
    if (UI.towerPowerBtn) {
        UI.towerPowerBtn.style.borderColor = '#cbd5e1';
        UI.towerPowerBtn.style.boxShadow = 'inset 0 2px 5px #000';
    }

    // Condition 1: ABSOLUTE NO POWER
    if (!plugStates['PSU'] || !plugStates['ATX24']) {
        UI.powerLed.className = 'power-led led-off';
        
        // Blank out the Volumetric Pump LCD completely
        if (UI.pumpLcdText) UI.pumpLcdText.innerText = ''; 
        if (UI.pumpLcdScreen) {
            UI.pumpLcdScreen.style.borderColor = '#1e293b';
            UI.pumpLcdScreen.style.boxShadow = 'inset 0 0 10px #000';
        }
        return; 
    }
    
    // Hardware has power. Illuminate button if front panel header is plugged.
    if (plugStates['FrontPanel'] && UI.towerPowerBtn) {
        UI.towerPowerBtn.style.borderColor = 'var(--cyan-glow)';
        UI.towerPowerBtn.style.boxShadow = '0 0 10px var(--cyan-glow)';
    }

    // Condition 2: DISPLAY CABLE / GPU MISSING
    if (!plugStates['GPU'] || !plugStates['Riser']) {
        UI.powerLed.className = 'power-led led-error';
        UI.screenError.classList.remove('hidden');
        UI.errorText.style.color = '#cbd5e1';
        UI.errorText.innerText = 'NO SIGNAL DETECTED';
        UI.errorText.style.animation = 'pulse-text 2s infinite';
        return;
    }

    // Condition 3: THERMAL SHUTDOWN TRIGGERED
    if (isThermalShutdown) {
        UI.powerLed.className = 'power-led led-error';
        if (UI.towerPowerBtn) {
            UI.towerPowerBtn.style.borderColor = 'var(--red-glow)';
            UI.towerPowerBtn.style.boxShadow = '0 0 15px var(--red-glow)';
        }
        UI.screenError.classList.remove('hidden');
        UI.errorText.style.color = 'var(--red-glow)';
        UI.errorText.innerHTML = 'FATAL: THERMAL TRIP DETECTED<br><br>CPU CORE EXCEEDED 110°C.<br>EMERGENCY HALT INITIATED TO PREVENT SILICON DAMAGE.<br><br>Action Required: Reconnect volumetric cooling block and execute power cycle.';
        UI.errorText.style.animation = 'none';
        return;
    }

    // Condition 4: MEMORY ARCHITECTURE MISSING
    if (!plugStates['RAM']) {
        UI.powerLed.className = 'power-led led-on';
        UI.screenError.classList.remove('hidden');
        UI.errorText.style.color = '#3b82f6'; // BSOD Blue
        UI.errorText.innerHTML = ':( <br><br>Your PC ran into a problem and needs to restart.<br><br>Stop code: MEMORY_MANAGEMENT_FAILURE';
        UI.errorText.style.animation = 'none';
        return;
    }

    // Condition 5: CPU OR BUS SEVERED
    if (!plugStates['CPU'] || !plugStates['EPS8'] || !plugStates['Chipset']) {
        UI.powerLed.className = 'power-led led-on';
        UI.screenError.classList.remove('hidden');
        UI.errorText.style.color = '#ef4444';
        UI.errorText.innerHTML = 'SYSTEM HALT.<br>ERR_NO_PROCESSOR_OR_CRITICAL_BUS_FOUND';
        UI.errorText.style.animation = 'none';
        return;
    }

    // Condition 6: STORAGE BOOTLOADER MISSING
    if (!plugStates['SSD']) {
        UI.powerLed.className = 'power-led led-on';
        UI.screenBios.classList.remove('hidden');
        UI.biosText.innerHTML = 'Excellent BIOS v4.0.1<br>CPU: Detected successfully<br>Memory: OK (64GB)<br><br>ERROR: Boot Device Not Found on PCIe Lanes.<br>Please install an operating system to continue.';
        return;
    }

    // Condition 7: SECURE BOOT TPM MISSING
    if (!plugStates['TPM']) {
        UI.powerLed.className = 'power-led led-on';
        UI.screenBios.classList.remove('hidden');
        UI.biosText.innerHTML = 'Excellent BIOS v4.0.1<br>CPU: Detected successfully<br>Memory: OK (64GB)<br><br>ERROR: Trusted Platform Module (TPM 2.0) not detected.<br>ExcellentOS requires TPM architecture for secure boot.';
        return;
    }

    // Condition 8: VOLATILE BIOS RESET (CMOS DEAD)
    if (!plugStates['CMOS']) {
        UI.powerLed.className = 'power-led led-on';
        UI.screenBios.classList.remove('hidden');
        UI.biosText.innerHTML = 'Excellent BIOS v4.0.1<br><br>WARNING: CMOS Checksum Error.<br>CMOS Battery Voltage Low or Missing.<br>System Time has been reset to defaults.<br><br>Press F1 to Run SETUP';
        return;
    }

    // Condition 9: SUCCESSFUL BOOT EXECUTION -> DESKTOP
    // We only show desktop if it's not currently animating the boot sequence
    if(isBooting) {
        UI.screenBoot.classList.remove('hidden');
    } else {
        UI.powerLed.className = 'power-led led-on';
        UI.screenDesktop.classList.remove('hidden');
    }
    
    // Minor aesthetic logic: If VRM heatsink is removed, display minor graphical artifacts
    if (!plugStates['VRM'] && UI.gpuGlitch && !isBooting) {
        UI.gpuGlitch.classList.remove('hidden'); 
    }
}

// ----------------------------------------------------------------------------
// BACKGROUND DESKTOP DAEMON & REAL-TIME THERMALS
// ----------------------------------------------------------------------------
function startDesktopLoop() {
    desktopLoop = setInterval(() => {
        
        // Determine system thermal state and apply chassis visual warnings
        if (sysTemp > 75) {
            UI.tower3D.classList.add('overheating');
        } else {
            UI.tower3D.classList.remove('overheating');
        }

        // Calculate and format the current temperature string
        let currentTemp;
        let formattedTempStr;
        
        if (plugStates['Fan'] && plugStates['WaterPump']) {
            currentTemp = Math.floor(Math.random() * 3) + 38;
            formattedTempStr = `${currentTemp}°C`;
            UI.widTempVal.className = 'wid-val temp-val';
        } else {
            currentTemp = sysTemp;
            formattedTempStr = `${currentTemp}°C`;
            UI.widTempVal.className = 'wid-val temp-val temp-hot';
        }

        UI.widTempVal.innerText = formattedTempStr;

        // Sync Volumetric 3D Pump LCD with physics engine
        if (UI.pumpLcdText && UI.pumpLcdScreen) {
            if (plugStates['PSU'] && plugStates['ATX24'] && plugStates['WaterPump']) {
                UI.pumpLcdText.innerText = formattedTempStr;
                
                // Adjust colors based on thermal warnings
                if(currentTemp > 75) {
                    UI.pumpLcdText.style.color = 'var(--red-glow)';
                    UI.pumpLcdText.style.textShadow = '0 0 15px var(--red-glow)';
                    UI.pumpLcdScreen.style.borderColor = 'var(--red-glow)';
                } else {
                    UI.pumpLcdText.style.color = 'var(--cyan-glow)';
                    UI.pumpLcdText.style.textShadow = '0 0 8px var(--cyan-glow)';
                    UI.pumpLcdScreen.style.borderColor = 'var(--cyan-glow)';
                }
            } else {
                // Device powered down
                UI.pumpLcdText.innerText = ''; 
                UI.pumpLcdScreen.style.borderColor = '#1e293b';
                UI.pumpLcdScreen.style.boxShadow = 'inset 0 0 10px #000';
            }
        }

        // If core features are missing, halt random UI value generation
        if (!plugStates['PSU'] || isThermalShutdown || !plugStates['CPU'] || !plugStates['RAM'] || !plugStates['SSD']) {
            return;
        }

        // Generate dynamic CPU Load values
        let cpuLoad = Math.floor(Math.random() * 12) + 2;
        if (!plugStates['VRM']) cpuLoad = 100; // Throttling logic
        
        UI.widCpuBar.style.width = `${cpuLoad}%`;
        UI.widCpuVal.innerText = `${cpuLoad}%`;

        // Generate dynamic RAM values based on HDD status
        let ramUsage = plugStates['HDD'] ? 18 : 64; 
        UI.widRamBar.style.width = `${ramUsage}%`;
        UI.widRamVal.innerText = `${ramUsage}%`;
        UI.widRamBar.style.backgroundColor = plugStates['HDD'] ? 'var(--cyan-glow)' : 'var(--yellow-glow)';

        // Manage Network Logic
        if (plugStates['NIC'] || plugStates['WiFi']) {
            UI.widNetVal.innerText = plugStates['NIC'] ? '10GBPS LINK' : 'WI-FI CONNECTED';
            UI.widNetVal.style.color = 'var(--cyan-glow)';
        } else {
            UI.widNetVal.innerText = 'OFFLINE';
            UI.widNetVal.style.color = 'var(--red-glow)';
        }
        
    }, 1500);
}
