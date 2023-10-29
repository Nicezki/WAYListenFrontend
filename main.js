// WHAT ARE YOU LISTENING
// BY NICEZKI
// BASED ON LAST.FM API
// VERSION 1.0.3.001
class yaminowplaying {
    constructor(username="Nicezki") {
        this.element = {
            template : ".nowplay-box",
            listarea : ".nowplay-listarea",
            loading : ".wait-loading"
        }
        this.data = {
            // Lastfm Friends
            path : "https://playgrounds.nicezki.com/api/v1/lastfmplay/?username=",
            username : username,
            lastData : [],
            currentData : [],
            createdBox : [],
            epochList : []
        }

        this.init();
    }


    // <style>
    // .ynp-playing {
    //     "background-color" : "#b9075e";
    // }
    // </style>


    

        convertToUniqueID(id) {
            // Convert to lowercase and replace invalid CSS characters
            id = id.toLowerCase().replace(/[^a-z0-9]/g, '_');
            // Encode as Base64 and remove padding characters
            return 'ynp_' + btoa(id).replace(/=+$/, '');
        }


        createNowPlayingBox(id, data) {
            id = this.convertToUniqueID(id);
            // Clone the template
            let box = document.querySelector(this.element.template).cloneNode(true);
            box.classList.add("nowplay-box");
            box.classList.add("nowplay-box-" + id);
            box.querySelector(".nowplay-name").querySelector("h2").textContent = data.name;
            box.querySelector(".nowplay-avatar").style.backgroundImage = "url(" + data.image + ")";
            box.style.display = "flex";
            document.querySelector(this.element.listarea).appendChild(box);
            console.log("[WAYI] Created box for " + id + ' (' + data.name + ')');
        }

        updateNowPlayingBox(id, data) {
            // normalize the id to lowercase
            id = this.convertToUniqueID(id);
            let box = document.querySelector(".nowplay-box-" + id);
            box.querySelector(".nowplay-title").querySelector("h2").textContent = data.track
            box.querySelector(".nowplay-artist").querySelector("h2").textContent = data.artist
            box.querySelector(".nowplay-album").querySelector("h2").textContent = data.album
            box.querySelector(".nowplay-cover").style.backgroundImage = "url(" + (data.album_image ? data.album_image : data.alt_artist_image) + ")";
            let timetext = this.timeSince(data.epoch);
            if (timetext == "ฟังอยู่ตอนนี้") {
                box.classList.add("ynp-playing");
            } else {
                box.classList.remove("ynp-playing");
            }
                
            box.querySelector(".nowplay-time").querySelector("h2").textContent = timetext
            box.querySelector(".nowplay-icon").querySelector("a").href = data.URL;
            box.querySelector(".nowplay-icon").querySelector("a").target = "_blank";
            console.log("[WAYI] Updated box for " + id + ' (' + data.track + ')');
        }


        timeSince(epoch) {
            if (epoch == undefined || epoch == "") {
                return "ฟังอยู่ตอนนี้";
            }
            let now = new Date();
            let then = new Date(epoch * 1000);
            let diff = now - then;
            let seconds = Math.floor(diff / 1000);
            let minutes = Math.floor(seconds / 60);
            let hours = Math.floor(minutes / 60);
            let days = Math.floor(hours / 24);
            let weeks = Math.floor(days / 7);
            let months = Math.floor(days / 30);
            let years = Math.floor(days / 365);
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


        removeNowPlayingBox(id) {
            id = this.convertToUniqueID(id);
            let box = document.querySelector(".nowplay-box-" + id);
            box.remove();
            console.log("[WAYI] Removed box for " + id);
        }

        removeAllNowPlayingBox() {
            let boxes = document.querySelectorAll(".nowplay-box");
            boxes.forEach(box => {
                box.remove();
            });
            console.log("[WAYI] Removed all boxes");
        }



        updateDataFromAPI(){
            fetch(this.data.path + this.data.username)
            .then(response => response.json())
            .then(data => {
                // Hide loading (invisible)
                document.querySelector(this.element.loading).style.display = "none";
                this.compare(data);
            });

        }

        reinit() {
            this.data.lastData = [];
            this.data.currentData = [];
        }

        init(){
            // Show loading (visible)
            document.querySelector(this.element.loading).style.display = "flex";
            this.updateDataFromAPI();
            setInterval(() => {
                this.updateDataFromAPI();
            }, 10000);

        }

        compare(data) {
            this.data.currentData = data;
            if (data !== this.data.lastData) {
                if (typeof this.data.createdBox[data.self.name] === 'undefined') {
                    this.createSelfBox(data);
                    this.data.createdBox[data.self.name] = true;
                }
                // {self.username} , data.{self.username}
                this.updateNowPlayingBox(data.self.name, data[data.self.name][0]);
                data.friends.forEach(friend => {
                        //if data[friend.name][0] is undefined that means the data limit is reached (skip the user)
                        if (typeof data[friend.name] === 'undefined') {
                            console.log("[WAYI] Skipped " + friend.name + " because of data limit reached (Backend limit)");
                            // Show the error message from data[error] if it's not undefined
                            if (typeof data.error !== 'undefined') {
                                console.log("[WAYI] Error from backend: " + data.error);
                            }
                            return;
                        }
                        if (typeof this.data.createdBox[friend.name] === 'undefined') {
                            this.createNowPlayingBox(friend.name, friend);
                            this.data.createdBox[friend.name] = true;
                        }
                        
                        this.updateNowPlayingBox(friend.name, data[friend.name][0]);
                        // if "" that means the user is playing something now so set the epoch to current epoch
                        let currentEpoch = data[friend.name][0].epoch == "" ? Math.floor(Date.now() / 1000) : data[friend.name][0].epoch;
                        this.data.epochList[friend.name] = currentEpoch;
                    });

                this.changeElementOrder();
                this.data.lastData = this.data.currentData;
            }
        }

        orderByEpoch() {
            let sorted = [];
            for (let key in this.data.epochList) {
                sorted.push([key, this.data.epochList[key]]);
            }
            sorted.sort(function(a, b) {
                return a[1] - b[1];
            });
            return sorted.reverse();
        }


        changeElementOrder() {
            let sorted = this.orderByEpoch();
            let boxes = document.querySelectorAll(".nowplay-box");
            sorted.forEach((item, index) => {
                let box = document.querySelector(".nowplay-box-" + this.convertToUniqueID(item[0]));
                box.style.order = index;
                console.log("[WAYI] Changed order of " + item[0] + ' (' + this.convertToUniqueID(item[0]) + ') to ' + index);
            });
        }


        createSelfBox(data) {
            this.createNowPlayingBox(data.self.name, data.self);
        }

        changeUser(username) {
            this.data.username = username;
            this.reinit();
        }



}


// ?username=Nicezki
try {
    var username = window.location.search.split('username=')[1];
} catch (error) {
    var username = "Nicezki";
}

if (username == undefined) {
    username = "Nicezki";
}

var app = new yaminowplaying(username);

