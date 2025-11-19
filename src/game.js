let playerImg, fishMonster, snakeMonster, lizardMonster, bgImg, portalImg, bossImg;
let shootSound, bgMusic;

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// canvas.width = 900;
// canvas.height = 500;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// =======================
// ASSET LOADING
// =======================
function loadImage(src) {
    return new Promise(resolve => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
    });
}

async function loadAssets() {
    const [images] = await Promise.all([
        Promise.all([
            loadImage("../assets/img/player.png"),
            loadImage("../assets/img/fishMonster.png"),
            loadImage("../assets/img/snakeMonster.png"),
            loadImage("../assets/img/lizardMonster.png"),
            loadImage("../assets/img/background.png"),
            loadImage("../assets/img/portal.png"),
            loadImage("../assets/img/boss.png")
        ])
    ]);

    [playerImg, fishMonster, snakeMonster, lizardMonster, bgImg, portalImg, bossImg] = images;
    loadingLoop();
}

// Loading screen
function loadingLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.fillText("Loading...", 300 + Math.sin(Date.now()/200) * 20, 250);

    if (playerImg && fishMonster && snakeMonster && lizardMonster && bgImg && portalImg) {
        initGame();
        gameLoop();
    } else {
        requestAnimationFrame(loadingLoop);
    }
}

function endGame(isVictory = false) {
    if (gameOver) return;   // <--- prevents double triggering

    gameOver = true;
    victory = isVictory;

    if (isVictory) {
        document.querySelector("#gameOverScreen h2").innerText = "YOU WIN!";
    } else {
        document.querySelector("#gameOverScreen h2").innerText = "GAME OVER";
    }

    document.getElementById("finalScore").innerText = score;
    document.getElementById("gameOverScreen").style.display = "flex";
}


// =======================
// PLAYER CLASS
// =======================
class Player {
    constructor() {
        this.x = 40;
        this.y = canvas.height / 2 - 60;
        this.width = 80;
        this.height = 120;
        this.speed = 5;
        this.health = 100;
        this.maxHealth = 100;
        this.facing = "right";
    }

    draw() {
        ctx.save();
        if (this.facing === "left") {
            // Flip the image horizontally
            ctx.translate(this.x + this.width / 2, 0);
            ctx.scale(-1, 1); 
            ctx.drawImage(playerImg, -this.width / 2, this.y, this.width, this.height);
        } else {
            ctx.drawImage(playerImg, this.x, this.y, this.width, this.height);
        }

        ctx.restore();        
        ctx.strokeStyle = "green";
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y - 12, this.width, 6);
        ctx.fillStyle = "green";
        ctx.fillRect(this.x, this.y - 12, this.width * (this.health / this.maxHealth), 6);
    }

    move(keys) {
        // ---- Vertical movement (unchanged)
        if (keys['KeyW'] && this.y > 0) this.y -= this.speed;
        if (keys['KeyS'] && this.y < canvas.height - this.height) this.y += this.speed;

        // ---- Horizontal movement
        if (keys['KeyA'] && this.x > 0) {
            this.x -= this.speed;
            this.facing = "left";
        }

        if (keys['KeyD']) {
            // Determine max X allowed
            let maxX = canvas.width - this.width; // default max
            if (boss) {
                maxX = boss.x - this.width; // restrict player to left of boss
            }

            if (this.x + this.speed < maxX) {
                this.x += this.speed;
                this.facing = "right";
            } else {
                this.x = maxX; // prevent crossing
            }
        }
    }

}

// =======================
// ENEMY CLASS
// =======================
class Enemy {
    constructor(type = 1) {
        this.type = type;
        this.width = 80;
        this.height = 120;
        this.x = canvas.width + 50;
        this.y = Math.random() * (canvas.height - this.height);

        if (type === 1) { this.speed = 4; this.health = 50; this.award = 10; }
        else if (type === 2) { this.speed = 2; this.health = 90; this.award = 30; }
        else { this.speed = 6; this.health = 40; this.award = 20; }

        this.maxHealth = this.health;
        this.direction = 1;
    }

    draw() {
        const img = this.type === 1 ? fishMonster : this.type === 2 ? snakeMonster : lizardMonster;
        ctx.drawImage(img, this.x, this.y, this.width, this.height);

        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y - 12, this.width, 6);
        ctx.fillStyle = "red";
        ctx.fillRect(this.x, this.y - 12, this.width * (this.health / this.maxHealth), 6);
    }

    move() { 
        this.x -= this.speed * this.direction; 
        if (this.x <= 0) this.direction = -1; // reverse to right
        if (this.x + this.width >= canvas.width) this.direction = 1; // reverse to left
    }
}

// =======================
// BULLET CLASS
// =======================
class Bullet {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.width = 10;
        this.height = 6;
        this.speed = 9;
        this.active = false;
        this.direction = "right";
    }

    activate(x, y, direction = "right") {
        this.x = x;
        this.y = y;
        this.active = true;
        this.direction = direction;
    }

    deactivate() { this.active = false; }

    update() {
        if (!this.active) return;
        this.x += this.direction === "right" ? this.speed : -this.speed;
        if (this.x > canvas.width || this.x < 0) this.active = false;
    }

    draw() {
        if (!this.active) return;
        ctx.fillStyle = "yellow";
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

// =======================
// PORTAL CLASS
// =======================
class Portal {
    constructor(type = 1, index = 0, totalPortals = 3) {
        this.type = type; // portal image type
        this.width = 100;
        this.height = 100;
        this.x = Math.min(Math.max(900, canvas.width * 0.6 + Math.random() * (canvas.width * 0.4 - this.width)), canvas.width - this.width);
        const availableHeight = canvas.height - (this.height * totalPortals);
        const gap = availableHeight / (totalPortals + 1);
        this.y = gap + index * (this.height + gap);        
        this.health = 150;
        this.maxHealth = this.health;
        this.spawnTimer = Math.floor(Math.random() * 180);    
    }

    draw() {
        ctx.drawImage(portalImg, this.x, this.y, this.width, this.height);
        ctx.strokeStyle = "purple";
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y - 10, this.width, 6);
        ctx.fillStyle = "purple";
        ctx.fillRect(this.x, this.y - 10, this.width * (this.health / this.maxHealth), 6);
    }

    update() {
        this.spawnTimer++;
        if (this.spawnTimer > 180) { // spawn enemy every 3s
            this.spawnEnemy();
            this.spawnTimer = 0;
        }
    }

    spawnEnemy() {
        const type = Math.floor(Math.random()*3) + 1;
        const enemy = new Enemy(type);
        enemy.x = this.x + this.width/2 - enemy.width/2;
        enemy.y = this.y + this.height/2 - enemy.height/2;
        enemies.push(enemy);
    }
}

// =======================
// BOSS CLASS
// =======================
class Boss {
    constructor() {
        this.width = 200;
        this.height = 200;
        this.x = canvas.width - this.width - 50;
        this.y = canvas.height / 2 - this.height / 2;

        this.health = 500;
        this.maxHealth = 500;

        this.moveTimer = 0;
        this.targetY = this.y;

        this.shootTimer = 0;
    }

    update() {
        // movement
        this.moveTimer++;
        if (this.moveTimer > 60) { 
            this.targetY = Math.random() * (canvas.height - this.height);
            this.moveTimer = 0;
        }

        if (this.y < this.targetY) this.y += 2;
        if (this.y > this.targetY) this.y -= 2;

        // shooting
        this.shootTimer++;
        if (this.shootTimer > 40) {
            this.shoot();
            this.shootTimer = 0;
        }
    }

    draw() {
        ctx.drawImage(bossImg, this.x, this.y, this.width, this.height);

        // boss health bar
        ctx.fillStyle = "red";
        ctx.fillRect(this.x, this.y - 15, this.width, 10);

        ctx.fillStyle = "lime";
        ctx.fillRect(this.x, this.y - 15, this.width * (this.health / this.maxHealth), 10);
    }

    shoot() {
        for (let b of bossBullets) {
            if (!b.active) {
                b.active = true;
                b.x = this.x;
                b.y = this.y + this.height / 2;
                break;
            }
        }
    }
}



// =======================
// GAME STATE
// =======================
let player = new Player();
let bulletPool = [];
let enemies = [];
let portals = [];
let keys = {};
let score = 0;
let gameOver = false;
let boss = null;
let bossBullets = [];

// Create bullet pool (Boss)
const MAX_BOSS_BULLETS = 20;
for (let i = 0; i < MAX_BOSS_BULLETS; i++) {
    bossBullets.push({
        x: 0,
        y: 0,
        width: 12,
        height: 12,
        speed: 5,
        active: false
    });
}

// Create bullet pool (Player)
const MAX_BULLETS = 30;
for (let i=0; i<MAX_BULLETS; i++) bulletPool.push(new Bullet());

// Input
document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);
document.addEventListener("mousedown", shoot);
document.getElementById("restartBtn").addEventListener("click", () => location.reload());

// =======================
// GAME FUNCTIONS
// =======================
function shoot() {
    if (gameOver) return;
    for (let b of bulletPool) {
        if (!b.active) {
            const startX = player.facing === "right" ? player.x + player.width : player.x - 10;
            const startY = player.y + player.height / 2 - 3;
            b.activate(startX, startY, player.facing);
            return;
        }
    }
}

function removeEnemy(i) {
    const last = enemies.length-1;
    [enemies[i], enemies[last]] = [enemies[last], enemies[i]];
    enemies.pop();
}

function initGame() {
    // Spawn 3 portals initially
    for (let i=0; i<4; i++) {
        const type = 1;
        portals.push(new Portal(type, i, 4));
    }
}

// function hitEnemy() {

// }

// =======================
// UPDATE GAME LOGIC
// =======================
function update() {
    if (gameOver) return;
    player.move(keys);

    // Update bullets
    for (let b of bulletPool) 
        b.update();

    // Update enemies
    if (!boss) {
        for (let ei=enemies.length-1; ei>=0; ei--) {
            const e = enemies[ei];
            e.move();

            // Enemy hits player
            if (
                e.x < player.x + player.width &&
                e.x + e.width > player.x &&
                e.y < player.y + player.height &&
                e.y + e.height > player.y
            ) {
                player.health -= 0.5;
            }

            for (let b of bulletPool) {
                if (!b.active) continue;
                if (b.x < e.x + e.width &&
                    b.x + b.width > e.x &&
                    b.y < e.y + e.height &&
                    b.y + b.height > e.y) 
                {
                    b.active = false;
                    e.health -= 25;
                    if (e.health <= 0) { 
                        score += e.award; 
                        removeEnemy(ei); 
                        break; 
                    }
                }
            }
        }

        // Update portals
        for (let pi=portals.length-1; pi>=0; pi--) {
            const p = portals[pi];
            p.update();

            for (let b of bulletPool) {
                if (!b.active) continue;
                if (b.x < p.x + p.width &&
                    b.x + b.width > p.x &&
                    b.y < p.y + p.height &&
                    b.y + b.height > p.y)
                {
                    b.active = false;
                    p.health -= 25;
                    if (p.health <= 0) { 
                        portals.splice(pi, 1); 
                        score += 100; 
                        break; 
                    }
                }
            }
        }
    }
    else {
        boss.update();

        // boss bullet movement + collision
        for (let b of bossBullets) {
            if (!b.active) continue;

            b.x -= b.speed;

            // hit player
            if (
                b.x < player.x + player.width &&
                b.x + b.width > player.x &&
                b.y < player.y + player.height &&
                b.y + b.height > player.y
            ) {
                b.active = false;
                player.health -= 5;
            }

            if (b.x < 0) b.active = false;
        }

        // player bullets hit boss
        for (let pBullet of bulletPool) {
            if (!pBullet.active) continue;

            if (
                pBullet.x < boss.x + boss.width &&
                pBullet.x + pBullet.width > boss.x &&
                pBullet.y < boss.y + boss.height &&
                pBullet.y + pBullet.height > boss.y
            ) {
                pBullet.active = false;
                boss.health -= 20;

                if (boss.health <= 0) {
                    score += 500;
                    boss = null;
                    endGame(true); // YOU WIN
                }
            }
        }
    }

    document.getElementById("score").innerText = score;
    document.getElementById("playerHealth").innerText = Math.max(0, Math.floor(player.health));

    if (portals.length === 0 && enemies.length === 0 && !boss) {
        boss = new Boss();
    }


    if (player.health <= 0) endGame();
}

// =======================
// DRAW GAME
// =======================
function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

    player.draw();
    for (let b of bulletPool) b.draw();
    for (let p of portals) p.draw();
    for (let e of enemies) e.draw();
    
    // === 🚨 BOSS AND BOSS BULLETS GO HERE === //
    if (boss) {
        boss.draw();

        for (let b of bossBullets) {
            if (b.active) {
                ctx.fillStyle = "red";
                ctx.fillRect(b.x, b.y, b.width, b.height);
            }
        }
    }
}

// =======================
// GAME LOOP
// =======================
function gameLoop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(gameLoop);
}

// function endGame() {
//     gameOver = true;
//     document.getElementById("finalScore").innerText = score;
//     document.getElementById("gameOverScreen").style.display = "flex";
// }

// Start loading assets
loadAssets();
