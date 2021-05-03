// simple peer sends mediastream
let socket;

socket = io()
showRooms()
if (socket.username && socket.room) {
    checkBrowser()
    startVideoShare()
}

frm_create_room.addEventListener('submit', function(e) {
    e.preventDefault()
    if (username.value && rmid.value) {
        socket.username = username.value
        socket.room = rmid.value
        checkBrowser()
        startVideoShare()
        socket.emit('setUsername', {socketID: socket.id, username: username.value})
        videos.style.display = "block"
        roomInfo.style.display = "none"
    }
})

let localStream = null;
let streamType = 0 // 0: camera; 1: screen share
// usermedia constraints
let constraints = {
    audio: true,
    video: true
}
// constraints = {
//     audio: false,
//     video: {
//         facingMode: "user",
//         width: {min: 640, max: 1920, ideal: 1280},
//         height: {min: 480, ideal: 720, max: 1080}
//     }
// }
// the stream object used to send media
// all peer connections
let peers = {}
function startVideoShare() {
    // GET ROOM ID
    const roomID = socket.room
    
    // enabling the camera at startup
    // navigator.mediaDevices.getUserMedia(constraints).then(stream => {
    //     console.log('Received local stream', 'Camera')
    //     localVideo.srcObject = stream;
    //     localStream = stream;
    //     init()

    // }).catch(e => alert(`getusermedia error ${e}`))
    console.log(navigator.mediaDevices.getSupportedConstraints())
    // navigator.getUserMedia = navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
    navigator.mediaDevices.getUserMedia(constraints).then(stream => {
        console.log('Received local stream', 'Camera')
        localVideo.srcObject = stream;
        localStream = stream;
        init()

    }).catch(e => alert(`getusermedia error ${e}`))

    // init socket io connection
    function init() {
        socket.emit('join room', roomID)
        socket.on('initReceive', sockInfo => {
            console.log('INIT RECEIVE ' + sockInfo.id)
    
            addPeer(sockInfo.id, false, sockInfo.username)
            socket.emit('initSend', sockInfo.id)
        })

        socket.on('initSend', sockInfo => {
            console.log('INIT SEND ' + sockInfo.id)
            addPeer(sockInfo.id, true, sockInfo.username)
        })

        socket.on('removePeer', socket_id => {
            console.log('removing peer ' + socket_id)
            removePeer(socket_id)
        })

        socket.on('disconnect', () => {
            console.log('GOT DISCONNECTED')
            for (let socket_id in peers) {
                removePeer(socket_id)
            }
        })

        socket.on('signal', data => {
            peers[data.socket_id].signal(data.signal)
        })
    }


    // Creates a new peer connection and sets the event listeners
    // @param {String} socket_id 
    //                 ID of the peer
    // @param {Boolean} am_initiator 
    //                  Set to true if the peer initiates the connection process.
    //                  Set to false if the peer receives the connection. 
    function addPeer(socket_id, am_initiator, username) {
        
        peers[socket_id] = new SimplePeer({
            initiator: am_initiator,
            stream: localStream
        })
        peers[socket_id].username = username
        peers[socket_id].on('signal', data => {
            socket.emit('signal', {
                signal: data,
                socket_id: socket_id
            })
        })
        peers[socket_id].on('stream', stream => {
            // column
            let newCol = document.createElement("div")
            newCol.classList.add('col-sm-6')
            // card
            let newCard2 = document.createElement("div")
            newCard2.className = "card"

            // console.log('audio tracks', stream.getAudioTracks())
            // video element
            console.log("stream", stream)
            let newVid = document.createElement('video')
            newVid.srcObject = stream
            newVid.id = socket_id
            newVid.playsinline = false
            newVid.autoplay = true
            newVid.setAttribute('controls', true)
            newVid.setAttribute('disablepictureinpicture', true)
            newVid.setAttribute('controlslist', 'nodownload')
            newVid.classList.add("vid")
            newVid.classList.add("card-img-top")
            newVid.onclick = (e) => { e.preventDefault() }//openPictureMode(newVid)
            newVid.ontouchstart = (e) => { e.preventDefault()} //openPictureMode(newVid)
            // append video to card as card top
            newCard2.appendChild(newVid)
            
            // create card body
            let cardBody = document.createElement('div')
            cardBody.className = "card-body"

            // create card-title
            let cardTitle = document.createElement('h5')
            cardTitle.className = "card-title"

            // user name
            var textnode = document.createTextNode(username)

            cardTitle.appendChild(textnode)
            cardBody.appendChild(cardTitle)
            newCard2.appendChild(cardBody)

            newCol.appendChild(newCard2)
            peerVideo.appendChild(newCol)
        })
    }

    // open in PIP
    function openPictureMode(el) {
        console.log('opening pip')
        el.requestPictureInPicture()
    }

    localVideo.onclick = (e) => {
        e.preventDefault() 
        if(!isMobile()) {
            openPictureMode(localVideo)
            myVideo.style.display = "none"
        }
        // console.log(e)
    }

    localVideo.ontouchstart = (e) => {
        e.preventDefault()
        if(!isMobile()) {
            openPictureMode(localVideo)
        }
    }

    localVideo.addEventListener('pause', function(e) {
        localVideo.play();
    });

    localVideo.addEventListener('leavepictureinpicture', function() {
        myVideo.style.display = "block"
    })
}

function showRooms() {
    grouplist_join = document.getElementById('grouplist_join')

    socket.on('room list', response => {
        grouplist_join.innerHTML = ""
        if (response.length > 0) {
            for(let i = 0; i < response.length; i++) {
                var node = document.createElement("LI")
                node.classList.add('list-group-item')
                node.classList.add('select-group-li')
                node.id = "rmid" + response[i]
                
                var textnode = document.createTextNode("Room " + response[i])
                node.appendChild(textnode);
                node.onclick = function () {
                    var activeClass = document.getElementsByClassName('active')
                    console.log(activeClass.length)
                    if (activeClass.length > 0) {
                        activeClass[0].classList.remove('active')
                    }
                    document.getElementById('rmid'+response[i]).classList.add('active')
                    rmid.value = response[i]
                }
                
                grouplist_join.appendChild(node)
            }
        } else {
            var node = document.createElement("LI")
            node.classList.add('list-group-item')
            node.classList.add('text-center')
            var textnode = document.createTextNode('No Room Available')
            node.appendChild(textnode);    
            grouplist_join.appendChild(node)
        }
    })
}


// switch camera if 2 cameras are supported
function switchMedia() {
    if (constraints.video.facingMode.ideal === 'user') {
        constraints.video.facingMode.ideal = 'environment'
    } else {
        constraints.video.facingMode.ideal = 'user'
    }

    const tracks = localStream.getTracks();

    tracks.forEach(function (track) {
        track.stop()
    })

    localVideo.srcObject = null
    navigator.mediaDevices.getUserMedia(constraints).then(stream => {

        for (let socket_id in peers) {
            for (let index in peers[socket_id].streams[0].getTracks()) {
                for (let index2 in stream.getTracks()) {
                    if (peers[socket_id].streams[0].getTracks()[index].kind === stream.getTracks()[index2].kind) {
                        peers[socket_id].replaceTrack(peers[socket_id].streams[0].getTracks()[index], stream.getTracks()[index2], peers[socket_id].streams[0])
                        break;
                    }
                }
            }
        }

        localStream = stream
        localVideo.srcObject = stream

        updateButtons()
    })
}

// for share screen
function setScreen() {
    if (streamType === 1) {
        let ssConstraints = {
            audio: false, // mandatory.
            video: true, //{'mandatory': {'chromeMediaSource':'screen'}}
        };
        if (!isMobile()) {
            ssConstraints = {}
        }
        navigator.mediaDevices.getDisplayMedia(ssConstraints).then(stream => {
            for (let socket_id in peers) {
                for (let index in peers[socket_id].streams[0].getTracks()) {
                    for (let index2 in stream.getTracks()) {
                        if (peers[socket_id].streams[0].getTracks()[index].kind === stream.getTracks()[index2].kind) {
                            peers[socket_id].replaceTrack(peers[socket_id].streams[0].getTracks()[index], stream.getTracks()[index2], peers[socket_id].streams[0])
                            break;
                        }
                    }
                }

            }
            localStream = stream

            localVideo.srcObject = localStream
            socket.emit('removeUpdatePeer', '')
        })
        updateButtons()
    } else {
        navigator.mediaDevices.getUserMedia(constraints).then(stream => {
            for (let socket_id in peers) {
                for (let index in peers[socket_id].streams[0].getTracks()) {
                    for (let index2 in stream.getTracks()) {
                        if (peers[socket_id].streams[0].getTracks()[index].kind === stream.getTracks()[index2].kind) {
                            peers[socket_id].replaceTrack(peers[socket_id].streams[0].getTracks()[index], stream.getTracks()[index2], peers[socket_id].streams[0])
                            break;
                        }
                    }
                }

            }
            localStream = stream

            localVideo.srcObject = localStream
            socket.emit('removeUpdatePeer', '')
        })
        updateButtons()
    }
}

// remove / stop video stream
function removeLocalStream() {
    if (localStream) {
        const tracks = localStream.getTracks();

        tracks.forEach(function (track) {
            track.stop()
        })

        localVideo.srcObject = null
    }

    for (let socket_id in peers) {
        removePeer(socket_id)
    }
}

// microphone switch
function toggleMute() {
    for (let index in localStream.getAudioTracks()) {
        localStream.getAudioTracks()[index].enabled = !localStream.getAudioTracks()[index].enabled
        muteButton.innerText = localStream.getAudioTracks()[index].enabled ? "Unmuted" : "Muted"
    }
}

// enable/disable video
function toggleVid() {
    for (let index in localStream.getVideoTracks()) {
        
        localStream.getVideoTracks()[index].enabled = !localStream.getVideoTracks()[index].enabled
        if (localStream.getVideoTracks()[index].enabled === false) {
            screenshotButton.style.display = "none"
            // switchButton.style.display = "none"
        } else {
            screenshotButton.style.display = "inline-block"
            // switchButton.style.display = "inline-block"
        }
        vidButton.innerText = localStream.getVideoTracks()[index].enabled ? "Video Enabled" : "Video Disabled"
    }
}

// update video enable/disable button
function updateButtons() {
    for (let index in localStream.getVideoTracks()) {
        vidButton.innerText = localStream.getVideoTracks()[index].enabled ? "Video Enabled" : "Video Disabled"
    }
    for (let index in localStream.getAudioTracks()) {
        muteButton.innerText = localStream.getAudioTracks()[index].enabled ? "Unmuted" : "Muted"
    }
}

// remove peer 
function removePeer(socket_id) {

    let videoEl = document.getElementById(socket_id)
    if (videoEl) {

        const tracks = videoEl.srcObject.getTracks();

        tracks.forEach(function (track) {
            track.stop()
        })

        videoEl.srcObject = null
        videoEl.parentElement.parentElement.remove()
        videoEl.parentElement.remove()
        videoEl.parentNode.removeChild(videoEl)
    }
    if (peers[socket_id]) peers[socket_id].destroy()
    delete peers[socket_id]
}

const img = document.querySelector('#screenshot img');

const canvas = document.createElement('canvas');
screenshotButton.onclick = function() {
    takeSnap()
    .then(downloadSnap)
};

function takeSnap() {
    canvas.width = localVideo.videoWidth;
    canvas.height = localVideo.videoHeight;
    canvas.getContext('2d').drawImage(localVideo, 0, 0);

    // preview to page
    // img.src = canvas.toDataURL('image/webp');
    
    return new Promise((res, rej)=>{
        canvas.toBlob(res, 'image/jpeg');
    });
}
function downloadSnap(blob){
    // uses the <a download> to download a Blob
    if (!isMobile()) {
        let a = document.createElement('a'); 
        console.log(URL.createObjectURL(blob))
        a.href = URL.createObjectURL(blob);
        a.download = 'file:///C:/Users/ATOM/downloads/test123/screenshot.jpg';
        document.body.appendChild(a);
        a.click();
    } else {
        Android.sendData( URL.createObjectURL(blob));
    }
}

function checkBrowser() {
    let constraintObj = {video: true, audio: true}
     //handle older browsers that might implement getUserMedia in some way
    if (navigator.mediaDevices === undefined) {
        navigator.mediaDevices = {};
        navigator.mediaDevices.getUserMedia = function(constraintObj) {
            let getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
            if (!getUserMedia) {
                return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
            }
            return new Promise(function(resolve, reject) {
                getUserMedia.call(navigator, constraintObj, resolve, reject);
            });
        }
    }else{
        navigator.mediaDevices.enumerateDevices()
        .then(devices => {
            devices.forEach(device=>{
                console.log(device.kind.toUpperCase(), device.label);
                //, device.deviceId
            })
        })
        .catch(err=>{
            console.log(err.name, err.message);
        })
    }
}

function goFullscreen() {
    var element = localVideo;       
    if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
    } else if (element.webkitRequestFullScreen) {
      element.webkitRequestFullScreen();
    }
}
sharescreenButton.onclick = (e) => {
    if (streamType === 0) {
        streamType = 1
        sharescreenButton.innerHTML = "Show Video"
    } else {
        streamType = 0
        sharescreenButton.innerHTML = "Share Screen"
    }
    setScreen()
}
// webview.addEventListener('permissionrequest', function(e) {
//     if (e.permission === 'fullscreen') {
//         e.request.allow();
//     }
// })

function isMobile() {
    if ( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        return true
    }
    return false
}

function testEcho(p1){
    // document.write(p1);
    alert("LOADED")
    // let videoList = document.getElementsByClassName('vid')
    // if (videoList) {
    //     for(let x=0; x< Object.keys(videoList).length; x++) {
    //         videoList[x].play()
    //     }
    // }
}

function setAndroidStream(data) {
    // document.write( data);
    // alert(data)
    // var Sound = (function () {
    //     var df = document.createDocumentFragment();
    //     return function Sound(src) {
    //         var snd = new Audio(src);
    //         df.appendChild(snd); // keep in fragment until finished playing
    //         snd.addEventListener('ended', function () {df.removeChild(snd);});
    //         snd.play();
    //         return snd;
    //     }
    // }());
    // // then do it
    var kwa = new Audio("data:audio/wav;base64," + data);
    // let kwa = new Audio('data:audio/ogg;base64,2v/J/wQA8P/v/+D/mv/u/7P/FQAkAAsA1v/p/xoA3P/R//v/OgAKAN3/DgA1ACMA6v8kACMACgC0/+L/BQDP/xMAMwBBAOf/EQBBADYAKwAaAAkAIQC5/+f/0v8VAB0Af/8nAID/AQDU/wAA6//u/woA9P8WAPj/QgAoAD8ADQBGABsA3P8QABEAKQAQAPL/MwACADMAGgBZAGQA0P8EAEQAKAAmADwASAAUAOT/XQBOACkA//9lAGUA7/8PACwATwDy/+n/EQD+//3/3P8UAFAA4v/y/+H/6f/g/9H/KQDt/8z/1v8WAHkA4P8vAEgAAQDm/8X/FQAhAAsAHwBIALL/s//U/zoAEwC//8//3//d/6z/1v/N/73/j/+U/8D/wf/q//n/1/+4/9L/2v8KALj/4v8pAAQA8v+Z/9X//v+9/6//2//U/6b/i/8BAKH/h//G/+L/KwDJ/8X/EAAPANf/8v8DAPv/xf8AAEAA3v/h//v/FADc/+D/AwAbABsAw//4/1EADQA1AEIAPwAMAL3/MgAAAOn/1f8QAAkA2v89ADMAcAADAAwAQwAQADgA5v9/ALr/BwDQ/0MAhwAYAF4A6f8bAMv/RgBCAB4AFAArAGAA+v/b/z0AGQDY/7z/6P8pAPD/2f8MAM3/ov+p/ycA7v+i/+n/HAArABoAAgAzAEEABgAfAFUAKQAAAAEAMQDQ/63/+//9/yYAxv8LABQAzf/S/+//OQD4/woAAwAtAAwAzv8DAP3/BwD5/zMAOQDo//T/NgBMAAkA6/89AEMAIAAPAE8AQwAQABAAPwAEAMb/8v9LAAgAof8/ACsAWADV/w8AVgDq/xsAMQCEADQAAAAfAGQANAAQAC0ASAAKAD8AUAAJAPb/3f8zAO7/5f/U/xMALwDK/8r/AgDo/4//2//7/+j/uP+6/wsAqf+F/xEAFQDi/8L/GwDv//3/rP/H/w8A/P/a//L/OADy/+D/4P/Q/7H/vP8NABkAt/+p//T/2/+k/8j/+v/x/6n/vf/o/9D/w//l//7/vv+q/+7/BwC//5v/ov/w/wkA6f8KABoA6f/D/9j/IgDh/8X/+f/r/2wAiP/Z/2sAMf8eAGQAMAD3/2v/3v8ZAPL/BQAnAA8AEAC6/zgAXgDk/wcAWABNAAoAHABTAGcA+//W/xoACgB6ACwA9P8GAP//CQAyAAEAEgByACQAMwDK/yYAXAA/AB0ASwBuABgA8P9QAGIAJQASADgAVAAOAB0AIgAXAAUA5P8dAOL/xP/P/ykALQCE//L/ff+SAGAAKQBkAKf/8/+k/ygA/f+9/+j/EQD//9f/+P8vAM3/qP/l/x0AvP/o//n/8f/y/9P/FQAMAOP/1f8XAA4A/f/l///////P/ykANgALAMP/v/8KAMv/BgC+/1EABQDl//f/JwAcAMT/9/8AAAAA2f8rACAABgDm/4YAPQAJAMH/BAD8/6X/6v/M/wcAsP/N/zAALQDb/77/CgD6/wMAAwAbACoAFwAOAFQANwDs//3/NAAZAP//9/8eAAQAtP8YACYA8/+l/8r/5v/Y/9P//v/m/8n/9f/e/zAAv//E/zcAVAD4/9n/LAAZAAAA8f8yAA8A7//4/wEA6v/c/wcAVgAxAOf/EAA3ADMAwf/1/2wAPQAhADYAgQAwABQAYABAABsA8P82ADgA8//K/+P/CwDo/6H/BAAKAKH/3f/t//X/5P/k/yQA6P+h/7b/6f/5/9n/6v/6//n/qv+//wEA6f/C/9b/EADu/7D/zf8IAOj/wv/u/x8A5f/v/zgAPAABAOn/MgAXAPX/3v/x/1AADAATABEALwAMALz/DwAWAN3/3/8wABUADAD7/zoARQDp/xoANwAiAOj/2f86ABUAvP///x4A/P+8/+D/IADe/+j/8f/6/8r/nv/8/wQA5P+///v/CwD7/7X/AgAaAML/1//y/xQA/P/t/ycALQAEAAwANABBAPb/DwBeACgABwDn/0AAHACk/woAOQAeAOX/9/8QAP//wf/G/0EA9v/o/woAIQAYAND/AwAzAAEA4v9EADAA/v8WADUAEgDq//T/FADs/9b/2v/1//7///8AADgA/v+4//X/3//a/5//3v8SAPr/7f8AAGAA3f8YACAARwD0/7j/FQAFAP//yf8WAO//2v///xEAIQAJAOv/BgDh/9X/CgAjADMAAgAFAE4AMwAKABsAUgAHACAAIABOADMA8f86AEcAHADz/ywAOgAPAO//MABUAC8ABAA7ABcA7v/X/1AAeQDL//3/BAAbAOn/wv80AAgA/v/O/wgA9v+3/8P/tv/i/9T/5v8mAMz/gf/w/wAAGAC//wMAOQD2/x4A9P8zAOj/6f/6/0EALADR/xIAGAANAMz/NQBQAAoA8P8uAEkA4//7/yEALADI/8n/GgAeAPL/yf/5//f/5v/9/wIA8P+v/8r/AgDo/6D/1P8kAMH/k//g/9n/yv+d/8r/EwDR/8v/9f/9/+z/tf/5/xAAv/+M/+r/MgDA/+T/DQAkAML/r/8LAAoAy/+//yIA8f/L/6D/BgD//8n/3v8JABEA0v/v/wkAAgDc//H/MwAhAPn/DABMAAkA8/8dAC0A/P/P/ysAQgAvAB4ANQBjAD4AGwBaADUAIwDq/yQAQgAmAAwAFAA7ANn/CwATAAoA2/+3/wsAEwDk/9f/OQD3/7r///8YAC8A9v8nAEUAGgD6/xMAWQAsABIAWAAzADAAFQAbACkA3//p//L/GwD5//n/AgABAOL/3P89AAkAyf/V/w8AJgDU/wcAFgAFAAwA5P89ACEA/v8eAEMANgAZACcAagAyAPb/FAARAA4Arf8IAP7/3f/d/xUAEgDA/+L/u/8GAK3/4f8JAPf/1/+h/w0A9P/c/67/AgAQAPf/t//7/yIA7//g/+H/8/9l/wUA9f/2/97/2f8jACgA9v+//xIAAQC6/7//IwABANr/HAAaABEA4f8iAFcAAgAiAAgANgADAPP/WgAkAPL/8v9RAGIAFAABABgAFQAKAPD/HwAEALv/9v8dABkAx//Z/xIA0P/C/87////2/8f/8f8ZACYAzP/u/yYAEgDp//n/OADM/6//+/8DAOr/0/8NABMA6v/b/xwAMQDX/8H/BAD8/9z/7v82ABIA+f8ZAGUARgDx/wkACAAOALX/8f8gAPb/xv/C/ywA+f+6/+b/FwDl/6j/5f8PAN7/ov/4/9n/tf+r/wkAAgC8/7r/+P85AJH/OQDI/77/vf/8/x4ABwDS/+j/NAD8/+j//f9HAEUATABpAHwALwA2ACUAcwBOABsAMgBoAFoALQBDAE8AUgDe/1gAeQBZAAwACwBoAAoAGABFAH4A5v+//yEAFQAKAOH/KAAsAOD/4f8BACYA+v/p/xAA7f/d/5b/4//j/6z/4P/h/8r/bv+P/+X/9v+3/9P/DgDt//b/r/8kAOL/rf8ZABgAFgDl/x8ARAAoAP3/NAAwAOX/3//4/zAA3f/2/w4A9f/G/+H/AwACANr/vf/5/+L/7P/V/ygA/f+v/wwAAwD0/8X/0v8VAPT/5v/x/yoA+P/i/xwAIwAZAOH/AwAjAMP/2P9CAC8A9f8OAEUAMQAWAOb/EAAfAOb/HwAdABsAAgDi/wwABADU//f/RwDc/+7/FwAGAAYAz//y/yMA+f/D////BwDg/7v/wf8tANz/qP/u/wkA2v+//wwAHADl/9H/FQD+/9n/3f8xAE8Azf8CACQAKwDU/wAAaQBUACEA0f9cAF8AUgAWAFUAMQAeAEQAMAA9AOr/KwAwAP3/7f8WADQAAQAQABYALAAJAOj/EAAOAA0A8/86ABYA1P/W/xcA9f/0/wQAKgAGAM3/7//+/xUAy//V/w4A3f/e//f/BgDV/8f/6f8KAOD/uv8VABoA4P/S/wsA2v/c/87/8P8gAL7/+v8RAC8A3P/m/2UA3/8nADsALgAaAP//JQBAAAsAqf/N/+7//v+O/6z/AADH/7L/z//x/8r/rf/L//b/1/+y//f/BwDQ/8z/9/8YAOj/0v8GAEUA6v8EADQAGQDR/9X/KAD+//D/wv8WAD0AAwAjAFkAQwD4/yEARgAiAOH/+/9KAPf/0P8LAFEAJADq/xsAMQAOAKb/8/9jAAUABAAjABkAHwD1/xQAKgDv/wAALwArAAcA1/8QAA4Axf/I/wMAQQDO/7H/BQAEAOz/7f8lAPr/w//f/08A8//E/9j/AgAJANH/7P8GAO7/yP/7/xQAzP+w//X/HgDu/7n/7v8YAA8AFwAHABcA7/8RACgAJwD1/9D/SgAuAPX//v9mADgABQDm/zcAQwDg/yIANwBLAP//PgBZABsAGQAuAHkAIADt/ywAQAASAMj/+v8YACQA+P8uAEEA6//q/xEAFQC6/7X/7/89AOf/5/8NAOP/w//M/wUAEgDA/7r/BADK/9z/1P8dAAEAWf/a/+P/xP+//wEAEAD+/77/qv8OALX/uv++//L/w/+g/97/8f+7/5H/6f/M/9H/vv8DAAUAx//V/woACwDO/9T/AQAjAMX/CwAlAA4ACADL/0kA+P8LADUALQA1AMb/HABVACMA9P8YAFEABwD6/z0AXAAZABIAPABqACYABgBPAD0AOwD6/ywAQgDx//T/PgA0APv/5v8pADcAFgAWAG0AbwDy//T/LgAsAOr/PABYACsA6v8zAEAA/P8FAAwAOwAAAAcAPgAyAB4A5P8sADgA/P/8//P/MgAOANz/HAApAM7/2P8IAOf/qP+0/z8ASQDc/73/FwAUAMr/3P8UAOn/i//o/wAAz//C/63/AQAAAN//yP8aAND/nP8QAP//5v+w/xQAOQC2/7P/7/8HAM//6f8SABAA4P/C/xUA');
    // let kwa = new Audio('data:audio/ogg;base64,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')
    setTimeout(function() {
        kwa.play()
    }, 1000)
    let audioID = document.getElementById('audioID')
    audioID.appendChild(kwa)
    audioID.style.display="block"
    // alert("HOY!")
}
document.addEventListener("visibilitychange", function () {
    if (isMobile()) {
        location.reload();
    }
});