var audiobot = null;

function httpGet(url) {
    $.ajaxSetup({
        async: false,
        crossDomain: true,
        xhrFields: {
            withCredentials: true
        }
    });
    return $.get(url);
}

function httpPost(url,para) {
    $.ajaxSetup({
        async: false,
        crossDomain: true,
        xhrFields: {
            withCredentials: true
        }
    });
    return $.post(url, para);
}


function DamukuApi(rooomid) {
    this.roomId = rooomid;
    this.DamuApi = "https://api.live.bilibili.com/xlive/web-room/v1/dM/gethistory";
    this.latestDamuTime = 0;

    this.getNewestDamu = function () {
        var rs = httpPost(this.DamuApi, {"roomid": this.roomId});
        if (rs.status === 200) {
            var data = JSON.parse(rs.responseText);
            if (data["code"] === 0) {
                var rdata = [];
                for (var i = 0; i < data["data"]["room"].length; i++) {
                    if (parseInt(data["data"]["room"][i]["check_info"]["ts"]) <= this.latestDamuTime) {
                        continue;
                    }
                    rdata.push({
                        "sender": data["data"]["room"][i]["nickname"],
                        "text": data["data"]["room"][i]["text"],
                        "isadmin": data["data"]["room"][i]["isadmin"],
                        "guard_level": data["data"]["room"][i]["guard_level"],
                        "uid": data["data"]["room"][i]["uid"].toString()
                    });
                    this.latestDamuTime = parseInt(data["data"]["room"][i]["check_info"]["ts"]);
                }
                return rdata
            }
            return [];
        } else {
            return [];
        }
    }
}


// 无损需要accesskey, 且使用client api
function AudioBilibiliApi() {
    this.bAudioSearch = "https://api.bilibili.com/audio/music-service-c/s?page=1&pagesize=1&search_type=music&keyword=";
    this.bAudioInfo = "https://api.bilibili.com/audio/music-service-c/songs/playing?song_id=";
    this.bAudioUrl = "https://www.bilibili.com/audio/music-service-c/web/url?mid=8047632&privilege=2&quality=2&sid=";
    this.bAudioListInfo = "https://www.bilibili.com/audio/music-service-c/web/song/of-menu?ps=100&";

    this.getSid = function (url) {
        var au = /au[0-9]+/.exec(url);
        if (au === null) {
            return 0;
        } else {
            return au[0].substring(2);
        }
    };

    this.searchSid = function (keyword) {
        var rs = httpGet(this.bAudioSearch + keyword);
        if (rs === null || rs.status !== 200) {
            return 0;
        }
        var data = JSON.parse(rs.responseText);
        if (data["code"] !== 0 || data["data"]["result"].length === 0) {
            return 0;
        }
        return data["data"]["result"][0]["id"].toString();
    };

    this.getamid = function (url) {
        var au = /am[0-9]+/.exec(url);
        if (au === null) {
            return 0;
        } else {
            return au[0].substring(2);
        }
    };

    this.getInfo = function (sid) {
        var url = this.bAudioInfo + sid;
        var rs =httpGet(url);
        if (rs.status === 200) {
            var data = JSON.parse(rs.responseText);
            if (data["code"] === 0) {
                return {
                    "name": data["data"]["title"],
                    "up": data["data"]["up_name"],
                    "lyric": data["data"]["lyric_url"],
                    "cover": data["data"]["cover_url"]
                };
            }
            return null;
        } else {
            return null;
        }
    };

    this.getPlayUrl = function (sid) {
        var url = this.bAudioUrl + sid;
        var rs = httpGet(url);
        if (rs.status === 200) {
            var data = JSON.parse(rs.responseText);
            if (data["code"] === 0) {
                return {"cdns": data["data"]["cdns"]};
            }
            return null;
        } else {
            return null;
        }
    };

    this.getAudioList = function (amid) {
        var pn = 1;
        var aList = [];
        while (true) {
            var rs = httpGet(this.bAudioListInfo + "sid=" + amid + "&pn=" + pn);
            if (rs === null || rs.status !== 200) {
                break
            }
            var data = JSON.parse(rs.responseText);
            for (var i = 0; i < data["data"]["data"].length; i++) {
                aList.push(data["data"]["data"][i]["id"]);
            }
            if (data["data"]["pageCount"] === data["data"]["curPage"]) {
                break
            }
        }
        return aList;
    }
}

function AudioNeteaseApi(ab) {
    this.ab = ab;
    this.searchApi = "http://127.0.0.1:8050/netease/search?keywords=";
    this.lyricApi = "https://music.163.com/api/song/media?id=";
    this.albumApi = "http://127.0.0.1:8050/netease/album?id=";
    this.audioApi = "https://music.163.com/song/media/outer/url?id=";
    this.audiomatchApi = "http://127.0.0.1:8050/netease/audio/match?id=";
    this.audioApi1 = "http://127.0.0.1:8050/netease/audio/url?id=";
    this.audioListApi = "http://127.0.0.1:8050/netease/playlist/detail?pid=";

    this.getInfo = function (keyword) {
        // 是不是数字
        var sidflag = !isNaN(keyword);
        var info = {};
        info["sid"] = null;
        var rs = httpGet(this.searchApi + keyword);
        if (rs.status === 200) {
            var data = JSON.parse(rs.responseText);
            if (data["code"] === 200 && data["result"]["songCount"] > 0) {
                for (var i = 0; i < data["result"]["songs"].length; i++) {
                    if (this.ab.config.useNeteaseUnblock || (data["result"]["songs"][i]["fee"] === 0 || data["result"]["songs"][i]["fee"] === 8)) {
                        if (sidflag && data["result"]["songs"][i]["id"].toString() !== keyword){
                            continue;
                        }
                        info["sid"] = data["result"]["songs"][i]["id"].toString();
                        info["aid"] = data["result"]["songs"][i]["al"]["id"];
                        info["name"] = data["result"]["songs"][i]["name"];
                        break
                    }
                }
            } else {
                return null;
            }
        } else {
            return null;
        }
        if (info["sid"] === null) {
            return null;
        }
        rs = httpGet(this.lyricApi + info["sid"]);
        if (rs.status === 200) {
            var data = JSON.parse(rs.responseText);
            if (data["code"] === 200 && typeof (data["lyric"]) !== "undefined") {
                info["lyric"] = data["lyric"];
            } else {
                info["lyric"] = "";
            }
        }
        rs = httpGet(this.albumApi + info["aid"]);
        if (rs.status === 200) {
            var data = JSON.parse(rs.responseText);
            if (data["code"] === 200) {
                info["cover"] = data["album"]["picUrl"];
            } else {
                info["cover"] = "";
            }
        }
        // 链接检查
        rs = httpGet(this.audioApi1 + info["sid"]);
        // 如果有版权问题 404
        if (rs.status === 200) {
            var data = JSON.parse(rs.responseText);
            // 判断是不是版权限制或者vip 总之很混乱
            // id 错误
            if (data["code"] !== 200){
                return null;
            }
            // !== 200说明没有版权或者以及不能试听 || 有试听信息说明是vip歌曲
            if (data["data"][0]["code"] !== 200 || data["data"][0]["freeTrialInfo"] !== null){
                // 尝试使用match
                if (this.ab.config.useNeteaseUnblock){
                    rs = httpGet(this.audiomatchApi + info["sid"]);
                    if (rs.status === 200){
                        var tmpd = JSON.parse(rs.responseText);
                        if (tmpd["code"] === 200 && tmpd["data"]["url"] !== ""){
                            info["cdns"] = [tmpd["data"]["url"]]
                        }else{
                            return null;
                        }
                    }else{
                        return null;
                    }
                }else{
                    return null;
                }
            }else{
                info["cdns"] = [this.audioApi + info["sid"] + ".mp3"];
            }
            return info;
        }
        return null;
    };

    this.getAudioList = function (id) {
        var rs = httpGet(this.audioListApi + id);
        var aList = [];
        if (rs === null || rs.status !== 200) {
            return aList;
        }
        var data = JSON.parse(rs.responseText);
        if (data["code"] !== 200) {
            return aList;
        }
        for (var i = 0; i < data["playlist"]["trackIds"].length; i++) {
            aList.push(data["playlist"]["trackIds"][i]["id"]);
        }
        return aList;
    }
}

function DefaultPlayList(ab) {
    this.ab = ab;
    this.sList = [];
    this.index = 0;
    this.availableType = ["bilibili", "netease"];

    this.getNext = function () {
        if (this.sList.length === 0) {
            return null;
        }
        if (this.index === this.sList.length) {
            this.index = 0;
        }
        this.index += 1;
        return this.sList[this.index - 1];
    };

    this.getNextRandom = function(){
        if (this.sList.length === 0) {
            return null;
        }
        this.index = Math.floor(Math.random()*this.sList.length);
        return this.sList[this.index]
    };

    this.getByIndex = function (index) {
        if (this.index < 0 || this.index >= this.sList.length) {
            return null;
        }
        return this.sList[index];
    };

    this.addAudio = function (aType, aName) {
        this.sList.push({"type": aType, "name": aName})
    };

    this.addBilibiliList = function (url) {
        var amid = this.ab.audioApi.getamid(url);
        if (amid === 0) {
            return
        }
        var alist = this.ab.audioApi.getAudioList(amid);
        for (var i = 0; i < alist.length; i++) {
            this.addAudio("bilibili", "au" + alist[i]);
        }
    };

    this.addNeteaseList = function (id) {
        var alist = this.ab.audioNeteaseApi.getAudioList(id);
        for (var i = 0; i < alist.length; i++) {
            this.addAudio("netease", alist[i].toString());
        }
    };
}

// 种族歧视警告
function BlackListMananger() {
    this.keywordList = [];
    this.songidList = [];
    this.uidList = [];

    // 必须是正则表达式 /xxx/
    this.addKeyword = function (keyword) {
        this.keywordList.push(keyword);
    };

    // 没有返回false 有返回true
    this.checkKeyword = function (text) {
        for (var i = 0; i < this.keywordList.length; i++) {
            if (this.keywordList[i].test(text)) {
                return true;
            }
        }
        return false
    };

    // 没有返回false 有返回true
    this.checkSongId = function (type, id) {
        for (var i = 0; i < this.songidList.length; i++) {
            if (this.songidList[i]["type"] === type && this.songidList[i]["id"] === id) {
                return true;
            }
        }
        return false;
    };

    this.addSongId = function (atype, id) {
        this.songidList.push({"type": atype, "id": id});
    };

    this.addUID = function (uid) {
        this.uidList.push(uid);
    };

    this.checkUID = function (uid) {
        // 没有返回false 有返回true
        return this.uidList.indexOf(uid) !== -1;
    }
}

function bAudioBot(divId, roomId,config) {
    var self = this;
    this.ap = new APlayer({
        container: document.getElementById(divId),
        autoplay: true,
        showlrc: true,
        volume: 0.6
    });
    this.playerId = divId;
    this.config = config;
    this.audioApi = new AudioBilibiliApi();
    this.audioNeteaseApi = new AudioNeteaseApi(self);
    this.damukuApi = new DamukuApi(roomId);
    this.defaultPlayList = new DefaultPlayList(self);
    this.blacklist = new BlackListMananger();

    this.damukuApi.getNewestDamu();


    this.ap.on("ended", function () {
        self.removeFirst();
    });

    this.ap.on("listadd", function () {
        if (self.ap.audio.paused) {
            self.ap.play();
        }
    });

    // 如果你不想闲置歌单里的歌被顶掉的话就把这段注释掉.
    this.ap.on("listadd", function () {
        if (self.config.player.priority && self.ap.list.audios.length > 0 && self.ap.list.audios[0].artist === "System") {
            self.skipForward();
        }
    });


    this.ap.on("waiting", function () {
        while (self.ap.list.audios.length === 0 && self.defaultPlayList.sList.length >= 0) {
            var nextAudio = null;
            // 如果要随机闲置列表的话
            if (self.config.player.random){
                nextAudio = self.defaultPlayList.getNextRandom();
            }else{
                nextAudio = self.defaultPlayList.getNext();
            }
            //v
            if (nextAudio === null) {
                return;
            }
            if (nextAudio["type"] === "bilibili") {
                self.addBilibili(nextAudio["name"], "System");
            } else if (nextAudio["type"] === "netease") {
                self.addNetease(nextAudio["name"], "System");
            }
        }
    });

    // click listener
    // assume chrome excuse listeners in order
    this.ap.template.list.addEventListener('click', function (e) {
        var target = void 0;
        if (e.target.tagName.toUpperCase() === 'LI') {
            target = e.target;
        } else {
            target = e.target.parentElement;
        }
        var audioIndex = parseInt(target.getElementsByClassName('aplayer-list-index')[0].innerHTML) - 1;
        if (audioIndex !== 0) {
            self.playByIndex(audioIndex);
        }
    });

    this.ap.template.skipForwardButton.parentNode
        .replaceChild(this.ap.template.skipForwardButton.cloneNode(true),this.ap.template.skipForwardButton);
    this.ap.template.skipForwardButton =  this.ap.container.querySelector('.aplayer-icon-forward');
    this.ap.template.skipForwardButton.addEventListener("click",function (){self.skipForward();});


    this.laodConfig = function (){
        // 添加网易云默认歌单
        self.config.playlist.netease.forEach(function (tmp){self.defaultPlayList.addNeteaseList(tmp)});
        // 添加bilibili默认歌单
        self.config.playlist.bilibil.forEach(function (tmp){self.defaultPlayList.addBilibiliList(tmp)});

        // 添加bilibili默认歌曲
        self.config.song.bilibil.forEach(function (tmp){self.defaultPlayList.addAudio("bilibili", tmp)});
        // 添加网易云默认歌曲
        self.config.song.netease.forEach(function (tmp){self.defaultPlayList.addAudio("netease", tmp)});
        // 正则关键字黑名单
        self.config.blacklist.keywords.forEach(function (tmp){self.blacklist.addKeyword(tmp)});
        // 网易id黑名单
        self.config.blacklist.netease.forEach(function (tmp){self.blacklist.addSongId("netease", tmp)});
        // b站id黑名单
        self.config.blacklist.bilibili.forEach(function (tmp){if (tmp.indexOf("au") !== -1){tmp = tmp.replace("au","")}self.blacklist.addSongId("bilibili", tmp)});
        // 黑名单用户
        self.config.blacklist.user.forEach(function (tmp){self.blacklist.addUID(tmp)})
        // 修改背景颜色，这里是
        if (self.config.background.color !== null) {
            self.changeBackgroundColor(self.config.background.color);
        }
        // 修改背景图片, 第一个是url地址，第二个是repeat，一般用no-repeaet 最后一个是size
        if (self.config.background.image !== null && self.config.background.image.url !== null) {
            self.setBackroundImage(self.config.background.image.url,
                                    self.config.background.image.repeat,
                                    self.config.background.image.size);
        }
    }


    this.removeFirst = function () {
        self.remove(0);
    };

    this.remove = function (index) {
        if (self.ap.list.audios.length === 0) {
            return;
        }
        if (index < 0 || index >= self.ap.list.audios.length) {
            return
        }
        if (index === 0) {
            self.ap.pause();
            self.ap.list.remove(index);
            self.ap.play();
        } else {
            self.ap.list.remove(index);
        }

    };
    this.skipForward = function () {
        self.ap.pause();
        //self.ap.skipForward();
        self.removeFirst();
    };

    this.playByIndex = function (audioIndex){
        if (audioIndex===0||audioIndex>=self.ap.list.audios.length){
            return ;
        }
        self.ap.list.switch(audioIndex);
        var tmp = self.ap.list.audios[audioIndex];
        for (var i=audioIndex;i>=0;i--){
            self.ap.list.audios[i] = self.ap.list.audios[i-1]
        }
        self.ap.list.audios[0] = tmp;
        // 重置内部index
        self.ap.list.index = 0;
        // 修改html
        var lilist = self.ap.container.querySelectorAll('.aplayer-list li');
        for (var i=0;i<self.ap.list.audios.length;i++){
            lilist[i].getElementsByClassName('aplayer-list-title')[0].textContent = self.ap.list.audios[i]["name"];
            lilist[i].getElementsByClassName('aplayer-list-author')[0].textContent = self.ap.list.audios[i]["artist"];
        }
        // 清除歌词
        self.ap.lrc.parsed = [];
        // 重置html选中效果
        var light = self.ap.container.getElementsByClassName('aplayer-list-light')[0];
        if (light) {
            light.classList.remove('aplayer-list-light');
        }
        self.ap.container.querySelectorAll('.aplayer-list li')[0].classList.add('aplayer-list-light');
    }


    // 点bilibili歌
    this.addBilibili = function (url, sender) {
        var sid = self.audioApi.getSid(url) !== 0 ? self.audioApi.getSid(url) : self.audioApi.searchSid(url);
        if (sid === 0) {
            return false;
        }
        //黑名单检查
        if (self.blacklist.checkKeyword(url) || self.blacklist.checkSongId("bilibili", sid)) {
            return false;
        }
        var info = self.audioApi.getInfo(sid);
        if (info === null) {
            return false;
        }
        var cdns = self.audioApi.getPlayUrl(sid);
        if (cdns === null) {
            return false;
        }

        self.ap.list.add({
            name: info["name"] + " - " + info["up"],
            artist: sender,
            url: cdns["cdns"][0],
            cover: info["cover"],
            lrc: info["lyric"],
        });
        return true;
    };

    // 点网易歌
    this.addNetease = function (url, sender) {
        var keyword = url;
        var info = self.audioNeteaseApi.getInfo(keyword);
        if (info === null) {
            return false;
        }
        //黑名单检查
        if (self.blacklist.checkKeyword(keyword) || self.blacklist.checkSongId("netease", info["sid"])) {
            return false;
        }
        self.ap.list.add({
            name: info["name"],
            artist: sender,
            url: info["cdns"][0],
            cover: info["cover"],
            lrc: info["lyric"],
        });
        return true;
    };


    this.checkDamu = function () {
        var data = self.damukuApi.getNewestDamu();
        for (var i = 0; i < data.length; i++) {
            // 如果在黑名单内，直接跳过
            if (self.blacklist.checkUID(data[i]["uid"])) {
                continue;
            }

            // 如果没权限，跳过。
            if (self.config.privilege.default ||
                (self.config.privilege.admin && data[i]["isadmin"] === 1) ||
                (self.config.privilege.vip && data[i]["guard_level"] > 0)){
                // do nothing
            }else{
                continue;
            }

            // b站点歌关键字
            if (data[i]["text"].indexOf(self.config.hintword.bilibili) === 0) {
                var keyword = data[i]["text"].split(" ").slice(1).join(" ");
                self.addBilibili(keyword, data[i]["sender"]);
                continue;
            }
            // 网易点歌关键字
            if (data[i]["text"].indexOf(self.config.hintword.netease) === 0) {
                var keyword = data[i]["text"].split(" ").slice(1).join(" ");
                self.addNetease(keyword, data[i]["sender"]);
                continue;
            }
            // 切歌关键字
            if (data[i]["text"].indexOf(self.config.hintword.skip) === 0) {
                // 房管切歌
                if (self.config.skip.admin && self.ap.list.audios.length > 0 && data[i]["isadmin"] === 1) {
                    self.skipForward();
                    continue;
                }
                // 舰长切歌
                if (self.config.skip.vip && self.ap.list.audios.length > 0 && data[i]["guard_level"] > 0) {
                    self.skipForward();
                    continue;
                }
                // 切自己歌
                if (self.config.skip.default && self.ap.list.audios.length > 0 && data[i]["sender"] === self.ap.list.audios[0]["artist"]) {
                    self.skipForward();
                    continue;
                }
            }

            // 优先播放
            if (data[i]["text"].indexOf(self.config.hintword.playByIndex) === 0) {
                var aindex = data[i]["text"].split(" ").slice(1).join(" ");
                if (!isNaN(aindex)){
                    aindex = parseInt(aindex)-1
                    // 房管切歌
                    if (self.config.playByIndex.admin && data[i]["isadmin"] === 1) {
                        self.playByIndex(aindex);
                        continue;
                    }
                    // 舰长切歌
                    if (self.config.skip.vip && data[i]["guard_level"] > 0) {
                        self.playByIndex(aindex);
                        continue;
                    }
                    // 切自己歌
                    if (self.config.skip.default  && data[i]["sender"] === self.ap.list.audios[0]["artist"]) {
                        self.playByIndex(aindex);
                    }
                }
            }
        }
    };

    // 改背景颜色
    this.changeBackgroundColor = function (color) {
        document.body.style.backgroundColor = color;
    };

    this.setBackroundImage = function (url, repeat, size) {
        document.body.style.backgroundImage = "url(" + url + ")";
        document.body.style.backgroundRepeat = repeat;
        document.body.style.backgroundSize = size;
    };

    this.changeBackgroundColor("#FFB6C1");
    this.laodConfig();
    if (self.config.fetchDanmu){
        //开始获取弹幕 500ms
        self.fetchDamuRepeater = setInterval(this.checkDamu, 500);
    }

}