import * as electron from 'electron'
import path from 'node:path'

const { app, BrowserWindow, shell } = electron

// Safety: fallback if running in Node check usage
const isPackaged = app ? app.isPackaged : false

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let win: any | null
console.log('Main process starting...')

function createWindow() {
    console.log('Creating window...')
    if (!BrowserWindow) {
        console.error('BrowserWindow is undefined!')
        return;
    }
    win = new BrowserWindow({
        icon: path.join(process.env.VITE_PUBLIC || '', 'electron-vite.svg'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            webSecurity: false, // Fix CORS for Canvas/Replicate Images
        },
        titleBarStyle: 'hiddenInset',
        width: 1200,
        height: 800,
    })

    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', (new Date).toLocaleString())
    })

    if (process.env.VITE_DEV_SERVER_URL) {
        win.loadURL(process.env.VITE_DEV_SERVER_URL)
    } else {
        win.loadFile(path.join(process.env.DIST || '', 'index.html'))
    }
}

if (app) {
    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit()
            win = null
        }
    })

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })

    app.whenReady().then(createWindow)
}
