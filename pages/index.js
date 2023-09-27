import React, { useEffect, useRef } from "react";
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  BoxGeometry,
  MeshBasicMaterial,
  Mesh,
} from "three";
import { io } from "socket.io-client";

const socket = io("http://localhost:3001");

const MultiplayerGame = () => {
  const canvasRef = useRef(null);
  const cubeRef = useRef(null);
  const clientIdRef = useRef(null); // 存储自己的clientId
  useEffect(() => {
    // 初始化Three.js场景
    const scene = new Scene();
    const camera = new PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new WebGLRenderer({ canvas: canvasRef.current });
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.position.z = 5;

    // 等待连接建立后获取socket.id
    socket.on("connected", (msg) => {
      console.log(msg);
      clientIdRef.current = socket.id;
      console.log("Connected with socket.id:", clientIdRef.current);
    });

    // 监听来自服务器的位置更新消息
    socket.on("clientsArray", (clients) => {
      console.log("clientsArray");
    });

    // 发送本地物体位置到服务器
    const sendPositionToServer = () => {
      socket.emit("updatePosition", clientIdRef.current, {
        x: cube.position.x,
        y: cube.position.y,
        z: cube.position.z,
      });
    };

    // 创建一个可移动的物体
    const geometry = new BoxGeometry();
    const material = new MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new Mesh(geometry, material);
    scene.add(cube);
    cubeRef.current = cube; // 存储物体的引用以便后续更新位置

    // 渲染场景
    const animate = () => {
      requestAnimationFrame(animate);

      renderer.render(scene, camera);
    };
    animate();

    // 监听键盘事件
    const handleKeyPress = (event) => {
      const speed = 0.1; // 移动速度

      switch (event.key) {
        case "w":
          cube.position.y += speed;
          break;
        case "s":
          cube.position.y -= speed;
          break;
        case "a":
          cube.position.x -= speed;
          break;
        case "d":
          cube.position.x += speed;
          break;
        default:
          break;
      }
      sendPositionToServer();
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

  return <canvas ref={canvasRef} />;
};

export default MultiplayerGame;
