const http = require("http");
const fs = require('fs');
const url = require('url');
const {playlist_detail, cloudsearch, album, song_url} = require('NeteaseCloudMusicApi');
const match = require("@nondanee/unblockneteasemusic")
const loglevel = 2;

var apiserver = http.createServer();

function httpLog(msg, level) {
    if (level >= loglevel) {
        console.log(msg);
    }
}

function getType(endTag) {
    var type = null;
    switch (endTag) {
        case 'html':
        case 'htm':
            type = 'text/html; charset=UTF-8';
            break;
        case 'js':
            type = 'application/javascript; charset="UTF-8"';
            break;
        case 'css':
            type = 'text/css; charset="UTF-8"';
            break;
        case 'txt':
            type = 'text/plain; charset="UTF-8"';
            break;
        case 'manifest':
            type = 'text/cache-manifest; charset="UTF-8"';
            break;
        default:
            type = 'application/octet-stream';
            break;
    }
    return type;
}

apiserver.on("request", async function (req, resp) {
    resp.setHeader("Content-Type", "application/json; charset:utf-8");

    // cors config
    resp.setHeader("Access-Control-Allow-Credentials",true);
    resp.setHeader('Access-Control-Allow-Origin',req.headers.origin || '*')
    resp.setHeader('Access-Control-Allow-Headers','X-Requested-With,Content-Type');
    resp.setHeader('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS');
    // end cors config

    var urlparsed = url.parse(req.url, true);
    switch (urlparsed.pathname) {
        case "/netease/playlist/detail": {
            httpLog("playlist api: receive request", 1);
            var pid = urlparsed.query.pid;
            if (typeof (pid) !== "undefined") {
                try {
                    var result = await playlist_detail({
                        id: pid,
                    })
                    httpLog("playlist api: sending response", 2);
                    resp.end(JSON.stringify(result.body));
                } catch (err) {
                    httpLog("playlist api: internal error", 2);
                    httpLog(err, 0);
                    resp.end(JSON.stringify(err.body))
                }
            } else {
                httpLog("playlist api: playlist id not exists", 2)
                resp.end(JSON.stringify({"code": -1, "msg": "playlist id not exists"}))
            }
            break;
        }
        case "/netease/audio/match": {
            httpLog("audio api: receive request", 1);
            var id = urlparsed.query.id;
            if (typeof (id) !== "undefined") {
                try {
                    var result = await match(id, ['qq', "kuwo", "kugou", 'migu']);
                    httpLog("audio api: sending response", 2);
                    resp.end(JSON.stringify({"code": 200, "data": result}));
                } catch (err) {
                    httpLog("audio api: internal error", 2);
                    httpLog(err, 0);
                    resp.end(JSON.stringify({"code": 404, "msg": "may not be a good id"}));
                }
            } else {
                httpLog("audio api: id not exists", 2)
                resp.end(JSON.stringify({"code": -1, "msg": "id not exists"}))
            }
            break;
        }
        case "/netease/search": {
            try {
                resp.end(JSON.stringify((await cloudsearch({
                    keywords: urlparsed.query.keywords,
                })).body));
            } catch (err) {
                resp.end(JSON.stringify(err.body))
            }
            break;
        }
        case "/netease/album": {
            try {
                resp.end(JSON.stringify((await album({
                    id: urlparsed.query.id,
                })).body));
            } catch (err) {
                resp.end(JSON.stringify(err.body))
            }
            break;
        }
        case "/netease/audio/url": {
            try {
                resp.end(JSON.stringify((await song_url({
                    id: urlparsed.query.id,
                })).body));
            } catch (err) {
                resp.end(JSON.stringify(err.body))
            }
            break;
        }
        default: {
            try {
                var filename = urlparsed.pathname.substring(1);
                var type = getType(filename.substring(filename.lastIndexOf('.') + 1));
                httpLog('default process, ' + filename,2)
                fs.readFile(filename, function (err, content) {
                    if (err) {
                        resp.statusCode = 404;
                        resp.setHeader("Content-Type", "text/plain; charset=utf-8")
                        resp.end(err.message);
                    } else {
                        resp.setHeader("Content-Type", type);
                        resp.end(content);
                    }
                });
            } catch (err) {
                resp.statusCode = 404;
                resp.setHeader("Content-Type", "text/plain; charset=utf-8")
                resp.end("");
            }
            break;
        }
    }
});
apiserver.listen(8050);