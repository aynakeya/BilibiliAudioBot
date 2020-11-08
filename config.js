var myConfig = {
    // 房间号
    "room_id": null,
    // 是否自动开启
    "auto_create":false,
    // 闲置歌单
    "playlist":{
        // 网易云歌单id
        "netease":["582057519"],
        // bilibili歌单id
        "bilibil":[]
    },
    // 闲置歌单 单独加歌曲
    "song":{
        // 网易云歌曲id
        "netease":[],
        // bilibili au 号
        "bilibil":[]
    },
    // 黑名单
    "blacklist": {
        // 正则关键字
        "keywords":[],
        // 网易云id
        "netease":["561493928"],
        // bilibili au号
        "bilibili":[],
        // 用户uid
        "user":[]
    },
    // 背景
    "background":{
        "color":"#FFB6C1",
        "image":{
            "url":null,
            "repeat":"no-repeat",
            "size":"100%"
        }
    },
    // 点歌关键字
    "hintword":{
        // 网易云点歌关键字
        "netease":"点w歌",
        // bilibili点歌关键字
        "bilibili":"点b歌",
        // 切歌关键字
        "skip":"切歌",
    },
    // 切歌权限
    "skip":{
        //房管切歌
        "admin":true,
        // 舰长切歌
        "vip":true,
        // 自己切自己歌
        "default":true
    },
    // 点歌权限
    "privilege":{
        "admin":true,
        "vip":true,
        "default":true,
    },
    "player":{
        // 用户点歌具有优先权
        "priority":true,
        // 随机播放列表
        "random":true,
    },
    "fetchDanmu":true,
    "useNeteaseUnblock":true
}


var defaultConfig = {
    "room_id": null,
    "auto_create":false,
    "playlist":{
        "netease":[],
        "bilibil":[]
    },
    "song":{
        "netease":[],
        "bilibil":[]
    },
    "blacklist": {
        "keywords":[],
        "netease":[],
        "bilibili":[],
        "user":[]
    },
    "background":{
        "color":"#FFB6C1",
        "image":{
            "url":null,
            "repeat":"no-repeat",
            "size":"100%"
        }
    },
    "hintword":{
        "netease":"点w歌",
        "bilibili":"点b歌",
        "skip":"切歌",
    },
    "skip":{
        // 房管切歌
        "admin":true,
        // 舰长切歌
        "vip":true,
        // 自己切自己歌
        "default":true
    },
    // 点歌权限
    "privilege":{
        "admin":true,
        "vip":true,
        "default":true,
    },
    "player":{
        // 用户点歌具有优先权
        "priority":true,
        // 随机播放列表
        "random":true,
    },
    "fetchDanmu":true,
    "useNeteaseUnblock":false
}
