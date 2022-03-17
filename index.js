const express = require("express");
const { join } = require("path");
const http = require("http");
const { Server } = require("socket.io");
const formatMessage = require('./utils/messages');

const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require('./utils/users');

const app = express();

const server = http.createServer(app);

const io = new Server(server);

const botName = 'niicodeBot'

io.on("connection", (socket) => {
  socket.on('joinRoom', ({username, room}) => {
    const user = userJoin(socket.id, username, room)
    
    socket.join(user.room)

    // Welcome current user
    socket.emit('message', formatMessage(botName, 'Welcome to niicode school!'));

    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    // Send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });
  }) 

  //listen for messages
  socket.on("client-message", (msg) => {
    const user = getCurrentUser(socket.id)

    io.to(user.room).emit('message', formatMessage(user.username, msg));

  });

   // Runs when client disconnects
   socket.on('disconnect', () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });
});

app.use(express.static(join(__dirname, "public")));

server.listen(8000, () => console.log("App is running"));
