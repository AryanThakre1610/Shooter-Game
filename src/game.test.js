// src/game.test.js
const { Player, Enemy, Bullet, Portal, Boss, Collectable } = require('./game');

describe('Player', () => {
  test('initializes with correct health and speed', () => {
    const player = new Player();
    expect(player.health).toBe(100);
    expect(player.maxHealth).toBe(100);
    expect(player.speed).toBe(5);
  });
});

describe('Enemy', () => {
  test('initializes with correct type 1 properties', () => {
    const enemy = new Enemy(1);
    expect(enemy.baseSpeed).toBe(4);
    expect(enemy.health).toBe(50);
    expect(enemy.award).toBe(10);
  });
});

describe('Bullet', () => {
  test('activates and deactivates correctly', () => {
    const bullet = new Bullet();
    bullet.activate(10, 20, 'right');
    expect(bullet.active).toBe(true);
    bullet.deactivate();
    expect(bullet.active).toBe(false);
  });
});

describe('Portal', () => {
  test('initializes with correct health and size', () => {
    const portal = new Portal(1, 0, 3);
    expect(portal.health).toBe(150);
    expect(portal.maxHealth).toBe(150);
    expect(portal.width).toBe(100);
    expect(portal.height).toBe(100);
  });

  test('spawns an enemy when spawnEnemy is called', () => {
    const mockEnemies = [];
    const portal = new Portal(1, 0, 3, mockEnemies);
    portal.spawnEnemy();
    expect(mockEnemies.length).toBe(1);
    expect(mockEnemies[0]).toBeInstanceOf(Enemy);
  });
});

describe('Boss', () => {
  test('initializes with correct health and size', () => {
    const boss = new Boss();
    expect(boss.health).toBe(1200);
    expect(boss.maxHealth).toBe(1200);
    expect(boss.width).toBe(200);
    expect(boss.height).toBe(200);
  });
});

describe('Collectable', () => {
  test('initializes with correct type and size', () => {
    const collectable = new Collectable('health', 10, 20);
    expect(collectable.type).toBe('health');
    expect(collectable.width).toBe(50);
    expect(collectable.height).toBe(50);
    expect(collectable.x).toBe(10);
    expect(collectable.y).toBe(20);
    expect(collectable.active).toBe(true);
  });
});
