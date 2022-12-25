// client side javascript

// const socket = io('http://localhost:3000')

const socket = io('http://localhost:3000', { transports: ['websocket', 'polling', 'flashsocket'] });
const messageForm = document.getElementById('send-container')
const messageInput = document.getElementById('message-input')
const messageContainer = document.getElementById('message-container')
const roomContainer = document.getElementById('room-container')
const userText = document.getElementById('username')
const reloadButton = document.getElementById('reload-button')
const logo = document.getElementById('logo')
const userList = document.getElementById('current-users')
// userText.innerText = "hi!"
// appendRoom("hi")

// handle refreshing 
// sessionStorage.clear();
const pastUser = sessionStorage.getItem('uUID')
console.log(pastUser)
socket.emit('userLogin', pastUser)
socket.on('userData', userData => {
    console.log("inside of userData function")
    console.log(userData)
    sessionStorage.setItem('uUID', JSON.stringify(userData))
    if (userText != null){
        userText.innerText = 'You are: ' + userData["username"];
    }
})

// if (userList != null){
//     userList.innerHTML = ""
// }

// refresh page automatically if using back/forward arrows
// var perfEntries = performance.getEntriesByType("navigation");
// console.log("hello!")
// console.log(perfEntries[0].type)
// if (perfEntries[0].type === "back_forward") {
//     location.reload(true);
// }
// (function () {
//     window.onpageshow = function(event) {
//         if (event.persisted) {
//             window.location.reload();
//         }
//     };
// })();

if (messageForm != null) {
    // const name = prompt('What is your name?')
    // appendMessage(userData["username"]+' joined')
    socket.emit('new-user', roomName)

    messageForm.addEventListener('submit', e => {
        e.preventDefault() // prevent page from reloading every time user submits message
        const message = messageInput.value
        socket.emit('send-chat-message', roomName, message)
        // console.log(message)
        messageInput.value = '' // reset value of message on send
        // console.log(messageContainer.scrollTop)
        // console.log(messageContainer.scrollHeight)
        // messageContainer.scrollTop = messageContainer.scrollHeight - 406.5;
    })
}

socket.on('room-created', room => {
    appendRoom(room)
})

socket.on('chat-message', data => {
    appendMessage(data.name + ': ' + data.message)
    // make sure scrollbar is always at bottom
    messageContainer.lastElementChild.scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"});
})

socket.on('user-connected', name => {
    appendMessage(name + ' connected', "green")
    // make sure scrollbar is always at bottom
    messageContainer.lastElementChild.scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"});
})

socket.on('user-disconnected', name => {
    appendMessage(name + ' disconnected', "red")
    // make sure scrollbar is always at bottom
    messageContainer.lastElementChild.scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"});
})

socket.on('i-connected', name => {
    appendMessage(name + ' (you) joined', "green")
})

socket.on('my-message', (name, message) => {
    appendMessage(name + ' (you): ' + message)
    // make sure scrollbar is always at bottom
    messageContainer.lastElementChild.scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"});
})

socket.on('add-to-user-list', name => {
    appendUser(name)
})

socket.on('add-host-to-user-list', name => {
    prependUser(name)
})

socket.on('game-created', room => {
    // console.log("GAME CREATED!!!!")
    window.location.href='/game/'+room
})

// socket.on('game-created-client', room => {
//     window.location.href='/game/'+room
// })

// socket.on('receive-game-problems', problems => {
//     console.log("received game problems")
//     myGame = new Game(problems);
//     myGame.main()
// })

// socket.on('receive-game-problems-self', problems => {
//     console.log("received game problems self")
//     myGame = new Game(problems);
//     myGame.main();
// })

function appendMessage(message, color="black") {
    const messageElement = document.createElement('div')
    messageElement.innerText = message
    messageElement.style.color = color;
    messageContainer.append(messageElement)
}

function appendRoom(room) {
    const roomElement = document.createElement('div')
    roomElement.innerText = room
    const roomLink = document.createElement('a')
    roomLink.href = '/room/'+room
    roomLink.appendChild(roomElement)
    roomContainer.append(roomLink)
    // roomContainer.append(roomLink)
}

function appendUser(user) {
    // first, check if user is already in the list
    console.log("appending: " + user)
    seen = false
    existingUsers = userList.getElementsByTagName("div") // list of existing users
    for (var i = 0; i < existingUsers.length; i++){
        var curUser = existingUsers[i]
        if (curUser.innerText == user || curUser.innerText == '(host) ' + user){
            seen = true
        }
    }
    if (seen == false){ // if the user was not already in the list, add them to the list
        const newUser = document.createElement('div')
        newUser.innerText = user;
        userList.append(newUser)
    }
}

function prependUser(user) {
    // console.log("prependuser")
    const newUser = document.createElement('div')
    newUser.innerText = '(host) ' + user;
    const len = userList.children.length;
    if (len == 0){
        userList.prepend(newUser)
    }
}

// function renderUsers() {
//     Object.keys(users).forEach(uid => {
//         if (uid == host){
//             <div>(host) users[uid]["username"] </div>
//         }
//      }) 
//      Object.keys(users).forEach(uid => { 
//         if (uid != host){ 
//             <div> users[uid]["username"] </div>
//        } 
//     }) 
// }

if (reloadButton != null){
    reloadButton.addEventListener('click', function() {
        window.location.reload();
    })
}

logo.addEventListener('click', function() {
    socket.emit('back-to-home')
    window.location.href = '/'
})