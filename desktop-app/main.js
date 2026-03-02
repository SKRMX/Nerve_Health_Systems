const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1024,
        minHeight: 768,
        show: false, // Don't show until ready
        autoHideMenuBar: true, // Hides the default top menu for a cleaner app look
        icon: path.join(__dirname, 'icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            spellcheck: true
        }
    });

    // Load the web app URL directly
    mainWindow.loadURL('https://nervehealthsystems.com/app.html');

    // Once the page is loaded, show the window to avoid white flashing
    mainWindow.once('ready-to-show', () => {
        mainWindow.maximize(); // Start fully maximized
        mainWindow.show();
    });

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

// Remove default application menu
Menu.setApplicationMenu(null);

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});
