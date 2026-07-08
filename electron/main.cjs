const { app, BrowserWindow, Menu, shell, globalShortcut, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// The production live URL for KiotX
const LIVE_URL = 'https://ais-pre-n6gkpixewdlwl2vgnw2ab6-202499924698.asia-east1.run.app';
const DEV_URL = 'http://localhost:3000';

// Config file path for persistent window bounds and preferences
const configPath = path.join(app.getPath('userData'), 'window-config.json');

function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (err) {
    console.error('Error loading config:', err);
  }
  return { width: 1280, height: 800, maximized: false };
}

function saveConfig(config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving config:', err);
  }
}

function createWindow() {
  const config = loadConfig();

  mainWindow = new BrowserWindow({
    width: config.width,
    height: config.height,
    minWidth: 1000,
    minHeight: 650,
    title: 'KiotX Desktop',
    // Elegant frame and layout options
    backgroundColor: '#1c1917', // Match stone-900 theme
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    }
  });

  if (config.maximized) {
    mainWindow.maximize();
  }

  // Determine target URL
  const targetUrl = isDev ? DEV_URL : LIVE_URL;

  // Load the web app
  mainWindow.loadURL(targetUrl);

  // Show window when ready to prevent flickering
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Track size/position changes
  const saveBounds = () => {
    if (!mainWindow.isDestroyed() && !mainWindow.isMaximized() && !mainWindow.isMinimized()) {
      const bounds = mainWindow.getBounds();
      saveConfig({
        width: bounds.width,
        height: bounds.height,
        maximized: false
      });
    }
  };

  mainWindow.on('resize', saveBounds);
  mainWindow.on('move', saveBounds);
  mainWindow.on('maximize', () => {
    saveConfig({ ...loadConfig(), maximized: true });
  });
  mainWindow.on('unmaximize', () => {
    saveConfig({ ...loadConfig(), maximized: false });
  });

  // Handle errors or offline state
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.warn(`Failed to load: ${errorCode} - ${errorDescription} at ${validatedURL}`);
    
    // Don't trigger error page for internal assets or favicon
    if (validatedURL.includes('favicon.ico') || !mainWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Không thể kết nối KiotX</title>
        <style>
          body {
            background-color: #1c1917;
            color: #f5f5f4;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            padding: 24px;
            text-align: center;
          }
          .card {
            background-color: #292524;
            border: 1px solid #44403c;
            border-radius: 16px;
            padding: 32px;
            max-width: 480px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
          }
          h1 {
            font-size: 20px;
            margin-top: 0;
            margin-bottom: 12px;
            color: #fca5a5;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          p {
            font-size: 14px;
            color: #a8a29e;
            line-height: 1.6;
            margin-bottom: 24px;
          }
          .button-group {
            display: flex;
            gap: 12px;
            justify-content: center;
          }
          button {
            background-color: #e7e5e4;
            color: #1c1917;
            border: none;
            padding: 10px 20px;
            font-weight: bold;
            font-size: 13px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
            text-transform: uppercase;
          }
          button:hover {
            background-color: #ffffff;
            transform: translateY(-1px);
          }
          button.secondary {
            background-color: #44403c;
            color: #e7e5e4;
            border: 1px solid #57534e;
          }
          button.secondary:hover {
            background-color: #57534e;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Mất Kết Nối Máy Chủ 📡</h1>
          <p>Không thể tải dữ liệu KiotX. Vui lòng kiểm tra lại kết nối mạng Internet hoặc máy chủ của bạn và thử lại.</p>
          <div class="button-group">
            <button onclick="window.location.reload()">Thử Lại Ngay</button>
            <button class="secondary" onclick="window.location.href='${DEV_URL}'">Dùng Local (Cổng 3000)</button>
          </div>
        </div>
      </body>
      </html>
    `;
    
    mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));
  });

  // Intercept navigation to open external links in the default web browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(targetUrl) && !url.startsWith('data:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(targetUrl) && !url.startsWith('data:')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createApplicationMenu() {
  const template = [
    {
      label: 'Hệ Thống',
      submenu: [
        {
          label: 'Màn Hình Chính',
          accelerator: 'CmdOrCtrl+H',
          click: () => {
            const targetUrl = isDev ? DEV_URL : LIVE_URL;
            mainWindow.loadURL(targetUrl);
          }
        },
        {
          label: 'Tải Lại 🔄',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow && mainWindow.reload()
        },
        { type: 'separator' },
        {
          label: 'Thông Tin KiotX Desktop',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'KiotX Desktop',
              message: 'Hệ Thống Quản Lý Bán Hàng KiotX',
              detail: 'Phiên bản chuyên nghiệp chạy giả lập Desktop cho Windows & macOS.\n\nHỗ trợ hoàn hảo cho việc in ấn hóa đơn, quản lý kho hàng, đồng bộ hóa đám mây PostgreSQL tự động.',
              buttons: ['Đồng Ý']
            });
          }
        },
        { type: 'separator' },
        { role: 'quit', label: 'Thoát Ứng Dụng' }
      ]
    },
    {
      label: 'Chỉnh Sửa',
      submenu: [
        { role: 'undo', label: 'Hoàn tác' },
        { role: 'redo', label: 'Làm lại' },
        { type: 'separator' },
        { role: 'cut', label: 'Cắt' },
        { role: 'copy', label: 'Sao chép' },
        { role: 'paste', label: 'Dán' },
        { role: 'selectAll', label: 'Chọn tất cả' }
      ]
    },
    {
      label: 'Hiển Thị',
      submenu: [
        { role: 'togglefullscreen', label: 'Toàn màn hình' },
        { role: 'zoomIn', label: 'Phóng to' },
        { role: 'zoomOut', label: 'Thu nhỏ' },
        { role: 'resetZoom', label: 'Đặt lại cỡ chữ' },
        { type: 'separator' },
        {
          label: 'Bật/Tắt DevTools (F12)',
          accelerator: 'F12',
          click: () => {
            if (mainWindow) mainWindow.webContents.toggleDevTools();
          }
        }
      ]
    },
    {
      label: 'Trợ Giúp',
      submenu: [
        {
          label: 'Tài Liệu Hướng Dẫn',
          click: () => shell.openExternal('https://ai.studio/build')
        },
        {
          label: 'Báo Cáo Sự Cố',
          click: () => shell.openExternal('mailto:congbaotruong8@gmail.com')
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createWindow();
  createApplicationMenu();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
