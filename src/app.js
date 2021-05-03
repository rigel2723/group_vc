const path = require('path')
const express = require('express')
const app = express()
const http = require('http').Server(app)

const port = process.env.PORT || 3012

// require('./routes')(app)
app.use(express.static(path.join(__dirname, '..','public')))
app.use(express.static(path.join(__dirname, '..','node_modules')))

// app.get('/create-room', function(req, res){
//     res.sendFile(path.join(__dirname, '..','public/create_room.html'));
// });

let peers = {}
const io = require('socket.io')(http)
require('./socketioCTRL')(io)
// var getScreenMedia = require('getscreenmedia');
http.listen(port, () => {
    console.log('listening on port 3012')
})





