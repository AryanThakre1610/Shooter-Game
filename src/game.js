let playerImg, fishMonster, snakeMonster, lizardMonster, bgImg;
let shootSound, bgMusic;

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 900;
canvas.height = 500;


// Load assets (before game starts)
function loadImage(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
    });
}

async function loadAssets() {
    // Start loading images
    const [images] = await Promise.all([
        Promise.all([
            loadImage("../assets/img/player.png"),
            loadImage("../assets/img/fishMonster.png"),
            loadImage("../assets/img/snakeMonster.png"),
            loadImage("../assets/img/lizardMonster.png"),
            loadImage("../assets/img/background.png")
        ])
    ]);

    [playerImg, fishMonster, snakeMonster, lizardMonster, bgImg] = images;
}

function loadingLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.fillText("Loading...", 300 + Math.sin(Date.now()/200) * 20, 250);

    // Start game if all assets loaded
    if (playerImg && fishMonster && snakeMonster && lizardMonster && bgImg) {
        gameLoop();
    } else {
        requestAnimationFrame(loadingLoop);
    }
}


// PLAYER CLASS
class Player {
    constructor() {
        this.x = 40;
        this.y = canvas.height / 2 - 60;
        this.width = 80;
        this.height = 120;
        this.speed = 5;
        this.health = 100;
        this.maxHealth = 100;
    }

    draw() {
        ctx.drawImage(playerImg, this.x, this.y, this.width, this.height);
        ctx.strokeStyle = "green";
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y - 12, this.width, 6);
        ctx.fillStyle = "green";
        ctx.fillRect(this.x, this.y - 12, this.width * (this.health / this.maxHealth), 6);
    }

    move(keys) {
        if (keys['KeyW'] && this.y > 0) this.y -= this.speed;
        if (keys['KeyS'] && this.y < canvas.height - this.height) this.y += this.speed;
        if (keys['KeyA'] && this.x > 0) this.x -= this.speed;
        if (keys['KeyD'] && this.x < canvas.width - this.width) this.x += this.speed;
    }
}

// ENEMY CLASS
class Enemy {
    constructor(type = 1) {
        this.type = type; // 1, 2, 3
        this.width = 80;
        this.height = 120;
        this.x = canvas.width + 50;
        this.y = Math.random() * (canvas.height - this.height);

        // Different speed/health per enemy type
        if (type === 1) {
            this.speed = 3 + Math.random() * 2;
            this.health = 50;
        } else if (type === 2) {
            this.speed = 2 + Math.random() * 1.5;
            this.health = 90;
        } else if (type === 3) {
            this.speed = 4 + Math.random() * 2.5;
            this.health = 40;
        }
        this.maxHealth = this.health;
    }

    draw() {
        // Draw correct image based on type
        let img = this.type === 1 ? fishMonster :
                  this.type === 2 ? snakeMonster :
                  lizardMonster;

        ctx.drawImage(img, this.x, this.y, this.width, this.height);

        // Health bar
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y - 12, this.width, 6);
        ctx.fillStyle = "red";
        ctx.fillRect(this.x, this.y - 12, this.width * (this.health / this.maxHealth), 6);
    }

    move() {
        this.x -= this.speed;
    }
}


// BULLET CLASS
class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 10;
        this.height = 6;
        this.speed = 9;
    }

    draw() {
        ctx.fillStyle = "yellow";
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update() {
        this.x += this.speed;
    }
}

// GAME STATE
const player = new Player();
let bullets = [];
let enemies = [];
let keys = {};
let score = 0;
let gameOver = false;

// INPUT
document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);
document.addEventListener("mousedown", () => shoot());

// Restart button
document.getElementById("restartBtn").addEventListener("click", () => {
    window.location.reload();
});

// SHOOT
function shoot() {
    if (!gameOver) bullets.push(new Bullet(player.x + player.width, player.y + player.height / 2 - 3));
}

// ENEMY SPAWN
function spawnEnemy() {
    if (!gameOver) {
        const type = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3
        enemies.push(new Enemy(type));
    }
}
setInterval(spawnEnemy, 1200);

// UPDATE GAME
function update() {
    if (gameOver) return;

    player.move(keys);

    bullets.forEach((b, i) => {
        b.update();
        if (b.x > canvas.width) bullets.splice(i, 1);
    });

    enemies.forEach((e, ei) => {
        e.move();

        // Enemy hits player
        if (e.x < player.x + player.width &&
            e.x + e.width > player.x &&
            e.y < player.y + player.height &&
            e.y + e.height > player.y) {
            player.health -= 0.5;
        }

        bullets.forEach((b, bi) => {
            if (
                b.x < e.x + e.width &&
                b.x + b.width > e.x &&
                b.y < e.y + e.height &&
                b.y + b.height > e.y
            ) {
                e.health -= 25;
                bullets.splice(bi, 1);
            }
        });

        if (e.health <= 0) {
            enemies.splice(ei, 1);
            score += 10;
        }
    });

    document.getElementById("score").innerText = score;
    document.getElementById("playerHealth").innerText = Math.max(0, Math.floor(player.health));

    if (player.health <= 0) {
        endGame();
    }
}

// DRAW GAME
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

    player.draw();
    bullets.forEach(b => b.draw());
    enemies.forEach(e => e.draw());
}

// GAME LOOP
function gameLoop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(gameLoop);
}

function endGame() {
    gameOver = true;
    document.getElementById("finalScore").innerText = score;
    document.getElementById("gameOverScreen").style.display = "flex";
}

loadingLoop();
loadAssets();
