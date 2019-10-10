import { app, BrowserWindow, Menu, dialog, shell  } from 'electron'
import * as path from 'path' 
import { format as formatUrl } from 'url'
import settings from 'electron-settings'
import prompt from 'electron-prompt'


'use strict'

const isDevelopment = process.env.NODE_ENV !== 'production'

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow

function createMainWindow() {
  const window = new BrowserWindow({webPreferences: {nodeIntegration: true},  width: 1200, height: 600})


      // change default menu
  const menuTemplate = [
    {
      label: "New",
      submenu: [
        {
          label: 'Snippet',
          click: () => {
            // something
            shell.openExternal( settings.get('kbsnippetnewapi.new_url') );          
          }
        }
      ]
    },
    {
      label: "Settings",
      submenu: [
        {
          label: 'Set Folder Path',
          click: () => {
            // something
            openFolder();
          }
        },
        {
          label: 'Set All Snippets URL',
          click: () => {
            // something
            setApiLocation();
          }
        },
        {
          label: 'Set New Snippet URL',
          click: () => {
            // something
            setNewSnipetLocation();
          }
        },
        {
          label: 'Set Edit Snippet URL',
          click: () => {
            // something
            setEditSnipetLocation();
          }
        },
        {
          label: 'Set WP Username',
          click: () => {
            // something
            setWpUsername();
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

function setApiLocation(){
    let current_url = settings.get('kbsnippetapi.url')
    if(typeof current_url == 'undefined' || current_url == '' ){
      current_url = 'http://example.org/wp-json/wp/v2/kb/'
    }

    prompt({
      title: 'Set Snippets Url',
      label: 'URL:',
      value: current_url,
      inputAttrs: {
        type: 'url'
      }
    })
        .then((r) => {
          if(r === null) {
            console.log('user cancelled');
            settings.set('kbsnippetapi', {
              url: '',
            });
            mainWindow.reload();
          } else {
            console.log('result', r);
            settings.set('kbsnippetapi', {
              url: r,
            });
            mainWindow.reload();
          }
        })
        .catch(console.error);
}

function setNewSnipetLocation(){
  let current_new_url = settings.get('kbsnippetnewapi.new_url')
  if(typeof current_new_url == 'undefined' || current_new_url == '' ){
    current_new_url = 'http://example.org/wp-admin/post-new.php?post_type=kb'
  }

  prompt({
    title: 'Set New Snippets Url',
    label: 'URL:',
    value: current_new_url,
    inputAttrs: {
      type: 'url'
    }
  })
      .then((r) => {
        if(r === null) {
          console.log('user cancelled');
          settings.set('kbsnippetnewapi', {
            new_url: '',
          });
          mainWindow.reload();
        } else {
          console.log('result', r);
          settings.set('kbsnippetnewapi', {
            new_url: r,
          });
          mainWindow.reload();
        }
      })
      .catch(console.error);
}

function setEditSnipetLocation(){
  let current_url = settings.get('kbsnippeteditapi.url')
  if(typeof current_url == 'undefined' || current_url == '' ){
    current_url = 'http://example.org/wp-admin/post.php?action=edit&post='
  }

  prompt({
    title: 'Set Edit Snippet Url',
    label: 'URL:',
    value: current_url,
    inputAttrs: {
      type: 'url'
    }
  })
      .then((r) => {
        if(r === null) {
          console.log('user cancelled');
          settings.set('kbsnippeteditapi', {
            url: '',
          });
          mainWindow.reload();
        } else {
          console.log('result', r);
          settings.set('kbsnippeteditapi', {
            url: r,
          });
          mainWindow.reload();
        }
      })
      .catch(console.error);
}

function setWpUsername(){
  let current_username = settings.get('kbwpuser.username')
  if(typeof current_username == 'undefined' || current_username == '' ){
    current_username = 'admin'
  }

  prompt({
    title: 'Set WP Username',
    label: 'Username:',
    value: current_username,
    inputAttrs: {
      type: 'text'
    }
  })
      .then((r) => {
        if(r === null) {
          console.log('user cancelled');
          settings.set('kbwpuser', {
            username: '',
          });
          mainWindow.reload();
        } else {
          console.log('result', r);
          settings.set('kbwpuser', {
            username: r,
          });
          mainWindow.reload();
        }
      })
      .catch(console.error);
}

function respondWithPath(paths) {
    settings.set('kbfolder', {
      path: paths,
    });
    mainWindow.reload();
}
