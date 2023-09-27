const http = require("http");
const express = require("express");
const { Server } = require("socket.io");

const app = express("http://localhost:3000");
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:3000" },
});
const clients = {}; // 存储客户端标识符和物体位置的映射
io.on("connection", (socket) => {
  console.log("A user connected");
  // 为客户端生成唯一标识符
  const clientId = socket.id;
  console.log("clientID=>" + clientId);

  if (clients[clientId] === undefined) {
    clients[clientId] = { clientId: clientId, position: { x: 0, y: 0, z: 0 } };
    console.log(clients[clientId]);
    socket.emit("connected", "hello " + clientId);
  }

  // 监听客户端发送的位置更新消息
  socket.on("updatePosition", (id, position) => {
    // 向其他客户端广播位置更新消息
    if (clients[id]) {
      clients[id].position.x = position.x;
      clients[id].position.y = position.y;
      clients[id].position.z = position.z;
      console.log(clients);
      socket.broadcast.emit("clientsArray", clients);
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
    delete clients[clientId];
  });
});

server.listen(3001, () => {
  console.log("Server is running on http://localhost:3001");
});
