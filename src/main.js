import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

let cameraX = 4.61

camera.position.set(cameraX, 2.74, 8);

const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true,
});
renderer.shadowMap.enabled = true;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

class Box extends THREE.Mesh {
  constructor(
    { width, height, depth, color = "#00ff00", velocity = { x: 0, y: 0, z: 0 }, position = { x: 0, y: 0, z: 0 }, zAcceleration = false}
  ) {
    super(new THREE.BoxGeometry(width, height, depth), new THREE.MeshStandardMaterial({ color }));

    this.width = width;
    this.height = height;
    this.depth = depth;

    this.position.set(position.x, position.y, position.z);

    this.right = this.position.x + this.width / 2;
    this.left = this.position.x - this.width / 2;

    this.bottom = this.position.y - this.height / 2;
    this.top = this.position.y + this.height / 2;

    this.front = this.position.z + this.depth / 2;
    this.back = this.position.z - this.depth / 2;

    this.velocity = velocity;
    this.gravity = -0.002;

    this.zAcceleration = zAcceleration;
    this.canJump = true;
  }

  updateSides() {
    this.right = this.position.x + this.width / 2;
    this.left = this.position.x - this.width / 2;

    this.bottom = this.position.y - this.height / 2;
    this.top = this.position.y + this.height / 2;

    this.front = this.position.z + this.depth / 2;
    this.back = this.position.z - this.depth / 2;
  }

  update(ground) {
    this.updateSides();

    if (this.zAcceleration) this.velocity.z += 0.0003;

    this.position.x += this.velocity.x;
    this.position.z += this.velocity.z;

    this.applyGravity(ground);
  }

  applyGravity(ground) {
    this.velocity.y += this.gravity;

    if (boxCollision({ box1: this, box2: ground })) {
      const friction = 0.5;
      
      this.velocity.y *= friction;
      this.velocity.y = -this.velocity.y;

      this.canJump = true;
    } else {
      this.position.y += this.velocity.y;

      this.canJump = false;
    }
  }
}

// Cronômetro e elementos de interface
let timerInterval;
let timer;
let bestTime = 0;
let gameStarted = false;
let gameOver = false;

const timerElement = document.createElement("div");
timerElement.id = "timer";
timerElement.classList.add("ui-element");
document.body.appendChild(timerElement);

const bestTimeElement = document.createElement("div");
bestTimeElement.id = "best-time";
bestTimeElement.classList.add("ui-element");
document.body.appendChild(bestTimeElement);

const gameOverElement = document.createElement("div");
gameOverElement.id = "game-over";
gameOverElement.classList.add("ui-element");
document.body.appendChild(gameOverElement);

const restartButton = document.createElement("button");
restartButton.id = "restart-button";
restartButton.classList.add("ui-element");
restartButton.textContent = "Restart";
document.body.appendChild(restartButton);

restartButton.addEventListener("click", () => {
  restartGame();
});

document.addEventListener('keydown', function(event) {
  const keyPressed = event.key;

  const keyButtonDiv = document.querySelector(`.keyButton[data-key="${keyPressed}"]`);

  if (keyButtonDiv) {
    keyButtonDiv.style.backgroundColor = '#555';
  }
});

document.addEventListener('keyup', function(event) {
  const keyPressed = event.key;

  const keyButtonDiv = document.querySelector(`.keyButton[data-key="${keyPressed}"]`);

  if (keyButtonDiv) {
    keyButtonDiv.style.backgroundColor = '#333';
  }
});

function startTimer() {
  const start = Date.now();

  timerInterval = setInterval(() => {
    timer = ((Date.now() - start) / 1000).toFixed(1);

    timerElement.textContent = `Time: ${timer}s`;

    if (bestTime !== 0) {
      bestTimeElement.textContent = `Best Time: ${bestTime}s`;
    }
  }, 100);
}

function stopTimer() {
  clearInterval(timerInterval);

  const elapsed = parseFloat(timer);

  if (bestTime === 0 || elapsed > bestTime) {
    bestTime = elapsed;
  }
}

function restartGame() {
  gameOverElement.style.display = "none";
  restartButton.style.display = "none";

  gameOver = false;

  cube.position.set(0, 0, 0); // Reiniciar a posição do jogador

  enemies.forEach((enemy) => {
    scene.remove(enemy); // Remover inimigos da cena
  });

  enemies.length = 0;
  spawnRate = 200;

  startTimer();
  animate();
}

function boxCollision({ box1, box2 }) {
  const xCollision = box1.right >= box2.left && box1.left <= box2.right;
  const yCollision =
    box1.bottom + box1.velocity.y <= box2.top && box1.top >= box2.bottom;
  const zCollision = box1.front >= box2.back && box1.back <= box2.front;

  return xCollision && yCollision && zCollision;
}

const cube = new Box({
  width: 1,
  height: 1,
  depth: 1,
  velocity: { x: 0, y: -0.01, z: 0 },
});
cube.castShadow = true;
scene.add(cube);

const ground = new Box({
  width: 10,
  height: 0.5,
  depth: 40,
  color: "#0c4b6e",
  position: {
    x: 0,
    y: -2,
    z: 0,
  },
});

ground.receiveShadow = true;
scene.add(ground);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.y = 3;
light.position.z = 1;
light.castShadow = true;
scene.add(light);

scene.add(new THREE.AmbientLight(0xffffff, 0.5));

camera.position.z = 5;

const keys = {
  a: { pressed: false },
  d: { pressed: false },
  s: { pressed: false },
  w: { pressed: false },
};

window.addEventListener("keydown", (event) => {
  if (!gameStarted && !gameOver) {
    gameStarted = true;
  }

  switch (event.code) {
    case "KeyA":
      keys.a.pressed = true;
      break;
    case "KeyD":
      keys.d.pressed = true;
      break;
    case "KeyS":
      keys.s.pressed = true;
      break;
    case "KeyW":
      keys.w.pressed = true;
      break;
    case "Space":
      if (cube.canJump) {
        cube.velocity.y = 0.08;
        cube.canJump = false;
      }
      break;
    case "ShiftLeft":
      cameraX = -cameraX
      camera.position.set(cameraX, 2.74, 8);
      camera.lookAt(scene.position);
      break;
  }
});

window.addEventListener("keyup", (event) => {
  switch (event.code) {
    case "KeyA":
      keys.a.pressed = false;
      break;
    case "KeyD":
      keys.d.pressed = false;
      break;
    case "KeyS":
      keys.s.pressed = false;
      break;
    case "KeyW":
      keys.w.pressed = false;
      break;
  }
});

const enemies = [];
let frames = 0;
let spawnRate = 200;

function animate() {
  if (gameOver) return;

  const animationId = requestAnimationFrame(animate);
  renderer.render(scene, camera);

  // Movimento
  cube.velocity.x = 0;
  cube.velocity.z = 0;

  if (keys.a.pressed) cube.velocity.x = -0.05;
  if (keys.d.pressed) cube.velocity.x = 0.05;
  if (keys.s.pressed) cube.velocity.z = 0.05;
  if (keys.w.pressed) cube.velocity.z = -0.05;

  cube.update(ground);

  enemies.forEach((enemy) => {
    enemy.update(ground);

    if (boxCollision({ box1: cube, box2: enemy }) || cube.position.y <= -10) {
      stopTimer();

      gameOverElement.textContent = "Game Over!";
      gameOverElement.style.display = "block";
      restartButton.style.display = "block";

      cancelAnimationFrame(animationId);

      if (timer > bestTime) {
        bestTime = timer;

        bestTimeElement.innerHTML = `Best Time: ${bestTime}s`;
      }
    }
  });

  if (frames % spawnRate === 0) {
    if (spawnRate > 20) spawnRate -= 20;

    const enemy = new Box({
      width: 1,
      height: 1,
      depth: 1,
      position: { x: (Math.random() - 0.5) * 10, y: 0, z: -20 },
      velocity: { x: 0, y: 0, z: Math.random() * 0.1 + 0.05 },
      color: "#ff0000",
      zAcceleration: true,
    });
    enemy.castShadow = true;
    scene.add(enemy);
    enemies.push(enemy);
  }

  frames++;
}

// Iniciar o cronômetro e a animação
startTimer();
animate();