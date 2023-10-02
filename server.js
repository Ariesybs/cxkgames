const http = require("http");
const express = require("express");
const { Server } = require("socket.io");

const app = express("http://localhost:3000");
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:3000" },
});
const clients = {}; // 存储客户端的连接并与用户名映射
const players = {}; // 存储客户端标识符和物体位置的映射
io.on("connection", (socket) => {
  console.log(`User ${socket.id} connected`);

  socket.on("login", (userName) => {
    let error;
    if (clients[socket.id] !== undefined) {
      error = "请刷新页面重试!";
    } else if (players[userName] !== undefined) {
      error = "该用户名已存在游戏中!";
    } else {
   
      players[userName] = {
        userName: userName,
        position: {x: 0, y: 31, z: 0},
        rotation:{x: 0, y: 0, z: 0}
      };
      console.log(players[userName]);
      clients[socket.id] = userName;
      socket.emit("success_login", players[userName], players);
      io.emit("playerLogin",userName,{x: 0, y: 31, z: 0})
    }
    if (error !== undefined) {
      socket.emit("error_login", error);
      return;
    }
    socket.emit("allPlayersPosition", players);
  });

  // 监听客户端发送的位置更新消息
  socket.on("updatePosition", (userName, position,rotation) => {
    console.log("rotation=>" + rotation.x);
    // 向其他客户端广播位置更新消息
    console.log(players[userName]);
    if (players[userName]) {
      players[userName].position.x = position.x;
      players[userName].position.y = position.y;
      players[userName].position.z = position.z;
      players[userName].rotation.x = rotation.x;
      players[userName].rotation.y = rotation.y;
      players[userName].rotation.z = rotation.z;
      console.log(players);
      io.emit("allPlayersPosition", players);
    }
  });

  // 用户断开连接
  socket.on("disconnect", () => {
    console.log(`User ${socket.id} disconnected`);
    if (clients[socket.id]) {
      const userName = clients[socket.id];
      delete clients[socket.id];
      if (userName) {
        delete players[userName];
        io.emit("playerDisconnect",userName)
      }
    }
  });
});

server.listen(3001, () => {
  console.log("Server is running on http://localhost:3001");
});
