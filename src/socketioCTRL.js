peers = {}
rooms = {}
userRooms = {}
roomsList = []
usersInfo = {}

module.exports = (io) => {
    io.on('connect', (socket) => {
        console.log('a client is connected')

        // check user joined the room
        socket.on('join room', roomID => {
            // add rooms list
            if (roomsList.indexOf(roomID) == -1) {
                roomsList.push(roomID)
            }

            if (rooms[roomID]) {
                console.log('user joined to room: ', roomID)
            } else {
                console.log('user created room: ', roomID)
                rooms[roomID] = {}
            }
            // {userID: roomID}
            userRooms[socket.id] = roomID

            // add sp users by room
            rooms[roomID][socket.id] = socket


            for(let id in rooms[roomID]) {
                if(id === socket.id) continue
                let username = typeof usersInfo[socket.id] != 'undefined' ? usersInfo[socket.id].username : "No Name"
                rooms[roomID][id].emit('initReceive', {id: socket.id, username: username})
            }
            emitRooms()
        })

        /**
         * relay a peerconnection signal to a specific socket
         */
        socket.on('signal', data => {
            // console.log('sending signal from ' + socket.id + ' to ', data)
            let rmID = userRooms[data.socket_id]
            if(!rooms[rmID][data.socket_id])return
            rooms[rmID][data.socket_id].emit('signal', {
                socket_id: socket.id,
                signal: data.signal
            })
        })

        /**
         * remove the disconnected peer connection from all other connected clients
         */
        socket.on('disconnect', () => {
            // console.log('socket disconnected ' + socket.id)
            socket.broadcast.emit('removePeer', socket.id)
            let rmID = userRooms[socket.id]
            if (typeof rooms[rmID] != 'undefined' && typeof rooms[rmID][socket.id] != 'undefined') {
                console.log(rooms[rmID].length)

                if (Object.keys(rooms[rmID]).length === 1) {
                    // remove from rooms
                    delete rooms[rmID]
                    // delete rooms list
                    if (typeof roomsList[roomsList.indexOf(rmID)] != 'undefined') {
                        delete roomsList[roomsList.indexOf(rmID)]
                    }

                    emitRooms()
                } else {
                    // remove user in room
                    delete rooms[rmID][socket.id]
                    
                }
                
                // delete user rooms 
                delete userRooms[socket.id]
                console.log("user left room: ", rmID)
            }
        })

        /**
         * Send message to client to initiate a connection
         * The sender has already setup a peer connection receiver
         */
        socket.on('initSend', init_socket_id => {
            // console.log('INIT SEND by ' + socket.id + ' for ' + init_socket_id)
            let rmID = userRooms[socket.id]
            // console.log(rooms, rmID, init_socket_id)
            
            let username = typeof usersInfo[socket.id] != 'undefined' ? usersInfo[socket.id].username : "No Name"
  
            rooms[rmID][init_socket_id].emit('initSend', {id: socket.id, username: username})
        })
        
        roomsList = roomsList.filter(function (el) {
            return el != null;
        });
          
        // emit rooms list for newly opened create user page
        emitRooms(1)

        function emitRooms(type) {
            // emit rooms list
            roomsList = roomsList.filter(function (el) {
                return el != null;
            });
            if (!type) {
                socket.broadcast.emit('room list', roomsList)
            } else {
                socket.emit('room list', roomsList)
            }
        }

        socket.on('setUsername', function(data) {
            console.log(data)
            let rmID = userRooms[data.socketID]
            usersInfo[data.socketID] = {username: data.username}
            console.log(usersInfo)
            // socket.username = data.username
            // console.log(socket.id)
        })
    })
}