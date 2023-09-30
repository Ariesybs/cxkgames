import React, { useEffect, useRef } from "react";
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  BoxGeometry,
  MeshBasicMaterial,
  Mesh,
  CircleGeometry,
  BackSide,
  Spherical,
  Vector3,
  MeshStandardMaterial,
  AmbientLight,
  DirectionalLight,
  Object3D,
  Box3
} from "three";
import {FBXLoader} from "three/examples/jsm/loaders/FBXLoader"
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { io } from "socket.io-client";

const socket = io("http://localhost:3001");
const MultiplayerGame = () => {
  const canvasRef = useRef(null);
  const cubeRef = useRef(null);
  const userNameRef = useRef("");
  const playersRef = useRef([]);
  const otherPlayerMeshDict = {};
  const isLoginRef = useRef(false);
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
    camera.position.z = 30;

    /**========================================================SKY BOX============================================================================ */
    // 创建一个立方体几何体
    const skyboxGeometry = new BoxGeometry(1000, 1000, 1000); // 根据场景大小设置立方体大小
    
    // 创建自发光材质，设置颜色和发光强度
    const skyboxMaterial = new MeshBasicMaterial({
      color: 0x87ceeb, // 设置纯色，可以根据需要修改颜色
      side:BackSide,
      
    });
  
    // 创建天空盒对象
    const skybox = new Mesh(skyboxGeometry, skyboxMaterial);
    
    // 将天空盒添加到场景中
    scene.add(skybox);

    const directionalLight = new DirectionalLight(0xffffff, 2); // 使用白色，并设置光的强度为0.5
    directionalLight.castShadow = true
    directionalLight.position.set(100,100,100)
    scene.add(directionalLight);
    
    
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
    const loginContainer = document.createElement("div");
    loginContainer.style.position = "absolute";
    loginContainer.style.top = "50%";
    loginContainer.style.left = "50%";
    loginContainer.style.transform = "translate(-50%, -50%)"; // 使用transform来水平垂直居中
    document.body.appendChild(loginContainer);

    // 创建输入框
    const usernameInput = document.createElement("input");
    usernameInput.type = "text";
    usernameInput.placeholder = "请输入您的应援名";
    loginContainer.appendChild(usernameInput);

    // 创建登录按钮
    const loginButton = document.createElement("button");
    loginButton.textContent = "进入";
    loginButton.addEventListener("click", () => {
      const username = usernameInput.value;
      if (username) {
        // 将输入的用户名发送至服务器
        socket.emit("login", username);
        console.log("Logged in as:", username);
      }
    });
    loginContainer.appendChild(loginButton);

    /**======================================================LOADER=========================================================== */
    const fbxLoader = new FBXLoader()
    const fontLoader = new FontLoader();
    /**======================================================OWN PLAYER========================================================================= */
    // 创建并初始化玩家对象
    const ownPlayerInit = (player) => {
      console.log("own player init")

      // 创建玩家对象
      const playerObj = addCXKMesh(userNameRef.current,player.position)
        
      cubeRef.current = playerObj;

      // 创建OrbitControls控制器
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.copy(playerObj.position); // 将控制器的目标设置为要跟随的物体的位置

      
      
    };

    // 加载玩家名字
    const loadUserName=(userName,playerObj)=>{
      
      fontLoader.load("/font/STHupo.json",(font)=>{
        const textGeometry = new TextGeometry(userName, {
          font:font, // 使用字体
          size: 1, // 文本大小
          height: 0.01, // 文本厚度
        });
        const textMaterial = new MeshBasicMaterial({ color: 0x000000 });
        const textMesh = new Mesh(textGeometry, textMaterial);

        const textBoundingBox = new Box3().setFromObject(textMesh);
        const textWidth = textBoundingBox.max.x - textBoundingBox.min.x;
        // 计算偏移量以使文本居中
        
        const xOffset = -(textWidth / 2);
        textMesh.position.set(xOffset, 9, 0);
        
        playerObj.add(textMesh)
      })
    }

    /**=====================================================OTHER PLAYERS====================================================================== */
    // 创建并初始化其他玩家的对象
    const otherPlayersInit = (players) => {
      Object.entries(players).forEach(([name, player]) => {
        if (name !== userNameRef.current) {
          addCXKMesh(name,player.position)
        }
      });
    };

    /**=====================================================ADD MESH===================================================================== */

    const addCXKMesh = (name,position)=>{
      const playerObj = new Object3D();
      fbxLoader.load("/model/cxk.fbx",(cxk)=>{
        playerObj.position.copy(position)
        
        cxk.castShadow = true
        playerObj.add(cxk)
        otherPlayerMeshDict[name] = playerObj;
        loadUserName(name,playerObj)
        scene.add(playerObj)})
        return playerObj
    }

    /**==========================================================REMOVE MESH====================================================================== */


    const removePlayerMesh = (name)=>{
      console.log("remove mesh")
      const mesh =  otherPlayerMeshDict[name]
      if(mesh){
        //mesh.visible = false
        scene.remove(mesh)
        
        console.log(mesh)
        console.log(cubeRef.current)
        
      }
      
    }
    /**==========================================================SERVER===================================================================**/
    // 登陆成功后获取用户名
    socket.on("success_login", (player, players) => {
      // 更改用户状态
      isLoginRef.current = true;
      userNameRef.current = player.userName;

      // 移除登陆框
      if (loginContainer) {
        loginContainer.remove();
      }
      //初始化玩家
      ownPlayerInit(player);

      //初始化其他玩家
      otherPlayersInit(players);

      // 移除登陆失败的监听
      socket.off("error_login");
    });

    // 登陆错误提示
    socket.on("error_login", (msg) => {
      alert(msg);
    });

    // 监听来自服务器的位置更新消息
    socket.on("allPlayersPosition", (players) => {
      //获取所有玩家位置
      playersRef.current = players;

    });

    //玩家上线列表
    socket.on("playerLogin",(userName,position)=>{
      if(isLoginRef.current){
        if (userName !== userNameRef.current ) {
          addCXKMesh(userName,position)
          }
      }
      
    })

    // 玩家掉线
    socket.on("playerDisconnect",(username)=>{
      console.log(`${username} disconnected`)
      removePlayerMesh(username)
    })

    /**==================================================RENDER======================================================================= */
    const updateLocation = (players) => {
      //console.log(players);
      Object.entries(players).forEach(([name, player]) => {
        if (otherPlayerMeshDict[name]) {
          const otherPlayer = otherPlayerMeshDict[name];
          otherPlayer.position.x = player.position.x;
          otherPlayer.position.y = player.position.y;
          otherPlayer.position.z = player.position.z;
        }
      });
    };

    // 渲染场景
    const animate = () => {
      requestAnimationFrame(animate);
      //console.log(playersRef.current);
      updateLocation(playersRef.current);
      
      renderer.render(scene, camera);
    };
    animate();

    /**==================================================LISTENNER====================================================================== */
    // 监听键盘移动事件
    const handleKeyPress = (event) => {
      if (isLoginRef.current) {
        const speed = 0.5; // 移动速度
        const cube = cubeRef.current;
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
      const userName = userNameRef.current;
      const cube = cubeRef.current;
      socket.emit("updatePosition", userName, {
        x: cube.position.x,
        y: cube.position.y,
        z: cube.position.z,
      });
    };

    //监听鼠标移动
    
   

    
    window.addEventListener("keydown", handleKeyPress);
    /**============================================================================================================================== */
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

  return <canvas ref={canvasRef} />;
};

export default MultiplayerGame;
