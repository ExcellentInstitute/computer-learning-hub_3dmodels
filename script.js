/**
 * ============================================================================
 * EXCELLENT INSTITUTE - VOLUMETRIC HARDWARE LAB ENGINE (V5.0 - TRUE GEOMETRY)
 * ============================================================================
 * Architecture: True 3D Volumetric System Logic & Telemetry
 * Sub-system: Physical Simulation, Thermal Dynamics, Hardware POST Validation
 * Description: Uncompressed, exhaustively detailed logic engine handling 25 
 *              discrete hardware components mapped to 6-sided CSS 3D geometry.
 *              Includes completely overhauled Cinematic Camera Rig targeting
 *              the left transparent tempered glass panel for clear X-Ray inspection.
 *              Strictly un-minified to guarantee absolute execution stability.
 *              V5.0 Updates: 
 *              - Forced !important flag overrides for Cinematic Zoom synchronization.
 *              - Added multi-node highlighting for segmented AIO Tubes.
 *              - Enhanced Monitor Reaction sequence for hot-plugging recovery.
 *              - Expanded Bootloader logic to automatically reboot when critical
 *                hardware (RAM, GPU, etc.) is re-inserted while power is active.
 * ============================================================================
 */

// ============================================================================
// 1. GLOBAL CONFIGURATION & EXTERNAL ENDPOINTS
// ============================================================================

/**
 * Primary Firebase Storage Endpoint for dynamic GLB model configurations.
 * Contains explicit backup metadata in case of local cache invalidation or
 * cross-origin resource sharing (CORS) policy blocks.
 */
const FIREBASE_URL = 'https://firebasestorage.googleapis.com/v0/b/excellent-institute-vault.firebasestorage.app/o/vault%2Flab_data_3d.json?alt=media&token=b44afe29-a3a3-4911-a835-5e98eeaa8aec';

/**
 * Base URL for the Excellent Institute GitHub repository hosting the .glb files.
 * Used as a robust fallback for the 3D model viewer chamber.
 */
const REPO_URL = 'https://excellentinstitute.github.io/computer-learning-hub_3dmodels/';

// ============================================================================
// 2. CORE SYSTEM STATE MANAGEMENT & VOLUMETRIC TRACKING
// ============================================================================

let dbData = {};
let selectedComponent = 'CPU';
let isFetching = true;

/**
 * Hardware Plug States Tracker (25 Component Matrix)
 * Explicitly tracks the physical connection state of all 25 volumetric components.
 * Boolean True  = Component is physically seated in the motherboard/chassis.
 * Boolean False = Component has been forcibly ripped out by the user.
 */
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

/**
 * Critical Power Delivery Chain Array
 * If any of these specific components are evaluated as 'false', the system 
 * experiences an immediate and total volumetric blackout event.
 */
const powerComponents = [
    'PSU', 
    'ATX24', 
    'EPS8', 
    'CMOS'
];

/**
 * Critical Boot Pipeline Components
 * Re-inserting any of these while the system has power will trigger an
 * automatic warm reboot sequence to recover from BSOD/Error states.
 */
const criticalBootComponents = [
    'CPU',
    'RAM',
    'GPU',
    'SSD',
    'Chipset',
    'TPM',
    'Riser',
    'EPS8'
];

/**
 * Volumetric 3D Camera Rig Viewing Angles & Translations (V5.0 Overhaul)
 * Maps each component to its perfect Y-axis rotation and X/Y translation.
 * V5.0 Fix: Values specifically tuned between -60deg and -110deg to force the
 * camera to look THROUGH the transparent left tempered glass panel.
 * Adjusted scaling and translations to sync perfectly with the CSS updates.
 */
const cinematicCameraRig = {
    'FrontPanel':  { rotateY: 15, translateX: '20px', translateY: '0px',   scale: 1.5 },
    'ODD':         { rotateY: 20, translateX: '20px', translateY: '50px',  scale: 1.6 },
    'PSU':         { rotateY: 110, translateX: '40px', translateY: '-100px',scale: 1.5 },
    'CPU':         { rotateY: 80, translateX: '30px',  translateY: '20px',  scale: 1.8 },
    'WaterPump':   { rotateY: 85, translateX: '40px',  translateY: '20px',  scale: 1.8 },
    'RAM':         { rotateY: 75, translateX: '60px',  translateY: '30px',  scale: 1.7 },
    'GPU':         { rotateY: 85, translateX: '20px',  translateY: '-40px', scale: 1.6 },
    'Fan':         { rotateY: 100, translateX: '50px', translateY: '0px',   scale: 1.4 },
    'SSD':         { rotateY: 70, translateX: '20px',  translateY: '-20px', scale: 1.8 },
    'HDD':         { rotateY: 110, translateX: '50px', translateY: '0px',   scale: 1.5 },
    'Chipset':     { rotateY: 80, translateX: '20px',  translateY: '-80px', scale: 1.9 },
    'VRM':         { rotateY: 65, translateX: '30px',  translateY: '60px',  scale: 1.8 },
    'CMOS':        { rotateY: 70, translateX: '40px',  translateY: '-60px', scale: 1.9 },
    'TPM':         { rotateY: 75, translateX: '20px',  translateY: '-80px', scale: 1.8 },
    'ATX24':       { rotateY: 90, translateX: '50px',  translateY: '0px',   scale: 1.6 },
    'EPS8':        { rotateY: 40, translateX: '40px',  translateY: '80px',  scale: 1.7 },
    'SATA':        { rotateY: 85, translateX: '20px',  translateY: '-80px', scale: 1.8 },
    'NIC':         { rotateY: 85, translateX: '30px',  translateY: '-100px',scale: 1.6 },
    'WiFi':        { rotateY: 85, translateX: '30px',  translateY: '-120px',scale: 1.6 },
    'SoundCard':   { rotateY: 85, translateX: '30px',  translateY: '-140px',scale: 1.6 },
    'CaptureCard': { rotateY: 85, translateX: '30px',  translateY: '-160px',scale: 1.6 },
    'Riser':       { rotateY: 60, translateX: '20px',  translateY: '-50px', scale: 1.5 },
    'RGB':         { rotateY: 80, translateX: '20px',  translateY: '100px', scale: 1.6 },
    'M2Heatsink':  { rotateY: 75, translateX: '20px',  translateY: '-20px', scale: 1.8 },
    'USB3':        { rotateY: 90, translateX: '20px',  translateY: '-100px',scale: 1.8 }
};

// ============================================================================
// 3. THERMAL DYNAMICS & PHYSICS ENGINE VARIABLES
// ============================================================================

let sysTemp = 40;                     // Base ambient physical temperature in Celsius
let isThermalShutdown = false;        // Critical hardware silicon protection flag
let isBooting = false;                // BIOS sequence operating flag

let heatingInterval = null;           // Memory pointer for thermal escalation daemon
let desktopLoop = null;               // Memory pointer for UI telemetry generation daemon
let bootTimeout = null;               // Memory pointer for BIOS POST sequence logic
let zoomTimeout = null;               // Memory pointer for cinematic camera pan
let rgbCycleInterval = null;          // Memory pointer for Addressable RGB mathematics

let currentRgbHue = 0;                // Starting HSL hue value for dynamic RGB strips

let isDraggingTower = false;          // User interaction flag for manual 3D matrix rotation
let startX = 0;                       // Mouse/Touch origin coordinate vector
let currentRotation = 35;            // Default aesthetic isometric angle of the chassis

// ============================================================================
// 4. EXHAUSTIVE DOM ELEMENT MAPPING & REGISTRATION
// ============================================================================

const UI = {
    // --- 2D Left-Side Monitor Environment Layers ---
    screenBios: document.getElementById('screen-bios'),
    screenBoot: document.getElementById('screen-boot'),
    screenDesktop: document.getElementById('screen-desktop'),
    screenError: document.getElementById('screen-error'),
    gpuGlitch: document.getElementById('gpu-glitch'),
    
    // --- 2D Left-Side Text & Display Modules ---
    biosText: document.getElementById('bios-text'),
    errorText: document.getElementById('error-text'),
    powerLed: document.getElementById('power-led'),
    
    // --- 2D Left-Side Desktop Telemetry Widgets ---
    widCpuBar: document.getElementById('wid-cpu-bar'),
    widCpuVal: document.getElementById('wid-cpu-val'),
    widRamBar: document.getElementById('wid-ram-bar'),
    widRamVal: document.getElementById('wid-ram-val'),
    widTempVal: document.getElementById('wid-temp-val'),
    widNetVal: document.getElementById('wid-net-val'),

    // --- Right-Side Volumetric 3D Tower Elements ---
    towerContainer: document.getElementById('pc-tower-container'),
    tower3D: document.getElementById('pc-tower'),
    towerPowerBtn: document.getElementById('tower-power-btn'),
    
    // --- Physics Render Emitters ---
    sparkContainer: document.getElementById('global-spark-container'),
    sparkEmitter: document.getElementById('internal-spark-emitter'),
    
    // --- Volumetric AIO Pump LCD Screen Nodes ---
    pumpLcdScreen: document.querySelector('.pump-lcd-screen'),
    pumpLcdText: document.querySelector('.pump-lcd-text'),
    
    // --- Bottom Data Inspector Panel & Form ---
    selector: document.getElementById('component-selector'),
    title: document.getElementById('comp-title'),
    badge: document.getElementById('comp-badge'),
    desc: document.getElementById('comp-desc'),
    viewer3D: document.getElementById('component-3d-viewer'),
    
    // --- Aesthetic Target Nodes for RGB Cycle Engine ---
    rgbElements: document.querySelectorAll('.ram-rgb-diffuser, .gpu-led-strip, .rgb-header')
};

// ============================================================================
// 5. CORE BOOTSTRAP INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    logTelemetry('SYSTEM', 'INIT', 'DOM fully loaded. Executing exhaustive hardware bootstrap.');
    
    // 1. Fetch remote 3D models or load local robust database
    fetchHardwareData();
    
    // 2. Bind all physical interactions to the DOM
    setupEventListeners();
    
    // 3. Initialize the 3D rotation mathematics
    setupTowerRotation();
    
    // 4. Start the background telemetry daemon
    startDesktopLoop();
    
    // 5. Boot the virtual machine natively
    initiateBootSequence();
    
    // 6. Ignite the RGB lighting mathematically
    startRgbCycle();
});

// ============================================================================
// 6. DIAGNOSTIC TELEMETRY LOGGING SUBSYSTEM
// ============================================================================

/**
 * Outputs simulated hardware telemetry directly to the console.
 * Highly robust log mechanism for tracking state changes during physical component removals.
 * 
 * @param {string} component - The hardware part generating the log entry.
 * @param {string} state - The current active state (e.g., POWER_CUT, OVERHEAT).
 * @param {string} message - Detailed output message.
 */
function logTelemetry(component, state, message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [HARDWARE_ENGINE] [${component}] - State: ${state} - ${message}`);
}

// ============================================================================
// 7. DATA LAYER & FALLBACK GENERATION
// ============================================================================

/**
 * Attempts to retrieve dynamic GLB reference URLs from the Firebase cluster.
 * Immediately fails over to the robust local fallback database if external networks are blocked.
 */
async function fetchHardwareData() {
    try {
        logTelemetry('NETWORK', 'FETCH', `Requesting hardware database from: ${FIREBASE_URL}`);
        
        // Appending timestamp cache buster ensures we always pull fresh configuration logic
        const cacheBusterUrl = `${FIREBASE_URL}&t=${new Date().getTime()}`;
        const response = await fetch(cacheBusterUrl);
        
        if (response.ok) {
            logTelemetry('NETWORK', 'SUCCESS', 'Remote hardware database successfully acquired.');
            const serverData = await response.json();
            
            // Execute deep merge: Remote data overlays local robust fallback
            dbData = { ...generateAdvancedFallback(), ...serverData };
        } else {
            logTelemetry('NETWORK', 'FAILED', 'HTTP Response rejected. Loading local logic engine directly.');
            dbData = generateAdvancedFallback();
        }
    } catch (error) {
        logTelemetry('NETWORK', 'ERROR', `Fatal connection error: ${error.message}. Loading local logic engine.`);
        dbData = generateAdvancedFallback();
    }
    
    // Drop loading flag and push data to inspection panel
    isFetching = false;
    updateInspector(false); 
}

/**
 * Un-minified, exhaustive local database containing states, descriptions, 
 * and repository links for all 25 volumetric physical components.
 * 
 * @returns {Object} Extensively detailed hardware configuration object
 */
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

// ============================================================================
// 8. INTERACTIVE 3D MATHEMATICS (MOUSE & TOUCH)
// ============================================================================

/**
 * Binds mouse and touch events to the specific volumetric chassis container.
 * Calculates differential Y-axis rotation based on drag distance across the viewport.
 */
function setupTowerRotation() {
    
    // Pointer down execution logic
    const handleDragStart = (event) => {
        isDraggingTower = true;
        
        // Normalize touch vs mouse inputs mathematically
        if (event.type.includes('mouse')) {
            startX = event.pageX;
        } else {
            startX = event.touches[0].pageX;
        }
        
        // Strip CSS transition to allow immediate 1:1 rotation mapping without lag
        UI.tower3D.style.setProperty('transition', 'none', 'important'); 
        
        logTelemetry('CHASSIS', 'INTERACT', 'User initiated manual 3D rotation drag sequence.');
    };

    // Pointer move execution logic
    const handleDragMove = (event) => {
        if (isDraggingTower === false) {
            return;
        }
        
        event.preventDefault();
        
        let currentX;
        if (event.type.includes('mouse')) {
            currentX = event.pageX;
        } else {
            currentX = event.touches[0].pageX;
        }
        
        // Calculate differential vector and apply dampening multiplier (0.5)
        const differential = currentX - startX;
        const targetRotation = currentRotation + (differential * 0.5);
        
        // Update DOM transform dynamically using SetProperty to bypass rigid CSS rules
        UI.tower3D.style.setProperty('transform', `rotateY(${targetRotation}deg)`, 'important');
    };

    // Pointer up execution logic
    const handleDragStop = (event) => {
        if (isDraggingTower === false) {
            return;
        }
        
        isDraggingTower = false;
        
        let endX;
        if (event.type.includes('mouse')) {
            endX = event.pageX;
        } else {
            endX = event.changedTouches[0].pageX;
        }
        
        // Finalize state geometry variables
        currentRotation += (endX - startX) * 0.5;
        
        // Re-apply the smooth CSS cubic-bezier transition for upcoming cinematic zooms
        UI.tower3D.style.setProperty('transition', 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)', 'important'); 
        
        logTelemetry('CHASSIS', 'RELEASE', `Rotation sequence settled at exactly ${currentRotation} degrees.`);
    };

    // Desktop bindings
    UI.towerContainer.addEventListener('mousedown', handleDragStart);
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragStop);
    
    // Mobile bindings (Passive: false explicitly required to permit preventDefault usage)
    UI.towerContainer.addEventListener('touchstart', handleDragStart, { passive: false });
    window.addEventListener('touchmove', handleDragMove, { passive: false });
    window.addEventListener('touchend', handleDragStop);
}

// ============================================================================
// 9. HARDWARE UI EVENT LISTENERS
// ============================================================================

/**
 * Binds clicking events to the massive 25-button hardware matrix.
 * Synchronizes the visual dropdown state with the clicked physical button state.
 */
function setupEventListeners() {
    
    // Synchronize HTML select dropdown changes back to the main engine
    UI.selector.addEventListener('change', (event) => {
        selectedComponent = event.target.value;
        logTelemetry('UI', 'SELECT', `Dropdown triggered directly for component: ${selectedComponent}`);
        updateInspector(true); 
    });

    // Synchronize physical hardware grid clicks to the logic engine
    const physicalButtons = document.querySelectorAll('.cyber-btn');
    
    physicalButtons.forEach(button => {
        button.addEventListener('click', () => {
            const componentKey = button.getAttribute('data-component');
            
            logTelemetry('PHYSICAL', 'TOGGLE', `User physically interacted with ${componentKey} connection point.`);
            
            // Sync selection dropdown to match grid
            selectedComponent = componentKey;
            UI.selector.value = componentKey;
            
            // Push action into the physics engine
            toggleHardware(componentKey, button);
            
            // Refresh visual UI and trigger massive 3D cinematic zoom logic
            updateInspector(true);
            
            // Flash the monitor to show dynamic reaction to the hardware event
            flashMonitorReaction();
        });
    });
}

/**
 * Creates a quick visual flash on the monitor screen to simulate system 
 * reactivity when a component is physically altered.
 */
function flashMonitorReaction() {
    if (!UI.screenDesktop.classList.contains('hidden') || !UI.screenBios.classList.contains('hidden')) {
        // Apply extreme brightness briefly
        UI.monitorScreen.style.setProperty('filter', 'brightness(2.5) contrast(1.5)', 'important');
        
        setTimeout(() => {
            // Revert back to normal CSS state
            UI.monitorScreen.style.removeProperty('filter');
        }, 150);
    }
}

// ============================================================================
// 10. CINEMATIC 3D CAMERA RIG (V5.0 - EXACT 2 SECONDS, LEFT GLASS FOCUS)
// ============================================================================

/**
 * Automates the volumetric 3D camera pan.
 * Dynamically scales the specific tower container while mathematically translating
 * the X/Y coordinates and rotating the Y axis to perfectly frame the targeted component
 * explicitly through the left transparent glass panel. Highlights for exactly 2 seconds.
 * V5.0 FIX: Added setProperty(..., 'important') to physically force the CSS override.
 * 
 * @param {string} componentKey - The specific hardware node to target
 */
function triggerCinematicZoom(componentKey) {
    // Ensure viewport is scrolled to the top to prevent bounding box clipping issues
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    logTelemetry('CAMERA', 'ZOOM', `Initiating cinematic camera rig to view ${componentKey} through left panel.`);

    // Extract exact camera parameters from the cinematic rig configuration dictionary
    const rigData = cinematicCameraRig[componentKey] || { rotateY: 75, translateX: '20px', translateY: '0px', scale: 1.45 };
    
    // Force transition and transform using setProperty overriding any CSS sheet specificity
    UI.towerContainer.style.setProperty('transition', 'transform 1.2s cubic-bezier(0.2, 0.8, 0.2, 1)', 'important');
    UI.towerContainer.style.setProperty('transform', `scale(${rigData.scale}) translate(${rigData.translateX}, ${rigData.translateY})`, 'important');
    
    // Apply exact mathematical rotation to the inner 3D object to face the glass
    currentRotation = rigData.rotateY;
    UI.tower3D.style.setProperty('transform', `rotateY(${currentRotation}deg)`, 'important');

    // Automatically zoom out after exactly 2000ms (2 seconds) as requested
    clearTimeout(zoomTimeout);
    zoomTimeout = setTimeout(() => {
        logTelemetry('CAMERA', 'RESET', '2 seconds elapsed. Restoring default chassis perspective viewing angle.');
        
        // Reset scale and translation matrix with important flags
        UI.towerContainer.style.setProperty('transform', 'scale(1) translate(0px, 0px)', 'important');
        
        // Extinguish all active 3D x-ray glow nodes safely from the DOM
        const highlightedElements = document.querySelectorAll('.xray-highlight');
        highlightedElements.forEach(element => {
            element.classList.remove('xray-highlight');
        });
        
        // Reset to aesthetic chassis isometric angle (-35deg)
        currentRotation = 35;
        UI.tower3D.style.setProperty('transform', `rotateY(${currentRotation}deg)`, 'important');
    }, 2000); // Strict 2 second requirement met perfectly
}

/**
 * Dynamically applies the CSS X-Ray highlight to the target 3D block
 * inside the volumetric chassis, illuminating it in cyan.
 * 
 * @param {string} componentKey - The target node to illuminate
 */
function highlightPhysicalZone(componentKey) {
    // Scrub existing highlights globally to prevent ghosting
    const highlightedElements = document.querySelectorAll('.xray-highlight');
    highlightedElements.forEach(element => {
        element.classList.remove('xray-highlight');
    });
    
    // Map the string to the exact DOM ID and apply the glow class
    const targetZoneId = `zone-${componentKey}`;
    const targetZoneElement = document.getElementById(targetZoneId);
    
    if (targetZoneElement) {
        targetZoneElement.classList.add('xray-highlight');
        logTelemetry('AESTHETIC', 'HIGHLIGHT', `Illuminated physical node geometry: ${targetZoneId}`);
    } else {
        logTelemetry('AESTHETIC', 'WARN', `Target node ${targetZoneId} not found in DOM tree.`);
    }
    
    // Special V5.0 Edge Case: When WaterPump is selected, also illuminate the curved tubes
    if (componentKey === 'WaterPump') {
        const tube1 = document.getElementById('zone-Tube1');
        const tube2 = document.getElementById('zone-Tube2');
        if (tube1) tube1.classList.add('xray-highlight');
        if (tube2) tube2.classList.add('xray-highlight');
        logTelemetry('AESTHETIC', 'HIGHLIGHT', `Illuminated extended curved AIO coolant tubes.`);
    }
}

// ============================================================================
// 11. SPARK PARTICLE PHYSICS ENGINE
// ============================================================================

/**
 * Generates highly realistic sparks radiating from the PSU block.
 * Uses trigonometric functions to plot circular explosive vectors, mapping
 * directly into the 3D space of the chassis internals without breaking bounds.
 */
function spawnInternalSparks() {
    if (!UI.sparkEmitter) {
        logTelemetry('PHYSICS', 'ERROR', 'Spark emitter target node missing from DOM structure.');
        return;
    }
    
    logTelemetry('PHYSICS', 'SPARK', 'Critical power sever detected. Executing spark explosion mathematics.');
    
    // Randomize explosive yield between 30 and 55 massive spark nodes for heavy visual impact
    const sparkCount = Math.floor(Math.random() * 25) + 30; 
    
    for(let index = 0; index < sparkCount; index++) {
        let sparkNode = document.createElement('div');
        sparkNode.className = 'spark';
        
        // Origins relative to the 3D spark emitter div tucked inside the dual-chamber PSU void
        sparkNode.style.left = '0px';
        sparkNode.style.top = '0px';
        
        // Explicit Trigonometric Vector Mathematics
        // Calculate random explosion angle (0 to 360 degrees in radians)
        let vectorAngle = Math.random() * Math.PI * 2;
        
        // Calculate blast radius magnitude (pushing outwards in all directions)
        let radiusMagnitude = Math.random() * 200 + 50;
        
        // Apply Cosine for X translation and Sine for Y translation
        let translatedX = Math.cos(vectorAngle) * radiusMagnitude + 'px'; 
        let translatedY = Math.sin(vectorAngle) * radiusMagnitude + 'px'; 
        
        // Push CSS variables directly into the inline style for keyframe processing
        sparkNode.style.setProperty('--tx', translatedX);
        sparkNode.style.setProperty('--ty', translatedY);
        
        // Append strictly to the 3D space to guarantee bounding box containment
        UI.sparkEmitter.appendChild(sparkNode);
        
        // Garbage collection to prevent browser DOM memory leaks
        setTimeout(() => {
            if (sparkNode.parentNode) {
                sparkNode.parentNode.removeChild(sparkNode);
            }
        }, 800);
    }
}

// ============================================================================
// 12. ADDRESSABLE RGB MATHEMATICS
// ============================================================================

/**
 * Loops a color spectrum hue shift dynamically over JavaScript.
 * Ensures the fans, RAM, and GPU strips mathematically cycle through all
 * 360 degrees of the HSL color wheel when core system power is active.
 */
function startRgbCycle() {
    // Prevent duplicated timers memory leak
    clearInterval(rgbCycleInterval);
    
    // Validate prerequisites for lighting (Requires Power + RGB Hub active)
    if (plugStates['RGB'] === false || plugStates['PSU'] === false || plugStates['ATX24'] === false) {
        logTelemetry('RGB', 'HALT', 'Power or Controller disconnected. Halting light cycle immediately.');
        return;
    }
    
    logTelemetry('RGB', 'START', 'Initiating global Addressable RGB spectrum calculation matrix.');
    
    rgbCycleInterval = setInterval(() => {
        // Shift hue by 5 degrees per tick, looping seamlessly at 360
        currentRgbHue = (currentRgbHue + 5) % 360;
        
        // Format explicit HSL string for injection
        const computedColor = `hsl(${currentRgbHue}, 100%, 50%)`;
        
        // Dispatch color mathematically to all registered DOM nodes
        updateRgbElements(computedColor);
    }, 50); // Tick rate: 50 milliseconds
}

/**
 * Directly pushes inline box-shadow and background properties to nodes.
 * @param {string} colorValue - The CSS color string, or 'transparent' to kill lights.
 */
function updateRgbElements(colorValue) {
    if (UI.rgbElements) {
        UI.rgbElements.forEach(element => {
            if (colorValue === 'transparent') {
                element.style.background = 'transparent';
                element.style.boxShadow = 'none';
            } else {
                element.style.background = colorValue;
                element.style.boxShadow = `0 0 15px ${colorValue}`;
            }
        });
    }
}

// ============================================================================
// 13. CORE LOGIC EVALUATION ENGINE
// ============================================================================

/**
 * The primary decision matrix. Determines the downstream consequences of 
 * physically removing or inserting any volumetric component.
 * 
 * @param {string} componentKey - The specific component being evaluated.
 * @param {HTMLElement} buttonElement - The DOM node of the physical button.
 */
function toggleHardware(componentKey, buttonElement) {
    // 1. Invert hardware plug state in memory matrix
    plugStates[componentKey] = !plugStates[componentKey];
    const isCurrentlyPlugged = plugStates[componentKey];

    // 2. Evaluate physical removal consequences
    if (isCurrentlyPlugged === false) {
        logTelemetry('PHYSICS', 'REMOVE', `${componentKey} has been forcibly unseated from the board.`);
        
        // Visual button feedback update
        buttonElement.classList.replace('plugged', 'unplugged');
        
        // Consequence A: High voltage sever triggers sparks physics
        if (powerComponents.includes(componentKey)) {
            spawnInternalSparks();
        }
        
        // Consequence B: Disconnecting fans cuts animation via CSS class override
        if (componentKey === 'Fan') {
            logTelemetry('PHYSICS', 'FANS', 'Cooling fans physical rotation halted entirely.');
            UI.tower3D.classList.add('power-off');
        }
        
        // Consequence C: Disconnecting RGB controller halts the loop and drops lights
        if (componentKey === 'RGB') {
            clearInterval(rgbCycleInterval);
            updateRgbElements('transparent');
        }
        
        // Consequence D: Instantly kill boot timeouts if system loses critical parts mid-boot
        isBooting = false;
        clearTimeout(bootTimeout);
        
    } 
    // 3. Evaluate physical insertion consequences
    else {
        logTelemetry('PHYSICS', 'INSERT', `${componentKey} has been physically seated into the board.`);
        
        // Visual button feedback update
        buttonElement.classList.replace('unplugged', 'plugged');
        
        // Consequence A: Restore fan animations if system has baseline power
        if (componentKey === 'Fan' && plugStates['PSU'] === true && plugStates['ATX24'] === true) {
            logTelemetry('PHYSICS', 'FANS', 'Cooling fans physical rotation restored.');
            UI.tower3D.classList.remove('power-off');
        }
        
        // Consequence B: Restore RGB loop if system has baseline power
        if (componentKey === 'RGB' && plugStates['PSU'] === true && plugStates['ATX24'] === true) {
            startRgbCycle();
        }
    }

    // 4. Dedicated Thermal Escalation Logic Paths
    if (componentKey === 'PSU' || componentKey === 'ATX24') {
        
        // Sub-branch A: Total power loss neutralizes thermal escalation immediately
        if (plugStates['PSU'] === false || plugStates['ATX24'] === false) {
            logTelemetry('THERMALS', 'NORMALIZE', 'Power removed. Thermal escalation neutralized.');
            
            clearInterval(heatingInterval);
            sysTemp = 25; 
            isThermalShutdown = false;
            
            // Fan motors and RGB controllers lack power entirely, disable everything
            UI.tower3D.classList.add('power-off'); 
            clearInterval(rgbCycleInterval);
            updateRgbElements('transparent');
        } 
        // Sub-branch B: Power restored, but cooling is severely compromised
        else {
            logTelemetry('THERMALS', 'BOOT', 'Power restored. Evaluating cooling capacity threshold.');
            
            // Restore RGB if plugged in
            if (plugStates['RGB'] === true) {
                startRgbCycle();
            }
            
            // Extreme Danger: No fans and no water pump connected
            if (plugStates['Fan'] === false && plugStates['WaterPump'] === false) {
                logTelemetry('THERMALS', 'CRITICAL', 'Zero cooling units active. Extreme thermal escalation initiated.');
                sysTemp = 40;
                startThermalClimb(15); // Escalates +15 degrees per second
                UI.tower3D.classList.remove('power-off');
            } 
            // Moderate Danger: One cooling unit active, one dead
            else if (plugStates['Fan'] === false || plugStates['WaterPump'] === false) {
                logTelemetry('THERMALS', 'WARNING', 'Partial cooling failure detected. Moderate thermal escalation initiated.');
                sysTemp = 40;
                startThermalClimb(6); // Escalates +6 degrees per second
                UI.tower3D.classList.remove('power-off');
            }
        }
    } 
    // Dedicated Cooling Modification Logic (Triggered while System is Powered On)
    else if (componentKey === 'Fan' || componentKey === 'WaterPump') {
        
        // Sub-branch A: A cooling unit was removed while power is actively flowing
        if ((plugStates['Fan'] === false || plugStates['WaterPump'] === false) && plugStates['PSU'] === true && plugStates['ATX24'] === true) {
            
            let calculatedHeatRate = 6;
            
            if (plugStates['Fan'] === false && plugStates['WaterPump'] === false) {
                calculatedHeatRate = 15;
                logTelemetry('THERMALS', 'CRITICAL', 'All cooling failed dynamically. Escalating +15c/s.');
            } else {
                logTelemetry('THERMALS', 'WARNING', 'Cooling degraded dynamically. Escalating +6c/s.');
            }
            
            startThermalClimb(calculatedHeatRate);
        } 
        // Sub-branch B: Cooling units restored fully while powered
        else if (plugStates['Fan'] === true && plugStates['WaterPump'] === true) {
            logTelemetry('THERMALS', 'SECURE', 'Full cooling capabilities restored. Thermals normalized.');
            clearInterval(heatingInterval);
            sysTemp = 40; 
            isThermalShutdown = false;
        }
    }

    // 5. Dynamic Bootloader Evaluation Logic (V5.0 Feature Expansion)
    // If we just plugged a component back in, and the system is actively powered, 
    // we must check if we should trigger a recovery reboot sequence.
    if (isCurrentlyPlugged === true && plugStates['PSU'] === true && plugStates['ATX24'] === true) {
        
        // Did we just plug in a critical component that clears an error state?
        if (criticalBootComponents.includes(componentKey) || powerComponents.includes(componentKey)) {
            logTelemetry('BOOTLOADER', 'WARM_BOOT', `${componentKey} inserted. Triggering automated system recovery reboot.`);
            initiateBootSequence();
        } else {
            // Non-critical component inserted (e.g. WiFi card). Delay slightly to simulate hot-plug evaluation.
            setTimeout(evaluateSystemState, 250);
        }
    } else {
        // Standard evaluation route if component removed or power is off
        evaluateSystemState();
    }
}

/**
 * Triggers an asynchronous loop pushing temperatures higher on a fixed interval.
 * 
 * @param {number} ratePerSecond - Integer defining degrees to jump per second.
 */
function startThermalClimb(ratePerSecond) {
    // Clear any existing escalation to prevent exponential compounding loops
    clearInterval(heatingInterval);
    
    heatingInterval = setInterval(() => {
        sysTemp += ratePerSecond; 
        logTelemetry('THERMALS', 'CLIMB', `Core Temp reached ${sysTemp}°C`);
        
        // Validate against critical hardware trip point (110c threshold)
        if (sysTemp >= 110) {
            logTelemetry('THERMALS', 'SHUTDOWN', `CRITICAL LIMIT EXCEEDED. INITIATING EMERGENCY HARDWARE HALT.`);
            isThermalShutdown = true;
            clearInterval(heatingInterval);
            evaluateSystemState(); // Force UI update immediately to show thermal trip
        }
    }, 1000);
}

// ============================================================================
// 14. UI & VIEWPORT RENDER ENGINE
// ============================================================================

/**
 * Updates the bottom data inspector panel with descriptions, badges,
 * and sets the model-viewer URL based on the current selection.
 * 
 * @param {boolean} shouldZoom - Whether to trigger the cinematic camera pan.
 */
function updateInspector(shouldZoom) {
    if (isFetching === true) {
        return;
    }

    // Pull correct dictionary data from fallback array
    const currentData = dbData[selectedComponent] || {};
    const isCurrentlyPlugged = plugStates[selectedComponent];
    const isSystemDead = plugStates['PSU'] === false || plugStates['ATX24'] === false || isThermalShutdown === true;
    
    // Inject Title Text
    UI.title.innerText = currentData.title || selectedComponent;
    
    // Process typewriter description reset animation
    UI.desc.style.animation = 'none';
    UI.desc.offsetHeight; // Trigger DOM reflow calculation safely to restart anim
    
    if (isCurrentlyPlugged === true) {
        UI.desc.innerText = currentData.descOn || '';
    } else {
        UI.desc.innerText = currentData.descOff || '';
    }
    
    UI.desc.style.animation = 'fadeIn 0.5s ease-in';

    // Badge Logic Engine mapping
    let activeStatusText = isCurrentlyPlugged ? (currentData.statusOn || 'ACTIVE') : (currentData.statusOff || 'DISCONNECTED');
    
    // Reset base CSS class
    UI.badge.className = 'badge';
    
    if (isCurrentlyPlugged === false || isSystemDead === true) {
        UI.badge.classList.add('badge-critical');
    } else if (['HDD', 'ODD', 'NIC', 'WiFi', 'SoundCard', 'CaptureCard', 'RGB', 'FrontPanel', 'USB3'].includes(selectedComponent) && isCurrentlyPlugged === false) {
        UI.badge.classList.add('badge-warning'); 
    } else {
        UI.badge.classList.add('badge-active');
    }
    
    // Override badge if system is currently mid-POST sequence
    if (isBooting === true) {
        UI.badge.innerText = 'BOOTING...';
        UI.badge.classList.replace('badge-active', 'badge-booting');
    } else {
        UI.badge.innerText = activeStatusText;
    }

    // Feed GLB path to external WebGL renderer dynamically
    if (currentData.model_url) {
        UI.viewer3D.setAttribute('src', currentData.model_url);
    } else {
        UI.viewer3D.removeAttribute('src'); 
    }
    
    // Manage physical DOM highlighting safely
    highlightPhysicalZone(selectedComponent);
    
    if(shouldZoom === true) {
        triggerCinematicZoom(selectedComponent);
    }
}

// ============================================================================
// 15. BIOS POST SEQUENCE & SCREEN TRANSITIONS
// ============================================================================

/**
 * Triggers the 3-second ExcellentOS loading screen sequence dynamically.
 * Fails immediately if power or core processing chips are missing.
 */
function initiateBootSequence() {
    logTelemetry('BIOS', 'POST', 'Initiating pre-boot validation checks.');

    // Immediate Failure Check A: Zero Power
    if (plugStates['PSU'] === false || plugStates['ATX24'] === false || isThermalShutdown === true) {
        logTelemetry('BIOS', 'HALT', 'Power delivery missing. Boot sequence aborted.');
        evaluateSystemState();
        return;
    }
    
    // Immediate Failure Check B: Zero Processing Power
    if (plugStates['CPU'] === false || plugStates['EPS8'] === false || plugStates['Chipset'] === false) {
        logTelemetry('BIOS', 'HALT', 'Critical execution core missing. Boot sequence aborted.');
        evaluateSystemState();
        return;
    }

    logTelemetry('BIOS', 'BOOT', 'Hardware validated successfully. Spawning OS bootloader.');

    isBooting = true;
    updateInspector(false);
    
    // Scrub all non-boot screens dynamically
    UI.screenBios.classList.add('hidden');
    UI.screenDesktop.classList.add('hidden');
    UI.screenError.classList.add('hidden');
    
    if (UI.gpuGlitch) {
        UI.gpuGlitch.classList.add('hidden');
    }
    
    // Un-hide the loading sequence
    UI.screenBoot.classList.remove('hidden');
    
    // Trigger correct aesthetic LEDs
    UI.powerLed.className = 'power-led led-on';
    
    if (UI.towerPowerBtn && plugStates['FrontPanel'] === true) {
        UI.towerPowerBtn.style.borderColor = 'var(--cyan-glow)';
        UI.towerPowerBtn.style.boxShadow = '0 0 10px var(--cyan-glow)';
    }

    // Wait exactly 3 seconds, then evaluate the system state strictly to transition to Desktop or Error
    clearTimeout(bootTimeout);
    bootTimeout = setTimeout(() => {
        logTelemetry('BIOS', 'COMPLETE', 'OS bootloader cycle finished. Evaluating payload transition.');
        isBooting = false;
        
        // This will swap out the Boot screen for the real result
        evaluateSystemState(); 
        
        // Update bottom inspector
        updateInspector(false);
    }, 3000); 
}

/**
 * The master visual evaluation logic pipeline. Evaluates current physical variables 
 * and forces the correct 2D monitor output based on specific hardware states.
 * Formatted with explicit if/else chains for readability, logging, and exhaustiveness.
 */
function evaluateSystemState() {
    logTelemetry('EVAL', 'CHECK', 'Evaluating global system hardware states against OS logic.');

    // 1. Scrub everything to a completely blank slate
    UI.screenBios.classList.add('hidden');
    UI.screenBoot.classList.add('hidden');
    UI.screenDesktop.classList.add('hidden');
    UI.screenError.classList.add('hidden');
    
    if (UI.gpuGlitch) {
        UI.gpuGlitch.classList.add('hidden');
    }
    
    // Clean tower LED defaults
    if (UI.towerPowerBtn) {
        UI.towerPowerBtn.style.borderColor = '#cbd5e1';
        UI.towerPowerBtn.style.boxShadow = 'inset 0 2px 5px #000';
    }

    // ------------------------------------------------------------------------
    // FAILURE CONDITION 1: ABSOLUTE NO POWER
    // ------------------------------------------------------------------------
    if (plugStates['PSU'] === false || plugStates['ATX24'] === false) {
        logTelemetry('EVAL', 'STATE', 'NO POWER. Monitor completely blank.');
        UI.powerLed.className = 'power-led led-off';
        
        // Clean the 3D Pump LCD physically
        if (UI.pumpLcdText) {
            UI.pumpLcdText.innerText = ''; 
        }
        if (UI.pumpLcdScreen) {
            UI.pumpLcdScreen.style.borderColor = '#1e293b';
            UI.pumpLcdScreen.style.boxShadow = 'inset 0 0 10px #000';
        }
        return; // Terminal state reached. Halt execution tree.
    }
    
    // Apply successful power to front IO visually
    if (plugStates['FrontPanel'] === true && UI.towerPowerBtn) {
        UI.towerPowerBtn.style.borderColor = 'var(--cyan-glow)';
        UI.towerPowerBtn.style.boxShadow = '0 0 10px var(--cyan-glow)';
    }

    // ------------------------------------------------------------------------
    // FAILURE CONDITION 2: NO DISPLAY / DEAD GPU
    // ------------------------------------------------------------------------
    if (plugStates['GPU'] === false || plugStates['Riser'] === false) {
        logTelemetry('EVAL', 'STATE', 'NO SIGNAL. GPU or Riser disconnected.');
        
        UI.powerLed.className = 'power-led led-error';
        UI.screenError.classList.remove('hidden');
        UI.errorText.style.color = '#cbd5e1';
        UI.errorText.innerText = 'NO SIGNAL DETECTED';
        UI.errorText.style.animation = 'pulse-text 2s infinite';
        
        return; // Terminal state reached. Halt execution tree.
    }

    // ------------------------------------------------------------------------
    // FAILURE CONDITION 3: CRITICAL THERMAL SHUTDOWN
    // ------------------------------------------------------------------------
    if (isThermalShutdown === true) {
        logTelemetry('EVAL', 'STATE', 'THERMAL SHUTDOWN. Displaying FATAL error log.');
        
        UI.powerLed.className = 'power-led led-error';
        
        if (UI.towerPowerBtn) {
            UI.towerPowerBtn.style.borderColor = 'var(--red-glow)';
            UI.towerPowerBtn.style.boxShadow = '0 0 15px var(--red-glow)';
        }
        
        UI.screenError.classList.remove('hidden');
        UI.errorText.style.color = 'var(--red-glow)';
        
        const thermalString = 'FATAL: THERMAL TRIP DETECTED<br><br>CPU CORE EXCEEDED 110°C.<br>EMERGENCY HALT INITIATED TO PREVENT SILICON DAMAGE.<br><br>Action Required: Reconnect volumetric cooling block and execute power cycle.';
        UI.errorText.innerHTML = thermalString;
        UI.errorText.style.animation = 'none';
        
        return; // Terminal state reached. Halt execution tree.
    }

    // ------------------------------------------------------------------------
    // FAILURE CONDITION 4: RAM MEMORY FAULT
    // ------------------------------------------------------------------------
    if (plugStates['RAM'] === false) {
        logTelemetry('EVAL', 'STATE', 'BSOD GENERATED. RAM completely removed.');
        
        UI.powerLed.className = 'power-led led-on';
        UI.screenError.classList.remove('hidden');
        UI.errorText.style.color = '#3b82f6'; // True BSOD aesthetic hex
        
        const bsodString = ':( <br><br>Your PC ran into a problem and needs to restart.<br><br>Stop code: MEMORY_MANAGEMENT_FAILURE';
        UI.errorText.innerHTML = bsodString;
        UI.errorText.style.animation = 'none';
        
        return; // Terminal state reached. Halt execution tree.
    }

    // ------------------------------------------------------------------------
    // FAILURE CONDITION 5: CPU OR CRITICAL BUS MISSING
    // ------------------------------------------------------------------------
    if (plugStates['CPU'] === false || plugStates['EPS8'] === false || plugStates['Chipset'] === false) {
        logTelemetry('EVAL', 'STATE', 'HALT. CPU, EPS8, or Chipset missing.');
        
        UI.powerLed.className = 'power-led led-on';
        UI.screenError.classList.remove('hidden');
        UI.errorText.style.color = '#ef4444';
        
        const cpuHaltString = 'SYSTEM HALT.<br>ERR_NO_PROCESSOR_OR_CRITICAL_BUS_FOUND';
        UI.errorText.innerHTML = cpuHaltString;
        UI.errorText.style.animation = 'none';
        
        return; // Terminal state reached. Halt execution tree.
    }

    // ------------------------------------------------------------------------
    // FAILURE CONDITION 6: MISSING STORAGE (DUMPS TO BIOS)
    // ------------------------------------------------------------------------
    if (plugStates['SSD'] === false) {
        logTelemetry('EVAL', 'STATE', 'BIOS MENU. No bootable drive detected.');
        
        UI.powerLed.className = 'power-led led-on';
        UI.screenBios.classList.remove('hidden');
        
        const ssdBiosString = 'Excellent BIOS v4.0.1<br>CPU: Detected successfully<br>Memory: OK (64GB)<br><br>ERROR: Boot Device Not Found on PCIe Lanes.<br>Please install an operating system to continue.';
        UI.biosText.innerHTML = ssdBiosString;
        
        return; // Terminal state reached. Halt execution tree.
    }

    // ------------------------------------------------------------------------
    // FAILURE CONDITION 7: MISSING TPM (DUMPS TO BIOS)
    // ------------------------------------------------------------------------
    if (plugStates['TPM'] === false) {
        logTelemetry('EVAL', 'STATE', 'BIOS MENU. TPM 2.0 Check failed.');
        
        UI.powerLed.className = 'power-led led-on';
        UI.screenBios.classList.remove('hidden');
        
        const tpmBiosString = 'Excellent BIOS v4.0.1<br>CPU: Detected successfully<br>Memory: OK (64GB)<br><br>ERROR: Trusted Platform Module (TPM 2.0) not detected.<br>ExcellentOS requires TPM architecture for secure boot.';
        UI.biosText.innerHTML = tpmBiosString;
        
        return; // Terminal state reached. Halt execution tree.
    }

    // ------------------------------------------------------------------------
    // FAILURE CONDITION 8: MISSING CMOS (DUMPS TO BIOS)
    // ------------------------------------------------------------------------
    if (plugStates['CMOS'] === false) {
        logTelemetry('EVAL', 'STATE', 'BIOS MENU. CMOS checksum invalid.');
        
        UI.powerLed.className = 'power-led led-on';
        UI.screenBios.classList.remove('hidden');
        
        const cmosBiosString = 'Excellent BIOS v4.0.1<br><br>WARNING: CMOS Checksum Error.<br>CMOS Battery Voltage Low or Missing.<br>System Time has been reset to defaults.<br><br>Press F1 to Run SETUP';
        UI.biosText.innerHTML = cmosBiosString;
        
        return; // Terminal state reached. Halt execution tree.
    }

    // ------------------------------------------------------------------------
    // SUCCESSFUL BOOT EXECUTION -> RENDER EXCELLENT OS DESKTOP
    // ------------------------------------------------------------------------
    logTelemetry('EVAL', 'STATE', 'ALL CHECKS PASSED. Hardware validated.');

    // We only expose the final desktop layer if it's not currently animating the boot sequence
    if (isBooting === true) {
        logTelemetry('EVAL', 'YIELD', 'Yielding to active bootloader animation loop.');
        UI.screenBoot.classList.remove('hidden');
    } else {
        logTelemetry('EVAL', 'SUCCESS', 'Rendering ExcellentOS GUI Desktop.');
        UI.powerLed.className = 'power-led led-on';
        UI.screenDesktop.classList.remove('hidden');
    }
    
    // Non-Terminal Aesthetics: If VRM heatsink is removed, display minor graphical artifacts on desktop
    if (plugStates['VRM'] === false && UI.gpuGlitch && isBooting === false) {
        logTelemetry('EVAL', 'WARNING', 'VRM Missing. Initiating graphical degradation artifacts.');
        UI.gpuGlitch.classList.remove('hidden'); 
    }
}

// ============================================================================
// 16. BACKGROUND TELEMETRY DAEMON
// ============================================================================

/**
 * Spawns a setInterval that acts as the backbone of the entire UI logic layer.
 * Calculates randomized widget values, checks system temperatures, and 
 * pushes active states to the 3D Pump LCD physically mapped in the case.
 */
function startDesktopLoop() {
    
    desktopLoop = setInterval(() => {
        
        // --- 1. System Thermal Warnings ---
        if (sysTemp > 75) {
            UI.tower3D.classList.add('overheating');
        } else {
            UI.tower3D.classList.remove('overheating');
        }

        // --- 2. Calculate and format the current temperature string ---
        let currentComputedTemp;
        let formattedTempStr;
        
        if (plugStates['Fan'] === true && plugStates['WaterPump'] === true) {
            // Under perfect cooling, fluctuate gently between 38c and 40c
            currentComputedTemp = Math.floor(Math.random() * 3) + 38;
            formattedTempStr = `${currentComputedTemp}°C`;
            UI.widTempVal.className = 'wid-val temp-val';
        } else {
            // Under failing cooling, track the rigid physics engine variable
            currentComputedTemp = sysTemp;
            formattedTempStr = `${currentComputedTemp}°C`;
            UI.widTempVal.className = 'wid-val temp-val temp-hot';
        }

        // Push formatted string to 2D Monitor Widget
        UI.widTempVal.innerText = formattedTempStr;

        // --- 3. Sync Volumetric 3D Pump LCD with physics engine ---
        if (UI.pumpLcdText && UI.pumpLcdScreen) {
            
            // Explicit conditional chain for absolute power
            if (plugStates['PSU'] === true && plugStates['ATX24'] === true && plugStates['WaterPump'] === true) {
                
                UI.pumpLcdText.innerText = formattedTempStr;
                
                // Adjust colors based on active thermal warnings dynamically
                if(currentComputedTemp > 75) {
                    UI.pumpLcdText.style.color = 'var(--red-glow)';
                    UI.pumpLcdText.style.textShadow = '0 0 15px var(--red-glow)';
                    UI.pumpLcdScreen.style.borderColor = 'var(--red-glow)';
                } else {
                    UI.pumpLcdText.style.color = 'var(--cyan-glow)';
                    UI.pumpLcdText.style.textShadow = '0 0 8px var(--cyan-glow)';
                    UI.pumpLcdScreen.style.borderColor = 'var(--cyan-glow)';
                }
            } else {
                // Device powered down physically, blank the screen
                UI.pumpLcdText.innerText = ''; 
                UI.pumpLcdScreen.style.borderColor = '#1e293b';
                UI.pumpLcdScreen.style.boxShadow = 'inset 0 0 10px #000';
            }
        }

        // --- 4. Validate OS GUI Requirements ---
        // If core features are missing, halt random UI value generation entirely
        if (plugStates['PSU'] === false || isThermalShutdown === true || plugStates['CPU'] === false || plugStates['RAM'] === false || plugStates['SSD'] === false) {
            return;
        }

        // --- 5. Generate dynamic CPU Load values ---
        // Generates baseline idle load
        let activeCpuLoad = Math.floor(Math.random() * 12) + 2;
        
        // Throttling logic overrides standard loop if VRM is uncooled
        if (plugStates['VRM'] === false) {
            activeCpuLoad = 100; 
        }
        
        // Push CSS and Text format
        UI.widCpuBar.style.width = `${activeCpuLoad}%`;
        UI.widCpuVal.innerText = `${activeCpuLoad}%`;

        // --- 6. Generate dynamic RAM values based on HDD status ---
        // Simulate high memory usage if secondary mass storage drops out
        let activeRamUsage;
        if (plugStates['HDD'] === true) {
            activeRamUsage = 18;
        } else {
            activeRamUsage = 64; 
        }
        
        // Push CSS and Text format
        UI.widRamBar.style.width = `${activeRamUsage}%`;
        UI.widRamVal.innerText = `${activeRamUsage}%`;
        
        // Conditionally color the RAM bar based on storage states
        if (plugStates['HDD'] === true) {
            UI.widRamBar.style.backgroundColor = 'var(--cyan-glow)';
        } else {
            UI.widRamBar.style.backgroundColor = 'var(--yellow-glow)';
        }

        // --- 7. Manage Network Logic Strings ---
        if (plugStates['NIC'] === true || plugStates['WiFi'] === true) {
            // Determine explicit string priority
            let activeNetworkString;
            
            if (plugStates['NIC'] === true) {
                activeNetworkString = '10GBPS LINK';
            } else {
                activeNetworkString = 'WI-FI CONNECTED';
            }
            
            UI.widNetVal.innerText = activeNetworkString;
            UI.widNetVal.style.color = 'var(--cyan-glow)';
        } else {
            UI.widNetVal.innerText = 'OFFLINE';
            UI.widNetVal.style.color = 'var(--red-glow)';
        }
        
    }, 1500); // Internal loop rate locked to 1500 milliseconds for absolute readability
}

// EOF.
