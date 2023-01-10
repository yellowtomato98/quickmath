// server side javascript

const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);

app.set("views", "./views");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true })); // allow application to use url encoded parameters

const rooms = {};
const users = {};

// req = request variable
// res = response variable
app.get("/", (req, res) => {
  res.render("index", { rooms: rooms }); // render index.ejs
  // console.log("INSIDE OF INDEX EJS")
  // console.log("username: ", username)
});

app.post("/room", (req, res) => {
  // console.log(req.body.room)
  roomName = generateRoom();
  while (rooms[roomName] != null) {
    roomName = generateRoom(); // don't create duplicate rooms
  }
  rooms[roomName] = { users: {}, active: false };
  res.redirect("/room/" + roomName); // redirect user to new room
  // Send message that new room was created
  io.emit("room-created", roomName);
});

app.get("/room/:room", (req, res) => {
  // the use of the colon here stores whatever
  // is in the url for ":room" into req.params.room
  roomName = req.params.room;
  if (rooms[roomName] == null) {
    // if room does not exist, redirect user
    return res.redirect("/");
  }
  // console.log("INSIDE OF ROOM: ")
  // console.log(username)
  res.render("room", {
    roomName: roomName,
    users: rooms[roomName].users,
    host: rooms[roomName].host,
  }); // render room.ejs
});

app.post("/game", (req, res) => {
  // req.body contains post parameters
  // room is passed in as a parameter via the blank input in room.ejs
  roomName = req.body.room;
  rooms[roomName].active = true;
  res.redirect("/game/" + roomName);
  problems = [];
  for (var i = 0; i < 240; i++) {
    var randomize = Math.floor(Math.random() * 2) + 1;
    if (randomize == 1) {
      var num1 = Math.floor(Math.random() * 99) + 2;
      var num2 = Math.floor(Math.random() * 99) + 2;
      var ans = num1 + num2;
      if (Math.floor(Math.random() * 2) + 1 == 1) {
        problems.push([num1, num2, ans, 0]);
      } else {
        problems.push([ans, num2, num1, 1]);
      }
    } else {
      var num1 = Math.floor(Math.random() * 11) + 2;
      var num2 = Math.floor(Math.random() * 99) + 2;
      var ans = num1 * num2;
      if (Math.floor(Math.random() * 2) + 1 == 1) {
        problems.push([num1, num2, ans, 2]);
      } else {
        problems.push([ans, num1, num2, 3]);
      }
    }
  }
  rooms[roomName].problems = problems;
  Object.keys(rooms[roomName].users).forEach((UID) => {
    rooms[roomName].users[UID].score = -1; // set each user score to 0 at start of round
    console.log(users[UID].score);
  });
  // console.log("i'm here -- server side!")
  // console.log(problems[0])
  // console.log(roomName)
  io.in(roomName).emit("game-created", roomName);
});

app.get("/game/:room", (req, res) => {
  roomName = req.params.room;
  if (rooms[roomName] == null) {
    // if room does not exist
    return res.redirect("/");
  } else if (rooms[roomName].active == false) {
    // if room exists but game is not active
    return res.redirect("/room/" + roomName);
  }
  res.render("game", {
    roomName: roomName,
    problems: JSON.stringify(rooms[roomName].problems),
  });
});

app.get("/game", (req, res) => {
  return res.redirect("/");
});

server.listen(3000);

io.on("connection", (socket) => {
  // console.log('new User')
  // socket.emit('chat-message', 'Hello World')
  // console.log(username+ " connected")
  var userData;

  socket.on("userLogin", (uUID) => {
    // console.log("new user login")
    if (uUID != null) {
      parsed = JSON.parse(uUID);
      parsed["connected"] = true;
      users[parsed["UID"]] = parsed;
      userData = parsed;
    } else {
      userRef = String(Math.random().toString(24) + new Date());
      username = generateUser();
      users[userRef] = {
        UID: userRef,
        username: username,
        connected: true,
        score: 0,
      };
      userData = users[userRef];
    }
    socket.emit("userData", userData);
  });

  socket.on("new-user", (room) => {
    console.log(userData["username"] + " joining " + room);
    socket.join(room); // personal socket joins room
    // console.log(username + " joined a room")
    let userRef = userData["UID"];
    rooms[room].users[userRef] = users[userRef];
    socket.broadcast
      .to(room)
      .emit("user-connected", users[userRef]["username"]);
    socket.emit("i-connected", users[userRef]["username"]);

    // check if host already exists
    if (rooms[room].host == null) {
      rooms[room].host = users[userRef]["UID"];
      socket.emit("add-host-to-user-list", users[userRef]["username"]);
    } else if (rooms[room].host == users[userRef]["UID"]) {
      // host exists and is the same person (e.g. they refreshed)
      socket.emit("add-host-to-user-list", users[userRef]["username"]);
    } else {
      socket.emit("add-to-user-list", users[userRef]["username"]); // add self to list
      socket.broadcast
        .to(room)
        .emit("add-to-user-list", users[userRef]["username"]); // tell everyone else to add you to list
    }
  });

  socket.on("send-chat-message", (room, message) => {
    socket.broadcast.to(room).emit("chat-message", {
      message: message,
      name: rooms[room].users[userData["UID"]]["username"],
    }); // sends to every other user except for original user
    socket.emit("my-message", users[userData["UID"]]["username"], message);
  });

  socket.on("back-to-home", function () {
    // console.log("is this changing anything?")
    socket.join("/");
  });

  socket.on("join-game", (room) => {
    socket.join(room);
  });

  socket.on("update-score", (roomName) => {
    // method to update scores
    // console.log("hi updating score server")
    // console.log(rooms[roomName].users)
    console.log("im updating the score!");
    console.log(userData["username"]);
    rooms[roomName].users[userData["UID"]].score += 1;
    var ranks = [];
    Object.keys(rooms[roomName].users).forEach((UID) => {
      score = rooms[roomName].users[UID].score;
      if (score == -1) {
        score = 0;
      }
      ranks.push([score, users[UID].username]);
    });
    // console.log(ranks)
    // sort after broadcasting (idk why it doesn't persist)
    // socket.broadcast.to(roomName).emit('render-leaderboard', ranks)
    socket.emit("render-leaderboard", ranks);
    io.in(roomName).emit("render-leaderboard", ranks);
  });

  socket.on("end-game", (roomName) => {
    rooms[roomName].active = false;
  });

  socket.on("render-final-ranks", (roomName) => {
    console.log("rendering final ranks");
    var ranks = [];
    Object.keys(rooms[roomName].users).forEach((UID) => {
      ranks.push([rooms[roomName].users[UID].score, users[UID].username]);
    });
    if (userData["UID"] == rooms[roomName].host) {
      // socket.broadcast.to(roomName).emit('final', ranks)
      // socket.emit('final', ranks)
      io.in(roomName).emit("final", ranks);
    }
  });

  socket.on("disconnect", () => {
    if (userData != null) {
      getUserRooms(userData["UID"]).forEach((room) => {
        // console.log(room)
        socket.broadcast
          .to(room)
          .emit(
            "user-disconnected",
            rooms[room].users[userData["UID"]]["username"]
          );
      });
      users[userData["UID"]]["connected"] = false;
      setTimeout(function () {
        // only delete from user list if not reconnected
        if (!users[userData["UID"]]["connected"]) {
          getUserRooms(userData["UID"]).forEach((room) => {
            // console.log(room)
            // socket.broadcast.to(room).emit('user-disconnected', rooms[room].users[userData["UID"]]["username"])
            delete rooms[room].users[userData["UID"]];
          }); // delete user from rooms
          delete users[userData["UID"]]; // delete from user list
          // console.log("deleted!")
        } else {
          // console.log("not deleted!")
        }
      }, 15000);
    }
  });
});

function getUserRooms(uid) {
  names = [];
  Object.entries(rooms).forEach((room) => {
    if (room[1].users[uid] != null) names.push(room[0]);
  });
  return names;
  // return name of all rooms that user is a part of
}

const letters = ["abcdefghijklmnopqrstuvwxyz", "ABCDEFGHIJKLMNOPQRSTUVWXYZ"];

function generateRoom() {
  var room = "";
  for (var i = 0; i < 7; i++) {
    var x = Math.floor(Math.random() * 2);
    var idx = Math.floor(Math.random() * 26);
    room += letters[x][idx];
  }
  return room;
}

function generateUser() {
  var user = "Guest";
  for (var i = 0; i < 2; i++) {
    var x = Math.floor(Math.random() * 9);
    user += String(x);
  }
  for (var i = 0; i < 3; i++) {
    var x = Math.floor(Math.random() * 2);
    var idx = Math.floor(Math.random() * 26);
    user += letters[0][idx];
  }
  return user;
}
