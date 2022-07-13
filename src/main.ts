import { app, BrowserWindow, systemPreferences } from 'electron'
import * as path from 'path'

let mainWindow: Electron.BrowserWindow

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1280,
    minWidth: 450,
    height: 800,
    minHeight: 300,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:8080')
  } else {
    mainWindow.loadFile(path.join(__dirname, 'index.html'))
  }
}

app.on('ready', async () => {
  if (process.platform === 'darwin') {
    await systemPreferences.askForMediaAccess('camera')
  }

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
