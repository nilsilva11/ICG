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
let doorOpen = false;
let doorRotationSpeed = 0.01;

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
          

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    //first person controls
    controls = new PointerLockControls(camera, document.body);
    scene.add(controls.getObject());

    // Luz ambiente
    //const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    //scene.add(ambientLight);

    RectAreaLightUniformsLib.init();

    // Luz pontual no teto
    //const pointLight = new THREE.PointLight(0xffffff, 1.2);
    //pointLight.position.set(0, 40, 0);
    //scene.add(pointLight);

    // CHÃO
    const textureLoader = new THREE.TextureLoader();
    const floorTexture = textureLoader.load('escaperoom/textures/concrete.jpg'); // <– caminho para a textura do chão

    // Permitir repetição da textura no chão
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
    const wallTexture = textureLoader.load('escaperoom/textures/wall.jpg'); // caminho para a tua textura

    // Permitir repetição da textura para não parecer esticada
    wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(4, 2); // ajusta horizontal/vertical

    // Substituir o material
    const wallMaterial = new THREE.MeshStandardMaterial({
        map: wallTexture
    });
   

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(400, 100, 2), wallMaterial);
    backWall.position.set(0, 0, -200);
    scene.add(backWall);

    const frontWall = new THREE.Mesh(new THREE.BoxGeometry(400, 100, 2), wallMaterial);
    frontWall.position.set(0, 0, 200);
    scene.add(frontWall);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(2, 100, 400), wallMaterial);
    leftWall.position.set(-200, 0, 0);
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(2, 100, 400), wallMaterial);
    rightWall.position.set(200, 0, 0);
    scene.add(rightWall);

    const collidableObjects = [backWall, frontWall, leftWall, rightWall];

    // NOVA SALA: Lobby (ao lado esquerdo da atual)

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

    // 💡 Painel LED (RectAreaLight) no teto do lobby
    const ledLight = new THREE.RectAreaLight(0xffffff, 1, 100, 300); // (cor, intensidade, largura, altura)
    ledLight.position.set(-300, 49.5, 0); // ligeiramente abaixo do teto
    ledLight.rotation.x = -Math.PI / 2; // apontar para baixo
    scene.add(ledLight);

    // 👀 Helper (opcional para debug)
    //const ledHelper = new RectAreaLightHelper(ledLight);
    //ledLight.add(ledHelper);

    // 💡 LED tipo painel quadrado no teto do lobby
    //const ledLight = new THREE.RectAreaLight(0xffffff, 2, 300, 300); // (cor, intensidade, largura, altura)
    //ledLight.position.set(-300, 49, 0); // ligeiramente abaixo do teto
    //ledLight.lookAt(-300, 0, 0); // direção: para baixo
    //scene.add(ledLight);

    // 🔧 Helper para visualizar a área da luz (remove em produção)
    //const ledHelper = new RectAreaLightHelper(ledLight);
    //ledLight.add(ledHelper);

    // Paredes do lobby (sem parede a ligar ao armazém)
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

    //carrega flashlight
    loader.load('escaperoom/models/flashlight.glb', function (gltf) {
        const lantern = gltf.scene;
    
        // 👇 posição como se estivesse na mão direita, à frente
        lantern.position.set(0.2, -0.2, -0.3); // ligeiramente à frente e à direita
        lantern.rotation.set(0, 190.4, 0); // virada para a frente
        lantern.scale.set(2, 2, 2);
    
        camera.add(lantern); // ➕ attach à câmara
    
        // 🔦 Luz da lanterna
        flashlight = new THREE.SpotLight(0xffffff, 3, 200, Math.PI / 6, 0.2); // mais estreito
        flashlight.visible = lanternVisible; // aplica o estado inicial (false por defeito)
        flashlight.castShadow = true;
        flashlight.position.set(0, 0, 0); // origem na lanterna
    
        flashlightTarget = new THREE.Object3D();
        flashlightTarget.position.z = -5; // mais à frente (em relação à lanterna)
        camera.add(flashlightTarget)

        flashlight.target = flashlightTarget;
    
        lantern.add(flashlight);
        camera.add(flashlight);
    
    });

    // Carregar modelo de porta
    loader.load('escaperoom/models/door.glb', function (gltf) {
        portaModelo = gltf.scene;

        // 🧱 Ajustar escala, posição e rotação da porta
        portaModelo.scale.set(30, 30, 50); // Ajusta se necessário
        portaModelo.position.set(-200, -50, 0); // ao nível do chão
        portaModelo.rotation.y = Math.PI / 2; // virar para ficar de frente

        scene.add(portaModelo);
    });


    // Após adicionar a porta à cena
    loader.load('escaperoom/models/walllamp.glb', function (gltf) {
        const lampAboveDoor = gltf.scene;
        
        // ➕ Coloca o candeeiro por cima da porta (ajusta conforme o modelo)
        lampAboveDoor.position.set(-217, 40, 0);  // mesma X/Z da porta, altura um pouco abaixo do teto

        lampAboveDoor.rotation.y = Math.PI;

        lampAboveDoor.scale.set(5, 5, 5);      // ajusta escala se necessário
        scene.add(lampAboveDoor);

        // 💡 Luz do candeeiro acima da porta
        const lightAboveDoor = new THREE.PointLight(0xffa500,2, 100);
        lightAboveDoor.position.set(-215, 30, 0); // ligeiramente abaixo da lâmpada
        scene.add(lightAboveDoor);

    });

    

    // Carregar candeeiro
    loader.load('escaperoom/models/lamp.glb', function (gltf) {
        const lamp = gltf.scene;
        lamp.position.set(0, 47, 0); // ligeiramente abaixo do teto (que está a y = 50)
        lamp.scale.set(40, 40, 40); // ajusta conforme necessário
        scene.add(lamp);

        //Luz pendurada no candeeiro
        const lampLight = new THREE.PointLight(0xfffff, 1.5, 150);
        lampLight.position.set(0, 40, 0);
        scene.add(lampLight);
    });



};

document.addEventListener('click', () => {
    controls.lock();
  });

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const move = { forward: false, backward: false, left: false, right: false };

document.addEventListener('keydown', (event) => {
  switch (event.code) {
    case 'KeyW': move.forward = true; break;
    case 'KeyS': move.backward = true; break;
    case 'KeyA': move.left = true; break;
    case 'KeyD': move.right = true; break;
  }
});

document.addEventListener('keyup', (event) => {
  switch (event.code) {
    case 'KeyW': move.forward = false; break;
    case 'KeyS': move.backward = false; break;
    case 'KeyA': move.left = false; break;
    case 'KeyD': move.right = false; break;
  }
});

//para ligar lanterna
document.addEventListener('keydown', (event) => {
    if (event.code === 'KeyF' && flashlight) {
        lanternVisible = !lanternVisible;
        flashlight.visible = lanternVisible;

        console.log("Lanterna:", lanternVisible ? "ON" : "OFF");
    }
});

document.addEventListener('keydown', (event) => {
    if (event.code === 'KeyO') {  // Exemplo de tecla O para abrir a porta
        openDoor();
    }
});


function animate() {
    requestAnimationFrame(animate);

    if (controls.isLocked) {
        direction.z = Number(move.forward) - Number(move.backward);
        direction.x = Number(move.right) - Number(move.left);
        direction.normalize();

        velocity.x = direction.x * 1.5; // velocidade
        velocity.z = direction.z * 1.5;

        controls.moveRight(velocity.x);
        controls.moveForward(velocity.z);
    }
    // Deteta quando o player entra no armazém pela "porta" (posição X > -100)
    if (!portaBloqueada && camera.position.x > -100) {
        portaBloqueada = true;
        console.log("Porta trancada!");
    
        // Esconder ou mover a porta
        if (portaModelo) {
            // portaModelo.visible = false; // Esconder
            portaModelo.position.set(9999, 9999, 9999); // Mover para longe
        }
    
        // Parede a bloquear a passagem
        const bloqueio = new THREE.Mesh(
            new THREE.BoxGeometry(2, 100, 100),
            wallMaterial
        );
        bloqueio.position.set(-200, 0, 0);
        scene.add(bloqueio);
    }


    renderer.render(scene, camera);
}