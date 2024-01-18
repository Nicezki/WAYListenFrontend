// WHAT ARE YOU LISTENING
// BY NICEZKI
// BASED ON LAST.FM API
// VERSION 2.0.0 DEV210 Pre-release 2
class yaminowplaying {
    constructor(username="Nicezki") {
        this.db = null;
        this.element = {
            template : ".nowplay-box",
            listarea : ".nowplay-listarea",
            loading : ".wait-loading"
        }
        this.screen = {
            login : ".scr-login",
            loading : ".scr-loading",
            listen : ".scr-listen",
        }
        this.btn = {
            login : "#btn-login",
            guest : "#btn-guest",
            setlastfm : "#btn-setlastfm",
        }
        this.part = {
            loginbtn : ".part-loginbtnz",
            setlastfm : ".part-setlastfm",
            loaddetail : ".part-loaddetail",
            supporter : ".part-supporter",
        }
        this.templateElement = {
            nowplaybox : ""
        }

        this.config = {
            remove : "['/\s-\sTopic$/','/\s-\sSingle$/','/\s-\sหัวข้อ$/']"
        }


        this.data = {
            // Lastfm Friends
            yamiloginpath : "https://cynthia.yami.one/auth/preauth?redirect=https://nicezki.com/listen&checkback=https://nicezki.com/yamic/checkback",
            yamipath : "https://cynthia.yami.one/api/v1/yamilastfm/users",
            apicoverurl : "https://playgrounds.nicezki.com/api/v1/lastfmplay/getSongCover",
            path : "https://playgrounds.nicezki.com/api/v1/lastfmplay/?username=",
            lastfmpath : "https://ws.audioscrobbler.com/2.0/",
            lastfmsubpath : {
                recenttracks : "?method=user.getrecenttracks&user=",
                usergetinfo : "?method=user.getinfo&user=",
                usergetfriends : "?method=user.getfriends&user=",
                usergettoptracks : "?method=user.gettoptracks&user=",
                usergettopartists : "?method=user.gettopartists&user=",
                usergettopalbums : "?method=user.gettopalbums&user=",
                albumgetinfo : "?method=album.getinfo&artist=",
                trackgetinfo : "?method=track.getinfo&artist=",
                artistgetinfo : "?method=artist.getinfo&artist=",
                chartgettopartists : "?method=chart.gettopartists",
                chartgettoptracks : "?method=chart.gettoptracks",
                chartgettopalbums : "?method=chart.gettopalbums",
                chartgettoptags : "?method=chart.gettoptags",
            },
            apikey : "d3da3066f994feac54edd4103aabe46f",
            yamiuserdata : {},
            defaultusername : "Nicezki",
            guestMode : false,
            validYamiToken : false,
            username : username,
            profile : {},
            friends : {},
            friendsV1 : [],
            recenttracks : [],
            lastrecenttracks : [],
            lastOrder : [],
            currentOrder : [],
            friendscount : 0,
            data : {},
            lastData : {},
            nowplayingTime : {
                timeCurrent: {},
                songCurrent: {},
                interval: {},

            },
            errorTimeout : 0,
            reloadTime: 10000,
            limitRateTime: 200,
        }

        this.templateElement.nowplaybox = document.querySelector(this.element.template).cloneNode(true);
        document.querySelector(this.element.template).parentElement.remove();

        this.init();
    }



        async init() {
            console.log("[YAMILISTEN] You are running development version 2");
            this.addBtnEvent();
            this.hidePart(this.part.supporter);
            this.showScreen(this.screen.loading);
            this.showPart(this.part.loaddetail);
            // Init the database
            this.changeLoadingText("กำลังเช็คสถานะฐานข้อมูล",0);
            this.changeLoadingText("Checking database status",1);
            this.initDB();
            //If guest mode is true, skip login
            if (this.data.guestMode != true) {
                this.changeLoadingText("กำลังเช็คสถานะการเข้าสู่ระบบ",0);
                this.changeLoadingText("Checking your login status...",1);


                // Check if the user is logged in
                await this.checkLoginStatus();
                // If the login result is false, return
                if (this.validYamiToken == false) {
                    console.log("[YAMILISTEN] Login result is false, skipping init");
                    this.showScreen(this.screen.login);
                    this.showPart(this.part.loginbtn,true);
                    return;
                }
            }else{
                this.data.username = this.data.defaultusername;
                console.log("[YAMILISTEN] Guest mode is true, skipping login");
                //Slow update time
                this.data.reloadTime = 15000;
                this.data.limitRateTime = 1000;
            }
            
            this.changeLoadingText("กำลังเช็คสถานะชื่อผู้ใช้ LastFM",0);
            this.changeLoadingText("Checking your LastFM username...",1);
            // Check if the lastFMUsername is present
            let lastfmUsernameStatus = this.checkLastfmUsernamePresent();
            // If the lastFMUsername is empty, show the login screen
            if (lastfmUsernameStatus == 2) {
                console.log("[YAMILISTEN] LastFM username is empty, showing login screen");
                this.showScreen(this.screen.login);
                //Change text in setlastfm part
                document.querySelector(this.part.setlastfm).querySelectorAll("h2")[0].textContent = "You didn't set your Last.fm username in Yami Community";
                document.querySelector(this.part.setlastfm).querySelectorAll("h2")[1].textContent = "คุณยังไม่ได้ตั้งชื่อผู้ใช้ LastFM ใน Yami Community";
                this.showPart(this.part.setlastfm,true);
                this.hidePart(this.part.loginbtn);  
            }else if (lastfmUsernameStatus == 1) {
                console.log("[YAMILISTEN] LastFM username is present, check if the username is valid");
                this.changeLoadingText("กำลังเช็คสถานะผู้ใช้ "+this.data.username+" ใน LastFM",0);
                this.changeLoadingText("Checking your LastFM username (" + this.data.username + ")...",1);
                let lastfmResult =  await this.getMyLastFMProfile();
                // If the result is false, show the login screen
                if (lastfmResult == false) {
                    console.log("[YAMILISTEN] LastFM username is invalid, showing login screen");
                    this.showScreen(this.screen.login);
                    //Change text in setlastfm part
                    document.querySelector(this.part.setlastfm).querySelectorAll("h2")[0].textContent = "Your LastFM username is invalid or not found, please set your LastFM username again";
                    document.querySelector(this.part.setlastfm).querySelectorAll("h2")[1].textContent = "ชื่อผู้ใช้ LastFM ของคุณไม่ถูกต้อง กรุณาตั้งชื่อผู้ใช้ LastFM ใหม่";
                    this.showPart(this.part.setlastfm,true);
                    this.hidePart(this.part.loginbtn);
                    return;
                }
            }

            // Check if the profile is empty
            if (this.data.profile == {} || this.data.profile == undefined || this.data.profile == null) {
                console.log("[YAMILISTEN] Profile is empty, skipping init");
                //Change text in setlastfm part
                document.querySelector(this.part.setlastfm).querySelectorAll("h2")[0].textContent = "Your LastFM username is invalid or not found, please set your LastFM username again";
                document.querySelector(this.part.setlastfm).querySelectorAll("h2")[1].textContent = "ชื่อผู้ใช้ LastFM ของคุณไม่ถูกต้อง กรุณาตั้งชื่อผู้ใช้ LastFM ใหม่";
                this.showScreen(this.screen.login);
                this.showPart(this.part.setlastfm,true);
                this.hidePart(this.part.loginbtn);
                
                return;
            }

            this.changeLoadingText("กำลังเช็คสถานะเพื่อนของ "+this.data.username+" ใน LastFM",0);
            this.changeLoadingText("Checking your LastFM friends...",1);
            this.data.friends = await this.getAllFriendsData(this.data.username,true);
            this.changeLoadingText("รับข้อมูลเพื่อน "+this.data.friendscount+" คนของ "+this.data.username+" สำเร็จ",0);
            this.changeLoadingText("Successfully fetched " + this.data.friendscount + " friends of " + this.data.username,1);
            this.data.recenttracks = await this.getAllFriendsRecentTracks(false,1,true,true);
            this.removeAllNowPlayingBox();
            this.createAllNowPlayingBox();
            this.updateAllNowPlayingBox();
            this.changeBoxOrder();
            this.showScreen(this.screen.listen);

            this.data.reloadTime = this.calculateTimeToWait();

            // Refresh every 10 seconds
            setInterval(() => {
                console.log("[YAMILISTEN] Refreshing...");
                this.refresh();
            }, this.data.reloadTime);
        }


        // Add button event listener
        addBtnEvent() {
            document.querySelector(this.btn.login).addEventListener("click", () => {
                this.loginWithYami();
            });
            document.querySelector(this.btn.guest).addEventListener("click", () => {
                this.data.guestMode = true;
                this.init();
            });
            document.querySelector(this.btn.setlastfm).addEventListener("click", () => {
                this.setLastfmUsernameFronYami();
            });
        }

        async refresh() {
            this.data.lastData = this.data.recenttracks;
            this.data.recenttracks = await this.getAllFriendsRecentTracks(false,1,false,true);
            this.updateAllNowPlayingBox();
            this.changeBoxOrder();
        }

        navigateToTrackPage(username){
            try{
                //Get data from currentData
                var data = this.data.recenttracks[username]["track"][0];

                //Navigate to the track page
                window.open(data.url, '_blank');
            }catch(error){
                console.log("[WAYI] Error while navigating to track page: " + error + " With username: " + username);
                console.log("[WAYI] Data: " + data);
            }
        }


        async checkLoginStatus() {
            // Check if the user is logged in
            console.log("[YAMILISTEN] Checking if the user is logged in");
            if (this.getCookie("yami_token") != "" && this.getCookie("yami_token") != undefined && this.getCookie("yami_token") != null) {
                console.log("[YAMILISTEN] Yami token is present, checking if the token is valid");
                await this.getYamiUserData();
            }else{
                console.log("[YAMILISTEN] Yami token is not present, Showing login screen");
                this.validYamiToken = false;
            }
        }



        loginWithYami() {
                console.log("[YAMILISTEN] Login Process started");
                // Open Yami login page in a popup window
                const popup = window.open("https://cynthia.yami.one/auth/preauth?redirect=https://nicezki.com/listen&checkback=https://nicezki.com/yamic/checkback/inline", "Yami Login", "width=800,height=800");
                const interval = setInterval(() => {
                    if (popup.closed) {
                        clearInterval(interval);
                        console.log('[YAMILISTEN] Popup window closed');
                        // Check if the Yami token is empty
                        if (this.getCookie("yami_token") == "" || this.getCookie("yami_token") == undefined || this.getCookie("yami_token") == null) {
                            console.log("[YAMILISTEN] Yami token is empty, skipping login");
                            return;
                        }else{
                            console.log("[YAMILISTEN] Yami token is seem valid, loading friends");
                            this.getYamiUserData();
                            this.init();
                        }
                    }
                }, 500);
        }

        setLastfmUsernameFronYami() {
            console.log("[YAMILISTEN] Setting LastFM username from Yami process started");
            // Open Yami login page in a popup window
            //https://yami.one/profile/1-nicezki/edit/ (Obtain the url from data.yamiuserdata.profileUrl)
            const popup = window.open(this.data.yamiuserdata.profileUrl + "/edit/#form_header_core_pfieldgroups_15", "Yami Login", "width=1000,height=1700");
            const interval = setInterval(() => {
                if (popup.closed) {
                    clearInterval(interval);
                    console.log('[YAMILISTEN] Popup window closed');
                    // Check if the Yami token is empty
                    if (this.getCookie("yami_token") == "" || this.getCookie("yami_token") == undefined || this.getCookie("yami_token") == null) {
                        console.log("[YAMILISTEN] Yami token is empty, skipping login");
                        return;
                    }else{
                        console.log("[YAMILISTEN] Yami token is seem valid, loading friends");
                        this.getYamiUserData();
                        this.init();
                    }
                }
            }, 500);
        }
        

        async getYamiUserData() {
            // Get the Yami token from the cookie
            let yamiToken = this.getCookie("yami_token");
            // If the Yami token is empty, return false
            if (yamiToken == "") {
                console.log("[YAMILISTEN] Yami token is empty, Session might be expired, Skipping getting Yami user data");
                this.validYamiToken = false;
                return false;
            }
            // Else, get the Yami user data from the API
            console.log("[YAMILISTEN] Yami token is seems valid, getting Yami user data...");
            // Use fetch to get the data and authenticate with the Bearer token
            await fetch(this.data.yamipath, {
                headers: {
                    method: "GET",
                    Authorization: `Bearer ${yamiToken}`
                }
            })
            .then(response => response.json())
            .then(data => {
                this.data.errorTimeout = 0;
                // Process the Yami user data
                console.log("[YAMILISTEN] Yami user data finished fetching");
                console.log("[YAMILISTEN] Yami user data:", data);
                // Call a function to handle the data
                let result = this.handleYamiUserData(data);
                // If the result is false, return false
                if (result == false) {
                    console.log("[YAMILISTEN] Yami user data is invalid, skipping getting Yami user data");
                    this.validYamiToken = false;
                    return false;
                }else{
                    console.log("[YAMILISTEN] Yami user data is valid");
                    this.validYamiToken = true;
                    return true;
                }
            })
            .catch(error => {
                console.error("[YAMILISTEN] Error fetching Yami user data:", error);
                this.data.errorTimeout++;
                if (this.data.errorTimeout > 5) {
                    console.log("[YAMILISTEN] Error timeout reached, skipping getting Yami user data");
                    return false;
                }
                console.log("[YAMILISTEN] Error timeout is not reached, retrying getting Yami user data");
                return this.getYamiUserData();
            });
        }

        handleYamiUserData(data) {
            // If the data is empty, return false
            if (data == "" || data.name == null || data.name == undefined) {
                console.log("[YAMILISTEN] Yami user data is empty, skipping handle Yami user data");
                this.validYamiToken = false;
                return false;
            }

            //If supporter is 2
            if (data.supporter == 2) {
                console.log("[YAMILISTEN] Thank you very much for supporting Yami Community! <3");
                console.log("[YAMILISTEN] You are a Yami Supporter II");
                console.log("[YAMILISTEN] The time to wait is 10 seconds for all friends");
                this.data.reloadTime = 10000;
                console.log("[YAMILISTEN] The rate limit time is 75ms");
                this.data.limitRateTime = 75;
                //Set text in supporter part
                //document.querySelector(app.part.supporter).querySelectorAll("h2")[0].textContent
                document.querySelector(this.part.supporter).querySelectorAll("h2")[0].textContent = "SUPPORTER II";
                document.querySelector(this.part.supporter).querySelectorAll("h2")[1].textContent = "ขอบคุณที่เป็นส่วนหนึ่งของการสนับสนุน​";
                document.querySelector(this.part.supporter).querySelectorAll("h2")[2].textContent = "ภาพปกโปรไฟล์ของคุณจะเป็นพื้นหลังของหน้าจอนี้​";
                // Show the supporter part
                this.showPart(this.part.supporter);
                // Set the bg of .main-app-yplay to cover image (Overlay not the bg)
                document.querySelector(".main-app-yplay").style.backgroundImage = "url(" + data.coverPhotoUrl + ")";
                document.querySelector(".main-app-yplay").style.backgroundSize = "cover";
            }else if (data.supporter == 1) {
                console.log("[YAMILISTEN] Thank you very much for supporting Yami Community! <3");
                console.log("[YAMILISTEN] You are a Yami Supporter I");
                //Set text in supporter part
                document.querySelector(this.part.supporter).querySelectorAll("h2")[0].textContent = "SUPPORTER I";
                document.querySelector(this.part.supporter).querySelectorAll("h2")[1].textContent = "ขอบคุณที่เป็นส่วนหนึ่งของการสนับสนุน​";
                document.querySelector(this.part.supporter).querySelectorAll("h2")[2].textContent = "<3​";
                this.showPart(this.part.supporter);
            }
            console.log("[YAMILISTEN] Welcome " + data.name + "!" + " (Data is valid)");
            this.validYamiToken = true;
            this.data.yamiuserdata = data;
            return true;
        }


        checkLastfmUsernamePresent() {
            // Check from this.data.yamiuserdata if the lastFMUsername is empty
            // return 0 if not logged in, 1 if logged in and lastFMUsername is not empty, 2 if logged in but lastFMUsername is empty
            // Check first if data.yamiuserdata is empty
            // If guest mode is true, skip the check
            if (this.data.guestMode == true) {
                console.log("[YAMILISTEN] Guest mode is true, skipping check for LastFM username");
                console.log("[YAMILISTEN] Defaulting to default username (" + this.data.defaultusername + ")")
                this.data.username = this.data.defaultusername;
                return 1;
            }

            if (this.data.yamiuserdata == {}){
                console.log("[YAMILISTEN] Yami user data is empty, skipping check for LastFM username");
                console.log("[YAMILISTEN] Defaulting to default username (" + this.data.defaultusername + ")");
                this.data.username = this.data.defaultusername;
                return 0;
            }

            if (this.data.yamiuserdata.lastFMUsername == "" || this.data.yamiuserdata.lastFMUsername == undefined || this.data.yamiuserdata.lastFMUsername == null) {
                console.log("[YAMILISTEN] LastFM username is empty, skipping check for LastFM username");
                return 2;
            }

            console.log("[YAMILISTEN] LastFM username is not empty, checking for LastFM username");
            this.data.username = this.data.yamiuserdata.lastFMUsername;
            console.log("[YAMILISTEN] LastFM username is " + this.data.username);
            return 1;
        }


        async getLastfmProfile(username,raw=false) {
            try {
                const response = await fetch(this.data.lastfmpath + this.data.lastfmsubpath.usergetinfo + username + "&api_key=" + this.data.apikey + "&format=json");
                if (!response.ok) {
                    if (response.status == 404) {
                        console.log("[YAMILISTEN] The user " + username + " is not found");
                        return false;
                    }
                    throw new Error(`[YAMILISTEN] HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                console.log("[YAMILISTEN] Profile data:", data);
                this.data.errorTimeout = 0;
                if (raw) {
                    return data;
                }
                return data.user
            } catch (error) {
                console.error('[YAMILISTEN] Error fetching profile:', error);
                this.data.errorTimeout++;
                if (this.data.errorTimeout > 5) {
                    console.log("[YAMILISTEN] Error timeout reached, skipping getting profile");
                    return false;
                }
                console.log("[YAMILISTEN] Error timeout is not reached, retrying getting profile");
                return await this.getLastfmProfile(username,raw);
            }
        }
        

        async getLastfmFriends(username,page=1,raw=false) {
            try {
                const response = await fetch(this.data.lastfmpath + this.data.lastfmsubpath.usergetfriends + username + "&api_key=" + this.data.apikey + "&format=json" + "&page=" + page + "&limit=200");
                if (!response.ok) {
                    throw new Error(`[YAMILISTEN] HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                console.log("[YAMILISTEN] Friends data:", data);
                this.data.errorTimeout = 0;
                if (raw) {
                    return data;
                }else{
                    return data.friends;
                }
            } catch (error) {
                console.error('[YAMILISTEN] Error fetching friends:', error);
                //If it's 404, return false
                if (error == "Error: [YAMILISTEN] HTTP error! status: 404") {
                    console.log("[YAMILISTEN] The user " + username + " is not found");
                    return false;
                }
                this.data.errorTimeout++;
                if (this.data.errorTimeout > 5) {
                    console.log("[YAMILISTEN] Error timeout reached, skipping getting friends");
                    return false;
                }
                console.log("[YAMILISTEN] Error timeout is not reached, retrying getting friends");
                return await this.getLastfmFriends(username,page,raw);
            }
        }


        async processFriendsData(username, page) {
            const friends = await this.getLastfmFriends(username, page);
        
            if (!friends) {
                console.log("[YAMILISTEN] Friends data is empty, skipping getting all friends data");
                return false;
            }
        
            console.log("[YAMILISTEN] Friends data is valid, processing friends data (Page " + page + ")" );
            // console.log("[YAMILISTEN] Friends data:", friends);
        
            const friendsList = friends.user;
            return friendsList.map(friend => friend);
        }
        
        async getAllFriendsData(username,usernamemap = false) {
            const initialFriends = await this.getLastfmFriends(username, 1);
        
            if (!initialFriends) {
                console.log("[YAMILISTEN] Friends data is empty, skipping getting all friends data");
                return false;
            }
        
            console.log("[YAMILISTEN] Friends data is valid, processing friends data");
            console.log("[YAMILISTEN] Friends data:", initialFriends);
        
            const totalFriends = initialFriends["@attr"].total;
            const totalPages = initialFriends["@attr"].totalPages;
            let friendsData = initialFriends.user.map(friend => friend);
        
            for (let i = 2; i <= totalPages; i++) {
                // Rate limit
                console.log("[YAMILISTEN] Getting friends data page " + i + " of " + totalPages);
                console.log("[YAMILISTEN] Rate limit, waiting for 1000ms");
                await new Promise(resolve => setTimeout(resolve, 1000));
                const pageFriendsData = await this.processFriendsData(username, i);
                if (!pageFriendsData) return false;
                friendsData = friendsData.concat(pageFriendsData);
            }

            console.log("[YAMILISTEN] Friends data finished processing");
            this.data.friendscount = friendsData.length;
            if (usernamemap == true) {
                console.log("[YAMILISTEN] Mapping friends data to username");
                let friendsDataMap = {};
                friendsData.forEach(friend => {
                    // Fix the name to underscore
                    let name = this.fixName(friend.name);
                    friendsDataMap[name] = friend;
                });
                console.log("[YAMILISTEN] Friends data mapped to username");
                console.log("[YAMILISTEN] Friends data:", friendsDataMap);
                return friendsDataMap;
            }
            console.log("[YAMILISTEN] Mapping friends data to username skipped");
            console.log("[YAMILISTEN] Friends data:", friendsData);
            return friendsData;
        }
        

        async getMyLastFMProfile() {
            // If the data is empty, return false
            let data = await this.getLastfmProfile(this.data.username);
            if (data == "" || data == undefined || data == null) {
                console.log("[YAMILISTEN] LastFM profile data is empty, returning to login screen");
                return false;
            }
            // Else, process the data
            console.log("[YAMILISTEN] LastFM profile data is valid, processing profile");
            console.log("[YAMILISTEN] LastFM profile data:", data);
            this.data.profile = data;
        }

        async getRecentTracks(username,raw=false,limit=1) {
            try {
                const response = await fetch(this.data.lastfmpath + this.data.lastfmsubpath.recenttracks + username + "&api_key=" + this.data.apikey + "&format=json" + "&limit=" + limit);
                if (!response.ok) {
                    throw new Error(`[YAMILISTEN] HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                console.log("[YAMILISTEN] Recent tracks data:", data);
                if (raw) {
                    return data;
                }
                return data.recenttracks
            } catch (error) {
                console.error('[YAMILISTEN] Error fetching recent tracks:', error);
                this.data.errorTimeout++;
                if (this.data.errorTimeout > 5) {
                    console.log("[YAMILISTEN] Error timeout reached, skipping getting recent tracks");
                    return false;
                }
                console.log("[YAMILISTEN] Error timeout is not reached, retrying getting recent tracks");
                return await this.getRecentTracks(username,raw,limit);
            }
        }
        


        // Get the recent tracks of the all friends
        async getAllFriendsRecentTracks(raw=false,limit=1,annouce=false,includeself=false) {
            // Check if the friends array is empty
            if (this.data.friends == []) {
                console.log("[YAMILISTEN] Friends array is empty, skipping getting all friends recent tracks");
                return false;
            }
            // Else, get the recent tracks of all friends
            console.log("[YAMILISTEN] Friends array is present, getting all friends recent tracks");
            let friendsRecentTracks = {};
            // Loop through all friends
            for (let key in this.data.friends) {
                // Rate limit
                console.log("[YAMILISTEN] Slow down, waiting for " + this.data.limitRateTime + "ms");
                await new Promise(resolve => setTimeout(resolve, this.data.limitRateTime));
                console.log("[YAMILISTEN] Getting recent tracks of " + this.data.friends[key].name);
                if (annouce) {
                    this.changeLoadingText("กำลังเช็คเพลงล่าสุดของ " + this.data.friends[key].name,0);
                    this.changeLoadingText("Checking recent tracks of " + this.data.friends[key].name,1);
                }
                let recentTracks = await this.getRecentTracks(this.data.friends[key].name,raw,limit);
                if (!recentTracks) {
                    console.log("[YAMILISTEN] Recent tracks of " + this.data.friends[key].name + " is empty, skipping getting recent tracks");
                    continue;
                }
                // Fix the name to underscore
                let name = this.fixName(this.data.friends[key].name);
                friendsRecentTracks[name] = recentTracks;
            }
            if (includeself) {
                console.log("[YAMILISTEN] includeself is true, getting recent tracks of " + this.data.username);
                let recentTracks = await this.getRecentTracks(this.data.username,raw,limit);
                if (!recentTracks) {
                    console.log("[YAMILISTEN] Recent tracks of " + this.data.username + " is empty, skipping getting recent tracks");
                }else{
                    // Fix the name to underscore
                    let name = this.fixName(this.data.username);
                    friendsRecentTracks[name] = recentTracks;
                }
            }
            console.log("[YAMILISTEN] Recent tracks of all friends finished fetching");
            console.log("[YAMILISTEN] Recent tracks of all friends:", friendsRecentTracks);
            return friendsRecentTracks;
        }

        // Competible with V1 by converting data to V1 format
        // This function is for using with V1 only
        // This function is not used in V2
        compatConvert(){
            //Convert friends data to V1 format
            let friends = this.data.friends;
            let friendsV1 = [];
            for (let i = 0; i < friends.length; i++) {
                let friend = friends[i];
                let friendV1 = {
                    "name": friend.name,
                    "realname": friend.realname,
                    "url": friend.url,
                    "image": friend.image[3]["#text"] || friend.image[2]["#text"] || friend.image[1]["#text"] || friend.image[0]["#text"],
                    "country": friend.country,
                }
                friendsV1.push(friendV1);
            }
            this.data.friendsV1 = friendsV1;
            console.log("[YAMILISTEN] Converted friends data to V1 format");
            console.log("[YAMILISTEN] Friends data:", this.data.friends);


            let data = {
                "self": {
                    "name": this.data.profile.name,
                    "realname": this.data.profile.realname,
                    "url": this.data.profile.url,
                    "image": this.data.profile.image[3]["#text"] || this.data.profile.image[2]["#text"] || this.data.profile.image[1]["#text"] || this.data.profile.image[0]["#text"],
                    "country": this.data.profile.country,
                },
                "friends": friendsV1,
                "friendscount": this.data.friendscount,
            }
            
            console.log("[YAMILISTEN] Converted data to V1 format");
            console.log("[YAMILISTEN] Data:", data);
            return data;
        }


        removeAllNowPlayingBox() {
            console.log("[YAMILISTEN] Removing all now playing box");
            let boxes = document.querySelectorAll(".nowplay-box");
            boxes.forEach(box => {
                box.remove();
            }
            );
            console.log("[YAMILISTEN] Removed all now playing box");
        }


        createNowPlayingBox(username) {
            console.log("[YAMILISTEN] Creating box for " + username);
            username = this.fixName(username);
            //Check if user have the song 
            if (this.data.recenttracks[username]["track"][0] == undefined) {
                console.log("[YAMILISTEN] User " + username + " doesn't have the song, skipping create box");
                return;
            }
            //Check if box is already created
            if (document.querySelector(".nowplay-box-" + username) != null) {
                console.log("[YAMILISTEN] Box for " + username + " is already created, skipping create box");
                return;
            }
            let box = this.templateElement.nowplaybox.cloneNode(true);
            box.classList.add("nowplay-box");
            box.classList.add("nowplay-box-" + username);
            box.classList.add("animated");
            box.classList.add("bounceInUp");
            if (username == this.data.profile.name.toLowerCase()) {
                console.log("[YAMILISTEN] Creating box for " + username + ' (' + this.data.profile.name + ')');
                box.querySelector(".nowplay-name").querySelector("h2").textContent = this.data.profile.name;
                box.querySelector(".nowplay-avatar").style.backgroundImage = "url(" + this.data.profile.image[3]["#text"] || this.data.profile.image[2]["#text"] || this.data.profile.image[1]["#text"] || this.data.profile.image[0]["#text"] + ")";
            }else{
                console.log("[YAMILISTEN] Creating box for own " + username + ' (' + this.data.friends[username].name + ')');
                box.querySelector(".nowplay-name").querySelector("h2").textContent = this.data.friends[username].name;
                box.querySelector(".nowplay-avatar").style.backgroundImage = "url(" + this.data.friends[username].image[3]["#text"] || this.data.friends[username].image[2]["#text"] || this.data.friends[username].image[1]["#text"] || this.data.friends[username].image[0]["#text"] + ")";
            }
            box.querySelector(".nowplay-songinfo").classList.add("animated");
            box.querySelector(".nowplay-songinfo").classList.add("slideInUp");
            box.querySelector(".nowplay-usernamebox").addEventListener("click", () => {
                console.log("[WAYI] Go to " + username + "'s profile");
                if(username == this.data.profile.name.toLowerCase())
                window.open(this.data.profile.url, '_blank');
                else{
                window.open(this.data.friends[username].url, '_blank');
                }
            });

            box.querySelector(".nowplay-songinfo").addEventListener("click", () => {
                this.navigateToTrackPage(username);
            });

            box.querySelector(".nowplay-usernamebox").style.cursor = "pointer";
            box.querySelector(".nowplay-songinfo").style.cursor = "pointer";

            box.style.display = "flex";
            box.style.visibility = "visible";
            document.querySelector(this.element.listarea).appendChild(box);
            console.log("[YAMILISTEN] Created box for " + username);
        }


        async updateNowPlayingBox(username) {
            try {
                username = this.fixName(username);
                if (this.data.recenttracks[username]["track"][0] == undefined) {
                    console.log("[YAMILISTEN] User " + username + " doesn't have the song, skipping update box");
                    return;
                }
                let box = document.querySelector(".nowplay-box-" + username);
                let currentTitle = box.querySelector(".nowplay-title").querySelector("h2").textContent;
                let currentArtist = box.querySelector(".nowplay-artist").querySelector("h2").textContent;
                let currentAlbum = box.querySelector(".nowplay-album").querySelector("h2").textContent;
                let currentImage = window.getComputedStyle(box.querySelector(".nowplay-cover")).backgroundImage;
                let currentImageURL = currentImage.replace(/url\((['"])?(.*?)\1\)/gi, '$2').split(',')[0];

                let updatedTitle = this.data.recenttracks[username]["track"][0]["name"];
                let updatedArtist = this.data.recenttracks[username]["track"][0]["artist"]["#text"];
                let updatedAlbum = this.data.recenttracks[username]["track"][0]["album"]["#text"];
                let updatedImage = this.data.recenttracks[username]["track"][0]["image"][3]["#text"] || this.data.recenttracks[username]["track"][0]["image"][2]["#text"] || this.data.recenttracks[username]["track"][0]["image"][1]["#text"] || this.data.recenttracks[username]["track"][0]["image"][0]["#text"];
                let updatedImageURL = updatedImage.replace(/url\((['"])?(.*?)\1\)/gi, '$2').split(',')[0];
                let updatedAlbumImage = await this.getAlbumImage(username);
                console.log("[YAMILISTEN] Updated album image:", updatedAlbumImage);

                let updatedEpoch = this.getListeningEpoch(username);
                let timeText = this.timeSince(updatedEpoch);
                
                //Don't update if the time text is the same
                if (box.querySelector(".nowplay-time").querySelector("h2").textContent == timeText && updatedEpoch != 0) {
                    console.log("[YAMILISTEN] Skipped box for " + username + ' (' + updatedTitle + ')');
                    return;
                }
                //Highlight the box if currently listening
                if (updatedEpoch == 0) {
                    box.style.backgroundColor = "#ca0a7878";
                    //Check song [1] if it's the same as [0] check the time of [1]
                    if(this.data.recenttracks[username]["track"][1] != undefined){
                        if(this.data.recenttracks[username]["track"][1]["name"] == updatedTitle){
                            //Check if the songCurrent (time uts) is the same as the recenttracks [1] (time uts)
                            //If yes That means the song is still playing so still not reset the time interval
                            //If no That means the song is changed so reset the time interval 
                            if (this.data.nowplayingTime.songCurrent[username] !== parseInt(this.data.recenttracks[username]["track"][1]["date"]["uts"])) {
                                // Clear the existing interval if it exists
                                if (this.data.nowplayingTime.interval[username]) {
                                    clearInterval(this.data.nowplayingTime.interval[username]);
                                }
                            
                                // Save the time of [1] in data.nowplayingTime.songCurrent
                                this.data.nowplayingTime.songCurrent[username] = parseInt(this.data.recenttracks[username]["track"][1]["date"]["uts"]);
                            
                                // Get a reference to the time element
                                const timeElement = box.querySelector(".nowplay-time").querySelector("h2");
                            
                                // Set a new interval to update the time every 1 second 
                                this.data.nowplayingTime.interval[username] = setInterval(() => {
                                    const songTime = this.data.nowplayingTime.songCurrent[username];
                            
                                    // Display the absolute value of songTime to show the time elapsed since the song started playing
                                    const timeText = this.timeSinceMin(Math.abs(songTime));
                                    
                                    // Update the time element directly
                                    timeElement.textContent = "ฟังอยู่ (" + timeText + ")";
                                }, 500);
                            }else{
                                // Do nothing
                                console.log("[YAMILISTEN] The song is still playing, skipping update time");
                            }
                            
                            
                            
                        }else{
                            // Clear the existing interval if it exists
                            if (this.data.nowplayingTime.interval[username]) {
                                clearInterval(this.data.nowplayingTime.interval[username]);
                            }
                            box.querySelector(".nowplay-time").querySelector("h2").textContent = timeText;
                        }
                    }
                }else{
                        box.style.backgroundColor = "#ffffff14";
                }
                

                // If the data is the same as the current data, skip the update
                if (currentTitle == updatedTitle && currentArtist == updatedArtist && currentAlbum == updatedAlbum && currentImageURL == updatedImageURL) {
                    console.log("[YAMILISTEN] Skipped box for " + username + ' (' + updatedTitle + ')');
                    return;
                }else{
                    console.log("[YAMILISTEN] Updating box for " + username + ' (' + updatedTitle + ')');
                    if (currentTitle != updatedTitle) {
                        box.querySelector(".nowplay-title").querySelector("h2").textContent = updatedTitle;
                        // If track is updated, Hide and show the title to make the animation
                        box.querySelector(".nowplay-songinfo").style.display = "none";
                        box.querySelector(".nowplay-songinfo").style.visibility = "hidden";
                        setTimeout(() => {
                            box.querySelector(".nowplay-songinfo").style.display = "flex";
                            box.querySelector(".nowplay-songinfo").style.visibility = "visible";
                        }, 100);
                    }

                    if (currentArtist != updatedArtist) {
                        box.querySelector(".nowplay-artist").querySelector("h2").textContent = updatedArtist;
                    }

                    if (currentAlbum != updatedAlbum) {
                        box.querySelector(".nowplay-album").querySelector("h2").textContent = updatedAlbum;
                    }

                    if (currentImageURL != updatedAlbumImage) {
                        box.querySelector(".nowplay-cover").style.backgroundImage = "url(" + updatedAlbumImage + ")";
                    }
                }
            } catch (error) {
                console.error('[YAMILISTEN] Error updating box:', error);
            }
        }

        orderByEpoch() {
            let sorted = [];
            //can use getListeningEpoch(username) and select box by username
            for (let key in this.data.recenttracks) {
                //If zero change to current time
                if (this.getListeningEpoch(key) == 0) {
                    sorted.push([key, Date.now()]);
                    continue;
                }
                sorted.push([key, this.getListeningEpoch(key)]);
            }
            sorted.sort(function(a, b) {
                return a[1] - b[1];
            });
            return sorted.reverse();
        }

        changeBoxOrder() {
            let sorted = this.orderByEpoch();
            this.data.currentOrder = sorted;
            if (JSON.stringify(this.data.lastOrder) === JSON.stringify(this.data.currentOrder)) {
                console.log("[YAMILISTEN] Skipped order update because the order is the same");
                return;
            }
            let boxes = document.querySelectorAll(".nowplay-box");
            sorted.forEach((item, index) => {
                // If the box is not present, skip the update
                if (document.querySelector(".nowplay-box-" + this.fixName(item[0])) == null) {
                    console.log("[YAMILISTEN] Skipped order update because the box is not present");
                    return;
                }
                let box = document.querySelector(".nowplay-box-" + this.fixName(item[0]));
                box.style.order = index;
                console.log("[YAMILISTEN] Changed order of " + item[0] + ' (' + this.fixName(item[0]) + ') to ' + index);
            });
            this.data.lastOrder = this.data.currentOrder;


        }

        createAllNowPlayingBox() {
            // Loop through all friends including self
            //Self
            this.createNowPlayingBox(this.data.username);
            //check if the friends is more than 30
            let i = 0;
            for (let key in this.data.friends) {
                if (i > 30) {
                    console.log("[YAMILISTEN] More than 30 friends, skipping create all other boxes");
                    break;
                }
                this.createNowPlayingBox(key);
                i++;
            }
        }

        calculateTimeToWait() {
            //Calculate the time to wait (friendnum (max 30) * 1000ms)
            //If the time to wait is more than 20 seconds, set it to 20 seconds
            let i = this.data.friendscount;
            let timeToWait = (i * 1.5) * 500;
            if (timeToWait > 20000) {
                timeToWait = 20000;
            }
            //If the time to wait is less than 10 seconds, set it to 10 seconds
            if (timeToWait < 10000) {
                timeToWait = 10000;
            }
            console.log("[YAMILISTEN] [Qouta] According to the number of friends (" + i + "), the time to wait is " + timeToWait + "ms");
            return timeToWait;
        }
        

        updateAllNowPlayingBox() {
            // Loop through all friends including self
            //Self
            this.updateNowPlayingBox(this.data.username);
            //check if the friends is more than 30

            //if more than 30, update only 30
            let i = 0;
            for (let key in this.data.friends) {
                if (i > 30) {
                    console.log("[YAMILISTEN] Time to wait for " + key + " is " + timeToWait + "ms");

                    console.log("[YAMILISTEN] More than 30 friends, skipping update all other boxes");
                    break;
                }
                this.updateNowPlayingBox(key);
                i++;  
            }
        }
                


        getCurrentLastfmTrackImage(username) {
            username = this.fixName(username);
            if (this.data.recenttracks[username]["track"][0]["image"] == undefined) {
                return "";
            }
            let trackImage = this.data.recenttracks[username]["track"][0]["image"][3]["#text"] ?? "";
            let trackImageURL = trackImage?.replace(/url\((['"])?(.*?)\1\)/gi, '$2').split(',')[0];
            if (trackImageURL == "" || trackImageURL == "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png") {
                trackImageURL = "";
            }
            return trackImageURL;
        }


        getCurrentLastfmArtistImage(username) {
            username = this.fixName(username);
            if (this.data.recenttracks[username]["track"][0]["artist"]["image"] == undefined) {
                return "";
            }
            let artistImage = this.data.recenttracks[username]["track"][0]["artist"]["image"][3]["#text"] ?? "";
            let artistImageURL = artistImage?.replace(/url\((['"])?(.*?)\1\)/gi, '$2').split(',')[0];
            if (artistImageURL == "" || artistImageURL == "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png") {
                artistImageURL = "";
            }
            return artistImageURL;
        }


        getCurrentLastfmAlbumImage(username) {
            username = this.fixName(username);
            if (this.data.recenttracks[username]["track"][0]["album"]["image"] == undefined) {
                return "";
            }
            let albumImage = this.data.recenttracks[username]["track"][0]["album"]["image"][3]["#text"] ?? "";
            let albumImageURL = albumImage?.replace(/url\((['"])?(.*?)\1\)/gi, '$2').split(',')[0];
            if (albumImageURL == "" || albumImageURL == "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png") {
                albumImageURL = "";
            }
            return albumImageURL;
        }
            

        async getAlbumImage(username) {
            let trackImage = this.getCurrentLastfmTrackImage(username);
            let albumImage = this.getCurrentLastfmAlbumImage(username);
            let artistImage = this.getCurrentLastfmArtistImage(username);
            let altArtistImage = await this.getArtistAlternative(this.data.recenttracks[username]["track"][0]["artist"]["#text"]);
            let altArtistImageURL = altArtistImage['alt_artistimage'];
            let youtubeSongInfo = await this.getYoutubeSongInfo(this.data.recenttracks[username]["track"][0]["name"],this.data.recenttracks[username]["track"][0]["artist"]["#text"]);


            // Set youtube url
            let box = document.querySelector(".nowplay-box-" + this.fixName(username));
            box.querySelector(".yt-icon-play").querySelector("a").href = "https://music.youtube.com/watch?v=" + youtubeSongInfo['url'];
            box.querySelector(".yt-icon-play").querySelector("a").target = "_blank";
            // Use trackimg>official yt>unofficialyt>artistimg>altartistimg
            //Remove zoom class from the image
            if (box.querySelector(".nowplay-cover").classList.contains("cover-zoom")) {
                box.querySelector(".nowplay-cover").classList.remove("cover-zoom");
            }
            if (trackImage != "") {
                console.log("[YAMILISTEN] Using track image for " + username);
                return trackImage;
            }else if (youtubeSongInfo['cover'] != "" && youtubeSongInfo['official'] == true) {
                console.log("[YAMILISTEN] Using official youtube image for " + username);
                // Add zoom class to the image
                box.querySelector(".nowplay-cover").classList.add("cover-zoom");
                return youtubeSongInfo['cover'];
            }else if (youtubeSongInfo['cover'] != "" && youtubeSongInfo['official'] == false) {
                console.log("[YAMILISTEN] Using unofficial youtube image for " + username);
                // Add zoom class to the image
                box.querySelector(".nowplay-cover").classList.add("cover-zoom");
                return youtubeSongInfo['cover'];
            }else if (albumImage != "") {
                console.log("[YAMILISTEN] Using album image for " + username);
                return albumImage;
            }else if (artistImage != "") {
                console.log("[YAMILISTEN] Using artist image for " + username);
                return artistImage;
            }else if (altArtistImageURL != "") {
                console.log("[YAMILISTEN] Using alternative artist image for " + username);
                return altArtistImageURL;
            }else{
                console.log("[YAMILISTEN] Using default image for " + username);
                return "https://lastfm.freetls.fastly.net/i/u/300x300/c6f59c1e5e7240a4c0d427abd71f3dbb.jpg";
            }
        }


        getListeningEpoch(username) {
            username = this.fixName(username);
            //Handle no song 
            if (this.data.recenttracks[username]["track"][0] == undefined) {
                console.log("[YAMILISTEN] User " + username + " doesn't have the song, skipping get listening epoch");
                return 0;
            }
            //'epoch' => isset($track['date']['uts']) ? $track['date']['uts'] : '',
            //this date array can be gone if the user is listening to the song right now
            if (this.data.recenttracks[username]["track"][0]["date"] == undefined) {
                return 0;
            }else{
                return parseInt(this.data.recenttracks[username]["track"][0]["date"]["uts"]) ?? 0;
            }
        }


        // Fix name that has space or invalid characters to underscore and dot
        fixName(name) {
            return name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        }


        showScreen(screen,hideAll=true) {
            if (hideAll) {
                this.hideAllScreen();
            }

            // Show the screen
            document.querySelector(screen).style.display = "flex";
        }

        hideAllScreen() {
            for (let key in this.screen) {
                document.querySelector(this.screen[key]).style.display = "none";
            }
        }

        showPart(part,hideAll=false) {
            if (hideAll) {
                this.hideAllPart();
            }
            document.querySelector(part).style.display = "flex";
        }

        hidePart(part) {
            document.querySelector(part).style.display = "none";
        }

        hideAllPart() {
            for (let key in this.part) {
                document.querySelector(this.part[key]).style.display = "none";
            }
        }

        changeLoadingText(text,line) {
            document.querySelector(this.part.loaddetail).querySelectorAll("h2")[line].textContent = text;
            console.log("[YAMILISTEN] Changed loading text to " + text + " (Line " + line + ")");
        }


        getCookie(name) {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.startsWith(name + '=')) {
                    return cookie.substring(name.length + 1);
                }
            }
            return null;
        }


        /**
         * Convert the username to unique ID that can be used in CSS
         *
         * @param {*} id
         * @return {*} 
         * @memberof yaminowplaying
         */
        convertToUniqueID(id) {
            // Convert to lowercase and replace invalid CSS characters
            id = id.toLowerCase().replace(/[^a-z0-9]/g, '_');
            // Encode as Base64 and remove padding characters
            return 'ynp_' + btoa(id).replace(/=+$/, '');
        }

        timeDiff(epoch=0) {
            if (epoch == 0) {
                return 0;
            }
            let now = new Date();
            let then = new Date(epoch * 1000);
            let diff = now - then;
            return diff;
        }


        async getYoutubeSongInfo(songname,artistname) {
            // It's will return this:
            // {
            //     "url": "HGctE60B3J8",
            //     "cover": "https://i.ytimg.com/vi/HGctE60B3J8/hqdefault.jpg",
            //     "official": true
            // }
            // If the song is not found, it will error 400
            // Same endpoint as apicoverurl
            
            var query = songname + " " + artistname;
            var originalQuery = query;
            var cacheData = null;

            await this.getCache(query, 'youtube', 86400000)
            .then(value => {
                console.log('[YAMILISTEN] Cache has value present:', value);
                cacheData = value;
            })
            .catch(error => {
                console.error('[YAMILISTEN] Error:', error);
            }
            );

            if (cacheData !== null) {
                console.log('[YAMILISTEN] Youtube data found in cache');
                console.log('[YAMILISTEN] Using cached youtube data:', cacheData);
                return cacheData;
            }else{
                query = encodeURIComponent(query);
                let selfkey = btoa(String(Math.floor(Date.now() / 1000))+"*desuwa");
                const url = this.data.apicoverurl + '?artist=' + artistname + '&song=' + songname + '&mode=1&selfkey=' + selfkey;
                const response = await fetch(url);
            
                // Check if the response is valid JSON
                if (!response.ok) {
                    console.log('[YAMILISTEN] Youtube data is empty');
                    return {
                        url: '',
                        cover: '',
                        official: false
                    };
                }
                console.log('[YAMILISTEN] Youtube data finished fetching');
                console.log('[YAMILISTEN] Youtube data:', response);
                const data = await response.json();
            
                const youtubeData = {
                    url: data.url || '',
                    cover: data.cover || '',
                    official: data.official || false
                };
            
                this.setCache(originalQuery, youtubeData, 'youtube');
                console.log('[YAMILISTEN] Youtube data:', youtubeData);
                return youtubeData;
            }
        }
            



        async getArtistAlternative(artist) {
            var originalArtist = artist;

            // Remove all the items in the list
            artist = artist.replace(this.remove, '');

            var cacheData = null;

            await this.getCache(originalArtist, 'artist_alt', 86400000*60)
            .then(value => {
                console.log('[YAMILISTEN] Cache has value present:', value);
                cacheData = value;
            })
            .catch(error => {
                console.error('[YAMILISTEN] Error:', error);
            });

        
            
            if (cacheData !== null) {
                console.log('[YAMILISTEN] Artist alternative data found in cache');
                console.log('[YAMILISTEN] Using cached artist alternative data:', cacheData);
                return cacheData;
            }else{
                artist = encodeURIComponent(artist);
                let selfkey = btoa(String(Math.floor(Date.now() / 1000))+"*desuwa");
                const url = this.data.apicoverurl + '?artist=' + artist + '&mode=0&selfkey=' + selfkey;
                const response = await fetch(url);
            
                // Check if the response is valid JSON
                if (!response.ok) {
                    console.log('[YAMILISTEN] Artist alternative data is empty');
                    return {
                        alt_name: 'DEEZER_IS_DOWN',
                        alt_artistimage: ''
                    };
                }
                console.log('[YAMILISTEN] Artist alternative data finished fetching');
                console.log('[YAMILISTEN] Artist alternative data:', response);
                const data = await response.json();
            
                let bestMatchIndex = -1;
                let maxMatchCount = 0;
                let minNameLength = Number.MAX_SAFE_INTEGER; // Initialize with a large value
            
                if (data.data) {
                    for (let index = 0; index < data.data.length; index++) {
                        const artistData = data.data[index];
            
                        if (artistData.name) {
                            const currentName = artistData.name;
                            const currentMatchCount = this.similarText(artist, currentName);
                            const currentNameLength = currentName.length;
            
                            // Check if the current name can be rearranged to match the input artist name
                            const isRearrangeable = this.isRearrangeableMatch(artist, currentName);
            
                            // Check if it's a rearranged match, and if so, prioritize it
                            if (isRearrangeable) {
                                bestMatchIndex = index;
                                break;
                            }
            
                            // If it's not a rearranged match, check other criteria
                            if (
                                currentMatchCount > maxMatchCount ||
                                (currentMatchCount === maxMatchCount && currentNameLength < minNameLength)
                            ) {
                                maxMatchCount = currentMatchCount;
                                minNameLength = currentNameLength;
                                bestMatchIndex = index;
                            }
                        }
                    }
                }
            
                const artistData = bestMatchIndex !== -1 ? data.data[bestMatchIndex] : {};
            
                const artistInfo = {
                    alt_name: artistData.name || '',
                    alt_artistimage: artistData.picture_big || ''
                };
            
                this.setCache(originalArtist, artistInfo, 'artist_alt');
                console.log('[YAMILISTEN] Artist alternative data:', artistInfo);
                return artistInfo;
            }
        

        }

        // init the indexedDB
        initDB() {
            // Create the database
            const request = indexedDB.open('yaminowplaying', 1);

            // Create the object store
            request.onupgradeneeded = () => {
                console.log('[YAMILISTEN] Creating object store');
                const db = request.result;
                db.createObjectStore('cache');
            };

            // Handle errors
            request.onerror = () => {
                console.error('[YAMILISTEN] Error opening indexedDB');
            };

            // Handle success
            request.onsuccess = () => {
                this.db = request.result;
                console.log('[YAMILISTEN] IndexedDB opened successfully');
            };
        }


        // Set cache
        setCache(key, value, type) {
            if (!this.db) {
                console.log('[YAMILISTEN] Cannot set cache, indexedDB is not initialized');
                return;
            }

            let time = Date.now();

            //Convert the key to base64
            key = btoa(unescape(encodeURIComponent(key)));
            const transaction = this.db.transaction(['cache'], 'readwrite');
            const objectStore = transaction.objectStore('cache');

            const request = objectStore.put({
                key,
                value,
                type,
                time
            }, key);

            request.onerror = () => {
                console.error('[YAMILISTEN] Error setting cache');
            };

            request.onsuccess = () => {
                console.log('[YAMILISTEN] Cache set successfully for key', key);
                console.log('[YAMILISTEN] Cache value:', value);
            };
        }


        // Get cache
        getCache(key, type, time = 0) {
            return new Promise((resolve, reject) => {
                if (!this.db) {
                    console.log('[YAMILISTEN] Cannot get cache, indexedDB is not initialized');
                    reject('[YAMILISTEN] Cannot get cache, indexedDB is not initialized');
                    return;
                }

                let originalKey = key;

                key = btoa(unescape(encodeURIComponent(key)));
                console.log('[YAMILISTEN] Looking for cache for (' + originalKey + ') '+ key);
                const transaction = this.db.transaction(['cache'], 'readonly');
                const objectStore = transaction.objectStore('cache');
                const request = objectStore.get(key);

                transaction.onerror = () => {
                    console.error('[YAMILISTEN] Error getting cache');
                    reject('[YAMILISTEN] Error getting cache');
                };

                transaction.oncomplete = () => {
                    const cache = request.result;
                    if (!cache) {
                        console.log('[YAMILISTEN] Cache not found for key', key);
                        resolve(null);
                        return;
                    }

                    const cacheTime = cache.time;
                    const currentTime = Date.now();
                    const isCacheExpired = cacheTime + time < currentTime;

                    if (isCacheExpired) {
                        console.log('[YAMILISTEN] Cache expired for key', key);
                        this.removeCache(key);
                        resolve(null);
                        return;
                    }

                    console.log('[YAMILISTEN] Cache found for key', key);
                    console.log(cache.value);
                    resolve(cache.value);
                };
            });
        }

        // Example usage:
        // getCache('yourKey', 'yourType', 60000)
        //     .then(value => {
        //         console.log('Received value:', value);
        //     })
        //     .catch(error => {
        //         console.error('Error:', error);
        //     });



        removeCache(key) {
            if (!this.db) {
                console.log('[YAMILISTEN] Cannot remove cache, indexedDB is not initialized');
                return;
            }

            //Convert the key to base64
            key = btoa(unescape(encodeURIComponent(key)));

            const transaction = this.db.transaction(['cache'], 'readwrite');
            const objectStore = transaction.objectStore('cache');
            const request = objectStore.delete(key);

            request.onerror = () => {
                console.error('[YAMILISTEN] Error removing cache');
            };

            request.onsuccess = () => {
                console.log('[YAMILISTEN] Cache removed successfully for key', key);
            };
        }

        
        isRearrangeableMatch(input, compareName) {
            // Convert both strings to lowercase to perform a case-insensitive check
            input = input.toLowerCase();
            compareName = compareName.toLowerCase();
        
            // Check if the input is a single word
            if (input.indexOf(' ') === -1) {
                return false; // Single-word input cannot be rearranged
            }
        
            // Split the input into words
            const inputWords = input.split(' ');
        
            // Check if there are exactly two words (first name and last name)
            if (inputWords.length !== 2) {
                return false; // More than two words cannot be rearranged
            }
        
            // Swap the words and join them without a space
            const swapName = inputWords[1] + inputWords[0];
        
            // Compare the name and input, and swapName and input
            return input === compareName || swapName === compareName;
        }


        similarText(str1, str2) {
            if (typeof str1 !== 'string' || typeof str2 !== 'string') {
                throw new Error('Input parameters must be strings');
            }
        
            str1 = str1.toLowerCase();
            str2 = str2.toLowerCase();
        
            const length1 = str1.length;
            const length2 = str2.length;
        
            const matrix = new Array(length1 + 1).fill(null).map(() => new Array(length2 + 1).fill(0));
        
            for (let i = 0; i <= length1; i++) {
                for (let j = 0; j <= length2; j++) {
                    if (i === 0 || j === 0) {
                        matrix[i][j] = 0;
                    } else if (str1[i - 1] === str2[j - 1]) {
                        matrix[i][j] = matrix[i - 1][j - 1] + 1;
                    } else {
                        matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
                    }
                }
            }
        
            const longestCommonSubsequence = matrix[length1][length2];
        
            // Calculate similarity percentage
            const similarity = (2 * longestCommonSubsequence) / (length1 + length2) * 100;
        
            return similarity;
        }


        timeSinceMin(epoch) {
            // Format: 00:00 (Minutes:Seconds)
            // No hours because it's not needed, just count as minutes
            const currentTime = Math.floor(Date.now() / 1000);
            const diffInSeconds = currentTime - epoch;
        
            if (epoch === undefined || epoch === "" || diffInSeconds < 60) {
                return "ฟังอยู่ตอนนี้";
            }
        
            const minutes = Math.floor(diffInSeconds / 60);
            const seconds = diffInSeconds % 60;

            console.log("[YAMILISTEN] Debug Song time: " + diffInSeconds + " Current time: " + currentTime + " Song current: " + epoch);
        
            return minutes.toString().padStart(2, '0') + ":" + seconds.toString().padStart(2, '0');
        }
        
        

        timeSince(epoch) {
            let diff = this.timeDiff(epoch);            
            let seconds = Math.floor(diff / 1000);
            let minutes = Math.floor(seconds / 60);
            let hours = Math.floor(minutes / 60);
            let days = Math.floor(hours / 24);
            let weeks = Math.floor(days / 7);
            let months = Math.floor(days / 30);
            let years = Math.floor(days / 365);

            // If the epoch is undefined or empty or the difference is less than 1 minutes
            if (epoch == undefined || epoch == "" || seconds < 60) {
                return "ฟังอยู่ตอนนี้";
            }
            if (years > 0) {
                return years + " ปีที่แล้ว";
            } else if (months > 0) {
                return months + " เดือนที่แล้ว";
            } else if (weeks > 0) {
                return weeks + " สัปดาห์ที่แล้ว";
            } else if (days > 0) {
                return days + " วันที่แล้ว";
            } else if (hours > 0) {
                return hours + " ชั่วโมงที่แล้ว";
            } else if (minutes > 0) {
                return minutes + " นาทีที่แล้ว";
            } else {
                return "ฟังอยู่ตอนนี้";
            }
        }
}
//If in the test environment, do not run the code
//if url contains post.php add testenv flag
if(window.location.href.indexOf("preview") == -1){
    var app = new yaminowplaying();

}else{
    console.log("Test environment detected - not running code");
}
































// REF only from V1
// Obsolete

        // createNowPlayingBox(id, data) {
        //     id = this.convertToUniqueID(id);
        //     // Clone the template
        //     let box = document.querySelector(this.element.template).cloneNode(true);
        //     box.classList.add("nowplay-box");
        //     box.classList.add("nowplay-box-" + id);
        //     box.classList.add("animated");
        //     box.classList.add("bounceInUp");
        //     box.querySelector(".nowplay-name").querySelector("h2").textContent = data.name;
        //     box.querySelector(".nowplay-avatar").style.backgroundImage = "url(" + data.image + ")";
        //     box.querySelector(".nowplay-songinfo").classList.add("animated");
        //     box.querySelector(".nowplay-songinfo").classList.add("slideInUp");
        //     box.style.display = "flex";
        //     box.style.visibility = "visible";
        //     document.querySelector(this.element.listarea).appendChild(box);
        //     console.log("[WAYI] Created box for " + id + ' (' + data.name + ')');

        //     //[1.0.6.001] Add event listener to the nowplay-usernamebox to go to the user's profile
        //     box.querySelector(".nowplay-usernamebox").addEventListener("click", () => {
        //         console.log("[WAYI] Go to " + id + ' (' + data.name + ') profile');
        //         window.open(data.url, '_blank');
        //     });

        //     //[1.0.6.001] Add event listener to the nowplay-songinfo to go to the track's page
        //     box.querySelector(".nowplay-songinfo").addEventListener("click", () => {
        //         this.navigateToTrackPage(data.name);
        //     });

        //     //[1.0.6.001] Add cursor pointer to the nowplay-usernamebox and nowplay-songinfo
        //     box.querySelector(".nowplay-usernamebox").style.cursor = "pointer";
        //     box.querySelector(".nowplay-songinfo").style.cursor = "pointer";

        // }



        // //[1.0.6.001] Because of <a> breaks the element in UI, we need to use this function to navigate to the track's page instead
        // navigateToTrackPage(username){
        //     try{
        //         //Get data from currentData
        //         var data = this.data.currentData;
        //         //Get the track data
        //         var track = data[username][0];
        //         //Navigate to the track page
        //         window.open(track.URL, '_blank');
        //     }catch(error){
        //         console.log("[WAYI] Error while navigating to track page: " + error + " With username: " + username);
        //         console.log(data);
        //     }
        // }

        // updateNowPlayingBox(id, data) {
        //     // normalize the id to lowercase
        //     id = this.convertToUniqueID(id);
        //     let box = document.querySelector(".nowplay-box-" + id);
        //     // Retreive the current data
        //     let currentTitle = box.querySelector(".nowplay-title").querySelector("h2").textContent;
        //     let currentArtist = box.querySelector(".nowplay-artist").querySelector("h2").textContent;
        //     let currentAlbum = box.querySelector(".nowplay-album").querySelector("h2").textContent;
        //     let currentImage = window.getComputedStyle(box.querySelector(".nowplay-cover")).backgroundImage;
        //     let currentImageURL = currentImage.replace(/url\((['"])?(.*?)\1\)/gi, '$2').split(',')[0];
        //     // let currentURL = box.querySelector(".nowplay-icon").querySelector("a").href;
        //     let albumImage = this.albumImage(data,id);
        //     // If the data is the same as the current data, skip the update
        //     if (currentTitle == data.track && currentArtist == data.artist && currentAlbum == data.album && currentImageURL == albumImage) {
        //         console.log("[WAYI] Skipped box for " + id + ' (' + data.track + ') because the data is the same');
        //         return;
        //     }
        //     //Else update the box
        //     if (currentTitle != data.track) {
        //         box.querySelector(".nowplay-title").querySelector("h2").textContent = data.track
        //         // If track is updated, Hide and show the title to make the animation
        //         box.querySelector(".nowplay-songinfo").style.display = "none";
        //         box.querySelector(".nowplay-songinfo").style.visibility = "hidden";
        //         setTimeout(() => {
        //             box.querySelector(".nowplay-songinfo").style.display = "flex";
        //             box.querySelector(".nowplay-songinfo").style.visibility = "visible";
        //         }, 100);

        //         //[1.0.7.001] Update the yt-icon-play link to the current track
        //         if(data.yt_cover_image.url != undefined){
        //             box.querySelector(".yt-icon-play").querySelector("a").href = "https://music.youtube.com/watch?v=" + data.yt_cover_image.url;
        //             box.querySelector(".yt-icon-play").querySelector("a").target = "_blank";
        //         }else{
        //             box.querySelector(".yt-icon-play").querySelector("a").href = "https://music.youtube.com/search?q=" + data.track + " " + data.artist;
        //             box.querySelector(".yt-icon-play").querySelector("a").target = "_blank";
        //         }
                
        //     }else{
        //         console.log("[WAYI] Skipped title update for " + id + ' (' + data.track + ') because the data is the same');
        //     }
        //     if (currentArtist != data.artist) {
        //         box.querySelector(".nowplay-artist").querySelector("h2").textContent = data.artist
        //     }else{
        //         console.log("[WAYI] Skipped artist update for " + id + ' (' + data.track + ') because the data is the same');
        //     }
        //     if (currentAlbum != data.album) {
        //         box.querySelector(".nowplay-album").querySelector("h2").textContent = data.album
        //     }else{
        //         console.log("[WAYI] Skipped album update for " + id + ' (' + data.track + ') because the data is the same');
        //     }
        //     if (currentImageURL != albumImage) {
        //         box.querySelector(".nowplay-cover").style.backgroundImage = "url(" + albumImage + ")";
        //     }else{
        //         console.log("[WAYI] Skipped album image update for " + id + ' (' + data.track + ') because the data is the same');
        //     }

        //     // box.querySelector(".nowplay-cover").style.backgroundImage = "url(" + (data.album_image ? data.album_image : data.alt_artist_image) + ")";
        //     let timetext = this.timeSince(data.epoch);
        //     let timediff = (this.timeDiff(data.epoch)/1000);
        //     if (timetext == "ฟังอยู่ตอนนี้") {
        //         console.log("[WAYI] " + id + " is now playing (" + data.track + " - " + data.artist + ")");
        //         box.classList.add("ynp-playing");
        //     } else if (timediff < 180) { 
        //         console.log("[WAYI] " + id + " is playing (" + data.track + " - " + data.artist + ") recently");
        //         box.classList.add("ynp-playing");
        //     }
        //     else {
        //         box.classList.remove("ynp-playing");
        //     }
                
        //     box.querySelector(".nowplay-time").querySelector("h2").textContent = timetext
        //     // box.querySelector(".nowplay-icon").querySelector("a").href = data.URL;
        //     // box.querySelector(".nowplay-icon").querySelector("a").target = "_blank";
        //     console.log("[WAYI] Updated box for " + id + ' (' + data.track + ')');
        // }


        // albumImage(data,id="Not Specified") {
        //     //[1.0.7.001] Add yt_cover_image to the priority
        //     //The priority is yt(official) > image > album_image > yt (Unoffical) > alt_artist_image
        //     if(data.yt_cover_image.offical == true){
        //         console.log("[WAYI] Using Youtube official image for " + id + ' (' + data.track + ')');
        //         // Add zoom class to the cover because the image having black bar on the top and bottom
        //         if(id != "Not Specified"){
        //             document.querySelector(".nowplay-box-" + id).querySelector(".nowplay-cover").classList.add("cover-zoom");
        //         }else{
        //             console.log("[WAYI] ID is not specified, skipping adding zoom class");
        //         }
        //         return data.yt_cover_image.cover;
        //     }    
        //     else if (data.image && data.image != "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png") {
        //         console.log("[WAYI] Using image for " + id + ' (' + data.track + ')');
        //         if(id != "Not Specified"){
        //             document.querySelector(".nowplay-box-" + id).querySelector(".nowplay-cover").classList.remove("cover-zoom");
        //         }else{
        //             console.log("[WAYI] ID is not specified, skipping removing zoom class");
        //         }
        //         return data.image;
                
                
        //     } 
        //     else if (data.album_image) {
        //         console.log("[WAYI] Using album image for " + id + ' (' + data.track + ')');
        //         if(id != "Not Specified"){
        //             document.querySelector(".nowplay-box-" + id).querySelector(".nowplay-cover").classList.remove("cover-zoom");
        //         }else{
        //             console.log("[WAYI] ID is not specified, skipping removing zoom class");
        //         }
        //         return data.album_image;
        //     }
        //     else if(data.yt_cover_image.url != undefined){
        //         console.log("[WAYI] Using Youtube unofficial image for " + id + ' (' + data.track + ')');
        //         if(id != "Not Specified"){
        //             document.querySelector(".nowplay-box-" + id).querySelector(".nowplay-cover").classList.add("cover-zoom");
        //         }else{
        //             console.log("[WAYI] ID is not specified, skipping adding zoom class");
        //         }
        //         return data.yt_cover_image.cover;
        //     }
        //     else if (data.alt_artist_image) {
        //         console.log("[WAYI] Fallback Using alt artist image for " + id + ' (' + data.track + ')');
        //         if(id != "Not Specified"){
        //             document.querySelector(".nowplay-box-" + id).querySelector(".nowplay-cover").classList.remove("cover-zoom");
        //         }else{
        //             console.log("[WAYI] ID is not specified, skipping removing zoom class");
        //         }
        //         return data.alt_artist_image;
        //     }
        //     else{
        //         console.log("[WAYI] Fallback Using default image for " + id + ' (' + data.track + ')');
        //         if(id != "Not Specified"){
        //             document.querySelector(".nowplay-box-" + id).querySelector(".nowplay-cover").classList.remove("cover-zoom");
        //         }else{
        //             console.log("[WAYI] ID is not specified, skipping removing zoom class");
        //         }
        //         return "https://lastfm.freetls.fastly.net/i/u/300x300/c6f59c1e5e7240a4c0d427abd71f3dbb.jpg";
        //     }
        // }





        // removeNowPlayingBox(id) {
        //     id = this.convertToUniqueID(id);
        //     let box = document.querySelector(".nowplay-box-" + id);
        //     box.remove();
        //     console.log("[WAYI] Removed box for " + id);
        // }

        // removeAllNowPlayingBox() {
        //     let boxes = document.querySelectorAll(".nowplay-box");
        //     boxes.forEach(box => {
        //         box.remove();
        //     });
        //     console.log("[WAYI] Removed all boxes");
        // }



        // updateDataFromAPI(){
        //     fetch(this.data.path + this.data.username)
        //     .then(response => response.json())
        //     .then(data => {
        //         // Hide loading (invisible)
        //         document.querySelector(this.element.loading).style.display = "none";
        //         this.compare(data);
        //     });

        // }

        // reinit() {
        //     this.data.lastData = [];
        //     this.data.currentData = [];
        // }

        // init(){
        //     // Show loading (visible)
        //     document.querySelector(this.element.loading).style.display = "flex";
        //     this.updateDataFromAPI();
        //     setInterval(() => {
        //         this.updateDataFromAPI();
        //     }, 10000);

        // }

        // compare(data) {
        //     this.data.currentData = data;
        //     // If last data and current data is the same, skip the update
        //     if (JSON.stringify(this.data.lastData) === JSON.stringify(this.data.currentData)) {
        //         console.log("[WAYI] Skipped data update because the data is the same");
        //         return;
        //     }
        //     if (data !== this.data.lastData) {
        //         if (typeof this.data.createdBox[data.self.name] === 'undefined') {
        //             this.createSelfBox(data);
        //             this.data.createdBox[data.self.name] = true;
        //         }
        //         // {self.username} , data.{self.username}
        //         this.updateNowPlayingBox(data.self.name, data[data.self.name][0]);
        //         data.friends.forEach(friend => {
        //             // Compare the last data and current data
        //                 //if data[friend.name][0] is undefined that means the data limit is reached (skip the user)
        //                 if (typeof data[friend.name] === 'undefined') {
        //                     console.log("[WAYI] Skipped " + friend.name + " because of data limit reached (Backend limit)");
        //                     // Show the error message from data[error] if it's not undefined
        //                     if (typeof data.error !== 'undefined') {
        //                         console.log("[WAYI] Error from backend: " + data.error);
        //                     }
        //                     return;
        //                 }
        //                 if (typeof this.data.createdBox[friend.name] === 'undefined') {
        //                     this.createNowPlayingBox(friend.name, friend);
        //                     this.data.createdBox[friend.name] = true;
        //                 }
        //                 this.updateNowPlayingBox(friend.name, data[friend.name][0]);
        //                 // if "" that means the user is playing something now so set the epoch to current epoch
        //                 let currentEpoch = data[friend.name][0].epoch == "" ? Math.floor(Date.now() / 1000) : data[friend.name][0].epoch;
        //                 this.data.epochList[friend.name] = currentEpoch;
        //             });

        //         this.changeElementOrder();
        //         this.data.lastData = this.data.currentData;
        //     }
        // }

        // orderByEpoch() {
        //     let sorted = [];
        //     for (let key in this.data.epochList) {
        //         sorted.push([key, this.data.epochList[key]]);
        //     }
        //     sorted.sort(function(a, b) {
        //         return a[1] - b[1];
        //     });
        //     return sorted.reverse();
        // }


        // changeElementOrder() {
        //     let sorted = this.orderByEpoch();
        //     this.data.currentOrder = sorted;
        //     if (JSON.stringify(this.data.lastOrder) === JSON.stringify(this.data.currentOrder)) {
        //         console.log("[WAYI] Skipped order update because the order is the same");
        //         return;
        //     }
        //     let boxes = document.querySelectorAll(".nowplay-box");
        //     sorted.forEach((item, index) => {
        //         let box = document.querySelector(".nowplay-box-" + this.convertToUniqueID(item[0]));
        //         box.style.order = index;
        //         console.log("[WAYI] Changed order of " + item[0] + ' (' + this.convertToUniqueID(item[0]) + ') to ' + index);
        //     });
        //     this.data.lastOrder = this.data.currentOrder;
        // }


        // createSelfBox(data) {
        //     this.createNowPlayingBox(data.self.name, data.self);
        // }

        // changeUser(username) {
        //     this.data.username = username;
        //     this.reinit();
        // }






// // ?username=Nicezki
// try {
//     var username = window.location.search.split('username=')[1];
// } catch (error) {
//     var username = "Nicezki";
// }

// if (username == undefined) {
//     username = "Nicezki";
// }

// var app = new yaminowplaying(username);