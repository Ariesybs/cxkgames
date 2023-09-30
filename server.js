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
      // 生成随机横向位置（x坐标）
      const randomX = Math.random() * 20 - 10; // -10到10之间的随机数
      // 生成随机纵向位置（y坐标）
      const randomY = Math.random() * 20 - 10; // -10到10之间的随机数
      // 生成随机纵向位置（z坐标）
      const randomZ = Math.random() * 20 - 10; // -10到10之间的随机数

      const position = {x: randomX, y: randomY, z: randomZ}
      players[userName] = {
        userName: userName,
        position: position,
      };
      console.log(players[userName]);
      clients[socket.id] = userName;
      socket.emit("success_login", players[userName], players);
      io.emit("playerLogin",userName,position)
    }
    if (error !== undefined) {
      socket.emit("error_login", error);
      return;
    }
    socket.emit("allPlayersPosition", players);
  });

  // 监听客户端发送的位置更新消息
  socket.on("updatePosition", (userName, position) => {
    console.log("updatePosition=>" + userName);
    // 向其他客户端广播位置更新消息
    console.log(players[userName]);
    if (players[userName]) {
      players[userName].position.x = position.x;
      players[userName].position.y = position.y;
      players[userName].position.z = position.z;
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
