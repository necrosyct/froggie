// ════════════════════════════════════════════
// STATE
// ════════════════════════════════════════════
let editor = null;
let tabs = [];
let activeTabId = null;
let tabCounter = 0;
let currentPage = 'home';
let hubScripts = [];
let savedScripts = []; // legacy support

let workspaceStructure = {
    scripts: [],
    autoexec: [],
    workspace: []
};
let activeWsTab = 'scripts';
let favorites = [];
let showFavoritesOnly = false;
let pendingScriptLoad = null; // {name, content} queued for when Monaco loads
let currentlySelectedHubScript = null;

const featuredScripts = [
    {
        id: "featured-inf-yield",
        title: "Infinite Yield",
        game: "Universal",
        description: "The most popular admin commands script for Roblox. Features fly, noclip, teleport, speed, and hundreds of other useful commands.",
        script: 'loadstring(game:HttpGet("https://raw.githubusercontent.com/EdgeIY/infiniteyield/master/source"))()'
    },
    {
        id: "featured-dex",
        title: "Dex Explorer V4",
        game: "Universal",
        description: "A powerful game explorer and debugger tool. View the workspace hierarchy, check objects, edit properties, and export maps.",
        script: 'loadstring(game:HttpGet("https://raw.githubusercontent.com/infypanda/Dex-v4/main/source"))()'
    },
    {
        id: "featured-simplespy",
        title: "SimpleSpy V2",
        game: "Universal",
        description: "The ultimate RemoteEvent and RemoteFunction logging and spying tool. Track network activity and generate script calls.",
        script: 'loadstring(game:HttpGet("https://raw.githubusercontent.com/exxtremestuffs/SimpleSpySource/master/SimpleSpy.lua"))()'
    },
    {
        id: "featured-hydroxide",
        title: "Hydroxide",
        game: "Universal",
        description: "A modern runtime introspection and execution auditing tool. Analyze remotes, modify constants, and hook functions.",
        script: 'loadstring(game:HttpGet("https://raw.githubusercontent.com/Upbolt/Hydroxide/revision/init.lua"))()'
    },
    {
        id: "featured-owlhub",
        title: "OwlHub",
        game: "Universal / ESP",
        description: "High quality silent aim, aimbot, wallhack (ESP) and customization hub. Perfect for FPS and combat games.",
        script: 'loadstring(game:HttpGet("https://raw.githubusercontent.com/CriShoux/OwlHub/master/OwlHub.txt"))()'
    },
    {
        id: "featured-nameless-admin",
        title: "Nameless Admin",
        game: "Universal",
        description: "Advanced script command executor with custom UI, smooth animations, and a large suite of power tools.",
        script: 'loadstring(game:HttpGet("https://raw.githubusercontent.com/FilteringEnabled/NamelessAdmin/main/Source"))()'
    },
    {
        id: "featured-fly",
        title: "Fly Script",
        game: "Universal",
        description: "Press E to toggle flying. Customize speed using the inline variables. Works in almost every experience.",
        script: `-- Universal Fly Script\nlocal player = game.Players.LocalPlayer\nlocal character = player.Character or player.CharacterAdded:Wait()\nlocal humanoid = character:WaitForChild("Humanoid")\nlocal mouse = player:GetMouse()\n\nlocal flying = false\nlocal speed = 50\nlocal bv, bg\n\nlocal function startFly()\n    flying = true\n    humanoid.PlatformStand = true\n    \n    bv = Instance.new("BodyVelocity")\n    bv.maxForce = Vector3.new(1e9, 1e9, 1e9)\n    bv.velocity = Vector3.new(0, 0.1, 0)\n    bv.Parent = character.PrimaryPart\n    \n    bg = Instance.new("BodyGyro")\n    bg.maxDegreesOfFreedom = Enum.DegreesOfFreedom.Yaw\n    bg.maxTorque = Vector3.new(1e9, 1e9, 1e9)\n    bg.cframe = character.PrimaryPart.CFrame\n    bg.Parent = character.PrimaryPart\n    \n    task.spawn(function()\n        while flying do\n            local camera = workspace.CurrentCamera\n            local dir = Vector3.new(0, 0, 0)\n            if mouse.KeyDown:Connect(function() end) then end\n            bv.velocity = camera.CFrame.LookVector * speed\n            task.wait()\n        end\n    end)\nend\n\nlocal function stopFly()\n    flying = false\n    humanoid.PlatformStand = false\n    if bv then bv:Destroy() end\n    if bg then bg:Destroy() end\nend\n\nmouse.KeyDown:Connect(function(key)\n    if key:lower() == "e" then\n        if flying then stopFly() else startFly() end\n    end\nend)`
    },
    {
        id: "featured-esp",
        title: "Unnamed ESP",
        game: "Universal",
        description: "A highly customizable vector-drawing ESP script. Shows box, tracers, name, distance, and skeletal trackers for players.",
        script: 'loadstring(game:HttpGet("https://raw.githubusercontent.com/ic3w0lf22/Unnamed-ESP/master/UnnamedESP.lua"))()'
    },
    {
        id: "featured-remote-spy",
        title: "Hydroxide Remote Spy",
        game: "Universal",
        description: "Robust remote execution logger to monitor game client and server messages, complete with script generation.",
        script: 'loadstring(game:HttpGet("https://raw.githubusercontent.com/Upbolt/Hydroxide/revision/ui/main.lua"))()'
    },
    {
        id: "featured-vlynx",
        title: "VLynx Hub",
        game: "Universal",
        description: "A multi-game hub offering extensive utility features, aimbots, and movement modifications for general experiences.",
        script: 'loadstring(game:HttpGet("https://raw.githubusercontent.com/VLynx/Hub/main/Loader.lua"))()'
    },
    {
        id: "featured-speed-bypass",
        title: "WalkSpeed & JumpPower Bypass",
        game: "Universal",
        description: "Safely bypass Roblox anti-cheat walkspeed and jumppower checks, allowing you to walk faster and jump higher.",
        script: `local lp = game.Players.LocalPlayer\nlocal char = lp.Character or lp.CharacterAdded:Wait()\nlocal hum = char:WaitForChild("Humanoid")\n\nlocal mt = getrawmetatable(game)\nlocal oldIndex = mt.__index\nlocal oldNewIndex = mt.__newindex\nsetreadonly(mt, false)\n\nmt.__newindex = newcclosure(function(t, k, v)\n    if t == hum and (k == "WalkSpeed" or k == "JumpPower") then\n        return\n    end\n    return oldNewIndex(t, k, v)\nend)\n\nhum.WalkSpeed = 50\nhum.JumpPower = 100\nsetreadonly(mt, true)`
    },
    {
        id: "featured-rtx",
        title: "RTX Shader Graphics",
        game: "Universal",
        description: "Enhance your Roblox graphics dramatically with custom lighting, atmospheric effects, bloom, and enhanced color settings.",
        script: `local lighting = game:GetService("Lighting")\nlighting.Ambient = Color3.fromRGB(255, 255, 255)\nlighting.OutdoorAmbient = Color3.fromRGB(150, 150, 150)\nlighting.Brightness = 3\nlighting.GlobalShadows = true\n\nlocal colorCorrection = Instance.new("ColorCorrectionEffect")\ncolorCorrection.Brightness = 0.05\ncolorCorrection.Contrast = 0.1\ncolorCorrection.Saturation = 0.15\ncolorCorrection.Parent = lighting\n\nlocal bloom = Instance.new("BloomEffect")\nbloom.Intensity = 0.4\nbloom.Size = 24\nbloom.Threshold = 0.95\nbloom.Parent = lighting\n\nlocal sunRays = Instance.new("SunRaysEffect")\nsunRays.Intensity = 0.1\nsunRays.Spread = 1\nsunRays.Parent = lighting`
    }
];

// Context Menu State
let selectedTabIdForMenu = null;
let selectedWsFileNameForMenu = null;
let selectedWsFileFolderForMenu = null;
let autoExecuteNextOpenedFile = false;

// ════════════════════════════════════════════
// DOM ELEMENTS
// ════════════════════════════════════════════
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// Custom Confirm/Alert Modal (replaces native confirm/alert to avoid 'froggie.local diz')
function froggieConfirm(message, title = 'Confirm') {
    return new Promise((resolve) => {
        const modal = $('#froggie-confirm-modal');
        const msgEl = $('#froggie-confirm-message');
        const titleEl = $('#froggie-confirm-title');
        const okBtn = $('#froggie-confirm-ok');
        const cancelBtn = $('#froggie-confirm-cancel');
        const cancelX = $('#froggie-confirm-cancel-x');
        titleEl.textContent = title;
        msgEl.textContent = message;
        okBtn.textContent = 'Confirm';
        cancelBtn.style.display = '';
        modal.classList.add('active');
        function cleanup(result) {
            modal.classList.remove('active');
            okBtn.removeEventListener('click', onOk);
            cancelBtn.removeEventListener('click', onCancel);
            cancelX.removeEventListener('click', onCancel);
            resolve(result);
        }
        function onOk() { cleanup(true); }
        function onCancel() { cleanup(false); }
        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);
        cancelX.addEventListener('click', onCancel);
    });
}

function froggieAlert(message, title = 'Notice') {
    return new Promise((resolve) => {
        const modal = $('#froggie-confirm-modal');
        const msgEl = $('#froggie-confirm-message');
        const titleEl = $('#froggie-confirm-title');
        const okBtn = $('#froggie-confirm-ok');
        const cancelBtn = $('#froggie-confirm-cancel');
        const cancelX = $('#froggie-confirm-cancel-x');
        titleEl.textContent = title;
        msgEl.textContent = message;
        okBtn.textContent = 'OK';
        cancelBtn.style.display = 'none';
        modal.classList.add('active');
        function cleanup() {
            modal.classList.remove('active');
            okBtn.removeEventListener('click', onOk);
            cancelX.removeEventListener('click', onOk);
            resolve();
        }
        function onOk() { cleanup(); }
        okBtn.addEventListener('click', onOk);
        cancelX.addEventListener('click', onOk);
    });
}

// Title bar
const btnMinimize = $('#btn-minimize');
const btnMaximize = $('#btn-maximize');
const btnClose = $('#btn-close');

// Navigation
const navBtns = $$('.nav-btn');
const pages = $$('.page');

// Executor Workspace Split Pane
const wsSidebar = $('#workspace-sidebar');
const wsToggle = $('#workspace-toggle');
const btnWorkspaceRefresh = $('#btn-workspace-refresh');
const btnWorkspaceNew = $('#btn-workspace-new');
const btnWorkspaceOpenFolder = $('#btn-workspace-open-folder');
const workspaceFilesList = $('#workspace-files-list');

// Executor Tabs & Area
const tabsList = $('#tabs-list');
const btnAddTab = $('#btn-add-tab');
const btnExecute = $('#btn-execute');
const btnClear = $('#btn-clear');
const btnOpenFile = $('#btn-open-file');
const btnSaveFile = $('#btn-save-file');
const btnToggleConsole = $('#btn-toggle-console');
const btnClearLogs = $('#btn-clear-logs');
const btnCloseConsole = $('#btn-close-console');
const consoleDrawer = $('#console-drawer');
const consoleLogsContent = $('#console-logs-content');

// Sidebar inject
const btnInject = $('#btn-inject');
const statusDot = $('#status-dot');
const statusText = $('#status-text');

// Home Stats
const statStatus = $('#stat-status');
const statScripts = $('#stat-scripts');
const statTabs = $('#stat-tabs');

// Script Hub
const hubGrid = $('#hub-grid');
const hubSearch = $('#hub-search');
const btnHubRefresh = $('#btn-hub-refresh');

// Settings Page DOM Elements
const settingAutoAttach = $('#setting-auto-attach');
const settingAlwaysOnTop = $('#setting-always-on-top');
const settingMinimap = $('#setting-minimap');
const settingBracketColorization = $('#setting-bracket-colorization');
const settingAutoCloseBrackets = $('#setting-auto-close-brackets');
const settingLineNumbers = $('#setting-line-numbers');
const settingWordWrap = $('#setting-word-wrap');
const settingFontSize = $('#setting-font-size');
const settingShowExplorer = $('#setting-show-explorer');
const settingAnimations = $('#setting-animations');
const settingCustomBg = $('#setting-custom-bg');
const settingBlurRadius = $('#setting-blur-radius');
const settingNavLabels = $('#setting-nav-labels');
const settingDiscordRpc = $('#setting-discord-rpc');
const settingNotificationSound = $('#setting-notification-sound');
const settingRestorePage = $('#setting-restore-page');
const settingLockWindowSize = $('#setting-lock-window-size');
const settingAutoSaveWindow = $('#setting-auto-save-window');
const settingLockSidebar = $('#setting-lock-sidebar');
const settingAutoSaveSidebar = $('#setting-auto-save-sidebar');
const settingCustomColorPicker = $('#setting-custom-color-picker');
const btnApplyCustomBg = $('#btn-apply-custom-bg');
const settingCustomBgInput = $('#setting-custom-bg-input');
const btnApplyCustomHex = $('#btn-apply-custom-hex');
const btnOpenAutoexec = $('#btn-open-autoexec');
const btnOpenScripts = $('#btn-open-scripts');
const btnOpenWorkspace = $('#btn-open-workspace');

const btnSettingTerminateRoblox = $('#btn-setting-terminate-roblox');
const btnSettingClearLogs = $('#btn-setting-clear-logs');
const btnSettingOpenFolder = $('#btn-setting-open-folder');

// New Settings
const settingAutoLogs = $('#setting-auto-logs');
const settingLogWatcher = $('#setting-log-watcher');

// Empty State Actions
const btnEmptyCreate = $('#btn-empty-create');
const btnEmptyImport = $('#btn-empty-import');

// Modal Elements
const newScriptModal = $('#new-script-modal');
const btnModalClose = $('#btn-modal-close');
const btnModalCancel = $('#btn-modal-cancel');
const btnModalCreate = $('#btn-modal-create');
const modalScriptName = $('#modal-script-name');
const modalScriptContent = $('#modal-script-content');

// Custom Context Menus
const tabContextMenu = $('#tab-context-menu');
const workspaceContextMenu = $('#workspace-context-menu');

// ════════════════════════════════════════════
// IPC
// ════════════════════════════════════════════
function sendToCSharp(action, data = {}) {
    if (window.chrome && window.chrome.webview) {
        window.chrome.webview.postMessage({ action, ...data });
    } else {
        console.warn(`[IPC Mock] ${action}`, data);
    }
}

// ════════════════════════════════════════════
// Titlebar dragging via WebView2 IPC
const titlebar = $('#titlebar');
if (titlebar) {
    titlebar.addEventListener('mousedown', (e) => {
        if (e.target.closest('.titlebar-btn')) return;
        sendToCSharp('window_drag');
    });
    titlebar.addEventListener('dblclick', (e) => {
        if (e.target.closest('.titlebar-btn')) return;
        sendToCSharp('window_maximize');
    });
}

btnMinimize.addEventListener('click', () => {
    const shell = $('.app-shell');
    if (shell) {
        shell.classList.add('window-minimizing');
        setTimeout(() => {
            sendToCSharp('window_minimize');
            setTimeout(() => {
                shell.classList.remove('window-minimizing');
            }, 600);
        }, 220);
    } else {
        sendToCSharp('window_minimize');
    }
});

btnMaximize.addEventListener('click', () => {
    sendToCSharp('window_maximize');
});

btnClose.addEventListener('click', () => {
    const shell = $('.app-shell');
    if (shell) {
        shell.classList.add('window-closing');
        setTimeout(() => {
            sendToCSharp('window_close');
        }, 220);
    } else {
        sendToCSharp('window_close');
    }
});

// ════════════════════════════════════════════
// PAGE NAVIGATION
// ════════════════════════════════════════════
function navigateTo(pageName) {
    currentPage = pageName;

    navBtns.forEach(b => b.classList.toggle('active', b.dataset.page === pageName));
    pages.forEach(p => p.classList.toggle('active', p.id === `page-${pageName}`));

    // Lazy init editor when entering executor page
    if (pageName === 'executor' && !editor) {
        initMonaco();
    }

    // Load hub scripts on first open
    if (pageName === 'scripthub' && hubScripts.length === 0) {
        fetchHubScripts();
    }

    updateHomeStats();
}

navBtns.forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.page));
});

// Home card click navigation
$$('.info-card[data-page-link]').forEach(card => {
    card.addEventListener('click', () => navigateTo(card.dataset.pageLink));
});

// Open folder home button
const homeOpenFolder = $('#home-open-folder');
if (homeOpenFolder) {
    homeOpenFolder.addEventListener('click', (e) => {
        e.stopPropagation();
        sendToCSharp('open_scripts_folder');
    });
}

// ════════════════════════════════════════════
// SETTINGS PERSISTENCE & ACTIONS
// ════════════════════════════════════════════
function loadFavorites() {
    try {
        favorites = JSON.parse(localStorage.getItem('hub-favorites') || '[]');
    } catch {
        favorites = [];
    }
}
function saveFavorites() {
    localStorage.setItem('hub-favorites', JSON.stringify(favorites));
}
function isFavorite(id) {
    return favorites.includes(id);
}
function toggleFavorite(id) {
    const idx = favorites.indexOf(id);
    if (idx === -1) {
        favorites.push(id);
    } else {
        favorites.splice(idx, 1);
    }
    saveFavorites();
}

// Helper to apply accent color to the entire UI
function applyAccentColor(color) {
    if (!color) return;
    document.documentElement.style.setProperty('--accent', color);
    document.documentElement.style.setProperty('--accent-dim', color + '1f');
    document.documentElement.style.setProperty('--accent-glow', color + '59');
    localStorage.setItem('--theme-accent', color);

    const customHexInput = $('#setting-custom-hex');
    if (customHexInput) customHexInput.value = color;

    const customColorPicker = $('#setting-custom-color-picker');
    if (customColorPicker) customColorPicker.value = color;

    $$('.theme-color-dot').forEach(dot => {
        dot.classList.toggle('active', dot.dataset.color.toLowerCase() === color.toLowerCase());
    });
}

// Helper to apply custom background image
function applyCustomBackground() {
    const customBgEnabled = localStorage.getItem('setting-custom-bg') === 'true';
    const bgUrl = localStorage.getItem('setting-custom-bg-url') || '';
    const shell = $('.app-shell');

    const bgInput = $('#setting-custom-bg-input');
    if (bgInput && !bgUrl.startsWith('data:')) bgInput.value = bgUrl;

    if (shell) {
        if (customBgEnabled && bgUrl) {
            shell.style.backgroundImage = `url('${bgUrl}')`;
            shell.classList.add('has-custom-bg');
        } else {
            shell.style.backgroundImage = '';
            shell.classList.remove('has-custom-bg');
        }
    }
}

// Helper: read a file as Data URL for background upload
function handleBgFileUpload(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const dataUrl = e.target.result;
        localStorage.setItem('setting-custom-bg-url', dataUrl);
        localStorage.setItem('setting-custom-bg', 'true');
        if (settingCustomBg) settingCustomBg.checked = true;
        applyCustomBackground();
        appendLog(`Applied uploaded background image: ${file.name}`, 'success');
    };
    reader.readAsDataURL(file);
}

function loadSettings() {
    // 1. General Settings
    const autoAttach = localStorage.getItem('setting-auto-attach') === 'true';
    if (settingAutoAttach) {
        settingAutoAttach.checked = autoAttach;
        sendToCSharp('set_auto_attach', { value: autoAttach });
    }

    const alwaysOnTop = localStorage.getItem('setting-always-on-top') === 'true';
    if (settingAlwaysOnTop) {
        settingAlwaysOnTop.checked = alwaysOnTop;
        sendToCSharp('set_topmost', { value: alwaysOnTop });
    }

    if (settingDiscordRpc) {
        const val = localStorage.getItem('setting-discord-rpc') !== 'false';
        settingDiscordRpc.checked = val;
        sendToCSharp('set_discord_rpc', { value: val });
    }

    // 2. Personalization Accent color
    const savedThemeColor = localStorage.getItem('--theme-accent') || '#39ff14';
    applyAccentColor(savedThemeColor);

    // Navigation labels
    if (settingNavLabels) {
        const navLabelsVal = localStorage.getItem('setting-nav-labels') || 'hover';
        settingNavLabels.value = navLabelsVal;
        document.body.className = document.body.className.replace(/\bnav-style-\S+/g, '');
        document.body.classList.add(`nav-style-${navLabelsVal}`);
    }

    // Custom background
    if (settingCustomBg) {
        settingCustomBg.checked = localStorage.getItem('setting-custom-bg') === 'true';
    }
    applyCustomBackground();

    // Blur radius
    if (settingBlurRadius) {
        const blurRadiusVal = localStorage.getItem('setting-blur-radius') || '12';
        settingBlurRadius.value = blurRadiusVal;
        const radiusValueSpan = $('#blur-radius-value');
        if (radiusValueSpan) radiusValueSpan.textContent = blurRadiusVal;
        document.documentElement.style.setProperty('--blur-radius', blurRadiusVal + 'px');
    }

    // UI animations
    if (settingAnimations) {
        const animationsEnabled = localStorage.getItem('setting-animations') !== 'false';
        settingAnimations.checked = animationsEnabled;
        document.body.classList.toggle('no-animations', !animationsEnabled);
    }

    // 3. Editor Settings
    if (settingLineNumbers) settingLineNumbers.checked = localStorage.getItem('setting-line-numbers') !== 'false';
    if (settingWordWrap) settingWordWrap.checked = localStorage.getItem('setting-word-wrap') === 'true';
    if (settingFontSize) {
        const fontSizeVal = localStorage.getItem('setting-font-size') || '14';
        settingFontSize.value = fontSizeVal;
        const fontSizeValueSpan = $('#font-size-value');
        if (fontSizeValueSpan) fontSizeValueSpan.textContent = fontSizeVal + 'pt';
    }
    if (settingShowExplorer) {
        const showExplorer = localStorage.getItem('setting-show-explorer') !== 'false';
        settingShowExplorer.checked = showExplorer;
        if (wsSidebar) wsSidebar.style.display = showExplorer ? 'flex' : 'none';
        if (wsToggle) wsToggle.style.display = showExplorer ? 'flex' : 'none';
    }
    if (settingMinimap) settingMinimap.checked = localStorage.getItem('setting-minimap') === 'true';
    if (settingBracketColorization) settingBracketColorization.checked = localStorage.getItem('setting-bracket-colorization') !== 'false';
    if (settingAutoCloseBrackets) settingAutoCloseBrackets.checked = localStorage.getItem('setting-auto-close-brackets') !== 'false';

    // 4. Interface Settings
    if (settingNotificationSound) settingNotificationSound.checked = localStorage.getItem('setting-notification-sound') !== 'false';

    if (settingRestorePage) settingRestorePage.checked = localStorage.getItem('setting-restore-page') === 'true';

    if (settingAutoLogs) settingAutoLogs.checked = localStorage.getItem('setting-auto-logs') !== 'false';
    if (settingLogWatcher) settingLogWatcher.checked = localStorage.getItem('setting-log-watcher') !== 'false';

    if (settingLockWindowSize) {
        const lockWindow = localStorage.getItem('setting-lock-window-size') === 'true';
        settingLockWindowSize.checked = lockWindow;
        sendToCSharp('set_lock_window', { value: lockWindow });
    }

    if (settingAutoSaveWindow) settingAutoSaveWindow.checked = localStorage.getItem('setting-auto-save-window') !== 'false';

    if (settingLockSidebar) settingLockSidebar.checked = localStorage.getItem('setting-lock-sidebar') === 'true';

    if (settingAutoSaveSidebar) settingAutoSaveSidebar.checked = localStorage.getItem('setting-auto-save-sidebar') !== 'false';

    loadFavorites();
}

// Settings changes listeners
if (settingAutoAttach) {
    settingAutoAttach.addEventListener('change', (e) => {
        const val = e.target.checked;
        localStorage.setItem('setting-auto-attach', val);
        sendToCSharp('set_auto_attach', { value: val });
        appendLog(`Auto-Attach set to ${val ? 'Enabled' : 'Disabled'}.`, 'system');
    });
}

if (settingAlwaysOnTop) {
    settingAlwaysOnTop.addEventListener('change', (e) => {
        const val = e.target.checked;
        localStorage.setItem('setting-always-on-top', val);
        sendToCSharp('set_topmost', { value: val });
        appendLog(`Always On Top set to ${val ? 'Enabled' : 'Disabled'}.`, 'system');
    });
}

if (settingDiscordRpc) {
    settingDiscordRpc.addEventListener('change', (e) => {
        const val = e.target.checked;
        localStorage.setItem('setting-discord-rpc', val);
        sendToCSharp('set_discord_rpc', { value: val });
        appendLog(`Discord RPC set to ${val ? 'Enabled' : 'Disabled'}.`, 'system');
    });
}

// Accent Color Swap Dots
$$('.theme-color-dot').forEach(dot => {
    dot.addEventListener('click', () => {
        const color = dot.dataset.color;
        applyAccentColor(color);
    });
});

if (btnApplyCustomHex) {
    btnApplyCustomHex.addEventListener('click', () => {
        const customHexInput = $('#setting-custom-hex');
        if (customHexInput) {
            let color = customHexInput.value.trim();
            if (!color.startsWith('#')) color = '#' + color;
            if (/^#[0-9A-F]{6}$/i.test(color)) {
                applyAccentColor(color);
                appendLog(`Applied custom accent color: ${color}`, 'success');
            } else {
                appendLog('Invalid hex color format (use #RRGGBB).', 'warning');
            }
        }
    });
}

if (settingCustomColorPicker) {
    settingCustomColorPicker.addEventListener('input', (e) => {
        applyAccentColor(e.target.value);
    });
}

if (settingNavLabels) {
    settingNavLabels.addEventListener('change', (e) => {
        const val = e.target.value;
        localStorage.setItem('setting-nav-labels', val);
        document.body.className = document.body.className.replace(/\bnav-style-\S+/g, '');
        document.body.classList.add(`nav-style-${val}`);
    });
}

if (settingCustomBg) {
    settingCustomBg.addEventListener('change', (e) => {
        localStorage.setItem('setting-custom-bg', e.target.checked);
        applyCustomBackground();
    });
}

if (btnApplyCustomBg) {
    btnApplyCustomBg.addEventListener('click', () => {
        if (settingCustomBgInput) {
            const url = settingCustomBgInput.value.trim();
            localStorage.setItem('setting-custom-bg-url', url);
            localStorage.setItem('setting-custom-bg', 'true');
            if (settingCustomBg) settingCustomBg.checked = true;
            applyCustomBackground();
            appendLog(`Applied custom background image!`, 'success');
        }
    });
}

if (settingCustomBgInput) {
    settingCustomBgInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const url = settingCustomBgInput.value.trim();
            localStorage.setItem('setting-custom-bg-url', url);
            localStorage.setItem('setting-custom-bg', 'true');
            if (settingCustomBg) settingCustomBg.checked = true;
            applyCustomBackground();
            appendLog(`Applied custom background image!`, 'success');
        }
    });
}

// File upload for custom background
const bgUploadBtn = $('#btn-bg-upload');
const bgFileInput = $('#bg-file-input');
if (bgUploadBtn && bgFileInput) {
    bgUploadBtn.addEventListener('click', () => bgFileInput.click());
    bgFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleBgFileUpload(file);
    });
}

if (settingBlurRadius) {
    settingBlurRadius.addEventListener('input', (e) => {
        const val = e.target.value;
        localStorage.setItem('setting-blur-radius', val);
        const radiusValueSpan = $('#blur-radius-value');
        if (radiusValueSpan) radiusValueSpan.textContent = val;
        document.documentElement.style.setProperty('--blur-radius', val + 'px');
    });
}

if (settingAnimations) {
    settingAnimations.addEventListener('change', (e) => {
        const val = e.target.checked;
        localStorage.setItem('setting-animations', val);
        document.body.classList.toggle('no-animations', !val);
    });
}

if (settingLineNumbers) {
    settingLineNumbers.addEventListener('change', (e) => {
        const val = e.target.checked;
        localStorage.setItem('setting-line-numbers', val);
        if (editor) {
            editor.updateOptions({ lineNumbers: val ? 'on' : 'off' });
        }
    });
}

if (settingWordWrap) {
    settingWordWrap.addEventListener('change', (e) => {
        const val = e.target.checked;
        localStorage.setItem('setting-word-wrap', val);
        if (editor) {
            editor.updateOptions({ wordWrap: val ? 'on' : 'off' });
        }
    });
}

if (settingFontSize) {
    settingFontSize.addEventListener('input', (e) => {
        const val = e.target.value;
        localStorage.setItem('setting-font-size', val);
        const fontSizeValueSpan = $('#font-size-value');
        if (fontSizeValueSpan) fontSizeValueSpan.textContent = val + 'pt';
        if (editor) {
            editor.updateOptions({ fontSize: parseInt(val) });
        }
    });
}

if (settingShowExplorer) {
    settingShowExplorer.addEventListener('change', (e) => {
        const val = e.target.checked;
        localStorage.setItem('setting-show-explorer', val);
        if (wsSidebar) wsSidebar.style.display = val ? 'flex' : 'none';
        if (wsToggle) wsToggle.style.display = val ? 'flex' : 'none';
    });
}

if (settingMinimap) {
    settingMinimap.addEventListener('change', (e) => {
        const val = e.target.checked;
        localStorage.setItem('setting-minimap', val);
        if (editor) {
            editor.updateOptions({ minimap: { enabled: val } });
        }
    });
}

if (settingBracketColorization) {
    settingBracketColorization.addEventListener('change', (e) => {
        const val = e.target.checked;
        localStorage.setItem('setting-bracket-colorization', val);
        if (editor) {
            editor.updateOptions({
                'bracketPairColorization.enabled': val,
                bracketPairColorization: { enabled: val }
            });
        }
    });
}

if (settingAutoCloseBrackets) {
    settingAutoCloseBrackets.addEventListener('change', (e) => {
        const val = e.target.checked;
        localStorage.setItem('setting-auto-close-brackets', val);
        if (editor) {
            editor.updateOptions({ autoClosingBrackets: val ? 'always' : 'never' });
        }
    });
}

if (settingNotificationSound) {
    settingNotificationSound.addEventListener('change', (e) => {
        localStorage.setItem('setting-notification-sound', e.target.checked);
    });
}

if (settingRestorePage) {
    settingRestorePage.addEventListener('change', (e) => {
        localStorage.setItem('setting-restore-page', e.target.checked);
    });
}

if (settingAutoLogs) {
    settingAutoLogs.addEventListener('change', (e) => {
        localStorage.setItem('setting-auto-logs', e.target.checked);
    });
}

if (settingLogWatcher) {
    settingLogWatcher.addEventListener('change', (e) => {
        localStorage.setItem('setting-log-watcher', e.target.checked);
    });
}

if (settingLockWindowSize) {
    settingLockWindowSize.addEventListener('change', (e) => {
        const val = e.target.checked;
        localStorage.setItem('setting-lock-window-size', val);
        sendToCSharp('set_lock_window', { value: val });
    });
}

if (settingAutoSaveWindow) {
    settingAutoSaveWindow.addEventListener('change', (e) => {
        localStorage.setItem('setting-auto-save-window', e.target.checked);
    });
}

if (settingLockSidebar) {
    settingLockSidebar.addEventListener('change', (e) => {
        localStorage.setItem('setting-lock-sidebar', e.target.checked);
    });
}

if (settingAutoSaveSidebar) {
    settingAutoSaveSidebar.addEventListener('change', (e) => {
        localStorage.setItem('setting-auto-save-sidebar', e.target.checked);
    });
}

// Empty State listeners
if (btnEmptyCreate) {
    btnEmptyCreate.addEventListener('click', () => {
        createNewTab('Script 1', '-- Write your script here!\n');
    });
}

if (btnEmptyImport) {
    btnEmptyImport.addEventListener('click', () => {
        sendToCSharp('open_file');
    });
}

// C# Folder openers in General section
if (btnOpenAutoexec) {
    btnOpenAutoexec.addEventListener('click', () => {
        sendToCSharp('open_subfolder', { folder: 'autoexec' });
    });
}

if (btnOpenScripts) {
    btnOpenScripts.addEventListener('click', () => {
        sendToCSharp('open_subfolder', { folder: 'scripts' });
    });
}

if (btnOpenWorkspace) {
    btnOpenWorkspace.addEventListener('click', () => {
        sendToCSharp('open_subfolder', { folder: 'workspace' });
    });
}

// Settings Side-tabs Switching
const settingsTabBtns = $$('.settings-tab-btn');
const settingsSections = $$('.settings-section');
settingsTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        settingsTabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const secId = btn.dataset.settingsSection;
        settingsSections.forEach(sec => {
            sec.classList.toggle('active', sec.id === `settings-section-${secId}`);
        });
    });
});

// Utilities hooks
if (btnSettingTerminateRoblox) btnSettingTerminateRoblox.addEventListener('click', () => sendToCSharp('kill_roblox'));
if (btnSettingOpenFolder) btnSettingOpenFolder.addEventListener('click', () => sendToCSharp('open_scripts_folder'));
if (btnSettingClearLogs) {
    btnSettingClearLogs.addEventListener('click', () => {
        consoleLogsContent.innerHTML = '<div class="log-entry system">[SYSTEM] Console cleared.</div>';
        appendLog('Console output log history cleared.', 'system');
    });
}

// ════════════════════════════════════════════
// MONACO EDITOR ENHANCEMENT
// ════════════════════════════════════════════
function initMonaco() {
    // Wait for the async-loaded Monaco loader script
    if (typeof require === 'undefined') {
        setTimeout(initMonaco, 200);
        return;
    }
    require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs' } });
    require(['vs/editor/editor.main'], function () {

        // ─── Register Roblox API Autocompletion ───
        monaco.languages.registerCompletionItemProvider('lua', {
            triggerCharacters: ['.', ':'],
            provideCompletionItems: function (model, position) {
                const suggestions = [
                    // Roblox Globals
                    {
                        label: 'game',
                        kind: monaco.languages.CompletionItemKind.Variable,
                        insertText: 'game',
                        detail: 'Roblox DataModel Root',
                        documentation: 'The Game object is the root of Roblox hierarchy.'
                    },
                    {
                        label: 'workspace',
                        kind: monaco.languages.CompletionItemKind.Variable,
                        insertText: 'workspace',
                        detail: 'Workspace Container',
                        documentation: 'Direct reference to game.Workspace containing 3D physical world assets.'
                    },
                    {
                        label: 'script',
                        kind: monaco.languages.CompletionItemKind.Variable,
                        insertText: 'script',
                        detail: 'Script Reference',
                        documentation: 'Refers to the Roblox script instance currently executing.'
                    },
                    {
                        label: 'shared',
                        kind: monaco.languages.CompletionItemKind.Variable,
                        insertText: 'shared',
                        detail: 'Shared Environment Table'
                    },
                    {
                        label: 'Players',
                        kind: monaco.languages.CompletionItemKind.Variable,
                        insertText: 'game:GetService("Players")',
                        detail: 'Players Service',
                        documentation: 'Retrieves the Players service handling clients connected to the server.'
                    },
                    {
                        label: 'Lighting',
                        kind: monaco.languages.CompletionItemKind.Variable,
                        insertText: 'game:GetService("Lighting")',
                        detail: 'Lighting Service',
                        documentation: 'Manages visual skyboxes, shadows, ambient illumination and post-processing.'
                    },
                    {
                        label: 'ReplicatedStorage',
                        kind: monaco.languages.CompletionItemKind.Variable,
                        insertText: 'game:GetService("ReplicatedStorage")',
                        detail: 'ReplicatedStorage Service',
                        documentation: 'Common repository folder for assets, modules and RemoteEvents shared across Client and Server.'
                    },
                    {
                        label: 'ServerStorage',
                        kind: monaco.languages.CompletionItemKind.Variable,
                        insertText: 'game:GetService("ServerStorage")',
                        detail: 'ServerStorage Service',
                        documentation: 'Server-only asset repository folder, inaccessible by client engines.'
                    },
                    {
                        label: 'HttpService',
                        kind: monaco.languages.CompletionItemKind.Variable,
                        insertText: 'game:GetService("HttpService")',
                        detail: 'HttpService Service',
                        documentation: 'Provides methods for networking requests, JSON serialization, and UUID generation.'
                    },
                    {
                        label: 'TweenService',
                        kind: monaco.languages.CompletionItemKind.Variable,
                        insertText: 'game:GetService("TweenService")',
                        detail: 'TweenService Service',
                        documentation: 'Creates smooth transitions of Instance properties over time.'
                    },
                    {
                        label: 'UserInputService',
                        kind: monaco.languages.CompletionItemKind.Variable,
                        insertText: 'game:GetService("UserInputService")',
                        detail: 'UserInputService Service',
                        documentation: 'Queries physical inputs (keyboard, mouse, touch, gamepads).'
                    },
                    {
                        label: 'RunService',
                        kind: monaco.languages.CompletionItemKind.Variable,
                        insertText: 'game:GetService("RunService")',
                        detail: 'RunService Service',
                        documentation: 'Manages frame tick update callbacks (RenderStepped, Heartbeat, Stepped).'
                    },

                    // Roblox Common Methods
                    {
                        label: 'GetService',
                        kind: monaco.languages.CompletionItemKind.Method,
                        insertText: 'GetService("${1:ServiceName}")',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: 'Instance:GetService(serviceName)',
                        documentation: 'Retrieves or instantiates a built-in Service Class.'
                    },
                    {
                        label: 'FindFirstChild',
                        kind: monaco.languages.CompletionItemKind.Method,
                        insertText: 'FindFirstChild("${1:ChildName}")',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: 'Instance:FindFirstChild(name)',
                        documentation: 'Returns the first child object matching name without waiting or throwing exceptions.'
                    },
                    {
                        label: 'WaitForChild',
                        kind: monaco.languages.CompletionItemKind.Method,
                        insertText: 'WaitForChild("${1:ChildName}")',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: 'Instance:WaitForChild(name, timeout)',
                        documentation: 'Yields thread until a child object matching name exists.'
                    },
                    {
                        label: 'Destroy',
                        kind: monaco.languages.CompletionItemKind.Method,
                        insertText: 'Destroy()',
                        detail: 'Instance:Destroy()',
                        documentation: 'Breaks all parenting, connections, and schedules instance garbage collection.'
                    },
                    {
                        label: 'Clone',
                        kind: monaco.languages.CompletionItemKind.Method,
                        insertText: 'Clone()',
                        detail: 'Instance:Clone()',
                        documentation: 'Duplicates an instance along with all its descendants.'
                    },
                    {
                        label: 'GetChildren',
                        kind: monaco.languages.CompletionItemKind.Method,
                        insertText: 'GetChildren()',
                        detail: 'Instance:GetChildren()',
                        documentation: 'Returns an array table containing direct children objects.'
                    },
                    {
                        label: 'GetDescendants',
                        kind: monaco.languages.CompletionItemKind.Method,
                        insertText: 'GetDescendants()',
                        detail: 'Instance:GetDescendants()',
                        documentation: 'Returns an array table containing descendants recursively.'
                    },
                    {
                        label: 'Instance.new',
                        kind: monaco.languages.CompletionItemKind.Constructor,
                        insertText: 'Instance.new("${1:ClassName}")',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: 'Instance.new(className, parent)',
                        documentation: 'Instantiates a new Roblox Object type in memory.'
                    },

                    // Common Lua Utilities
                    {
                        label: 'print',
                        kind: monaco.languages.CompletionItemKind.Function,
                        insertText: 'print(${1:message})',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: 'print(value)'
                    },
                    {
                        label: 'warn',
                        kind: monaco.languages.CompletionItemKind.Function,
                        insertText: 'warn(${1:message})',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: 'warn(value)'
                    },
                    {
                        label: 'task.wait',
                        kind: monaco.languages.CompletionItemKind.Function,
                        insertText: 'task.wait(${1:seconds})',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: 'task.wait(duration)',
                        documentation: 'Yields the execution thread for a duration tied to TaskScheduler updates.'
                    },
                    {
                        label: 'task.spawn',
                        kind: monaco.languages.CompletionItemKind.Function,
                        insertText: 'task.spawn(${1:function})',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: 'task.spawn(func)'
                    },
                    {
                        label: 'task.defer',
                        kind: monaco.languages.CompletionItemKind.Function,
                        insertText: 'task.defer(${1:function})',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: 'task.defer(func)'
                    },
                    {
                        label: 'local',
                        kind: monaco.languages.CompletionItemKind.Keyword,
                        insertText: 'local ${1:name} = ${2:value}',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: 'Local Variable Declaration'
                    }
                ];

                return { suggestions: suggestions };
            }
        });

        // ─── Define Froggie Custom Monaco Theme ───
        monaco.editor.defineTheme('froggie-dark', {
            base: 'vs-dark', inherit: true,
            rules: [
                { token: 'comment', foreground: '5a5d6d', fontStyle: 'italic' },
                { token: 'keyword', foreground: '39ff14', fontWeight: 'bold' },
                { token: 'string', foreground: '00b4ff' },
                { token: 'number', foreground: 'a855f7' },
            ],
            colors: {
                'editor.background': '#08080a',
                'editor.foreground': '#f0f0f5',
                'editor.lineHighlightBackground': '#0e0e12',
                'editorLineNumber.foreground': '#5a5d6d',
                'editorLineNumber.activeForeground': '#39ff14',
                'editor.selectionBackground': 'rgba(57, 255, 20, 0.12)',
                'editorCursor.foreground': '#39ff14',
            }
        });

        // ─── Create Editor Instance ───
        const useMinimap = localStorage.getItem('setting-minimap') === 'true';
        const useBracketColor = localStorage.getItem('setting-bracket-colorization') !== 'false';
        const useAutoClose = localStorage.getItem('setting-auto-close-brackets') !== 'false';
        const useLineNumbers = localStorage.getItem('setting-line-numbers') !== 'false' ? 'on' : 'off';
        const useWordWrap = localStorage.getItem('setting-word-wrap') === 'true' ? 'on' : 'off';
        const useFontSize = parseInt(localStorage.getItem('setting-font-size') || '14');

        editor = monaco.editor.create(document.getElementById('monaco-editor-container'), {
            theme: 'froggie-dark',
            automaticLayout: true,
            fontSize: useFontSize,
            fontFamily: "'Fira Code', Consolas, monospace",
            minimap: { enabled: useMinimap },
            scrollbar: { verticalScrollbarSize: 5, horizontalScrollbarSize: 5 },
            lineNumbers: useLineNumbers,
            wordWrap: useWordWrap,
            roundedSelection: true,
            scrollBeyondLastLine: false,
            // High fidelity enhancements
            'bracketPairColorization.enabled': useBracketColor,
            bracketPairColorization: { enabled: useBracketColor },
            autoClosingBrackets: useAutoClose ? 'always' : 'never',
            guides: {
                bracketPairs: true,
                indentation: true
            }
        });

        // Process any pending script load from Script Hub
        if (pendingScriptLoad) {
            const { name, content } = pendingScriptLoad;
            pendingScriptLoad = null;
            createNewTab(name, content);
        } else {
            createNewTab('Script 1', '-- Write your script here!\nprint("Hello from Froggie!")\n');
        }
    });
}

// ════════════════════════════════════════════
// TABS MANAGEMENT
// ════════════════════════════════════════════
function createNewTab(name = 'Untitled.lua', content = '', filePath = '') {
    if (typeof monaco === 'undefined' || !monaco.editor) {
        // Monaco not loaded yet — queue for later
        pendingScriptLoad = { name, content };
        return;
    }
    tabCounter++;
    const id = `tab-${tabCounter}`;
    const model = monaco.editor.createModel(content, 'lua');

    model.onDidChangeContent(() => {
        const t = tabs.find(t => t.id === id);
        if (t && t.isSaved) { t.isSaved = false; renderTabs(); }
    });

    tabs.push({ id, name, model, isSaved: true, filePath });
    hideEmptyState();
    renderTabs();
    selectTab(id);
    updateHomeStats();
}

function selectTab(id) {
    const t = tabs.find(t => t.id === id);
    if (!t) return;
    activeTabId = id;
    if (editor) editor.setModel(t.model);
    document.querySelectorAll('.tab').forEach(el => el.classList.toggle('active', el.dataset.id === id));
}

function closeTab(id, e) {
    if (e) e.stopPropagation();
    const idx = tabs.findIndex(t => t.id === id);
    if (idx === -1) return;
    tabs[idx].model.dispose();
    tabs.splice(idx, 1);
    if (tabs.length === 0) {
        activeTabId = null;
        if (editor) editor.setModel(null);
        renderTabs();
        showEmptyState();
        if (consoleDrawer) consoleDrawer.classList.remove('active');
        updateHomeStats();
        return;
    }
    renderTabs();
    if (activeTabId === id) selectTab(tabs[Math.min(idx, tabs.length - 1)].id);
    updateHomeStats();
}

function showEmptyState() {
    const el = $('#editor-empty-state');
    const monacoEl = $('#monaco-editor-container');
    if (el) el.style.display = 'flex';
    if (monacoEl) monacoEl.style.display = 'none';
    if (consoleDrawer) consoleDrawer.style.display = 'none';
}

function hideEmptyState() {
    const el = $('#editor-empty-state');
    const monacoEl = $('#monaco-editor-container');
    if (el) el.style.display = 'none';
    if (monacoEl) monacoEl.style.display = 'block';
    if (consoleDrawer) consoleDrawer.style.display = '';
}

function renderTabs() {
    tabsList.innerHTML = '';
    tabs.forEach(tab => {
        const el = document.createElement('div');
        el.className = `tab${tab.id === activeTabId ? ' active' : ''}`;
        el.dataset.id = tab.id;
        el.innerHTML = `<span class="tab-name">${tab.name}${tab.isSaved ? '' : ' •'}</span><span class="tab-close"><i class="fa-solid fa-xmark"></i></span>`;
        el.addEventListener('click', () => selectTab(tab.id));
        el.querySelector('.tab-close').addEventListener('click', (e) => closeTab(tab.id, e));
        tabsList.appendChild(el);
    });
}

function openTabForFile(name, content, filePath) {
    if (filePath) {
        const existing = tabs.find(t => t.filePath === filePath);
        if (existing) {
            selectTab(existing.id);
            return;
        }
    }
    createNewTab(name, content, filePath);
}

// ════════════════════════════════════════════
// WORKSPACE ACTIONS (COLLAPSIBLE SIDEBAR)
// ════════════════════════════════════════════
if (wsToggle && wsSidebar) {
    wsToggle.addEventListener('click', () => {
        const isCollapsed = wsSidebar.classList.toggle('collapsed');
        wsToggle.querySelector('i').className = isCollapsed ? 'fa-solid fa-chevron-right' : 'fa-solid fa-chevron-left';
        
        localStorage.setItem('workspace-collapsed', isCollapsed);
        
        if (editor) {
            setTimeout(() => editor.layout(), 300);
        }
    });

    if (localStorage.getItem('workspace-collapsed') === 'true') {
        wsSidebar.classList.add('collapsed');
        wsToggle.querySelector('i').className = 'fa-solid fa-chevron-right';
    }
}

function createWorkspaceFileDOM(fileName, folder) {
    const el = document.createElement('div');
    el.className = 'workspace-file-item';
    el.dataset.fileName = fileName;
    el.dataset.folder = folder;
    el.innerHTML = `
        <i class="fa-brands fa-lua file-icon"></i>
        <span class="file-name" title="${fileName}">${fileName}</span>
        <button class="btn-delete-workspace-file" title="Delete Script">
            <i class="fa-solid fa-trash-can"></i>
        </button>
    `;

    // Click file item to open in editor
    el.addEventListener('click', (e) => {
        if (e.target.closest('.btn-delete-workspace-file')) return;
        sendToCSharp('read_script', { fileName, folder });
        appendLog(`Loading local script: ${folder}/${fileName}`, 'system');
    });

    // Hover Delete Button Click
    el.querySelector('.btn-delete-workspace-file').addEventListener('click', async (e) => {
        e.stopPropagation();
        if (await froggieConfirm(`Are you sure you want to delete script: ${folder}/${fileName}?`, 'Delete Script')) {
            sendToCSharp('delete_script', { fileName, folder });
        }
    });

    // Right-Click Context Menu Trigger
    el.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showWorkspaceFileContextMenu(fileName, folder, e.clientX, e.clientY);
    });

    return el;
}

// Render local scripts inside split pane
function renderWorkspaceFiles() {
    if (!workspaceFilesList) return;
    workspaceFilesList.innerHTML = '';

    // Explorer view showing scripts, autoexec, workspace folders
    const folders = ['scripts', 'autoexec', 'workspace'];
    folders.forEach(folder => {
        const files = workspaceStructure[folder] || [];
        
        const folderEl = document.createElement('div');
        folderEl.className = 'explorer-folder open';
        folderEl.dataset.folder = folder;

        const headerEl = document.createElement('div');
        headerEl.className = 'folder-header';
        headerEl.innerHTML = `
            <i class="fa-solid fa-chevron-down folder-toggle"></i>
            <i class="fa-solid fa-folder"></i>
            <span class="folder-name">${folder}</span>
        `;

        const contentsEl = document.createElement('div');
        contentsEl.className = 'folder-contents';

        if (files.length === 0) {
            contentsEl.innerHTML = `
                <div class="folder-empty">Empty</div>
            `;
        } else {
            files.forEach(fileName => {
                const el = createWorkspaceFileDOM(fileName, folder);
                contentsEl.appendChild(el);
            });
        }

        folderEl.appendChild(headerEl);
        folderEl.appendChild(contentsEl);

        // Toggle folder open/collapsed state
        headerEl.addEventListener('click', () => {
            const isOpen = folderEl.classList.toggle('open');
            headerEl.querySelector('.folder-toggle').className = isOpen 
                ? 'fa-solid fa-chevron-down folder-toggle' 
                : 'fa-solid fa-chevron-right folder-toggle';
        });

        workspaceFilesList.appendChild(folderEl);
    });
}

btnWorkspaceRefresh.addEventListener('click', () => {
    sendToCSharp('get_scripts');
    appendLog('Refreshing saved workspace scripts...', 'system');
});

btnWorkspaceOpenFolder.addEventListener('click', () => {
    sendToCSharp('open_scripts_folder');
});

// ════════════════════════════════════════════
// CREATE SCRIPT MODAL DIALOG
// ════════════════════════════════════════════
btnWorkspaceNew.addEventListener('click', () => {
    newScriptModal.classList.add('active');
    modalScriptName.value = 'NewScript';
    modalScriptContent.value = '';
    const modalFolderSelect = $('#modal-script-folder');
    if (modalFolderSelect) {
        modalFolderSelect.value = 'scripts';
    }
    modalScriptName.focus();
    modalScriptName.select();
});

btnModalClose.addEventListener('click', () => newScriptModal.classList.remove('active'));
btnModalCancel.addEventListener('click', () => newScriptModal.classList.remove('active'));

btnModalCreate.addEventListener('click', () => {
    let name = modalScriptName.value.trim();
    const content = modalScriptContent.value;
    const folder = $('#modal-script-folder')?.value || 'scripts';
    
    if (!name) {
        froggieAlert('Please enter a script name.', 'Missing Name');
        return;
    }
    
    if (!name.endsWith('.lua') && !name.endsWith('.txt') && !name.endsWith('.json')) {
        name += '.lua';
    }
    
    sendToCSharp('create_script_file', { fileName: name, content, folder });
    newScriptModal.classList.remove('active');
});

// Close modal on escape key
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && newScriptModal.classList.contains('active')) {
        newScriptModal.classList.remove('active');
    }
});

// ════════════════════════════════════════════
// CUSTOM CONTEXT MENUS LOGIC
// ════════════════════════════════════════════

// 1. TABS CONTEXT MENU
tabsList.addEventListener('contextmenu', (e) => {
    const tabEl = e.target.closest('.tab');
    if (!tabEl) return;
    e.preventDefault();
    e.stopPropagation();
    hideWorkspaceContextMenu();
    showTabContextMenu(tabEl.dataset.id, e.clientX, e.clientY);
});

function showTabContextMenu(tabId, x, y) {
    selectedTabIdForMenu = tabId;
    tabContextMenu.style.display = 'block';

    const menuWidth = tabContextMenu.offsetWidth || 160;
    const menuHeight = tabContextMenu.offsetHeight || 220;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let left = x;
    let top = y;

    if (x + menuWidth > windowWidth) left = windowWidth - menuWidth - 10;
    if (y + menuHeight > windowHeight) top = windowHeight - menuHeight - 10;

    tabContextMenu.style.left = `${left}px`;
    tabContextMenu.style.top = `${top}px`;
}

function hideTabContextMenu() {
    tabContextMenu.style.display = 'none';
}

// 2. WORKSPACE FILES CONTEXT MENU
function showWorkspaceFileContextMenu(fileName, folder, x, y) {
    selectedWsFileNameForMenu = fileName;
    selectedWsFileFolderForMenu = folder;
    workspaceContextMenu.style.display = 'block';

    const menuWidth = workspaceContextMenu.offsetWidth || 160;
    const menuHeight = workspaceContextMenu.offsetHeight || 120;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let left = x;
    let top = y;

    if (x + menuWidth > windowWidth) left = windowWidth - menuWidth - 10;
    if (y + menuHeight > windowHeight) top = windowHeight - menuHeight - 10;

    workspaceContextMenu.style.left = `${left}px`;
    workspaceContextMenu.style.top = `${top}px`;
}

function hideWorkspaceContextMenu() {
    workspaceContextMenu.style.display = 'none';
}

// Hide context menus on left click away
document.addEventListener('click', (e) => {
    if (!e.target.closest('#tab-context-menu')) hideTabContextMenu();
    if (!e.target.closest('#workspace-context-menu')) hideWorkspaceContextMenu();
});

// Hide context menus on right click away
document.addEventListener('contextmenu', (e) => {
    if (!e.target.closest('.tab') && !e.target.closest('.workspace-file-item')) {
        hideTabContextMenu();
        hideWorkspaceContextMenu();
    }
});

// Hide context menus on escape
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        hideTabContextMenu();
        hideWorkspaceContextMenu();
    }
});

// Context Menu Actions - Tab Menu
$('#menu-rename').addEventListener('click', () => {
    if (!selectedTabIdForMenu) return;
    const t = tabs.find(x => x.id === selectedTabIdForMenu);
    if (t) {
        showRenameModal(t);
    }
    hideTabContextMenu();
});

// Custom Rename Modal (avoids browser prompt showing 'froggie.local')
function showRenameModal(tab) {
    const modal = $('#rename-modal');
    const input = $('#rename-modal-input');
    if (!modal || !input) return;
    input.value = tab.name;
    modal.classList.add('active');
    modal.dataset.tabId = tab.id;
    setTimeout(() => { input.focus(); input.select(); }, 100);
}

const renameModalOk = $('#rename-modal-ok');
const renameModalCancel = $('#rename-modal-cancel');
const renameModal = $('#rename-modal');

function doRename() {
    if (!renameModal) return;
    const tabId = renameModal.dataset.tabId;
    const input = $('#rename-modal-input');
    const newName = input ? input.value.trim() : '';
    if (newName && tabId) {
        const t = tabs.find(x => x.id === tabId);
        if (t) {
            t.name = newName;
            renderTabs();
        }
    }
    renameModal.classList.remove('active');
}

if (renameModalOk) renameModalOk.addEventListener('click', doRename);
if (renameModalCancel) renameModalCancel.addEventListener('click', () => renameModal.classList.remove('active'));

// Enter key to confirm rename
const renameInput = $('#rename-modal-input');
if (renameInput) {
    renameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') doRename();
        if (e.key === 'Escape') renameModal.classList.remove('active');
    });
}

// Close rename modal on escape
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && renameModal && renameModal.classList.contains('active')) {
        renameModal.classList.remove('active');
    }
});

$('#menu-duplicate').addEventListener('click', () => {
    if (!selectedTabIdForMenu) return;
    const t = tabs.find(x => x.id === selectedTabIdForMenu);
    if (t) {
        const content = t.model.getValue();
        const baseName = t.name.replace(/\.lua$/i, '').replace(/\.txt$/i, '');
        createNewTab(`${baseName} (Copy).lua`, content);
    }
    hideTabContextMenu();
});

$('#menu-execute').addEventListener('click', () => {
    if (!selectedTabIdForMenu) return;
    const t = tabs.find(x => x.id === selectedTabIdForMenu);
    if (t) {
        sendToCSharp('execute', { script: t.model.getValue() });
        appendLog(`Executing tab: ${t.name}...`, 'system');
    }
    hideTabContextMenu();
});

$('#menu-clear').addEventListener('click', () => {
    if (!selectedTabIdForMenu) return;
    const t = tabs.find(x => x.id === selectedTabIdForMenu);
    if (t) {
        t.model.setValue('');
        appendLog(`Editor cleared for: ${t.name}`, 'system');
    }
    hideTabContextMenu();
});

$('#menu-close-others').addEventListener('click', () => {
    if (!selectedTabIdForMenu) return;
    tabs.forEach(t => {
        if (t.id !== selectedTabIdForMenu) t.model.dispose();
    });
    tabs = tabs.filter(t => t.id === selectedTabIdForMenu);
    renderTabs();
    selectTab(selectedTabIdForMenu);
    updateHomeStats();
    hideTabContextMenu();
});

$('#menu-delete').addEventListener('click', () => {
    if (!selectedTabIdForMenu) return;
    closeTab(selectedTabIdForMenu);
    hideTabContextMenu();
});

// Context Menu Actions - Workspace Menu
$('#ws-menu-open').addEventListener('click', () => {
    if (selectedWsFileNameForMenu) {
        sendToCSharp('read_script', { fileName: selectedWsFileNameForMenu, folder: selectedWsFileFolderForMenu || 'scripts' });
    }
    hideWorkspaceContextMenu();
});

$('#ws-menu-execute').addEventListener('click', () => {
    if (selectedWsFileNameForMenu) {
        autoExecuteNextOpenedFile = true;
        sendToCSharp('read_script', { fileName: selectedWsFileNameForMenu, folder: selectedWsFileFolderForMenu || 'scripts' });
    }
    hideWorkspaceContextMenu();
});

$('#ws-menu-delete').addEventListener('click', () => {
    if (selectedWsFileNameForMenu) {
        const folder = selectedWsFileFolderForMenu || 'scripts';
        const shouldDelete = await froggieConfirm(`Are you sure you want to delete script: ${folder}/${selectedWsFileNameForMenu}?`, 'Delete Script');
        if (shouldDelete) {
            sendToCSharp('delete_script', { fileName: selectedWsFileNameForMenu, folder });
        }
    }
    hideWorkspaceContextMenu();
});

// ════════════════════════════════════════════
// CONSOLE / LOGS
// ════════════════════════════════════════════
function appendLog(message, level = 'info') {
    const el = document.createElement('div');
    el.className = `log-entry ${level}`;
    const now = new Date();
    el.textContent = `[${now.toTimeString().split(' ')[0]}] ${message}`;
    consoleLogsContent.appendChild(el);
    consoleLogsContent.scrollTop = consoleLogsContent.scrollHeight;

    // Auto-expand logs if settings auto logs is enabled and it's an error
    const autoLogs = localStorage.getItem('setting-auto-logs') !== 'false';
    if ((level === 'error' || autoLogs) && !consoleDrawer.classList.contains('active')) {
        consoleDrawer.classList.add('active');
    }
}

// ════════════════════════════════════════════
// EXECUTOR BUTTON EVENTS
// ════════════════════════════════════════════
btnAddTab.addEventListener('click', () => createNewTab(`Script ${tabs.length + 1}`, '-- New script\n'));

btnExecute.addEventListener('click', () => {
    if (!activeTabId) return;
    const t = tabs.find(t => t.id === activeTabId);
    if (t) {
        sendToCSharp('execute', { script: t.model.getValue() });
        appendLog(`Executing: ${t.name}...`, 'system');
    }
});

btnClear.addEventListener('click', () => {
    if (!activeTabId) return;
    const t = tabs.find(t => t.id === activeTabId);
    if (t) { t.model.setValue(''); appendLog('Editor cleared.', 'system'); }
});

btnOpenFile.addEventListener('click', () => sendToCSharp('open_file'));

btnSaveFile.addEventListener('click', () => {
    if (!activeTabId) return;
    const t = tabs.find(t => t.id === activeTabId);
    if (t) sendToCSharp('save_file', { tabId: t.id, filePath: t.filePath, content: t.model.getValue() });
});

btnToggleConsole.addEventListener('click', () => {
    if (tabs.length === 0) return;
    consoleDrawer.classList.toggle('active');
});
btnCloseConsole.addEventListener('click', () => consoleDrawer.classList.remove('active'));
btnClearLogs.addEventListener('click', () => { consoleLogsContent.innerHTML = '<div class="log-entry system">[SYSTEM] Console cleared.</div>'; });

// ════════════════════════════════════════════
// INJECT
// ════════════════════════════════════════════
btnInject.addEventListener('click', () => {
    btnInject.disabled = true;
    const label = $('#status-text');
    if (label) label.textContent = 'Injecting...';
    updateStatus('injecting', 'Injecting...');
    sendToCSharp('inject');
    appendLog('Injection requested...', 'system');
});

function updateStatus(status, text) {
    statusDot.className = 'status-dot';
    if (status) statusDot.classList.add(status);
    
    const label = $('#status-text');
    if (label) label.textContent = text;

    if (status === 'injected') {
        btnInject.disabled = true;
        if (label) label.textContent = 'Injected';
        statStatus.textContent = 'Online';
        statStatus.style.color = 'var(--accent)';
    } else if (status === 'injecting') {
        btnInject.disabled = true;
        if (label) label.textContent = 'Injecting...';
    } else {
        btnInject.disabled = false;
        if (label) label.textContent = 'Inject';
        statStatus.textContent = 'Offline';
        statStatus.style.color = '';
    }
}

// ════════════════════════════════════════════
// HOME STATS
// ════════════════════════════════════════════
function updateHomeStats() {
    statTabs.textContent = tabs.length || '0';
}

// ════════════════════════════════════════════
// SCRIPT HUB - RSCRIPT API
// ════════════════════════════════════════════
async function fetchHubScripts() {
    hubGrid.innerHTML = '<div class="hub-loading"><div class="spinner"></div><p>Loading scripts from RScript...</p></div>';

    let fetchDone = false;
    
    // Timeout of 3 seconds to trigger fallback if API is slow
    const timeoutId = setTimeout(() => {
        if (!fetchDone) {
            appendLog('API fetch is slow, loading featured scripts...', 'warning');
            hubScripts = [...featuredScripts];
            renderHubScripts(hubScripts);
        }
    }, 3000);

    try {
        const controller = new AbortController();
        const signal = controller.signal;
        // Cancel after 5 seconds to not hang forever
        setTimeout(() => controller.abort(), 5000);

        const res = await fetch('https://rscripts.net/api/scripts?page=1&orderBy=date&sort=desc', { signal });
        const data = await res.json();

        fetchDone = true;
        clearTimeout(timeoutId);

        if (data && data.scripts && data.scripts.length > 0) {
            hubScripts = [...data.scripts];
            renderHubScripts(hubScripts);
        } else {
            // No scripts returned, load featured
            hubScripts = [...featuredScripts];
            renderHubScripts(hubScripts);
        }
    } catch (err) {
        // Try second endpoint
        try {
            const controller = new AbortController();
            setTimeout(() => controller.abort(), 4000);
            
            const res = await fetch('https://rscripts.net/api/v2/scripts?page=1&orderBy=date&sort=desc', { signal: controller.signal });
            const data = await res.json();
            
            fetchDone = true;
            clearTimeout(timeoutId);
            
            if (data && data.scripts && data.scripts.length > 0) {
                hubScripts = [...data.scripts];
                renderHubScripts(hubScripts);
            } else {
                hubScripts = [...featuredScripts];
                renderHubScripts(hubScripts);
            }
        } catch (e2) {
            fetchDone = true;
            clearTimeout(timeoutId);
            // Both endpoints failed, use featured scripts
            hubScripts = [...featuredScripts];
            renderHubScripts(hubScripts);
            appendLog('RScript API unreachable. Loaded featured scripts.', 'warning');
        }
    }
}

function showHubFallback() {
    hubGrid.innerHTML = `
        <div class="hub-loading">
            <i class="fa-solid fa-triangle-exclamation" style="font-size:24px; color:var(--orange);"></i>
            <p>Could not load scripts from RScript API.</p>
            <p style="font-size:11px; color:var(--text-3);">Check your internet connection or try again later.</p>
            <button class="btn-pill btn-ghost" onclick="fetchHubScripts()" style="margin-top:8px;">
                <i class="fa-solid fa-rotate"></i> Retry
            </button>
        </div>
    `;
}

function getScriptGradient(title) {
    const gradients = [
        'linear-gradient(135deg, #1e3a8a, #3b82f6)',
        'linear-gradient(135deg, #311b92, #d500f9)',
        'linear-gradient(135deg, #004d40, #00e676)',
        'linear-gradient(135deg, #e65100, #ffea00)',
        'linear-gradient(135deg, #880e4f, #ff4081)',
        'linear-gradient(135deg, #0d47a1, #00bcd4)',
        'linear-gradient(135deg, #3e2723, #d84315)',
        'linear-gradient(135deg, #1a237e, #5c6bc0)',
        'linear-gradient(135deg, #263238, #b0bec5)',
        'linear-gradient(135deg, #4a148c, #8e24aa)'
    ];
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
        hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
}

// Script Hub detailed modal elements
const scriptHubModal = $('#script-hub-modal');
const btnHubModalClose = $('#btn-hub-modal-close');
const detailedTitle = $('#detailed-title');
const detailedBanner = $('#detailed-banner');
const detailedGame = $('#detailed-game');
const detailedDesc = $('#detailed-desc');

const btnHubModalCopy = $('#btn-hub-modal-copy');
const btnHubModalLoad = $('#btn-hub-modal-load');
const btnHubModalExecute = $('#btn-hub-modal-execute');

function openHubScriptDetails(script) {
    currentlySelectedHubScript = script;
    const title = script.title || script.name || 'Untitled';
    
    let game = 'Universal';
    if (script.game) {
        if (typeof script.game === 'object') {
            game = script.game.name || script.game.title || 'Universal';
        } else {
            game = script.game;
        }
    } else if (script.gameName) {
        game = script.gameName;
    }

    const desc = script.description || script.desc || 'No description provided for this script.';

    detailedTitle.textContent = title;
    detailedGame.innerHTML = `<i class="fa-solid fa-gamepad"></i> ${escapeHtml(game)}`;
    detailedDesc.textContent = desc;

    const bannerUrl = script.image || script.thumbnail;
    if (bannerUrl) {
        detailedBanner.style.background = `url('${bannerUrl}') center/cover no-repeat`;
    } else {
        detailedBanner.style.background = getScriptGradient(title);
    }

    scriptHubModal.classList.add('active');
}

if (btnHubModalClose) {
    btnHubModalClose.addEventListener('click', () => {
        scriptHubModal.classList.remove('active');
    });
}

// Helper function to fetch raw script content if URL is provided
async function getHubScriptCode(script) {
    if (!script) return '';
    // If it's a featured script, it already has the content on .script
    if (script.script && !script.script.startsWith('http')) {
        return script.script;
    }
    
    const url = script.rawScript || script.script || script.code || script.content || '';
    if (!url) return '';
    
    if (url.startsWith('http')) {
        try {
            const res = await fetch(url);
            if (res.ok) {
                return await res.text();
            }
            throw new Error(`HTTP status ${res.status}`);
        } catch (e) {
            console.error('Failed to fetch raw script:', e);
            throw new Error('Failed to download script. Server might be blocked/offline.');
        }
    }
    return url;
}

// Helper to wrap button action with a visual loading spinner
async function executeWithLoading(btn, actionFn) {
    const origHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Fetching...`;
    try {
        await actionFn();
    } catch (e) {
        appendLog(e.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = origHTML;
    }
}

btnHubModalCopy.addEventListener('click', () => {
    if (!currentlySelectedHubScript) return;
    executeWithLoading(btnHubModalCopy, async () => {
        const code = await getHubScriptCode(currentlySelectedHubScript);
        if (code) {
            await navigator.clipboard.writeText(code);
            appendLog(`Copied script to clipboard: ${currentlySelectedHubScript.title || currentlySelectedHubScript.name}`, 'success');
            const orig = btnHubModalCopy.innerHTML;
            btnHubModalCopy.innerHTML = `<i class="fa-solid fa-check"></i> Copied!`;
            setTimeout(() => { btnHubModalCopy.innerHTML = orig; }, 1500);
        } else {
            appendLog('No script content to copy.', 'warning');
        }
    });
});

btnHubModalExecute.addEventListener('click', () => {
    if (!currentlySelectedHubScript) return;
    executeWithLoading(btnHubModalExecute, async () => {
        const code = await getHubScriptCode(currentlySelectedHubScript);
        if (code) {
            sendToCSharp('execute', { script: code });
            appendLog(`Executing hub script: ${currentlySelectedHubScript.title || currentlySelectedHubScript.name}`, 'system');
            scriptHubModal.classList.remove('active');
        } else {
            appendLog('No script content to execute.', 'warning');
        }
    });
});

btnHubModalLoad.addEventListener('click', () => {
    if (!currentlySelectedHubScript) return;
    executeWithLoading(btnHubModalLoad, async () => {
        const code = await getHubScriptCode(currentlySelectedHubScript);
        if (code) {
            const scriptName = (currentlySelectedHubScript.title || currentlySelectedHubScript.name || 'HubScript') + '.lua';
            scriptHubModal.classList.remove('active');

            // Queue the load if Monaco isn't ready yet
            if (!editor) {
                pendingScriptLoad = { name: scriptName, content: code };
                navigateTo('executor'); 
                appendLog(`Loading script to editor: ${scriptName}`, 'success');
            } else {
                navigateTo('executor');
                openTabForFile(scriptName, code);
                appendLog(`Loaded script to editor: ${scriptName}`, 'success');
            }
        } else {
            appendLog('No script content to load.', 'warning');
        }
    });
});

function filterAndRenderHubScripts() {
    const term = hubSearch.value.toLowerCase();
    let filtered = hubScripts;

    if (showFavoritesOnly) {
        filtered = filtered.filter(s => isFavorite(s.id || s.title || s.name));
    }

    if (term) {
        filtered = filtered.filter(s => {
            const title = (s.title || s.name || '').toLowerCase();
            let game = 'Universal';
            if (s.game) {
                if (typeof s.game === 'object') {
                    game = s.game.name || s.game.title || 'Universal';
                } else {
                    game = s.game;
                }
            } else if (s.gameName) {
                game = s.gameName;
            }
            game = game.toLowerCase();
            return title.includes(term) || game.includes(term);
        });
    }

    renderHubScripts(filtered);
}

function renderHubScripts(scripts) {
    hubGrid.innerHTML = '';
    
    if (scripts.length === 0) {
        hubGrid.innerHTML = '<div class="hub-loading"><p>No scripts found matching filters.</p></div>';
        return;
    }

    scripts.forEach(script => {
        const title = script.title || script.name || 'Untitled';
        
        let game = 'Universal';
        if (script.game) {
            if (typeof script.game === 'object') {
                game = script.game.name || script.game.title || 'Universal';
            } else {
                game = script.game;
            }
        } else if (script.gameName) {
            game = script.gameName;
        }

        const id = script.id || title;
        
        const card = document.createElement('div');
        card.className = 'hub-card';
        card.innerHTML = `
            <div class="hub-card-banner" style="background: ${getScriptGradient(title)}">
                ${script.image || script.thumbnail ? `<img src="${script.image || script.thumbnail}" class="banner-img" />` : ''}
                <div class="banner-overlay"></div>
                <button class="btn-favorite ${isFavorite(id) ? 'active' : ''}" title="Favorite Script">
                    <i class="${isFavorite(id) ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                </button>
            </div>
            <div class="hub-card-body">
                <div class="hub-card-title">${escapeHtml(title)}</div>
                <div class="hub-card-game"><i class="fa-solid fa-gamepad"></i> ${escapeHtml(game)}</div>
            </div>
        `;

        card.querySelector('.btn-favorite').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(id);
            const isFav = isFavorite(id);
            const btn = card.querySelector('.btn-favorite');
            btn.classList.toggle('active', isFav);
            btn.querySelector('i').className = isFav ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
            
            if (showFavoritesOnly) {
                filterAndRenderHubScripts();
            }
        });

        card.addEventListener('click', (e) => {
            if (e.target.closest('.btn-favorite')) return;
            openHubScriptDetails(script);
        });

        hubGrid.appendChild(card);
    });
}

hubSearch.addEventListener('input', () => {
    filterAndRenderHubScripts();
});

const btnHubFavoritesFilter = $('#btn-hub-favorites-filter');
if (btnHubFavoritesFilter) {
    btnHubFavoritesFilter.addEventListener('click', () => {
        showFavoritesOnly = !showFavoritesOnly;
        btnHubFavoritesFilter.classList.toggle('active', showFavoritesOnly);
        btnHubFavoritesFilter.querySelector('i').className = showFavoritesOnly ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
        filterAndRenderHubScripts();
    });
}

btnHubRefresh.addEventListener('click', () => {
    hubScripts = [];
    fetchHubScripts();
});

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ════════════════════════════════════════════
// C# -> JS MESSAGE HANDLER
// ════════════════════════════════════════════
if (window.chrome && window.chrome.webview) {
    window.chrome.webview.addEventListener('message', event => {
        const msg = event.data;
        switch (msg.type) {
            case 'log': 
                const logWatcherEnabled = localStorage.getItem('setting-log-watcher') !== 'false';
                if (logWatcherEnabled || msg.level === 'system') {
                    appendLog(msg.message, msg.level);
                }
                break;
            case 'inject_status': updateStatus(msg.status, msg.text); break;
            case 'window_restored':
                const shellEl = $('.app-shell');
                if (shellEl) {
                    shellEl.classList.add('window-opening');
                    requestAnimationFrame(() => {
                        setTimeout(() => {
                            shellEl.classList.remove('window-opening');
                        }, 50);
                    });
                }
                break;
            case 'workspace_structure':
                workspaceStructure.scripts = msg.scripts || [];
                workspaceStructure.autoexec = msg.autoexec || [];
                workspaceStructure.workspace = msg.workspace || [];
                statScripts.textContent = workspaceStructure.scripts.length;
                renderWorkspaceFiles();
                break;
            case 'scripts_list':
                workspaceStructure.scripts = msg.files || [];
                statScripts.textContent = workspaceStructure.scripts.length;
                renderWorkspaceFiles();
                break;
            case 'file_opened':
                navigateTo('executor');
                setTimeout(() => {
                    const folder = msg.folder || 'scripts';
                    openTabForFile(msg.fileName, msg.content, msg.filePath);
                    appendLog(`Opened: ${folder}/${msg.fileName}`, 'success');

                    // If user clicked "Execute Script" from workspace context menu
                    if (autoExecuteNextOpenedFile) {
                        autoExecuteNextOpenedFile = false;
                        // wait tiny delay for model setting
                        setTimeout(() => {
                            if (activeTabId) {
                                const t = tabs.find(x => x.id === activeTabId);
                                if (t) {
                                    sendToCSharp('execute', { script: t.model.getValue() });
                                    appendLog(`Auto-executing workspace script: ${t.name}`, 'system');
                                }
                            }
                        }, 250);
                    }
                }, editor ? 0 : 800);
                break;
            case 'file_saved':
                const t = tabs.find(t => t.id === msg.tabId);
                if (t) {
                    t.filePath = msg.filePath; t.name = msg.fileName; t.isSaved = true;
                    renderTabs(); selectTab(t.id);
                    appendLog(`Saved: ${msg.fileName}`, 'success');
                }
                // Refresh list on save
                sendToCSharp('get_scripts');
                break;
            case 'error': appendLog(msg.message, 'error'); break;
        }
    });
}

// Play open window animation
const shell = $('.app-shell');
if (shell) {
    shell.classList.add('window-opening');
    requestAnimationFrame(() => {
        setTimeout(() => {
            shell.classList.remove('window-opening');
        }, 50);
    });
}

try {
    loadSettings();
} catch (e) {
    console.error('[Froggie] loadSettings error:', e);
}

try {
    navigateTo('home');
} catch (e) {
    console.error('[Froggie] navigateTo error:', e);
}

// ─── Hide Startup Loader Screen ───
function hideStartupLoader() {
    const loader = document.getElementById('startup-loader');
    if (loader) {
        loader.style.transition = 'opacity 0.4s';
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 500);
    }
    try { sendToCSharp('ui_ready'); } catch(e) {}
}

// Run immediately — DOM is already loaded since <script> is at the bottom of <body>
hideStartupLoader();
