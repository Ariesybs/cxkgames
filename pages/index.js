import React, { useEffect, useRef } from "react";
import Matter from 'matter-js';
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
  Box3,
  DoubleSide,
  PlaneGeometry
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
  const controlsRef = useRef(null)
  const isMovingUpRef = useRef(null);
  const isMovingDownRef = useRef(null);
  const isMovingLeftRef = useRef(null);
  const isMovingRightRef = useRef(null);
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
    renderer.shadowMap.enabled = true
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    camera.position.y = 300
    camera.position.z = 300;

    /**======================================================MATTER ENGINE========================================================= */
    // const engine = Matter.Engine.create();
    // const boxA = Matter.Bodies.rectangle(0, 0, 1, 1);
    // Matter.World.add(engine.world, [boxA]);
    /**======================================================LOADER=========================================================== */
    const fbxLoader = new FBXLoader()
    const fontLoader = new FontLoader();

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

    const light  = new AmbientLight(0xffffff, 2); // 使用白色，并设置光的强度为0.5
    light.position.set(0,1000,0)
    scene.add(light);

    /**=================================================LOAD BASKEBALL COURT===================================================================== */
    fbxLoader.load("/model/map.fbx",(map)=>{
      map.receiveShadow = true
      scene.add(map)
      camera.lookAt(map.position)
    })
    
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

    
    /**======================================================OWN PLAYER========================================================================= */
    // 创建并初始化玩家对象
    const ownPlayerInit = (player) => {
      console.log("own player init")

      // 创建玩家对象
      const playerObj = addCXKMesh(userNameRef.current,player.position,player.rotation)
        
      cubeRef.current = playerObj;
      
    };

    // 加载玩家名字
    const loadUserName=(userName,playerObj)=>{
      
      fontLoader.load("/font/STHupo.json",(font)=>{
        const textGeometry = new TextGeometry(userName, {
          font:font, // 使用字体
          size: 3, // 文本大小
          height: 0.01, // 文本厚度
        });
        const textMaterial = new MeshBasicMaterial({ color: 0xFFFFFF });
        const textMesh = new Mesh(textGeometry, textMaterial);

        const textBoundingBox = new Box3().setFromObject(textMesh);
        const textWidth = textBoundingBox.max.x - textBoundingBox.min.x;
        // 计算偏移量以使文本居中
        
        const xOffset = -(textWidth / 2);
        textMesh.position.set(xOffset, 10, 0);
        
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

    const addCXKMesh = (name,position,rotation)=>{
      const playerObj = new Object3D();
      const shadowGeometry = new CircleGeometry(3, 32); // 适当的大小
      const shadowMaterial = new MeshBasicMaterial({color:0x222222});
      const shadowPlane = new Mesh(shadowGeometry, shadowMaterial);
      shadowPlane.position.set(0, -4.5, 0); // 略微提高以避免Z-fighting
      shadowPlane.rotateX(-Math.PI/2)
      //scene.add(shadowPlane);
      
      fbxLoader.load("/model/cxk.fbx",(cxk)=>{
        playerObj.position.set({x:0,y:32,z:0})
        playerObj.scale.set(2,2,2)
        cxk.castShadow = true
        playerObj.cxk = cxk
        
        playerObj.add(shadowPlane)
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
      
      Object.entries(players).forEach(([name, player]) => {
        const otherPlayer = otherPlayerMeshDict[name];
        if (otherPlayer) {
          console.log(player.rotation)
          otherPlayer.position.copy(player.position)
          
          
          // otherPlayer.position.x = player.position.x;
          // otherPlayer.position.y = player.position.y;
          // otherPlayer.position.z = player.position.z;
          otherPlayer.rotation.x = player.rotation.x;
          otherPlayer.rotation.y = player.rotation.y;
          otherPlayer.rotation.z = player.rotation.z;
        }
      });
    };

    /**==================================================LISTENNER====================================================================== */
    // 监听键盘移动事件

    window.addEventListener("keydown",(event)=> {
      
      if (isLoginRef.current) {
        const playerObj = cubeRef.current
        if (event.key === 'w') {  // W键
          isMovingUpRef.current = true;
          
          
        } else if (event.key === 's') {  // S键
          isMovingDownRef.current = true;
          
          
          
        } else if (event.key === 'a') {  // A键
          isMovingLeftRef.current = true;
          
          
        } else if (event.key === 'd') {  // D键
          isMovingRightRef.current = true;
          
         
        }
        
      }
    });

    window.addEventListener("keyup",(event)=>{
      if (isLoginRef.current) {
        if (event.key === 'w') {  // W键
          isMovingUpRef.current = false;
        } else if (event.key === 's') {  // S键
          isMovingDownRef.current = false;
        } else if (event.key === 'a') {  // A键
          isMovingLeftRef.current = false;
        } else if (event.key === 'd') {  // D键
          isMovingRightRef.current = false;
        }
      }
    })

    // 发送本地物体位置到服务器
    const sendPositionToServer = () => {
      const userName = userNameRef.current;
      const cube = cubeRef.current;
      socket.emit("updatePosition", userName, {
        x: cube.position.x,
        y: cube.position.y,
        z: cube.position.z,
      },
      {
        x:cube.rotation.x,
        y:cube.rotation.y,
        z:cube.rotation.z
      });
    };



    // 渲染场景
    const animate = () => {
      requestAnimationFrame(animate);
      updateLocation(playersRef.current );
      
      if(cubeRef.current){
        const playerObj = cubeRef.current
        console.log(cubeRef.current.rotation)
        if(isMovingLeftRef.current){
          cubeRef.current.position.x -= 0.5
          playerObj.rotation.x = 0; // 重置其他旋转
          playerObj.rotation.z = 0; // 重置其他旋转
          playerObj.rotation.y = 0; // 重置其他旋转
          playerObj.rotateY(-Math.PI/2); // 
          sendPositionToServer()
        }
        if(isMovingRightRef.current){
          cubeRef.current.position.x += 0.5
          playerObj.rotation.x = 0; // 重置其他旋转
          playerObj.rotation.z = 0; // 重置其他旋转
          playerObj.rotation.y = 0; // 重置其他旋转
          playerObj.rotateY(Math.PI/2); // 
          sendPositionToServer()
        }
        if(isMovingUpRef.current){
          cubeRef.current.position.z -= 0.5
          playerObj.rotation.x = 0; // 重置其他旋转
          playerObj.rotation.z = 0; // 重置其他旋转
          playerObj.rotation.y = 0; // 重置其他旋转
          playerObj.rotateY(Math.PI); // 向上
          sendPositionToServer()
        }
        if(isMovingDownRef.current){
          cubeRef.current.position.z += 0.5
          playerObj.rotation.x = 0; // 重置其他旋转
          playerObj.rotation.z = 0; // 重置其他旋转
          playerObj.rotation.y = 0; // 重置其他旋转
          sendPositionToServer()
        }
        
        camera.position.copy(cubeRef.current.position.clone().add(new Vector3(0,50,100)))
        camera.lookAt(cubeRef.current.position)
      }
      
      renderer.render(scene, camera);
    };
    animate();




    
    /**============================================================================================================================== */
    return () => {
      
    };
  }, []);

  return (
  <div style={{overflow:'hidden'}}>
  <canvas ref={canvasRef}/>
  </div>
  )
};

export default MultiplayerGame;
