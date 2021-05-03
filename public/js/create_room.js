// socket = io()
// grouplist_join = document.getElementById('grouplist_join')

// socket.on('room list', response => {
//     grouplist_join.innerHTML = ""
//     if (response.length > 0) {
//         for(let i = 0; i < response.length; i++) {
//             var node = document.createElement("LI")
//             node.classList.add('list-group-item')
//             node.classList.add('select-group-li')
//             node.id = "rmid" + response[i]
            
//             var textnode = document.createTextNode("Room " + response[i])
//             node.appendChild(textnode);
            
//             var btn = document.createElement("button")
//             btn.classList.add('btn')
//             btn.classList.add('btn-sm')
//             btn.classList.add('btn-primary')
//             btn.classList.add('float-right')
//             btn.classList.add('btn_join_room')
//             btn.id = response[i]
//             btn.innerHTML = "Join"
//             btn.onclick = function () {
//                 joinRoom(response[i])
//             }
            
//             node.appendChild(btn)
            
//             grouplist_join.appendChild(node)
//         }
//     } else {
//         var node = document.createElement("LI")
//         node.classList.add('list-group-item')
//         node.classList.add('text-center')
//         var textnode = document.createTextNode('No Room Available')
//         node.appendChild(textnode);    
//         grouplist_join.appendChild(node)
//     }
// })

// function joinRoom(id) {
//     location.href = window.location.origin + "/?room=" + id
// }

// frm_create_room.addEventListener('submit', function(e) {
//     e.preventDefault()
//     socket.emit('setUsername', {username: username.value, socketID: socket.id})
//     console.log("SUBMIT")
//     window.location.href="/?room=" + rmid.value

// })
