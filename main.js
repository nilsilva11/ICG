import * as THREE from "https://cdn.skypack.dev/three@0.132.2";
import { PointerLockControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/PointerLockControls.js';
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.132.2/examples/jsm/loaders/GLTFLoader.js";
import { RectAreaLightUniformsLib } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { RectAreaLightHelper } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/helpers/RectAreaLightHelper.js';

let scene, camera, renderer, controls;
let flashlight, flashlightTarget;
let lanternVisible = false;
let portaBloqueada = false;
let portaModelo;
let portao;
let lanternPickedUp = false;
let flashlightLight;
let pickupDistance = 50; 
let doorAnimation; 
let mixer;  
let doorAction;
let canOpenDoor = true; 
let campoTexto = document.getElementById('campoTexto');  
let textoDigitado = "";
let digitandoCodigo = false;
let codigoCorreto = "2734";
let codelock;
let mixerPortao;
let portaoAnimation;
let portaoAction;
let collidableObjects = []; 
const wallBoxes = [];
let portaoAberto = false;
let portaoBox = null;
let portaAberta = false;
let portaBox = null;
let origami;
let startTime = null;
let stopTime;
const hudCommands = document.getElementById('showCommands');
const hudHints = document.getElementById('showHints');
const popup = document.getElementById('popup');
const popupContent = document.getElementById('popupContent');
const closePopup = document.getElementById('closePopup');

const wallHeight = 150;
const totalWidth = 140;
const gapWidth = 40;
const sideWidth = (totalWidth - gapWidth) / 2;
const doorTopHeight = 30; // altura maior
const doorTopY = 36; // sobe mais para cima
const posX = -70;             // posição central X da parede
const posY = -10;
const posZ = -74.5;



hudCommands.addEventListener('click', () => {
    if (popup.classList.contains('visible') && popupContent.innerHTML.includes('Comandos')) {
      popup.classList.remove('visible'); // se já está aberto com comandos, fecha
    } else {
      popupContent.innerHTML = `
        <h2>Comandos</h2>
        <ul>
          <li>WASD - Movimento</li>
          <li>F - Ligar/Desligar lanterna</li>
          <li>O - Abrir porta</li>
          <li>E - Pegar/Interagir com objetos</li>
        </ul>
      `;
      popup.classList.add('visible'); // mostra popup com comandos
    }
  });
  
  hudHints.addEventListener('click', () => {
    if (popup.classList.contains('visible') && popupContent.innerHTML.includes('Pistas')) {
      popup.classList.remove('visible'); // se já está aberto com pistas, fecha
    } else {
      popupContent.innerHTML = `
        <h2>Pistas</h2>
        <ul>
          <li>4 digit code needed</li>
          <li>Each room contains a clue for a digit</li>
          <li>Sala 1: Peace sign </li>
          <li>Sala 2: What time is it?</li>
          <li>Sala 3: The trump suit is spades</li>
          <li>Sala 4: The clue is outside the room</li>
        </ul>
      `;
      popup.classList.add('visible'); // mostra popup com pistas
    }
  });
  
  closePopup.addEventListener('click', () => {
    popup.classList.remove('visible');
  });
  

init();
animate();

function init() {

    // Carregador de modelos GLB
    const loader = new GLTFLoader();

    // Cena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const lampLight = new THREE.PointLight(0xFFA500, 1.5, 100); // Cor alaranjada
    lampLight.position.set(0, 1, 0); 

    // Câmara
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(-300, -10, 0); // ao nível do chão (o chão está em y = -50)
    //camera.position.set(50, -10, 40)

    camera.rotation.y = Math.PI / -2;
          

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    //first person controls
    controls = new PointerLockControls(camera, document.body);
    scene.add(controls.getObject());

    RectAreaLightUniformsLib.init(); //led lobby lights

    // CHÃO
    const textureLoader = new THREE.TextureLoader();
    const floorTexture = textureLoader.load('escaperoom/textures/concrete.jpg'); 

    //textura do chão
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(8, 8); 

    const floorMaterial = new THREE.MeshStandardMaterial({ map: floorTexture });

    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(400, 400),
        floorMaterial
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -50;
    scene.add(floor);

    // TETO
    const ceiling = new THREE.Mesh(
        new THREE.PlaneGeometry(402, 402),
        new THREE.MeshStandardMaterial({ color: 0x333333, side: THREE.DoubleSide })
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 50;
    scene.add(ceiling);

    // PAREDES
    const wallTexture = textureLoader.load('escaperoom/textures/wall.jpg'); 

    
    wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(4, 2); // ajusta horizontal/vertical

    const wallMaterial = new THREE.MeshStandardMaterial({
        map: wallTexture,
        side: THREE.DoubleSide, // para que as paredes sejam visíveis de ambos os lados
        roughness: 1,
        metalness: 0
    });
   

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(400, 100, 2), wallMaterial);
    backWall.position.set(0, 0, -200);
    scene.add(backWall);

    const frontWall = new THREE.Mesh(new THREE.BoxGeometry(400, 100, 2), wallMaterial);
    frontWall.position.set(0, 0, 200);
    scene.add(frontWall);

    //frontwall
    //const leftWall = createWallWithHole();

    const leftWall1 = new THREE.Mesh(new THREE.BoxGeometry(2, 100, 180), wallMaterial);
    leftWall1.position.set(-200, 0, -110);
    scene.add(leftWall1);

    const leftWall2 = new THREE.Mesh(new THREE.BoxGeometry(2, 100, 180), wallMaterial);
    leftWall2.position.set(-200, 0, 110);
    scene.add(leftWall2);

    const leftWall3 = new THREE.Mesh(new THREE.BoxGeometry(2, 100, 100), wallMaterial);
    leftWall3.position.set(-200,68,0);
    scene.add(leftWall3);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(2, 100, 198), wallMaterial);
    rightWall.position.set(200, 0, -150);
    scene.add(rightWall);
    
    const rightWall2 = new THREE.Mesh(new THREE.BoxGeometry(2, 100, 198), wallMaterial);
    rightWall2.position.set(200, 0, 150);
    scene.add(rightWall2);


    collidableObjects = [backWall, frontWall, leftWall1, leftWall2, leftWall3, rightWall, rightWall2]; // objetos com os quais o jogador pode colidir

    collidableObjects.forEach(obj => {
        const box = new THREE.Box3().setFromObject(obj);
        wallBoxes.push(box);
    });

    // ==================== lobby room =========================

    const lobbyFloorTexture = textureLoader.load('escaperoom/textures/lobbyfloor.jpg');
    lobbyFloorTexture.wrapS = lobbyFloorTexture.wrapT = THREE.RepeatWrapping;
    lobbyFloorTexture.repeat.set(4, 4);

    const lobbyFloorMaterial = new THREE.MeshStandardMaterial({ map: lobbyFloorTexture });

    const lobbyFloor = new THREE.Mesh(
        new THREE.PlaneGeometry(200, 400),
        lobbyFloorMaterial
    );
    lobbyFloor.rotation.x = -Math.PI / 2;
    lobbyFloor.position.set(-300, -50, 0); // deslocada para o lado
    scene.add(lobbyFloor);

    const lobbyCeilingTexture = textureLoader.load('escaperoom/textures/lobbywall.jpg');
    lobbyCeilingTexture.wrapS = lobbyCeilingTexture.wrapT = THREE.RepeatWrapping;
    lobbyCeilingTexture.repeat.set(4, 2);

    const lobbyCeilingMaterial = new THREE.MeshStandardMaterial({
        map: lobbyCeilingTexture,
        side: THREE.DoubleSide
    });

    const lobbyCeiling = new THREE.Mesh(
        new THREE.PlaneGeometry(200, 400),
        lobbyCeilingMaterial
    );

    lobbyCeiling.rotation.x = Math.PI / 2;
    lobbyCeiling.position.set(-300, 50, 0);
    scene.add(lobbyCeiling); 

    //LED lights no teto do lobby
    const ledLight = new THREE.RectAreaLight(0xffffff, 3, 100, 300); // (cor, intensidade, largura, altura)
    ledLight.position.set(-300, 49.5, 0); // ligeiramente abaixo do teto
    ledLight.rotation.x = -Math.PI / 2; // apontar para baixo
    scene.add(ledLight);

    //paredes do lobby (sem parede a ligar ao armazém)
    const lobbyWallTexture = textureLoader.load('escaperoom/textures/lobbywall.jpg');
    lobbyWallTexture.wrapS = lobbyWallTexture.wrapT = THREE.RepeatWrapping;
    lobbyWallTexture.repeat.set(4, 2);

    const lobbyWallMaterial = new THREE.MeshStandardMaterial({ map: lobbyWallTexture });

    const lobbyBackWall = new THREE.Mesh(new THREE.BoxGeometry(2, 100, 400), lobbyWallMaterial);
    lobbyBackWall.position.set(-400, 0, 0); // esquerda
    scene.add(lobbyBackWall);

    const lobbyFrontWall = new THREE.Mesh(new THREE.BoxGeometry(200, 100, 2), lobbyWallMaterial);
    lobbyFrontWall.position.set(-300, 0, 200);
    scene.add(lobbyFrontWall);

    const lobbyBackWall2 = new THREE.Mesh(new THREE.BoxGeometry(200, 100, 2), lobbyWallMaterial);
    lobbyBackWall2.position.set(-300, 0, -200);
    scene.add(lobbyBackWall2);

    // ==================== lobby room end =========================
    // ======================  clue rooms =========================
    //quarto fundo esquerda

    const roomLight = new THREE.PointLight(0xffffff, 1, 60); // cor branca, intensidade 1, alcance 60
    roomLight.position.set(60, 30, -110); // perto do centro da sala e em altura
    roomLight.castShadow = true; // se quiser sombras (opcional)
    scene.add(roomLight);

    // Lado esquerdo
    const room1Left = new THREE.Mesh(new THREE.PlaneGeometry(150, 250), wallMaterial);
    room1Left.rotation.y = Math.PI / 2;
    room1Left.position.set(-10, -10, -149); // ajusta conforme necessário
    scene.add(room1Left);
    wallBoxes.push(new THREE.Box3().setFromObject(room1Left));

    // Lado direito
    const room1Right = new THREE.Mesh(new THREE.PlaneGeometry(150, 250), wallMaterial);
    room1Right.position.set(130.5, -10, -149); // ajusta a posição se for preciso
    room1Right.rotation.y = -Math.PI / 2; // gira para ficar na orientação correta
    scene.add(room1Right);
    wallBoxes.push(new THREE.Box3().setFromObject(room1Right));

    // Parede atrás (topo)
    /*const room1Back = new THREE.Mesh(new THREE.PlaneGeometry(140, 150), wallMaterial);
    room1Back.position.set(60, -10, -74.5);
    scene.add(room1Back);
    wallBoxes.push(new THREE.Box3().setFromObject(room1Back)); */

    const room1BackLeft = new THREE.Mesh(new THREE.PlaneGeometry(sideWidth, wallHeight), wallMaterial);
    room1BackLeft.position.set(60 - (gapWidth / 2 + sideWidth / 2), -10, -74.5);
    scene.add(room1BackLeft);
    wallBoxes.push(new THREE.Box3().setFromObject(room1BackLeft));

    // Parede direita
    const room1BackRight = new THREE.Mesh(new THREE.PlaneGeometry(sideWidth, wallHeight), wallMaterial);
    room1BackRight.position.set(60 + (gapWidth / 2 + sideWidth / 2), -10, -74.5);
    scene.add(room1BackRight);
    wallBoxes.push(new THREE.Box3().setFromObject(room1BackRight));

    // placa room 2
    const canvas = document.createElement('canvas');
    canvas.width = 500;   // tamanho do canvas, podes ajustar
    canvas.height = 200;

    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height); // limpa o canvas
    

    context.font = 'bold 100px Arial';  // fonte, tamanho e estilo
    context.fillStyle = 'black';         // cor do texto
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('ROOM 2', canvas.width / 2, canvas.height / 2);

    const numberTexture = new THREE.CanvasTexture(canvas);

    const numberMaterial = new THREE.MeshBasicMaterial({ 
        map: numberTexture,
        transparent: true  // permite fundo transparente se quiseres
    });

    const numberMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(gapWidth, doorTopHeight * 0.6),  // tamanho do número na parede, ajusta conforme quiseres
        numberMaterial
    );

    // Posicionar o número no topo da porta (ou onde quiseres)
    numberMesh.position.set(60, doorTopY, -74.4); // ligeiramente à frente da parede para evitar z-fighting
    scene.add(numberMesh);


    const doorTop = new THREE.Mesh(
        new THREE.PlaneGeometry(140, doorTopHeight), // largura igual à parede, altura aumentada
        wallMaterial
    );
    doorTop.position.set(60, doorTopY, -74.5); // aumenta a posição Y para subir a peça
    scene.add(doorTop);
    wallBoxes.push(new THREE.Box3().setFromObject(doorTop));

    //room 1
    // Lado direito
    const room2Right = new THREE.Mesh(new THREE.PlaneGeometry(150, 250), wallMaterial);
    room2Right.position.set(-140, -10, -149); // ajusta a posição se for preciso
    room2Right.rotation.y = -Math.PI / 2; // gira para ficar na orientação correta
    scene.add(room2Right);
    wallBoxes.push(new THREE.Box3().setFromObject(room2Right));

    // Parede atrás (topo)
    // Parede esquerda
    const room2BackLeft = new THREE.Mesh(new THREE.PlaneGeometry(sideWidth, wallHeight), wallMaterial);
    room2BackLeft.position.set(posX - (gapWidth / 2 + sideWidth / 2), posY, posZ);
    scene.add(room2BackLeft);
    wallBoxes.push(new THREE.Box3().setFromObject(room2BackLeft));

    // Parede direita
    const room2BackRight = new THREE.Mesh(new THREE.PlaneGeometry(sideWidth, wallHeight), wallMaterial);
    room2BackRight.position.set(posX + (gapWidth / 2 + sideWidth / 2), posY, posZ);
    scene.add(room2BackRight);
    wallBoxes.push(new THREE.Box3().setFromObject(room2BackRight));

    const doorTop2 = new THREE.Mesh(
        new THREE.PlaneGeometry(gapWidth, doorTopHeight), // largura igual à parede, altura aumentada
        wallMaterial
    );
    doorTop2.position.set(posX, doorTopY, posZ); // aumenta a posição Y para subir a peça
    scene.add(doorTop2);
    wallBoxes.push(new THREE.Box3().setFromObject(doorTop2));

    // Placa room 1
    const canvasRoom1 = document.createElement('canvas');
    canvasRoom1.width = 500;
    canvasRoom1.height = 200;
    const contextRoom1 = canvasRoom1.getContext('2d');

    // Fundo transparente
    contextRoom1.clearRect(0, 0, canvasRoom1.width, canvasRoom1.height);

    // Texto preto, centralizado
    contextRoom1.font = 'bold 100px Arial';
    contextRoom1.fillStyle = 'black';
    contextRoom1.textAlign = 'center';
    contextRoom1.textBaseline = 'middle';
    contextRoom1.fillText('ROOM 1', canvasRoom1.width / 2, canvasRoom1.height / 2);

    // Criar textura a partir do canvas
    const textureRoom1 = new THREE.CanvasTexture(canvasRoom1);

    // Material com a textura e transparente
    const materialRoom1 = new THREE.MeshBasicMaterial({ 
    map: textureRoom1, 
    transparent: true 
    });

    // Plano para o texto, com tamanho ajustado
    const planeRoom1 = new THREE.Mesh(
    new THREE.PlaneGeometry(gapWidth, doorTopHeight * 0.6), // proporção do tamanho da porta
    materialRoom1
    );

    // Posicionar o texto no mesmo local que doorTop2, ligeiramente à frente para evitar z-fighting
    planeRoom1.position.set(posX, doorTopY, posZ + 0.1); // 0.1 à frente da parede

    scene.add(planeRoom1);



    //sala 3
    // Lado esquerdo
    const room1LeftMirror = new THREE.Mesh(new THREE.PlaneGeometry(150, 250), wallMaterial);
    room1LeftMirror.rotation.y = Math.PI / 2;  // mantém rotação igual
    room1LeftMirror.position.set(-10, -10, 149); // inverte Z
    scene.add(room1LeftMirror);
    wallBoxes.push(new THREE.Box3().setFromObject(room1LeftMirror));

    // Lado direito
    const room1RightMirror = new THREE.Mesh(new THREE.PlaneGeometry(150, 250), wallMaterial);
    room1RightMirror.position.set(130.5, -10, 149); // inverte Z
    room1RightMirror.rotation.y = -Math.PI / 2;  // mantém rotação igual
    scene.add(room1RightMirror);
    wallBoxes.push(new THREE.Box3().setFromObject(room1RightMirror));

    // Parede atrás esquerda
    const room1BackLeftMirror = new THREE.Mesh(new THREE.PlaneGeometry(sideWidth, wallHeight), wallMaterial);
    room1BackLeftMirror.position.set(60 - (gapWidth / 2 + sideWidth / 2), -10, 74.5); // inverte Z
    scene.add(room1BackLeftMirror);
    wallBoxes.push(new THREE.Box3().setFromObject(room1BackLeftMirror));

    // Parede atrás direita
    const room1BackRightMirror = new THREE.Mesh(new THREE.PlaneGeometry(sideWidth, wallHeight), wallMaterial);
    room1BackRightMirror.position.set(60 + (gapWidth / 2 + sideWidth / 2), -10, 74.5); // inverte Z
    scene.add(room1BackRightMirror);
    wallBoxes.push(new THREE.Box3().setFromObject(room1BackRightMirror));

    const doorTop3 = new THREE.Mesh(
        new THREE.PlaneGeometry(gapWidth, doorTopHeight),
        wallMaterial
    );
    doorTop3.position.set(60, doorTopY, 74.5);  // X = 60 (meio), Y = doorTopY, Z = 74.5 (espelho)
    scene.add(doorTop3);
    wallBoxes.push(new THREE.Box3().setFromObject(doorTop3));

    //placa room 3
    const canvasRoom1Z = document.createElement('canvas');
    canvasRoom1Z.width = 500;
    canvasRoom1Z.height = 200;
    const contextRoom1Z = canvasRoom1Z.getContext('2d');
    contextRoom1Z.clearRect(0, 0, canvasRoom1Z.width, canvasRoom1Z.height);
    contextRoom1Z.font = 'bold 100px Arial';
    contextRoom1Z.fillStyle = 'black';
    contextRoom1Z.textAlign = 'center';
    contextRoom1Z.textBaseline = 'middle';
    contextRoom1Z.fillText('ROOM 3', canvasRoom1Z.width / 2, canvasRoom1Z.height / 2);
    const textureRoom1Z = new THREE.CanvasTexture(canvasRoom1Z);
    const materialRoom1Z = new THREE.MeshBasicMaterial({ map: textureRoom1Z, transparent: true });
    const planeRoom1Z = new THREE.Mesh(
        new THREE.PlaneGeometry(gapWidth, doorTopHeight * 0.6),
        materialRoom1Z
    );
    planeRoom1Z.position.set(posX, doorTopY, -posZ - 1);
    planeRoom1Z.rotation.y = Math.PI;
    scene.add(planeRoom1Z);

    //sala 4

    const room2RightMirror = new THREE.Mesh(new THREE.PlaneGeometry(150, 250), wallMaterial);
    room2RightMirror.position.set(-140, -10, 149); // inverte Z
    room2RightMirror.rotation.y = -Math.PI / 2;
    scene.add(room2RightMirror);
    wallBoxes.push(new THREE.Box3().setFromObject(room2RightMirror));

    const room2BackLeftMirror = new THREE.Mesh(new THREE.PlaneGeometry(sideWidth, wallHeight), wallMaterial);
    room2BackLeftMirror.position.set(posX - (gapWidth / 2 + sideWidth / 2), posY, -posZ); // inverte Z
    scene.add(room2BackLeftMirror);
    wallBoxes.push(new THREE.Box3().setFromObject(room2BackLeftMirror));

    const room2BackRightMirror = new THREE.Mesh(new THREE.PlaneGeometry(sideWidth, wallHeight), wallMaterial);
    room2BackRightMirror.position.set(posX + (gapWidth / 2 + sideWidth / 2), posY, -posZ); // inverte Z
    scene.add(room2BackRightMirror);
    wallBoxes.push(new THREE.Box3().setFromObject(room2BackRightMirror));

    const doorTop2Mirror = new THREE.Mesh(
        new THREE.PlaneGeometry(gapWidth, doorTopHeight),
        wallMaterial
    );
    doorTop2Mirror.position.set(posX, doorTopY, -posZ);
    scene.add(doorTop2Mirror);
    wallBoxes.push(new THREE.Box3().setFromObject(doorTop2Mirror));

    //placa room 4
    const canvasRoom2XZ = document.createElement('canvas');
    canvasRoom2XZ.width = 500;
    canvasRoom2XZ.height = 200;
    const contextRoom2XZ = canvasRoom2XZ.getContext('2d');
    contextRoom2XZ.clearRect(0, 0, canvasRoom2XZ.width, canvasRoom2XZ.height);
    contextRoom2XZ.font = 'bold 100px Arial';
    contextRoom2XZ.fillStyle = 'black';
    contextRoom2XZ.textAlign = 'center';
    contextRoom2XZ.textBaseline = 'middle';
    contextRoom2XZ.fillText('ROOM 4', canvasRoom2XZ.width / 2, canvasRoom2XZ.height / 2);
    const textureRoom2XZ = new THREE.CanvasTexture(canvasRoom2XZ);
    const materialRoom2XZ = new THREE.MeshBasicMaterial({ map: textureRoom2XZ, transparent: true });
    const planeRoom2XZ = new THREE.Mesh(
        new THREE.PlaneGeometry(gapWidth, doorTopHeight * 0.6),
        materialRoom2XZ
    );
    planeRoom2XZ.position.set(-posX - 10, doorTopY, -posZ -1);
    planeRoom2XZ.rotation.y = Math.PI;
    scene.add(planeRoom2XZ);
   


    
    // ======================  clue rooms =========================


    //carregar lanterna para cima da mesa
    loader.load('escaperoom/models/flashlight.glb', function (gltf) {
        const lantern = gltf.scene;
        
        //ajustar a escala
        lantern.scale.set(90, 90, 90);

        // Posiciona a lanterna em cima da mesa
        lantern.position.set(-220, -27.5, -40); 

        scene.add(lantern);

        flashlight = lantern;

        //criar luz da lanterna
        flashlightLight = new THREE.SpotLight(0xffffff, 3, 200, Math.PI / 6, 0.2); // mais estreito
        flashlightLight.visible = false; // Iniciar com a luz desligada
        flashlightLight.position.set(0, 0, 0); // Origem na lanterna
        flashlightLight.castShadow = true;

        //adicionar a luz ao modelo da lanterna
        lantern.add(flashlightLight);

        //criar um range para a luz da lanterna
        flashlightTarget = new THREE.Object3D();
        flashlightTarget.position.z = -5; 
        camera.add(flashlightTarget);

        flashlightLight.target = flashlightTarget; 

        camera.add(flashlightLight);

    });

    //carregar modelo de porta
    loader.load('escaperoom/models/door.glb', function (gltf) {
        portaModelo = gltf.scene;


        //escala da porta
        portaModelo.scale.set(35, 30, 50);
        portaModelo.position.set(-200, -50, 0);
        portaModelo.rotation.y = Math.PI / 2;
        scene.add(portaModelo);

        portaBox = new THREE.Box3().setFromObject(portaModelo);
        wallBoxes.push(portaBox);

        const animations = gltf.animations;

        //criar o mixer para controlar animações
        mixer = new THREE.AnimationMixer(portaModelo);

        //verificar se há animações e associar à animação de abrir a porta
        if (animations && animations.length) {
            
            doorAnimation = animations[0];  
            doorAction = mixer.clipAction(doorAnimation);

        
            doorAction.setLoop(THREE.LoopOnce, 1); 
            doorAction.clampWhenFinished = true; 
        }
    });


    //carregar walllamp
    loader.load('escaperoom/models/walllamp.glb', function (gltf) {
        const lampAboveDoor = gltf.scene;
        
        //colocado em cima da porta
        lampAboveDoor.position.set(-217, 40, 0);

        lampAboveDoor.rotation.y = Math.PI;

        lampAboveDoor.scale.set(5, 5, 5);    
        scene.add(lampAboveDoor);

        //criar a "lâmpada"
        const bulbGeometry = new THREE.SphereGeometry(0.2, 32, 32); 
        const bulbMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });  //cor amarelada
        const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);

        //posicionar a esfera dentro do candeeiro 
        bulb.position.set(-215, 30, 0); 
        lampAboveDoor.add(bulb); 

        //luz do canddeeiro
        const lightAboveDoor = new THREE.PointLight(0xffa500, 2, 100);
        lightAboveDoor.position.set(-215, 30, 0); 
        scene.add(lightAboveDoor);

    });

    
    //carregar luz do armazém
    loader.load('escaperoom/models/lamp.glb', function (gltf) {
        const lamp = gltf.scene;
        lamp.position.set(0, 47, 0);
        lamp.scale.set(40, 40, 40);
        scene.add(lamp);

        //luz pendurada no candeeiro
        const lampLight = new THREE.PointLight(0xffffaa, 3, 150);
        lampLight.position.set(0, 40, 0);
        scene.add(lampLight);
    });

    //sala pista
    loader.load('escaperoom/models/room1.glb', function(gltf) {
        const sala = gltf.scene;

        sala.scale.set(0.2, 0.18, 0.2);
        
        sala.position.set(70, -48, -135);
        
    
        scene.add(sala);
    });

    //chair room

    loader.load('escaperoom/models/creepy.glb', function(gltf) {
        const creepyroom = gltf.scene;
        creepyroom.position.set(-75, -48, -164);
        creepyroom.scale.set(0.27, 0.3, 0.3);  // ajusta escala se necessário

        creepyroom.traverse(child => {
            if (child.isMesh) {
              const worldPos = new THREE.Vector3();
              child.getWorldPosition(worldPos);
              console.log('Posição absoluta (world) da lâmpada', child.name, ':', worldPos);
            }
          });

        creepyroom.traverse(child => {
            if (child.isMesh && child.name === 'wallsAndFloor_cement_0') {
              child.visible = false; 
              console.log(`Ocultado: ${child.name}`);
            }
        });

        const lampPosition = new THREE.Vector3(-75, 20, -160);  // posição no teto (ajusta Y para altura desejada)
        const targetPosition = new THREE.Vector3(-75, 0, -160);  // ponto no chão onde o feixe incide

        const spotLight = new THREE.SpotLight(0xffffff, 10, 100, Math.PI / 6, 0.2, 2);
        spotLight.position.copy(lampPosition);

        // Define o alvo do spotLight para apontar para o chão
        spotLight.target.position.copy(targetPosition);
        scene.add(spotLight.target);

        scene.add(spotLight);

        scene.add(creepyroom);
    });

    loader.load('escaperoom/models/old_room.glb', function(gltf) {
        const oldroom = gltf.scene;

        
        oldroom.position.set(-85, -49, 149);
        oldroom.scale.set(0.18, 0.2, 0.19);  // ajusta escala se necessário

        scene.add(oldroom);

        const lampLight = new THREE.PointLight(0xffffaa, 1, 100); // cor amarelada, intensidade 2, alcance 100

        // Usar as posições absolutas que viste (x,y,z)
        lampLight.position.set(-95, -15, 195);

        // Podes adicionar a luz diretamente à cena
        scene.add(lampLight);

        
    });

    loader.load('escaperoom/models/cards.glb', function(gltf) {
        const cards = gltf.scene;

        
        cards.position.set(-80, -25, 195);
        cards.scale.set(0.005, 0.005, 0.005);  // ajusta escala se necessário
        cards.rotation.x = -Math.PI/4; // ajusta a rotação se necessário
        
        scene.add(cards);

        
    });


    //carregar mesa
    loader.load('escaperoom/models/table.glb', function (gltf) {
        const table = gltf.scene;
        table.scale.set(7, 7, 7); 
        table.position.set(-220, -50, -40); 
        table.rotation.y = Math.PI / 2; 
        scene.add(table);
    });


    //origami
    loader.load('escaperoom/models/origami.glb', function(gltf) {
        origami = gltf.scene;
        origami.scale.set(2, 2, 2);  // ajusta a escala conforme o tamanho que queres
        origami.position.set(-75, -27, -162); // posição da cadeira, ajusta o Y para ficar em cima
        origami.rotation.y = 0;  // ajusta se quiseres rodar o origami
        
        scene.add(origami);
        
        // aqui podes adicionar interação para detectar clique no origami
    });

    //carregar modelo de portão
    loader.load('escaperoom/models/garage.glb', function (gltf) {
        
        portao = gltf.scene;
    
            //escala da porta
        portao.scale.set(50, 50, 50);
        portao.position.set(200, -50, 0);
        portao.rotation.y = Math.PI / 2;
        scene.add(portao);

        portaoBox = new THREE.Box3().setFromObject(portao);
        wallBoxes.push(portaoBox);

        const animations = gltf.animations;
        if (animations && animations.length) {
            mixerPortao = new THREE.AnimationMixer(portao);
            portaoAnimation = animations[1];
            portaoAction = mixerPortao.clipAction(portaoAnimation);
            
            // Define a animação para tocar uma vez e sem looping
            portaoAction.setLoop(THREE.LoopOnce, 1); 
            portaoAction.clampWhenFinished = true; 
        }
    
        
    });

    //================================carregar candeeiro industrial

    // Posição da parede (centro)
    const wallX = posX - (gapWidth / 2 + sideWidth / 2);
    const wallY = posY;
    const wallZ = posZ;

    // Deslocamento para o lado esquerdo do lado esquerdo da parede
    // meio da largura da parede + uma distância extra (exemplo 5)
    const deslocamentoLadoEsquerdo = sideWidth / 2 + 5;

    // Posição do objeto ao lado esquerdo da parede
    const objectX = wallX - deslocamentoLadoEsquerdo;
    const objectY = wallY; // mesmo nível vertical da parede
    const objectZ = wallZ; // mesma profundidade da parede

    loader.load('escaperoom/models/industrial.glb', function(gltf) {
        const industrial = gltf.scene;
        industrial.scale.set(50, 50, 50);
        industrial.rotation.y = Math.PI;
        industrial.position.set(objectX - 20, -50, objectZ);
        scene.add(industrial);

        // Criar a esfera que representa a lâmpada dentro do candeeiro
        const bulbGeometry = new THREE.SphereGeometry(0.5, 32, 32); 
        const bulbMaterial = new THREE.MeshBasicMaterial({ color: 0xffffaa, emissive: 0xffffaa }); // luz amarelada
        const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
        bulb.visible = false;

        // Ajusta esta posição para ficar exatamente dentro do candeeiro industrial
        industrial.add(bulb); 

        // Luz do candeeiro (point light, para iluminar localmente)
        const light = new THREE.PointLight(0xffffaa, 2, 100);
        light.position.set(0, 1.5, -1);
        industrial.add(light);

    
    });


    //candeeiro inndustrial 2

    // Posicao da parede (centro)
    const wall2X = -140;
    const wall2Y = -10;
    const wall2Z = -149;

    // Deslocamento para o lado direito do lado direito da parede
    const deslocamentoLadoDireito = sideWidth / 2 + 5; // mesma lógica, desloca para a direitae

    loader.load('escaperoom/models/industrial.glb', function(gltf) {
        const industrial2 = gltf.scene;
        industrial2.scale.set(50, 50, 50);
        industrial2.rotation.y = Math.PI; // gira conforme necessário para alinhamento
        industrial2.position.set(155,-50, -75); // ajusta a posição para o lado direito da parede
        scene.add(industrial2);

        // Criar a esfera que representa a lâmpada dentro do candeeiro
        const bulbGeometry = new THREE.SphereGeometry(0.5, 32, 32);
        const bulbMaterial = new THREE.MeshBasicMaterial({ color: 0xffffaa, emissive: 0xffffaa });
        const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
        bulb.visible = false;
        industrial2.add(bulb);

        // Luz do candeeiro (point light, para iluminar localmente)
        const light = new THREE.PointLight(0xffffaa, 2, 100);
        light.position.set(0, 1.5, -1);
        industrial2.add(light);
    });


    //candeeiro industrial 3

    // Posicao da parede (centro)
    const wall3X = -140;
    const wall3Y = -10;
    const wall3Z = -149;

    // Deslocamento para o lado direito do lado direito da parede
    const deslocamentoLadoDireito3 = sideWidth / 2 + 5; // mesma lógica, desloca para a direita

    // Posicao do objeto ao lado direito da paredee

    loader.load('escaperoom/models/industrial.glb', function(gltf) {
        const industrial3 = gltf.scene;
        industrial3.scale.set(50, 50, 50);
        //industrial3.rotation.y = ; // gira conforme necessário para alinhamento
        industrial3.position.set(155,-50, 100); // ajusta a posição para o lado direito da parede
        scene.add(industrial3);

        // Criar a esfera que representa a lâmpada dentro do candeeiro
        const bulbGeometry = new THREE.SphereGeometry(0.5, 32, 32);
        const bulbMaterial = new THREE.MeshBasicMaterial({ color: 0xffffaa, emissive: 0xffffaa });
        const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
        bulb.visible = false;
        industrial3.add(bulb);

        // Luz do candeeiro (point light, para iluminar localmente)
        const light = new THREE.PointLight(0xffffaa, 2, 100);
        light.position.set(0, 1.5, -1);
        industrial3.add(light);
    });


    //candeeiro industrial 4

    loader.load('escaperoom/models/industrial.glb', function(gltf) {
        const industrial4 = gltf.scene;
        industrial4.scale.set(50, 50, 50);
        //industrial3.rotation.y = ; // gira conforme necessário para alinhamento
        industrial4.position.set(-160,-50, 100); // ajusta a posição para o lado direito da parede
        scene.add(industrial4);

        // Criar a esfera que representa a lâmpada dentro do candeeiro
        const bulbGeometry = new THREE.SphereGeometry(0.5, 32, 32);
        const bulbMaterial = new THREE.MeshBasicMaterial({ color: 0xffffaa, emissive: 0xffffaa });
        const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
        bulb.visible = false;
        industrial4.add(bulb);

        // Luz do candeeiro (point light, para iluminar localmente)
        const light = new THREE.PointLight(0xffffaa, 2, 100);
        light.position.set(0, 1.5, -1);
        industrial4.add(light);
    });



    //carregar modelo do codelock
    loader.load('escaperoom/models/codelock.glb', function (gltf) {
        
        codelock = gltf.scene;
    
            //escala da porta
        codelock.scale.set(5, 5, 5);
        codelock.position.set(200, -10, 70);
        codelock.rotation.y = Math.PI;
        scene.add(codelock);
    
    });


};

//lock após clicar 
document.addEventListener('click', () => {
    controls.lock();
  });

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const move = { forward: false, backward: false, left: false, right: false };

//movimento wasd
document.addEventListener('keydown', (event) => {
  switch (event.code) {
    case 'KeyW': move.forward = true; break;
    case 'KeyS': move.backward = true; break;
    case 'KeyA': move.left = true; break;
    case 'KeyD': move.right = true; break;
  }
});

//movimento wasd
document.addEventListener('keyup', (event) => {
  switch (event.code) {
    case 'KeyW': move.forward = false; break;
    case 'KeyS': move.backward = false; break;
    case 'KeyA': move.left = false; break;
    case 'KeyD': move.right = false; break;
  }
});

//ligar/desligar lanterna
document.addEventListener('keydown', (event) => {
    if (event.code === 'KeyF' && lanternPickedUp) {
        lanternVisible = !lanternVisible;
        flashlightLight.visible = lanternVisible;

        console.log("Lanterna:", lanternVisible ? "ON" : "OFF");
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() === 'x') {
      hudCommands.click();
    } else if (event.key.toLowerCase() === 'z') {
      hudHints.click();
    }
  });

document.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() === 'e') {
        if (verificarProximidadeParaOrigami()) {
            abrirPopupPista();
        }
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() === 'e') {
      if (verificarProximidadeParaAbrirCampo()) {
        mostrarCampoTexto();
      }
    }
  });

//abrir e fechar porta
document.addEventListener('keydown', (event) => {
    if (event.code === 'KeyO') {  
        if (portaModelo && !portaBloqueada && canOpenDoor) {  

            const cameraPosition = new THREE.Vector3();
            const portaPosition = new THREE.Vector3();

            //cam and door pos
            camera.getWorldPosition(cameraPosition);
            portaModelo.getWorldPosition(portaPosition);

            //distancia entre cam e porta
            const distance = cameraPosition.distanceTo(portaPosition);

            //se estiver perto
            if (distance <= pickupDistance) {
                if (doorAction) {
                    doorAction.reset(); 
                    doorAction.play();  
                    console.log("A porta está a abrir...");
                    portaAberta = true;

                    const index = wallBoxes.indexOf(portaBox);
                    if (index > -1) {
                        wallBoxes.splice(index, 1);
                    }
                }
            } else {
                console.log("A porta está muito longe!");
            }
        }
    }
});

//pegar lanterna
document.addEventListener('keydown', (event) => {
    if (event.code === 'KeyE' && !lanternPickedUp) {  
        const cameraPosition = new THREE.Vector3();
        const lanternPosition = new THREE.Vector3();

        camera.getWorldPosition(cameraPosition);
        flashlight.getWorldPosition(lanternPosition);

        const distance = cameraPosition.distanceTo(lanternPosition);

        if (distance <= pickupDistance) {
            pickUpLantern();
        } else {
            console.log("A lanterna está muito longe!");
        }
    }
});

document.addEventListener('keydown', (event) => {
    if (digitandoCodigo) {
        if (event.code === 'Enter') {
            verificarCodigo();
        } else if (event.code === 'Backspace') {
            // Remove o último carácter do textoDigitado
            textoDigitado = textoDigitado.slice(0, -1);
            campoTexto.value = textoDigitado;
        } else if (event.key.length === 1) {
            // Só adiciona se for um carácter imprimível
            textoDigitado += event.key;
            campoTexto.value = textoDigitado;
        }
        event.preventDefault();  // evita que a tecla afete o comportamento padrão do browser
    }
});

//função para pegar a lanterna
function pickUpLantern() {
    if (flashlight) {

        //move lanterna para posição da mão
        flashlight.position.set(0.2, -0.2, -0.3); 
        flashlight.rotation.set(0, 190.4, 0);
        flashlight.scale.set(2, 2, 2);

        //anexar lanterna á camera
        camera.add(flashlight);

        lanternPickedUp = true;
    }
}

function verificarProximidadeParaAbrirCampo() {
    if (!codelock) {
        esconderMensagemNaTela();
        return false;  // Se não estiver carregado, não está perto
    }

    const cameraPosition = new THREE.Vector3();
    const codelockPosition = new THREE.Vector3();

    camera.getWorldPosition(cameraPosition);
    codelock.getWorldPosition(codelockPosition);

    const distance = cameraPosition.distanceTo(codelockPosition);

    if (distance <= 50) {
        mostrarMensagemNaTela("Pressione 'E' para digitar o código.");
        return true;
    } else {
        esconderMensagemNaTela();
        return false;
    }
}

function mostrarCampoTexto() {
    campoTexto.style.display = "block"; 
    campoTexto.focus(); 
    digitandoCodigo = true; //ativa modo de escrever
}

//verifica se o código está correto
function verificarCodigo() {

    const textoLimpo = textoDigitado.trim();

    console.log("Texto digitado:", `"${textoDigitado}"`);
    console.log("Texto limpo:", `"${textoLimpo}"`);
    console.log("Código correto:", `"${codigoCorreto}"`);

    if (textoDigitado === codigoCorreto) {
        console.log("Código correto! O portão será aberto.");
        abrirPortao(); 
    } else {
        console.log("Código incorreto! Tente novamente.");
    }

    campoTexto.value = "";
    textoDigitado = "";
    campoTexto.style.display = "none";
    digitandoCodigo = false; //acaba modo de escrever
}

function abrirPortao() {
    if (portaoAction) {
        portaoAction.reset(); // Reseta a animação antes de tocar novamente
        portaoAction.play();  // Reproduz a animação de abrir o portão
        console.log("Portão está abrindo...");

        portaoAberto = true;

        // Remove portaoBox da colisão para deixar passar
        const index = wallBoxes.indexOf(portaoBox);
        if (index > -1) {
            wallBoxes.splice(index, 1);
        }
    
    }
}

function createPlayerBox(position) {
    const buffer = 1;
    const box = new THREE.Box3();
    const size = new THREE.Vector3(1 + buffer, 2, 1 + buffer); // largura, altura, profundidade do jogador
    box.setFromCenterAndSize(position.clone().add(new THREE.Vector3(0, 1, 0)), size); // ajusta Y para ficar no meio da altura
    return box;
}

function verificarProximidadeParaOrigami() {

    if (!origami) return;
    const cameraPosition = new THREE.Vector3();
    const origamiPosition = new THREE.Vector3();

    camera.getWorldPosition(cameraPosition);
    origami.getWorldPosition(origamiPosition);

    const distance = cameraPosition.distanceTo(origamiPosition);

    if (distance <= 50) {
        console.log("Pressione 'E' para ver a pista.");
        mostrarMensagemNaTela("Pressione 'E' para ver a pista."); // função que cria um aviso no UI, podes implementar
        return true;
    } else {
        esconderMensagemNaTela();
        return false;
    }
}

function abrirPopupPista() {
    const popup = document.getElementById('popup-pista'); // div com a imagem da pista
    popup.style.display = 'block';
}

function mostrarMensagemNaTela(msg) {
    const mensagemDiv = document.getElementById('mensagemProximidade');
    if (!mensagemDiv) {
      // cria o elemento se não existir
      const div = document.createElement('div');
      div.id = 'mensagemProximidade';
      div.style.position = 'fixed';
      div.style.bottom = '10%';
      div.style.left = '50%';
      div.style.transform = 'translateX(-50%)';
      div.style.backgroundColor = 'rgba(0,0,0,0.7)';
      div.style.color = 'white';
      div.style.padding = '10px 20px';
      div.style.borderRadius = '5px';
      div.style.fontSize = '18px';
      document.body.appendChild(div);
      div.textContent = msg;
    } else {
      mensagemDiv.textContent = msg;
      mensagemDiv.style.display = 'block';
    }
  }
  
  function esconderMensagemNaTela() {
    const mensagemDiv = document.getElementById('mensagemProximidade');
    if (mensagemDiv) {
      mensagemDiv.style.display = 'none';
    }
  }

  function atualizarMensagensProximidade() {
    if (verificarProximidadeParaOrigami()) {
        mostrarMensagemNaTela("Pressione 'E' para ver a pista.");
    } else if (verificarProximidadeParaAbrirCampo()) {
        mostrarMensagemNaTela("Pressione 'E' para digitar o código.");
    } else {
        esconderMensagemNaTela();
    }
}

function verificarPassagemPortao() {
    const playerPos = controls.getObject().position;
    if (portaoBox && playerPos.x > portao.position.x) { // ou outra condição para detectar que passou o portão
        stopTime = Date.now();
        mostrarCreditos(); // Chama a função para mostrar os créditos
    }
  }

  function mostrarCreditos() {
    const credits = document.getElementById('credits');
    const creditsText = document.getElementById('credits-text');

  
    // Limpa texto antes de adicionar
    creditsText.innerHTML = `
      <p>Congratulations!</p>
        <p>You finished the Escape Room!</p>
        <p>Thank you for playing!</p>
        <p>Credits:</p>
        <p>Developer: Nil Silva</p>
        <p>University of Aveiro</p>
        <p>Bachelor: LECI</p>
        <p>Course: ICG</p>
    `;
  
    credits.style.display = 'block';
  }

function animate() {
    requestAnimationFrame(animate);

    if (controls.isLocked) {
        direction.z = Number(move.forward) - Number(move.backward);
        direction.x = Number(move.right) - Number(move.left);
        direction.normalize();

        let velocityX = direction.x * 1.5;
        let velocityZ = direction.z * 1.5;

        const currentPos = controls.getObject().position.clone();

        let movedX = 0;
        let movedZ = 0;

        const maxSteps = 10;

        // Tenta encontrar o máximo movimento em X que não colida
        for (let step = 0; step <= maxSteps; step++) {
            let factor = 1 - step / maxSteps;
            let newPosX = currentPos.clone();
            // Para X, temos de aplicar o movimento no eixo local (direita/esquerda)
            const rightVector = new THREE.Vector3(1, 0, 0);
            rightVector.applyQuaternion(camera.quaternion);
            newPosX.addScaledVector(rightVector, velocityX * factor);

            const boxX = createPlayerBox(newPosX);
            const collisionX = wallBoxes.some(wallBox => wallBox.intersectsBox(boxX));

            if (!collisionX) {
                movedX = velocityX * factor;
                break;
            }
        }

        // Tenta encontrar o máximo movimento em Z que não colida
        for (let step = 0; step <= maxSteps; step++) {
            let factor = 1 - step / maxSteps;
            let newPosZ = currentPos.clone();
            // Para Z, movimento no eixo local (frente/trás)
            const forwardVector = new THREE.Vector3(0, 0, -1);
            forwardVector.applyQuaternion(camera.quaternion);
            newPosZ.addScaledVector(forwardVector, velocityZ * factor);

            const boxZ = createPlayerBox(newPosZ);
            const collisionZ = wallBoxes.some(wallBox => wallBox.intersectsBox(boxZ));

            if (!collisionZ) {
                movedZ = velocityZ * factor;
                break;
            }
        }

        // Aplica movimento máximo permitido nos dois eixos
        if (movedX !== 0) controls.moveRight(movedX);
        if (movedZ !== 0) controls.moveForward(movedZ);
    }

    // resto do teu código (porta, animações, render)
    if (!portaBloqueada && camera.position.x > -130) {
        portaBloqueada = true;
        startTime = Date.now();
        portaAberta = false;
        console.log("Porta trancada!");
        canOpenDoor = false; 

        if (portaBox) {
            portaBox.setFromObject(portaModelo);
            portaBox.expandByScalar(2); // buffer para antecipar colisão
            if (!wallBoxes.includes(portaBox)) {
                wallBoxes.push(portaBox);
            }
        }
    }

    if (mixer) mixer.update(0.05);
    if (mixerPortao) mixerPortao.update(0.01);

    atualizarMensagensProximidade();
    verificarPassagemPortao();
    //verificarProximidadeParaOrigami();
   //verificarProximidadeParaAbrirCampo();

    renderer.render(scene, camera);
}