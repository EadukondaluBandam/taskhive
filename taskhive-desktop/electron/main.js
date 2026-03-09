import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain } from 'electron'
import activeWin from 'active-win'
import db, { insertLog } from './database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const preloadPath = path.join(__dirname, 'preload.js')
const API_BASE_URL = process.env.TASKHIVE_API_URL || 'http://localhost:4000/api/v1'

function resolveFaviconPath() {
  const candidates = [
    path.join(__dirname, '../../public/favicon.ico'),
    path.join(__dirname, '../public/favicon.ico'),
    path.join(process.cwd(), 'public/favicon.ico')
  ]

  return candidates.find((iconPath) => fs.existsSync(iconPath)) || null
}

const faviconPath = resolveFaviconPath()

let mainWindow = null
let widgetWindow = null
let tray = null
let isQuitting = false
let lastApp = null
let lastWebsite = null
let lastStart = Date.now()
let widgetTimer = null
let isLoggedIn = false
let timerRunning = false
let timerStartedAt = null
let elapsedSeconds = 0
let widgetExpanded = false
let authAccessToken = null
let loggedInUser = null

function formatDuration(seconds) {
  const total = Math.max(0, seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function getTrackingStatus() {
  if (!lastApp) {
    return {
      app: 'Waiting for activity...',
      site: 'No active website',
      duration: '0s'
    }
  }

  return {
    app: lastApp,
    site: lastWebsite || 'Desktop app',
    duration: formatDuration(Math.floor((Date.now() - lastStart) / 1000))
  }
}

function getElapsedSeconds() {
  if (!timerRunning || !timerStartedAt) return elapsedSeconds
  return elapsedSeconds + Math.floor((Date.now() - timerStartedAt) / 1000)
}

function getWidgetState() {
  const tracking = getTrackingStatus()
  return {
    loggedIn: isLoggedIn,
    user: loggedInUser ? { email: loggedInUser.email, role: loggedInUser.role } : null,
    running: timerRunning,
    elapsed: formatDuration(getElapsedSeconds()),
    app: tracking.app,
    site: tracking.site,
    trackingFor: tracking.duration
  }
}

function buildAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' }
  if (authAccessToken) headers.Authorization = `Bearer ${authAccessToken}`
  return headers
}

async function loginAgainstBackend(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })

  let payload = null
  try {
    payload = await response.json()
  } catch (_err) {
    payload = null
  }

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || 'Authentication failed')
  }

  const accessToken = payload?.data?.accessToken || null
  const user = payload?.data?.user || null
  if (!accessToken || !user) {
    throw new Error('Invalid authentication response from backend')
  }

  authAccessToken = accessToken
  loggedInUser = user
  isLoggedIn = true
}

async function logoutFromBackend() {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: buildAuthHeaders()
    })
  } catch (_err) {
    // Local logout still proceeds even if backend logout fails.
  }
}

function updateWidgetStatus() {
  if (!widgetWindow || widgetWindow.isDestroyed()) return
  widgetWindow.webContents.send('taskhive:widget-state', getWidgetState())
}

function flushCurrentActivity(endTime = Date.now()) {
  if (!lastApp) return
  const duration = Math.floor((endTime - lastStart) / 1000)
  if (duration < 3) return

  insertLog(
    lastApp,
    lastWebsite,
    new Date(lastStart).toISOString(),
    new Date(endTime).toISOString(),
    duration
  )
  console.log('SAVED:', lastApp, lastWebsite, `(${duration}s)`)
}

async function trackActivity() {
  if (!isLoggedIn || !timerRunning) return

  const win = await activeWin()
  if (!win) return

  const appName = win.owner.name
  const title = win.title || ''

  let website = null

  const isBrowser = (
    appName.toLowerCase().includes('edge') ||
    appName.toLowerCase().includes('chrome') ||
    appName.toLowerCase().includes('firefox')
  )

  if (isBrowser) {
    let clean = title
      .replace(/ - Microsoft Edge| â€“ Microsoft Edge| - Google Chrome| â€“ Google Chrome| - Personal| â€“ Personal/i, '')
      .trim()

    const lower = clean.toLowerCase()

    // Strict matching rules (Outlook > Gmail > others)
    if (lower.includes('outlook') || lower.includes('office.com')) {
      website = 'outlook.office.com'
    } 
    else if ((lower.includes('mail.google.com') || lower.includes('gmail')) && lower.includes('inbox')) {
      website = 'mail.google.com'
    } 
    else if (lower.includes('github')) {
      website = 'github.com'
    } 
    else if (lower.includes('chatgpt')) {
      website = 'chatgpt.com'
    } 
    else if (lower.includes('gemini') || lower.includes('google ai')) {
      website = 'gemini.google.com'
    } 
    else if (lower.includes('youtube')) {
      website = 'youtube.com'
    } 
    else if (lower.includes('jira') || lower.includes('atlassian')) {
      website = 'jira.atlassian.com'
    } 
    else if (lower.includes('google')) {
      website = 'google.com'
    } 
    else if (clean.includes('.') && !clean.includes('â€“')) {
      website = clean
    }
  }

  console.log('ACTIVE:', appName, '| TITLE:', `"${title.substring(0, 60)}${title.length > 60 ? '...' : ''}"`, '| SITE:', website)

  const appChanged = lastApp !== appName
  const siteChanged = isBrowser && website !== lastWebsite && lastWebsite !== null

  if (appChanged || siteChanged) {
    const now = Date.now()

    flushCurrentActivity(now)

    lastApp = appName
    lastWebsite = website
    lastStart = now
  }

  updateWidgetStatus()
}

function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'TaskHive Desktop',
    width: 1200,
    height: 800,
    show: false,
    icon: faviconPath,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.loadURL('http://localhost:8080')
  mainWindow.once('ready-to-show', () => {
    // Start minimized so users see a taskbar icon without the large window.
    mainWindow.show()
    mainWindow.minimize()
  })

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      mainWindow.hide()
    }
  })

  // Keep tracking running in the background from startup.
  setInterval(trackActivity, 3000)
}

function createWidget() {
  widgetWindow = new BrowserWindow({
    width: 50,
    height: 50,
    x: 20,
    y: 20,
    frame: false,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    movable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    transparent: true,
    hasShadow: false,
    icon: faviconPath || undefined,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  widgetWindow.setAlwaysOnTop(true, 'screen-saver')
  widgetWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  let iconUrl = ''
  if (faviconPath) {
    try {
      const icoBuffer = fs.readFileSync(faviconPath)
      iconUrl = `data:image/x-icon;base64,${icoBuffer.toString('base64')}`
    } catch (_error) {
      iconUrl = ''
    }
  }

  const widgetHtml = `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>TaskHive Timer Widget</title>
      <style>
        body {
          margin: 0;
          font-family: "Segoe UI", Tahoma, sans-serif;
          overflow: hidden;
          background: transparent;
        }
        .icon {
          width: 50px;
          height: 50px;
          margin: 0;
          padding: 0;
          border: 0;
          border-radius: 0;
          cursor: pointer;
          background: transparent;
          box-shadow: none;
          overflow: hidden;
          line-height: 0;
          position: relative;
          -webkit-app-region: no-drag;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .icon img {
          width: 100%;
          height: 100%;
          border-radius: 0;
          object-fit: cover;
          display: block;
        }
        .icon .dot {
          position: absolute;
          right: 2px;
          bottom: 2px;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          border: 2px solid rgba(17, 24, 39, 0.95);
          background: #ef4444;
        }
        .dot.running {
          background: #22c55e;
        }
        .panel {
          position: absolute;
          top: 52px;
          left: 4px;
          width: 300px;
          background: rgba(18, 24, 32, 0.97);
          color: #e7edf7;
          border: 1px solid #324152;
          border-radius: 12px;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.45);
          padding: 12px;
          display: none;
        }
        .panel.show {
          display: block;
        }
        .row {
          margin-bottom: 8px;
        }
        .label {
          font-size: 11px;
          color: #90a5ba;
          margin-bottom: 3px;
        }
        .value {
          font-size: 13px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        input {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #445569;
          background: #121a24;
          color: #f1f5f9;
          border-radius: 8px;
          padding: 8px 9px;
          margin-bottom: 8px;
          outline: none;
        }
        .actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        button {
          border: 0;
          border-radius: 8px;
          padding: 7px 10px;
          color: #eaf3fb;
          cursor: pointer;
          background: #334155;
        }
        .primary {
          background: #0284c7;
        }
        .danger {
          background: #b91c1c;
        }
        .muted {
          color: #90a5ba;
          font-size: 11px;
        }
        .panel-close {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 24px;
          height: 24px;
          border: 0;
          border-radius: 6px;
          color: #d7e0ea;
          background: #334155;
          cursor: pointer;
          line-height: 24px;
          text-align: center;
          padding: 0;
        }
      </style>
    </head>
    <body>
      <button id="ws-icon" class="icon" title="Open timer">
        ${iconUrl ? '<img alt="" src="' + iconUrl + '" />' : ''}
        <div id="ws-dot" class="dot"></div>
      </button>

      <div id="ws-panel" class="panel">
        <button id="ws-close-panel" class="panel-close" title="Close">X</button>
        <div id="ws-login-section">
          <div class="row">
            <div class="label">Login</div>
            <input id="ws-email" placeholder="Email" />
            <input id="ws-password" type="password" placeholder="Password" />
            <div id="ws-error" class="muted" style="color:#fca5a5;min-height:16px;"></div>
            <div class="actions">
              <button id="ws-login-btn" class="primary">Login</button>
            </div>
            <div class="muted">Timer starts only after login and pressing Start.</div>
          </div>
        </div>

        <div id="ws-control-section" style="display:none;">
          <div class="row">
            <div class="label">Timer</div>
            <div id="ws-elapsed" class="value">0s</div>
          </div>
          <div class="row">
            <div class="label">App</div>
            <div id="ws-app" class="value">Waiting for activity...</div>
          </div>
          <div class="row">
            <div class="label">Website</div>
            <div id="ws-site" class="value">No active website</div>
          </div>
          <div class="actions">
            <button id="ws-start-stop" class="primary">Start</button>
            <button id="ws-open-main">Open App</button>
            <button id="ws-logout" class="danger">Logout</button>
          </div>
        </div>
      </div>

      <script>
        const api = window.TaskHiveDesktop
        const iconBtn = document.getElementById('ws-icon')
        const panel = document.getElementById('ws-panel')
        const dot = document.getElementById('ws-dot')
        const loginSection = document.getElementById('ws-login-section')
        const controlSection = document.getElementById('ws-control-section')
        const startStopBtn = document.getElementById('ws-start-stop')
        const errorBox = document.getElementById('ws-error')
        let dragData = null

        iconBtn.addEventListener('click', () => api.iconClick())
        iconBtn.addEventListener('mousedown', (event) => {
          if (event.button !== 0) return
          dragData = { startX: event.screenX, startY: event.screenY, active: true }
        })
        window.addEventListener('mousemove', (event) => {
          if (!dragData || !dragData.active) return
          const dx = event.screenX - dragData.startX
          const dy = event.screenY - dragData.startY
          if (dx !== 0 || dy !== 0) {
            api.dragWidget({ dx, dy })
            dragData.startX = event.screenX
            dragData.startY = event.screenY
          }
        })
        window.addEventListener('mouseup', () => {
          if (dragData) dragData.active = false
        })
        document.getElementById('ws-login-btn').addEventListener('click', async () => {
          errorBox.textContent = ''
          const email = document.getElementById('ws-email').value
          const password = document.getElementById('ws-password').value
          const result = await api.login({ email, password })
          if (!result?.success) {
            errorBox.textContent = result?.message || 'Login failed'
          }
        })
        startStopBtn.addEventListener('click', () => api.toggleTimer())
        document.getElementById('ws-logout').addEventListener('click', () => api.logout())
        document.getElementById('ws-open-main').addEventListener('click', () => api.openMain())
        document.getElementById('ws-close-panel').addEventListener('click', () => api.closeWidget())

        api.onWidgetLayout((payload) => {
          panel.classList.toggle('show', payload.expanded)
        })

        api.onWidgetState((state) => {
          if (state.loggedIn) errorBox.textContent = ''
          loginSection.style.display = state.loggedIn ? 'none' : 'block'
          controlSection.style.display = state.loggedIn ? 'block' : 'none'
          dot.classList.toggle('running', state.running)
          startStopBtn.textContent = state.running ? 'Stop' : 'Start'
          document.getElementById('ws-elapsed').textContent = state.elapsed
          document.getElementById('ws-app').textContent = state.app
          document.getElementById('ws-site').textContent = state.site
        })
      </script>
    </body>
  </html>
  `

  widgetWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(widgetHtml)}`)
  widgetWindow.once('ready-to-show', updateWidgetStatus)

  if (widgetTimer) clearInterval(widgetTimer)
  widgetTimer = setInterval(updateWidgetStatus, 1000)
}

function setWidgetExpanded(expanded) {
  if (!widgetWindow || widgetWindow.isDestroyed()) return
  widgetExpanded = expanded
  const bounds = widgetWindow.getBounds()
  const nextWidth = expanded ? 320 : 50
  const nextHeight = expanded ? 390 : 50
  widgetWindow.setBounds({ x: bounds.x, y: bounds.y, width: nextWidth, height: nextHeight })
  widgetWindow.webContents.send('taskhive:widget-layout', { expanded: widgetExpanded })
}

function showMainWindow() {
  if (!mainWindow) return
  mainWindow.show()
  mainWindow.focus()
}

function createTray() {
  if (!faviconPath) {
    console.warn('Tray icon not found: favicon.ico')
    return
  }

  const trayIcon = nativeImage.createFromPath(faviconPath)
  const fallbackIcon = nativeImage.createFromPath(process.execPath)
  tray = new Tray(trayIcon.isEmpty() ? fallbackIcon : trayIcon)
  tray.setToolTip('TaskHive Desktop')
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Open', click: showMainWindow },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true
        app.quit()
      }
    }
  ]))

  tray.on('click', showMainWindow)
}

app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('TaskHive')
  }

  db
  createWindow()
  createWidget()
  createTray()
})

ipcMain.handle('taskhive:toggle-widget', () => {
  setWidgetExpanded(!widgetExpanded)
  return { success: true }
})

ipcMain.handle('taskhive:close-widget', () => {
  setWidgetExpanded(false)
  return { success: true }
})

ipcMain.handle('taskhive:icon-click', () => {
  if (widgetExpanded) {
    setWidgetExpanded(false)
    return { success: true }
  }
  setWidgetExpanded(true)
  return { success: true }
})

ipcMain.handle('taskhive:drag-widget', (_event, payload) => {
  if (!widgetWindow || widgetWindow.isDestroyed()) return { success: false }
  const dx = Number(payload?.dx || 0)
  const dy = Number(payload?.dy || 0)
  const bounds = widgetWindow.getBounds()
  widgetWindow.setPosition(bounds.x + dx, bounds.y + dy)
  return { success: true }
})

ipcMain.handle('taskhive:open-main', () => {
  showMainWindow()
  return { success: true }
})

ipcMain.handle('taskhive:login', async (_event, payload) => {
  const email = String(payload?.email || '').trim()
  const password = String(payload?.password || '')
  if (!email || !password) {
    return { success: false, message: 'Email and password are required' }
  }

  try {
    await loginAgainstBackend(email, password)
    updateWidgetStatus()
    return { success: true, message: 'Login successful' }
  } catch (error) {
    return { success: false, message: error?.message || 'Login failed' }
  }
})

ipcMain.handle('taskhive:logout', async () => {
  await logoutFromBackend()
  authAccessToken = null
  loggedInUser = null

  if (timerRunning) {
    flushCurrentActivity(Date.now())
    elapsedSeconds = getElapsedSeconds()
  }
  timerRunning = false
  timerStartedAt = null
  isLoggedIn = false
  lastApp = null
  lastWebsite = null
  lastStart = Date.now()
  updateWidgetStatus()
  return { success: true }
})

ipcMain.handle('taskhive:toggle-timer', () => {
  if (!isLoggedIn) return { success: false, message: 'Not authenticated' }

  if (!timerRunning) {
    timerRunning = true
    timerStartedAt = Date.now()
    lastApp = null
    lastWebsite = null
    lastStart = Date.now()
  } else {
    flushCurrentActivity(Date.now())
    elapsedSeconds = getElapsedSeconds()
    timerRunning = false
    timerStartedAt = null
    lastApp = null
    lastWebsite = null
    lastStart = Date.now()
  }

  updateWidgetStatus()
  return { success: true }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' && isQuitting) {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
    createWidget()
  }
})


