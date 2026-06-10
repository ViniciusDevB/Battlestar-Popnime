const { app, BrowserWindow, shell, dialog, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');

const isDev = !app.isPackaged;
const gameDir = isDev
  ? path.join(__dirname, '..')
  : path.join(__dirname, 'game');

let mainWindow;

function injectSecrets() {
  if (!isDev) return; // Em produção as credenciais já estão no bundle
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
    console.error('[Secrets] Falha ao injetar credenciais:', e.message);
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
  checkForUpdates();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

function checkForUpdates() {
  if (isDev) return;

  autoUpdater.checkForUpdates();

  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('update-available', info);
  });

  autoUpdater.on('download-progress', (progress) => {
    mainWindow.webContents.send('download-progress', progress);
  });

  autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update-downloaded');
  });

  ipcMain.on('install-update', () => {
    autoUpdater.quitAndInstall();
  });
}
