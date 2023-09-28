import React, { useEffect, useRef,useState } from "react";
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  BoxGeometry,
  MeshBasicMaterial,
  Mesh,
  HorizontalBlurShader,
  VerticalBlurShader,
  CopyShader,
  CircleGeometry,
  
} from "three";
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { io } from "socket.io-client";


const socket = io("http://localhost:3001");
const MultiplayerGame = () => {
  const canvasRef = useRef(null);
  const cubeRef = useRef(null);
  const clientIdRef = useRef(null); // 存储自己的clientId
  const userNameRef = useRef('');
  const playersRef = useRef([])
  const isLoginRef = useRef(false)
  useEffect(() => {
/**=======================================================SCENE INIT====================================================================== */
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
    document.body.appendChild(renderer.domElement);
    camera.position.z = 5;
/**========================================================MASK===========================================================================* */
    //创建模糊遮罩效果

// 创建EffectComposer
// const composer = new EffectComposer(renderer);

// // 创建RenderPass
// const renderPass = new RenderPass(scene, camera);
// composer.addPass(renderPass);

// // 创建水平模糊Pass
// const hBlurPass = new ShaderPass(HorizontalBlurShader);
// //hBlurPass.uniforms["h"].value = 1 / window.innerWidth;
// composer.addPass(hBlurPass);

// // 创建垂直模糊Pass
// const vBlurPass = new ShaderPass(VerticalBlurShader);
// //vBlurPass.uniforms.v.value = 1 / window.innerHeight;
// composer.addPass(vBlurPass);

// // 创建最终CopyPass
// const copyPass = new ShaderPass(CopyShader);
// composer.addPass(copyPass);
// composer.render();
/**=======================================================LOGIN CONTAINER==================================================================================== **/
  // 创建登录界面的元素
    const loginContainer = document.createElement('div');
    loginContainer.style.position = 'absolute';
    loginContainer.style.top = '50%';
    loginContainer.style.left = '50%';
    loginContainer.style.transform = 'translate(-50%, -50%)'; // 使用transform来水平垂直居中
    document.body.appendChild(loginContainer);

    // 创建输入框
    const usernameInput = document.createElement('input');
    usernameInput.type = 'text';
    usernameInput.placeholder = '请输入您的应援名';
    loginContainer.appendChild(usernameInput);

    // 创建登录按钮
    const loginButton = document.createElement('button');
    loginButton.textContent = '进入';
    loginButton.addEventListener('click', () => {
      const username = usernameInput.value;
      if (username) {
        // 将输入的用户名发送至服务器
        socket.emit("login",username)
        console.log('Logged in as:', username);
      }
    });
    loginContainer.appendChild(loginButton);
    
    
/**======================================================OWN PLAYER========================================================================= */
    // 创建并初始化玩家对象
    const ownPlayerInit = (player)=>{
      console.log("own player init")
      const geometry = new BoxGeometry();
      const material = new MeshBasicMaterial({ color: 0x00ff00 });
      const cube = new Mesh(geometry, material);
      console.log(player.position)
      cube.position.copy(player.position)
      scene.add(cube);
    cubeRef.current = cube; // 存储物体的引用以便后续更新位置
    }
    


/**=====================================================OTHER PLAYERS====================================================================== */
// 创建并初始化其他玩家的对象
const otherPlayersInit = (players)=>{
  for( let i = 0; i <players.length ;i++) {
    const player = players[i]
    console.log(player)
    console.log(player.userName)
    // if(player.userName !== userNameRef.current){
    //   console.log(`player ${player.userName}  position => ${player.position}`)
    //   // const playerGeometry = new CircleGeometry();
    //   // const playerMaterial = new MeshBasicMaterial({ color: 0xff0000 });
    //   // const playerMesh = new Mesh(playerGeometry, playerMaterial);
    //   // scene.add(playerMesh);
     //}
  }
  
}



/**==========================================================SERVER===================================================================**/
    // 登陆成功后获取用户名
    socket.on("success_login", (player,players) => {
      
      // 更改用户状态
      isLoginRef.current = true
      userNameRef.current = player.userName
      
      // 移除登陆框
      if(loginContainer){
        
        loginContainer.remove()
      }
      //初始化玩家
      ownPlayerInit(player)

      //初始化其他玩家
      otherPlayersInit(players)

      // 移除登陆失败的监听
      socket.off("error_login")
    });

    // 登陆错误提示
    socket.on("error_login",(msg)=>{
      alert(msg)
    })

    // 监听来自服务器的位置更新消息
    socket.on("allPlayersPosition", (players) => {
      //获取所有玩家位置
      playersRef.current = players
      console.log(players)
    });

    
/**==================================================RENDER======================================================================= */
    // 渲染场景
    const animate = () => {
      requestAnimationFrame(animate);
      
      renderer.render(scene, camera);
    };
    animate();

/**==================================================LISTENNER====================================================================== */
    // 监听键盘移动事件
    const handleKeyPress = (event) => {
      
      if(isLoginRef.current){
        const speed = 0.1; // 移动速度
        const cube = cubeRef.current
      switch (event.key) {
        case "w":
          cube.position.y += speed;
          sendPositionToServer();
          break;
        case "s":
          cube.position.y -= speed;
          sendPositionToServer();
          break;
        case "a":
          cube.position.x -= speed;
          sendPositionToServer();
          break;
        case "d":
          cube.position.x += speed;
          sendPositionToServer();
          break;
        default:
          break;
      }
      }
      
    };

    // 发送本地物体位置到服务器
    const sendPositionToServer = () => {
      const userName = userNameRef.current
      const cube = cubeRef.current
      socket.emit("updatePosition", userName, {
        x: cube.position.x,
        y: cube.position.y,
        z: cube.position.z,
      });
    };

    window.addEventListener("keydown", handleKeyPress);
/**============================================================================================================================== */
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
      
    };



    
  }, []);

  return <canvas ref={canvasRef} />;
};

export default MultiplayerGame;
