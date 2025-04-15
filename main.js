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
let lanternPickedUp = false;
let flashlightLight;
let pickupDistance = 50; 
let doorAnimation; 
let mixer;  
let doorAction;
let canOpenDoor = true; 
let backWall, frontWall, leftWall1, leftWall2, leftWall3, rightWall;

let colliders = []; // Array para armazenar os colliders

//verificar colisão entre camera e colliders
function checkCollisions(newCameraPosition) {
    const cameraBox = new THREE.Box3().setFromCenterAndSize(newCameraPosition, new THREE.Vector3(1, 1, 1));  // Ajuste o tamanho conforme necessário

    for (let i = 0; i < colliders.length; i++) {
        if (cameraBox.intersectsBox(colliders[i])) {
            return true;
        }
    }
    return false; 
}

init();
animate();

function init() {

    // Carregador de modelos GLB
    const loader = new GLTFLoader();

    // Cena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const lampLight = new THREE.PointLight(0xFFA500, 1.5, 100); // Cor alaranjada
    lampLight.position.set(0, 1, 0); // Ajuste conforme a posição desejada
    scene.add(lampLight);

    // Câmara
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(-300, -10, 0); // ao nível do chão (o chão está em y = -50)
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
    floorTexture.repeat.set(8, 8); // Ajusta conforme o nível de detalhe

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
        new THREE.PlaneGeometry(400, 400),
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
        map: wallTexture
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

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(2, 100, 400), wallMaterial);
    rightWall.position.set(200, 0, 0);
    scene.add(rightWall);

    const collidableObjects = [backWall, frontWall, leftWall1, leftWall2, leftWall3, rightWall];

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
    const ledLight = new THREE.RectAreaLight(0xffffff, 1, 100, 300); // (cor, intensidade, largura, altura)
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
        const lampLight = new THREE.PointLight(0xfffff, 1.5, 150);
        lampLight.position.set(0, 40, 0);
        scene.add(lampLight);
    });

    //carregar mesa
    loader.load('escaperoom/models/table.glb', function (gltf) {
        const table = gltf.scene;
        table.scale.set(7, 7, 7); 
        table.position.set(-220, -50, -40); 
        table.rotation.y = Math.PI / 2; 
        scene.add(table);
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



function animate() {
    requestAnimationFrame(animate);

    if (controls.isLocked) {
        direction.z = Number(move.forward) - Number(move.backward);
        direction.x = Number(move.right) - Number(move.left);
        direction.normalize(); 

        velocity.x = direction.x * 1.5; //velocidade de movimento
        velocity.z = direction.z * 1.5;

        controls.moveRight(velocity.x);
        controls.moveForward(velocity.z);
    }
    //deteta quando player entra no armazém (necessário para depois trancar a porta)
    if (!portaBloqueada && camera.position.x > -180) {
        portaBloqueada = true;
        console.log("Porta trancada!");
    
        canOpenDoor = false; // Bloquear a interação com a porta
    
    }

    if (mixer) {
        mixer.update(0.05);  // O valor pode ser ajustado conforme a velocidade da animação
    }

    renderer.render(scene, camera);
}