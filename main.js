const { app, session,BrowserWindow,Menu,dialog} = require('electron');
const apiserver = require("./ApiServer.js");


function createMenu(){
    let template = [
        {
            label: '工具',
            submenu: [{
                label: '重载',
                accelerator: 'CmdOrCtrl+R',
                click: function (item, focusedWindow) {
                    if (focusedWindow) {
                        if (focusedWindow.id === 1) {
                            BrowserWindow.getAllWindows().forEach(function (win) {
                                if (win.id > 1) {
                                    win.close()
                                }
                            })
                        }
                        focusedWindow.reload()
                    }
                }
            }, {
                label: '关闭',
                accelerator: 'CmdOrCtrl+W',
                role: 'close'
            }, {
                label: '切换开发者工具',
                accelerator: (function () {
                    if (process.platform === 'darwin') {
                        return 'Alt+Command+I'
                    } else {
                        return 'Ctrl+Shift+I'
                    }
                })(),
                click: function (item, focusedWindow) {
                    if (focusedWindow) {
                        focusedWindow.toggleDevTools()
                    }
                }
            }]
        },
        {
            label: '设置',
            submenu: [{
                label: '背景',
                click: function (item, focusedWindow) {
                    dialog.showMessageBox({
                        type:'info',
                        title: '修改背景颜色',
                        message: '我不会，建议打开开发者工具使用audiobot.changeBackgroundColor("#FFB6C1")',
                        buttons:['好','垃圾作者快爬']
                    })
                }
            }]
        },
    ];
    let menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

const bilibilifilter = {
    urls: ['https://*.bilibili.com/*',
        "https://*.bilivideo.com/*",
        "*://*.com/*bilivideo.com*",
        "https://api.live.bilibili.com/*"]
}

app.on('window-all-closed', function() {
    // 在 OS X 上，通常用户在明确地按下 Cmd + Q 之前
    // 应用会保持活动状态
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('ready', function() {
    // 创建浏览器窗口。
    var mainWindow = new BrowserWindow({width: 800, height: 600});
    createMenu();

    // 当 window 被关闭，这个事件会被发出
    mainWindow.on('closed', function() {
        // 取消引用 window 对象，如果你的应用支持多窗口的话，
        // 通常会把多个 window 对象存放在一个数组里面，
        // 但这次不是。
        mainWindow = null;

    });

    session.defaultSession.webRequest.onBeforeSendHeaders(bilibilifilter, (details, callback) => {
        details.requestHeaders['Referer'] = 'https://www.bilibili.com';
        //details.requestHeaders["origin"] = "https://www.bilibili.com";
        callback({ requestHeaders: details.requestHeaders });
    });

    // 加载应用的 index.html
    mainWindow.loadFile('index.html',{userAgent:"BilibiliClient/2.33.3",httpReferrer:"https://www.bilibili.com"});

});


