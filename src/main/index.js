import { app, BrowserWindow, Menu } from 'electron'
import * as path from 'path'
import { remote } from 'electron'
import { dialog } from 'electron' 
import { format as formatUrl } from 'url'
import settings from 'electron-settings'

'use strict'

const isDevelopment = process.env.NODE_ENV !== 'production'

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow

function createMainWindow() {
  const window = new BrowserWindow({webPreferences: {nodeIntegration: true}})


      // change default menu
  const menuTemplate = [
    {
      label: "Settings",
      submenu: [
        {
          label: 'Set Folder Path',
          click: () => {
            // something
            openFolder();
          }
        }
      ]
    },
    {
      label: "Help",
      submenu:[
        {
          label: "Documentation",
          click: () =>{
            // something
          }
        },
        {
          label: "About",
          click: () => {
            // something
          }
        },
        {
          label: "Open DevTools",
          click: () => {
            window.webContents.openDevTools()
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  if (isDevelopment) {
    window.webContents.openDevTools()
  }

  if (isDevelopment) {
    window.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`)
  }
  else {
    window.loadURL(formatUrl({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file',
      slashes: true
    }))
  }

  window.on('closed', () => {
    mainWindow = null
  })

  window.webContents.on('devtools-opened', () => {
    window.focus()
    setImmediate(() => {
      window.focus()
    })
  })

  return window
}

// quit application when all windows are closed
app.on('window-all-closed', () => {
  // on macOS it is common for applications to stay open until the user explicitly quits
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // on macOS it is common to re-create a window even after all windows have been closed
  if (mainWindow === null) {
    mainWindow = createMainWindow()
  }
})

// create main BrowserWindow when electron is ready
app.on('ready', () => {
  mainWindow = createMainWindow()
})

function openFolder(){
    dialog.showOpenDialog(mainWindow, 
      {
          properties: ['openDirectory']
      }, 
        paths => respondWithPath(paths)
    )
}

function respondWithPath(paths) {
    settings.set('kbfolder', {
      path: paths,
    });
    mainWindow.reload();
}
