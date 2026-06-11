const { app, BrowserWindow, shell, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const path = require('path');
const fs = require('fs');

// ── Logger ────────────────────────────────────────────────────────────────────
// Logs gravados em %APPDATA%\battlestar-popnime\logs\main.log
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

const isDev = !app.isPackaged;
const gameDir = isDev
  ? path.join(__dirname, '..')
  : path.join(__dirname, 'game');

let mainWindow;

// Helper: envia IPC apenas se a janela ainda existe
function send(channel, ...args) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, ...args);
  }
}

// ── Listeners do updater registrados uma única vez ────────────────────────────
autoUpdater.on('update-available', (info) => {
  log.info('[Updater] Update disponível:', info.version);
  send('update-available', info);
});

autoUpdater.on('download-progress', (progress) => {
  send('download-progress', progress);
});

autoUpdater.on('update-downloaded', (info) => {
  log.info('[Updater] Update baixado:', info.version);
  send('update-downloaded');
});

autoUpdater.on('update-not-available', (info) => {
  log.info('[Updater] Já na versão mais recente:', info.version);
});

autoUpdater.on('error', (err) => {
  log.error('[Updater] Erro:', err.message);
});

// ── IPC: usuário clicou em "Reiniciar agora" ──────────────────────────────────
ipcMain.once('install-update', () => autoUpdater.quitAndInstall());

// ── Check com tratamento de erro e retry periódico ────────────────────────────
function runUpdateCheck() {
  if (isDev) return;
  autoUpdater.checkForUpdates().catch(err => log.error('[Updater] checkForUpdates falhou:', err.message));
}

// ── App ───────────────────────────────────────────────────────────────────────
function injectSecrets() {
  if (!isDev) return;
  const secretsPath = path.join(__dirname, 'secrets.json');
  if (!fs.existsSync(secretsPath)) return;
  try {
    const { SUPABASE_URL, SUPABASE_ANON_KEY } = JSON.parse(fs.readFileSync(secretsPath, 'utf8'));
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
    const configPath = path.join(gameDir, 'data', 'online_config.js');
    fs.writeFileSync(configPath,
      `const SUPABASE_URL = "${SUPABASE_URL}";\nconst SUPABASE_ANON_KEY = "${SUPABASE_ANON_KEY}";\n`,
      'utf8'
    );
  } catch (e) {
    log.error('[Secrets] Falha ao injetar credenciais:', e.message);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    title: 'Battlestar Popnime',
    icon: path.join(gameDir, 'assets', 'logo.jpg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    autoHideMenuBar: true,
  });

  mainWindow.loadFile(path.join(gameDir, 'index.html'));

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
  injectSecrets();
  createWindow();

  // Aguarda a janela carregar antes do primeiro check para garantir que os
  // listeners IPC do renderer já estejam registrados
  mainWindow.webContents.once('did-finish-load', () => {
    runUpdateCheck();
    setInterval(runUpdateCheck, 30 * 60 * 1000); // re-verifica a cada 30 min
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
