let playerImg, fishMonster, snakeMonster, lizardMonster, bgImg, portalImg, bossImg, healthImg, berserkImg, scoreImg, speedImg, igniteImg, slowdownImg;
let shootSound, bgMusic;

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

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
            loadImage("../assets/img/enemies/fishMonster.png"),
            loadImage("../assets/img/enemies/snakeMonster.png"),
            loadImage("../assets/img/enemies/lizardMonster.png"),
            loadImage("../assets/img/background.png"),
            loadImage("../assets/img/enemies/portal.png"),
            loadImage("../assets/img/enemies/boss.png"),
            loadImage("../assets/img/collectables/health.png"),
            loadImage("../assets/img/collectables/berserk.png"),
            loadImage("../assets/img/collectables/score.png"),
            loadImage("../assets/img/collectables/speed.png"),
            loadImage("../assets/img/collectables/ignite.png"),
            loadImage("../assets/img/collectables/slowdown.png")
        ])
    ]);

    [playerImg, fishMonster, snakeMonster, lizardMonster, bgImg, portalImg, bossImg, healthImg, 
        berserkImg, scoreImg, speedImg, igniteImg, slowdownImg] = images;
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
    if (gameOver) return;

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
        // ---- Vertical movement
        if (keys['KeyW'] && this.y > 0) this.y -= this.speed;
        if (keys['KeyS'] && this.y < canvas.height - this.height) this.y += this.speed;

        // ---- Horizontal movement
        if (keys['KeyA'] && this.x > 0) {
            this.x -= this.speed;
            this.facing = "left";
        }

        if (keys['KeyD']) {
            // Determine max X allowed
            let maxX = canvas.width - this.width; 
            if (boss) {
                maxX = boss.x - this.width; 
            }

            if (this.x + this.speed < maxX) {
                this.x += this.speed;
                this.facing = "right";
            } else {
                this.x = maxX; 
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

        if (type === 1) { this.baseSpeed = 4; this.health = 50; this.award = 10; }
        else if (type === 2) { this.baseSpeed = 2; this.health = 90; this.award = 30; }
        else { this.baseSpeed = 6; this.health = 40; this.award = 20; }

        this.maxHealth = this.health;
        this.direction = 1;
        this.speed = this.baseSpeed*speedMultiplier
        
        this.baseY = this.y;           // reference point for sine wave
        this.waveAmplitude = 30 + Math.random() * 40; // height of wave (30–70 px)
        this.waveFrequency = 0.0005 + Math.random() * 0.0005; // speed of wave motion
        this.waveOffset = 0; // random phase offset
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

    update(){



    }
    move() {
        // horizontal movement (left)
        this.x -= this.speed;

        // sinusoidal vertical movement
        this.y = this.baseY + Math.sin(Date.now() * this.waveFrequency + this.waveOffset) * this.waveAmplitude;

        // optional: remove if enemy goes off screen to the left
        if (this.x + this.width < 0) {
            this.x = canvas.width + Math.random() * 200;
            this.baseY = Math.random() * (canvas.height - this.height);
        }
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
        if (this.spawnTimer > 180 && enemies.length < maxEnemies) { // spawn enemy every 3s
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

        this.health = 1000;
        this.maxHealth = 1000;

        this.moveTimer = 0;
        this.targetY = this.y;

        this.shootTimer = 0;
        this.maxDeathTime = 120;

        // Charge attack properties
        this.isCharging = false;
        this.chargeProb = 0.003
        this.chargeDirection = -1; // -1 = left, 1 = right
        this.chargeSpeed = 15;
        this.chargeTimer = 0;
        this.shakeTimer = 0;
        this.chargeCooldown = 0;
        this.opacity = 1; // needed for death animation
    }

    startCharge() {
        this.isCharging = true;
        this.shakeTimer = 30;    // telegraph for 0.5 seconds
        // this.chargeTimer = 80;   // actual charge duration
        this.chargeDirection = -1;
        this.chargeCooldown = 240;
    }

    tryCharge() {
        if (!this.isCharging && Math.random() < this.chargeProb && this.chargeCooldown === 0) {
            this.startCharge();
        }
    }

    update(player) {
        if ((this.health/this.maxHealth) < 0.5) {
            this.chargeProb = 0.3;
            this.chargeSpeed = 30;
        }
            // ----------------------------
        // 💀 DEATH ANIMATION MODE
        // ----------------------------
        if (this.isDying) {
            this.deathTimer++;

            // shake effect
            this.x += Math.sin(this.deathTimer * 0.5) * 5;
            this.y += Math.cos(this.deathTimer * 0.4) * 5;

            // fade out
            this.opacity = 1 - (this.deathTimer / this.maxDeathTime);

            // when animation finishes -> YOU WIN
            if (this.deathTimer >= this.maxDeathTime) {
                this.opacity = 0;
                endGame(true);
            }

            return;
        }

        // ----------------------------
        // ⚡ CHARGE ATTACK
        // ----------------------------
        if (this.isCharging) {
            if (this.shakeTimer > 0) {
                this.shakeTimer--;
                this.x += Math.random() * 4 - 2;
            } else if (this.x > 0) {
                // Actual charge movement
                // if (this.x > 0)
                this.x += this.chargeDirection * this.chargeSpeed;
                this.chargeTimer--;
                if (this.x < player.x + player.width &&
                    this.x + this.width > player.x &&
                    this.y < player.y + player.height &&
                    this.y + this.height > player.y) {
                    // Apply damage
                    player.health -= 1;
                }
                // Bounce off screen edges
                if (this.x < 0) this.chargeDirection = 1;
                if (this.x + this.width > canvas.width) this.chargeDirection = -1;
            } else {
                // End charge
                this.isCharging = false;
                this.x = canvas.width - this.width - 50;
            }
        } else {
            // Normal movement
            this.moveTimer++;
            if (this.moveTimer > 60) { 
                this.targetY = Math.random() * (canvas.height - this.height);
                this.moveTimer = 0;
            }

            if (this.y < this.targetY) this.y += 2;
            if (this.y > this.targetY) this.y -= 2;

            // Shooting
            this.shootTimer++;
            if (this.shootTimer > 70) {
                this.shoot();
                this.shootTimer = 0;
            }
            if(this.chargeCooldown > 0) this.chargeCooldown--;

            console.log(this.chargeCooldown)

            // Randomly try to start a charge attack
            this.tryCharge();
        }
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.drawImage(bossImg, this.x, this.y, this.width, this.height);
        ctx.restore();

        // draw HP bar ONLY when alive
        if (!this.isDying) {
            ctx.strokeStyle = "white";
            ctx.lineWidth = 3;
            ctx.strokeRect(this.x, this.y - 18, this.width, 12);

            ctx.fillStyle = "red";
            ctx.fillRect(this.x, this.y - 15, this.width * (this.health / this.maxHealth), 6);
        }
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


class Collectable {
    constructor(type, x = null, y = null) {
        this.type = type;
        this.width = 50;
        this.height = 50;
        this.x = x !== null ? x : Math.random() * (canvas.width - this.width);
        this.y = y !== null ? y : Math.random() * (canvas.height - this.height);
        this.active = true;
        this.duration = 600; // lasts for 10 seconds
        this.bobOffset = Math.random() * 100; // random phase for smooth bobbing
    }

    draw() {
        if (!this.active) return;

        let img;
        switch (this.type) {
            case "health": img = healthImg; break;
            case "ammo": img = berserkImg; break;
            case "score": img = scoreImg; break;
            case "speed": img = speedImg; break;
            case "ignite": img = igniteImg; break;
            case "slowdown": img = slowdownImg; break;
            default: img = null;
        }

        if (img) {
            // bobbing effect
            const bob = Math.sin(Date.now() / 300 + this.bobOffset) * 5;
            ctx.drawImage(img, this.x, this.y + bob, this.width, this.height);
        }   
    }

    update() {
        if (!this.active) return;
        this.duration--;
        if (this.duration <= 0) this.active = false;

        // Check collision with player
        if (
            this.x < player.x + player.width &&
            this.x + this.width > player.x &&
            this.y < player.y + player.height &&
            this.y + this.height > player.y
        ) {
            this.applyEffect();
        }
    }

    applyEffect() {
        switch(this.type) {
            case "health":
                player.health = Math.min(player.maxHealth, player.health + 30);
                break;
            case "ammo":
                // optional: give extra bullets or fire rate
                break;
            case "score":
                score += 50; 
                break;
            case "speed":
                player.speed += 2; 
                setTimeout(() => player.speed -= 2, 5000); // lasts 5 seconds
                break;
            case "ignite":
                for (let e of enemies) {
                    e.health -= 10; // damage all enemies slightly
                }
                break;
            case "slowdown":
                speedMultiplier = 0.5
                setTimeout(() => {
                    // for (let e of enemies) 
                    speedMultiplier = 1; // restore speed
                }, 5000); // effect lasts 5 seconds
                break;
        }

        this.active = false;
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
let collectables = [];
let speedMultiplier = 1; // 1 = normal speed, <1 = slowed
let maxEnemies = 10;
let numPortals = 4;

// Create bullet pool (Boss)
const MAX_BOSS_BULLETS = 20;
for (let i = 0; i < MAX_BOSS_BULLETS; i++) {
    // bossBullets.push({
    //     x: 0,
    //     y: 0,
    //     width: 12,
    //     height: 12,
    //     speed: 5,
    //     active: false
    // });
    bossBullets.push(new Bullet())
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

// =======================
// SPAWN COLLECTABLES
// =======================
function checkCollision(a,b){
    return (a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y)
}

// =======================
// SPAWN COLLECTABLES
// =======================
function spawnCollectable(type, x = null, y = null) {
    collectables.push(new Collectable(type, x, y));
}

// =======================
// REMOVE ENEMY
// =======================
function removeEnemy(i) {
    const last = enemies.length-1;
    [enemies[i], enemies[last]] = [enemies[last], enemies[i]];
    enemies.pop();
}

function initGame() {
    // Spawn 3 portals initially
    for (let i=0; i<numPortals; i++) {
        const type = 1;
        portals.push(new Portal(type, i, numPortals));
    }
}

// =======================
// UPDATE GAME LOGIC
// =======================
function update() {
    if (gameOver) return;
    player.move(keys);
    // Update bullets
    for (let b of bulletPool) b.update();
    for (let c of collectables) c.update();

    // Update enemies
    if (!boss) {
        for (let ei=enemies.length-1; ei>=0; ei--) {
            const e = enemies[ei];
            e.speed = e.baseSpeed*speedMultiplier
            e.move();


            // Enemy hits player
            if (checkCollision(e,player)) player.health -= 0.5;

            for (let b of bulletPool) {
                if (!b.active) continue;
                if (checkCollision(b,e)){
                    b.active = false;
                    e.health -= 25;
                    if (e.health <= 0) { 
                        score += e.award; 
                        removeEnemy(ei); 

                        // Spawn a random collectible at enemy's position
                        const types = ["health", "ammo", "score", "speed", "ignite", "slowdown"];
                        if (Math.random() < 0.2) { // 30% chance to drop
                            let type = null
                            if (player.health < 30){
                                type = types[0];
                            }
                            else{
                                type = types[Math.floor(Math.random() * types.length)];
                            }
                            spawnCollectable(type, e.x + e.width/2 - 20, e.y + e.height/2 - 20);
                        }
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
                if (checkCollision(b,p))
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
        boss.update(player);

        // boss bullet movement + collision
        for (let b of bossBullets) {
            if (!b.active) continue;

            b.x -= b.speed;

            // hit player
            if (
                checkCollision(b,player)
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
                checkCollision(pBullet,boss)
            ) {
                pBullet.active = false;
                boss.health -= 20;

                if (boss.health <= 0 && !boss.isDying) {
                    score += 500;
                    boss.isDying = true;
                    boss.deathTimer = 0;
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
    for (let c of collectables) c.draw();

    // === 🚨 BOSS AND BOSS BULLETS GO HERE === //
    if (boss) {
        ctx.fillStyle = "white";
        ctx.font = "40px Arial Black";
        ctx.textAlign = "center";
        ctx.fillText("FINAL BOSS!", canvas.width / 2, 150);
        
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
