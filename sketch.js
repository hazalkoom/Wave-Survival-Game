let player, items, enemies, gameState;
let trees = [];
// let sounds = {
//   ambient: { play() {}, loop() {}, stop() {}, setVolume() {}, isPlaying() { return false; } },
//   damage:  { play() {}, loop() {}, stop() {}, setVolume() {}, isPlaying() { return false; } },
//   collect: { play() {}, loop() {}, stop() {}, setVolume() {}, isPlaying() { return false; } },
//   attack:  { play() {}, loop() {}, stop() {}, setVolume() {}, isPlaying() { return false; } },
//   shoot:   { play() {}, loop() {}, stop() {}, setVolume() {}, isPlaying() { return false; } }
// };
let sounds = {};
let voiceLines = {};


// Animation and effect systems
let flashEffect = 0;
let bullets = [];
let particles = [];
let effects = [];
let shootCooldown = 0;

// Create a simplified grid for pathfinding
let GRID_SIZE = 20; // Size of each grid cell
let GRID_COLS, GRID_ROWS;

function setup() {
  createCanvas(800, 600);
  
  // Initialize grid dimensions AFTER canvas is created
  GRID_COLS = Math.ceil(width / GRID_SIZE);
  GRID_ROWS = Math.ceil(height / GRID_SIZE);
  
  if (sounds.ambient && !sounds.ambient.isPlaying()) {
    sounds.ambient.loop();
    sounds.ambient.setVolume(0.3);
  }

  initGame();
}

function initGame() {
  gameState = {
    timeLeft: 180, // 3 minutes in seconds
    gameOver: false,
    won: false,
    score: 0,
    showInstructions: true,
    waveCount: 1,
    waveMessageTimer: 3
  };
  
  player = {
    x: width / 2,
    y: height / 2,
    size: 20,
    speed: 5,
    health: 100,
    hunger: 100,
    inventory: { 
      food: 0, 
      weapon: false,
      hasGun: false 
    },
    attackCooldown: 0,
    attackRange: 35,
    attackEffectFrame: 0,
    attackAngle: 0,
    facingAngle: 0,
    dashEffect: 0,
    lastDirection: { x: 0, y: 0 },
    lastDamageTime: 0,  // Track when player last took damage
    regenRate: 0.02,      // Health regeneration rate per frame
    meleeDamage: 10,
    rangedDamage: 15,
  };
  
  // Reset animation arrays
  bullets = [];
  particles = [];
  effects = [];
  
  // Generate random items
  items = [];
  for (let i = 0; i < 6; i++) {
    items.push({
      type: random() > 0.5 ? 'food' : (random() > 0.5 ? 'weapon' : 'gun'),
      x: random(50, width-50),
      y: random(50, height-50),
      size: 10,
      collected: false,
      floatOffset: random(TWO_PI),
      glowEffect: 0
    });
  }
  
  // Generate enemies
  enemies = [];
  for (let i = 0; i < 4; i++) {
    enemies.push({
      x: random(width),
      y: random(height),
      size: 20 + random(10),
      speed: 1 + random(1.5),
      health: 30,
      maxHealth: 30,
      damageEffect: 0,
      state: "wander",
      stateTimer: random(60, 120),
      path: [],
      targetX: 0,
      targetY: 0,
      lastPathfindTime: 0,
      facingAngle: 0,
      pulseEffect: 0
    });
  }
  
  // Generate trees/obstacles
  trees = [];
  for (let i = 0; i < 15; i++) {
    trees.push({
      x: random(width),
      y: random(height),
      size: 30 + random(20),
      swayOffset: random(TWO_PI),
      swayAmount: random(0.5, 1.5)
    });
  }
}

function preload() {
  sounds.ambient = loadSound('assets/ambient_loop.mp3');
  // sounds.damage = loadSound('assets/damage.mp3');
  sounds.collect = loadSound('assets/collect.mp3');
  sounds.attack = loadSound('assets/slash.mp3');
  sounds.shoot = loadSound('assets/gunshot.mp3');

  // Optional boss voice lines:
  voiceLines.bossIntro = loadSound('assets/boss_intro.mp3');
  // voiceLines.waveStart = loadSound('assets/wave_start.mp3');
}

function draw() {
  // Dark forest background
  background(20, 30, 20);
  
  if (gameState.showInstructions) {
    drawInstructions();
    return;
  }
  
  if (!gameState.gameOver) {
    drawEnvironment();
    updateEffects();
    updateProjectiles();
    updateParticles();
    updatePlayer();
    updateItems();
    updateEnemies();
    updateGameState();
    drawHUD();
    
    // Handle flash effects (damage/attack)
    if (flashEffect > 0) {
      fill(255, 0, 0, flashEffect * 5);
      rect(0, 0, width, height);
      flashEffect--;
    }
  } else {
    drawGameOver();
  }
  
  if (gameState.waveMessageTimer > 0) {
    fill(255);
    textSize(32);
    textAlign(CENTER);
    text(`Wave ${gameState.waveCount}`, width / 2, 50);
    textAlign(LEFT);
    gameState.waveMessageTimer--;
  }
}

function drawEnvironment() {
  // Draw trees/obstacles with swaying animation
  for (let tree of trees) {
    push();
    translate(tree.x, tree.y);
    let sway = sin(frameCount * 0.02 + tree.swayOffset) * tree.swayAmount;
    rotate(sway * 0.02);
    
    // Tree trunk
    fill(60, 40, 20);
    ellipse(0, 0, tree.size * 0.3, tree.size * 0.4);
    
    // Tree foliage with subtle movement
    fill(40 + sin(frameCount * 0.05 + tree.swayOffset) * 5, 
         70 + cos(frameCount * 0.04) * 3, 
         40);
    ellipse(sway, -tree.size * 0.1, tree.size, tree.size * 0.9);
    
    fill(30 + sin(frameCount * 0.03) * 3, 
         50 + sin(frameCount * 0.06) * 2, 
         30);
    ellipse(sway * 0.7, -tree.size * 0.15, tree.size * 0.7, tree.size * 0.65);
    pop();
  }
  
  // Dynamic lighting/shadows
  for (let i = 0; i < width; i += 150) {
    for (let j = 0; j < height; j += 150) {
      let size = 200 + sin(frameCount/40 + i/20 + j/20) * 30;
      let d = dist(player.x, player.y, i, j);
      
      // Dynamic fog based on player position
      if (d < 300) {
        fill(100, 100, 100, map(d, 0, 300, 0, 35));
      } else {
        fill(100, 100, 100, 35);
      }
      ellipse(i, j, size);
    }
  }
  
  // Add ambient particles (dust, spores, etc.)
  if (frameCount % 30 === 0) {
    createAmbientParticle();
  }
}

function updatePlayer() {
  let prevX = player.x;
  let prevY = player.y;
  let isMoving = false;
  
  // Movement
  if (keyIsDown(87) || keyIsDown(UP_ARROW)) {
    player.y -= player.speed;
    player.lastDirection = { x: 0, y: -1 };
    isMoving = true;
  }
  if (keyIsDown(83) || keyIsDown(DOWN_ARROW)) {
    player.y += player.speed;
    player.lastDirection = { x: 0, y: 1 };
    isMoving = true;
  }
  if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) {
    player.x -= player.speed;
    player.lastDirection = { x: -1, y: 0 };
    isMoving = true;
  }
  if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) {
    player.x += player.speed;
    player.lastDirection = { x: 1, y: 0 };
    isMoving = true;
  }
  
  // Check collision with trees
  for (let tree of trees) {
    let d = dist(player.x, player.y, tree.x, tree.y);
    if (d < player.size/2 + tree.size/2 - 5) {
      player.x = prevX;
      player.y = prevY;
    }
  }
  
  // Boundaries
  player.x = constrain(player.x, 0, width);
  player.y = constrain(player.y, 0, height);
  
  // Movement particles
  if (isMoving && frameCount % 4 === 0) {
    createFootstepParticle(player.x, player.y);
  }
  
  // Face towards mouse
  player.facingAngle = atan2(mouseY - player.y, mouseX - player.x);
  
  // Hunger decay (faster when moving)
  player.hunger -= isMoving ? 0.08 : 0.04;
  
  // Attack and shoot cooldown
  if (player.attackCooldown > 0) player.attackCooldown--;
  if (shootCooldown > 0) shootCooldown--;
  
  // Draw player with direction indication
  push();
  translate(player.x, player.y);
  rotate(player.facingAngle);
  
  // Player body
  fill(0, 255, 0);
  ellipse(0, 0, player.size, player.size);
  
  // Direction indicator
  fill(0, 200, 0);
  ellipse(player.size/2 - 2, 0, player.size/2, player.size/2);
  pop();
  
  // Draw dash effect
  if (player.dashEffect > 0) {
    push();
    noFill();
    stroke(0, 255, 0, player.dashEffect * 10);
    strokeWeight(2);
    for (let i = 1; i <= 3; i++) {
      let dashX = player.x - player.lastDirection.x * i * 5;
      let dashY = player.y - player.lastDirection.y * i * 5;
      ellipse(dashX, dashY, player.size - i * 2);
    }
    pop();
    player.dashEffect--;
  }
  
  // Draw attack effect
  if (player.attackEffectFrame > 0) {
    push();
    translate(player.x, player.y);
    rotate(player.attackAngle);
    
    // Slash arc animation
    stroke(255, 255, 0, player.attackEffectFrame * 25);
    strokeWeight(4);
    noFill();
    let arcSize = player.attackRange * 2 * (1 + (10 - player.attackEffectFrame) / 10);
    arc(0, 0, arcSize, arcSize, -PI/6, PI/6);
    
    // Additional slash effects
    if (player.attackEffectFrame > 5) {
      stroke(255, 255, 200, player.attackEffectFrame * 15);
      strokeWeight(2);
      for (let i = 0; i < 3; i++) {
        let angle = random(-PI/6, PI/6);
        let len = random(player.attackRange * 0.5, player.attackRange * 0.8);
        line(0, 0, cos(angle) * len, sin(angle) * len);
      }
    }
    pop();
    player.attackEffectFrame--;
    
    // Create particles for attack
    if (player.attackEffectFrame > 5 && frameCount % 2 === 0) {
      let angle = player.attackAngle + random(-PI/6, PI/6);
      let dist = random(player.attackRange * 0.3, player.attackRange * 0.9);
      let x = player.x + cos(angle) * dist;
      let y = player.y + sin(angle) * dist;
      createAttackParticle(x, y);
    }
  }
  
  // Show attack range when armed
  if (player.inventory.weapon) {
    noFill();
    stroke(200, 200, 0, 80 + sin(frameCount * 0.1) * 20);
    ellipse(player.x, player.y, player.attackRange * 2);
    noStroke();
  }
  
  // Show gun range when armed
  if (player.inventory.hasGun) {
    noFill();
    stroke(100, 100, 255, 60 + sin(frameCount * 0.05) * 15);
    line(player.x, player.y, 
         player.x + cos(player.facingAngle) * 150, 
         player.y + sin(player.facingAngle) * 150);
    noStroke();
  }
  
  // Health regeneration after not taking damage for 5 seconds
  const regenDelay = 5 * 60; // 5 seconds at 60fps
  if (frameCount - player.lastDamageTime > regenDelay && player.health < 100) {
    player.health = min(player.health + player.regenRate, 100);
    
    // Occasionally show healing effect
    if (frameCount % 30 === 0) {
      createHealParticle(player.x, player.y);
    }
  }
}

function updateItems() {
  for (let item of items) {
    if (!item.collected) {
      // Floating animation
      let floatY = sin(frameCount * 0.05 + item.floatOffset) * 2;
      
      // Pulsing glow
      if (dist(player.x, player.y, item.x, item.y) < 100) {
        item.glowEffect = min(item.glowEffect + 0.1, 1);
      } else {
        item.glowEffect = max(item.glowEffect - 0.05, 0);
      }
      
      // Draw glow effect
      if (item.glowEffect > 0) {
        noStroke();
        let glowColor;
        if (item.type === 'food') glowColor = color(255, 255, 0, item.glowEffect * 100);
        else if (item.type === 'weapon' ) glowColor = color(200, 200, 200, item.glowEffect * 100);
        else glowColor = color(100, 100, 255, item.glowEffect * 100);
        
        fill(glowColor);
        ellipse(item.x, item.y + floatY, item.size * 2);
      }
      
      // Draw item
      if (item.type === 'food') {
        fill('yellow');
      } else if (item.type === 'weapon') {
        fill('gray');
      } else { // gun
        fill(100, 100, 255);
      }
      
      ellipse(item.x, item.y + floatY, item.size);
      
      // Item icon
      fill(0);
      textSize(8);
      textAlign(CENTER, CENTER);
      text(item.type === 'food' ? 'F' : (item.type === 'weapon' ? 'W' : 'G'), 
          item.x, item.y + floatY);
      textAlign(LEFT);
      
      // Collection
      let d = dist(player.x, player.y, item.x, item.y);
      if (d < player.size / 2 + item.size / 2) {
        item.collected = true;
        
        // Create collection particles
        for (let i = 0; i < 10; i++) {
          createCollectParticle(item.x, item.y, item.type);
        }
        
        if (item.type === 'food') {
          player.inventory.food++;
          player.hunger = min(player.hunger + 20, 100);
          gameState.score += 10;
        } else if (item.type === 'weapon') {
          if (!player.inventory.weapon) {
            player.inventory.weapon = true;
            player.attackRange = 70;
            player.meleeDamage = 10;
          } else {
            player.attackRange = min(player.attackRange + 10, 120);
            player.meleeDamage += 5; // Increase melee damage
          }
          gameState.score += 20;
        } else if (item.type === 'gun') {
          if (!player.inventory.hasGun) {
            player.inventory.hasGun = true;
            player.rangedDamage = 15;
          } else {
            player.rangedDamage += 5; // Increase ranged damage
          }
          gameState.score += 30;
        }

        
        // Respawn after delay
        setTimeout(() => {
          item.x = random(50, width-50);
          item.y = random(50, height-50);
          item.collected = false;
        }, random(10000, 20000));
      }
    }
  }
}

function updateEnemies() {
  for (let enemy of enemies) {
    let distToPlayer = dist(enemy.x, enemy.y, player.x, player.y);
    
    // FSM: Update enemy state
    updateEnemyState(enemy, distToPlayer);
    
    // FSM: Execute behavior based on current state
    switch(enemy.state) {
      case "wander":
        executeWanderState(enemy);
        break;
        
      case "chase":
        executeChaseState(enemy);
        break;
        
      case "flee":
        executeFleeState(enemy);
        break;
    }
    
    // Update enemy facing direction
    if (enemy.path && enemy.path.length > 0) {
      let nextPoint = enemy.path[0];
      enemy.facingAngle = atan2(nextPoint.y - enemy.y, nextPoint.x - enemy.x);
    } else if (enemy.state === "chase") {
      enemy.facingAngle = atan2(player.y - enemy.y, player.x - enemy.x);
    } else if (enemy.state === "flee") {
      enemy.facingAngle = atan2(enemy.y - player.y, enemy.x - player.x);
    }
    
    // Check for collisions with the player
    if (distToPlayer < player.size / 2 + enemy.size / 2) {
      player.health -= 0.5;
      player.lastDamageTime = frameCount; // Record time of damage
      flashEffect = 20;
      
      // Create hit particles
      if (frameCount % 15 === 0) {
        for (let i = 0; i < 5; i++) {
          createDamageParticle(player.x, player.y);
        }
      }
    }
    
    // Create enemy movement particles
    if (frameCount % 10 === 0 && (enemy.state === "chase" || enemy.state === "flee")) {
      createFootstepParticle(enemy.x, enemy.y, color(200, 0, 0, 100));
    }
    
    // Draw enemy
      push();
      translate(enemy.x, enemy.y);
      rotate(enemy.facingAngle);

      // 👇 PUT IT HERE
      if (enemy.isBoss) {
        if (enemy.bossTier === "major") {
          stroke(255, 100, 0); // bright orange
          strokeWeight(4);
          fill(80, 0, 150);
        } else {
          stroke(255, 215, 0); // gold
          strokeWeight(3);
          fill(100, 0, 200);
        }
      } else if (enemy.damageEffect > 0) {
        fill(255, 200, 200);
        enemy.damageEffect--;

        // Create damage particles
        if (enemy.damageEffect > 5 && frameCount % 2 === 0) {
          createDamageParticle(enemy.x, enemy.y);
        }
      } else {
        switch (enemy.state) {
          case "wander":
            fill(255, 0, 0);
            noStroke();
            break;
          case "chase":
            fill(255, 0, 0);
            stroke(255, 255, 0, 150 + sin(frameCount * 0.2) * 50);
            strokeWeight(2);
            break;
          case "flee":
            fill(200, 0, 0);
            noStroke();
            break;
        }
      }
    
    // Enemy body
    ellipse(0, 0, enemy.size, enemy.size);
    
    // Enemy direction indicator
    fill(150, 0, 0);
    ellipse(enemy.size/2 - 2, 0, enemy.size/3, enemy.size/3);
    
    // Eyes
    fill(255);
    ellipse(-enemy.size/5, -enemy.size/5, enemy.size/4, enemy.size/4);
    ellipse(-enemy.size/5, enemy.size/5, enemy.size/4, enemy.size/4);
    
    // Pupils
    fill(0);
    ellipse(-enemy.size/5, -enemy.size/5, enemy.size/8, enemy.size/8);
    ellipse(-enemy.size/5, enemy.size/5, enemy.size/8, enemy.size/8);
    
    pop();
    noStroke();
    
    // Health bar
    let healthPct = enemy.health / enemy.maxHealth;
    fill(0, 0, 0, 100);
    rect(enemy.x - enemy.size/2, enemy.y - enemy.size/2 - 10, enemy.size, 5);
    fill(255 * (1-healthPct), 255 * healthPct, 0);
    rect(enemy.x - enemy.size/2, enemy.y - enemy.size/2 - 10, enemy.size * healthPct, 5);
    
    // Pulse effect for aggressive enemies
    if (enemy.state === "chase" && enemy.pulseEffect < 15) {
      enemy.pulseEffect++;
      noFill();
      stroke(255, 0, 0, 150 - enemy.pulseEffect * 10);
      strokeWeight(2);
      ellipse(enemy.x, enemy.y, enemy.size + enemy.pulseEffect * 2);
      noStroke();
    }
    
    // Reset pulse effect periodically
    if (enemy.state === "chase" && frameCount % 45 === 0) {
      enemy.pulseEffect = 0;
    }
  }
  
  // Spawn new wave if all enemies are defeated
  if (enemies.length === 0) {
    gameState.waveCount++;
    gameState.waveMessageTimer = 180;
    spawnWave(gameState.waveCount);
  }
}

function spawnWave(wave) {
  const isMajorBossWave = wave % 10 === 0;
  const isMiniBossWave = wave >= 5 && (wave % 5 === 0 || wave % 3 === 0);

  // 1. Base enemy spawn count (scales faster)
  const baseEnemyCount = Math.floor(4 + wave * 1.2);

    // ✅ Play general wave-start voice
  if (voiceLines.waveStart && voiceLines.waveStart.isLoaded()) {
    voiceLines.waveStart.play();
  }

  // 2. Spawn base enemies
  for (let i = 0; i < baseEnemyCount; i++) {
    enemies.push(createScaledEnemy(wave));
  }

  if (isMajorBossWave && voiceLines.bossIntro && voiceLines.bossIntro.isLoaded()) {
    voiceLines.bossIntro.play();
  }

  // 3. Add boss if required
  if (isMajorBossWave) {
    enemies.push(createBoss(wave, true)); // major boss
  } else if (isMiniBossWave) {
    enemies.push(createBoss(wave, false)); // mini-boss
  }
}

function createScaledEnemy(wave) {
  return {
    x: random(width),
    y: random(height),
    size: 20 + wave * 0.8,
    speed: 1 + wave * 0.07,
    health: 30 + wave * 10,
    maxHealth: 30 + wave * 10,
    damageEffect: 0,
    state: "wander",
    stateTimer: random(60, 120),
    path: [],
    targetX: 0,
    targetY: 0,
    lastPathfindTime: 0,
    facingAngle: random(TWO_PI),
    pulseEffect: 0
  };
}



function createBoss(wave, isMajor) {
  return {
    x: random(width),
    y: random(height),
    size: isMajor ? 120 + wave * 2 : 80 + wave,
    speed: isMajor ? 1 + wave * 0.05 : 1 + wave * 0.03,
    health: isMajor ? 1000 + wave * 50 : 400 + wave * 30,
    maxHealth: isMajor ? 1000 + wave * 50 : 400 + wave * 30,
    damageEffect: 0,
    state: "chase",
    stateTimer: 9999,
    path: [],
    targetX: 0,
    targetY: 0,
    lastPathfindTime: 0,
    facingAngle: 0,
    pulseEffect: 0,
    isBoss: true,
    bossTier: isMajor ? "major" : "mini"
  };
}



// FSM: State update logic
function updateEnemyState(enemy, distToPlayer) {
  // Decrease state timer
  enemy.stateTimer--;
  
  // State transitions based on conditions
  switch(enemy.state) {
    case "wander":
      // Transition to chase if player is close
      if (distToPlayer < 200) {
        enemy.state = "chase";
        enemy.stateTimer = random(120, 300);
        enemy.pulseEffect = 0;
      } 
      // Random state transitions
      else if (enemy.stateTimer <= 0) {
        enemy.state = "wander"; // Stay in wander
        enemy.stateTimer = random(60, 180);
        // Set random target location
        enemy.targetX = random(50, width-50);
        enemy.targetY = random(50, height-50);
        // Calculate path to new target
        enemy.path = findPath(enemy.x, enemy.y, enemy.targetX, enemy.targetY);
      }
      break;
      
    case "chase":
      // Transition to flee if low health
      if (enemy.health < 20) {
        enemy.state = "flee";
        enemy.stateTimer = random(120, 240);
      }
      // Stop chasing if player is too far
      else if (distToPlayer > 300) {
        enemy.state = "wander";
        enemy.stateTimer = random(60, 120);
      }
      // Recalculate path to player periodically
      else if (frameCount - enemy.lastPathfindTime > 30) {
        enemy.path = findPath(enemy.x, enemy.y, player.x, player.y);
        enemy.lastPathfindTime = frameCount;
      }
      break;
      
    case "flee":
      // Stop fleeing if recovered health or timer expired
      if (enemy.health > 25 || enemy.stateTimer <= 0) {
        enemy.state = "wander";
        enemy.stateTimer = random(60, 120);
      }
      break;
  }
}

// FSM: Wander state behavior
function executeWanderState(enemy) {
  // If no path or reached end of path, generate new one
  if (enemy.path.length === 0 || 
      (enemy.path.length === 1 && dist(enemy.x, enemy.y, enemy.path[0].x, enemy.path[0].y) < 5)) {
    enemy.targetX = random(50, width-50);
    enemy.targetY = random(50, height-50);
    enemy.path = findPath(enemy.x, enemy.y, enemy.targetX, enemy.targetY);
  }
  
  // Follow path
  if (enemy.path.length > 0) {
    let nextPoint = enemy.path[0];
    let d = dist(enemy.x, enemy.y, nextPoint.x, nextPoint.y);
    
    if (d < 5) {
      enemy.path.shift(); // Remove the point we've reached
    } else {
      // Move toward next point
      let angle = atan2(nextPoint.y - enemy.y, nextPoint.x - enemy.x);
      enemy.x += cos(angle) * (enemy.speed * 0.7);
      enemy.y += sin(angle) * (enemy.speed * 0.7);
    }
  }
}

// FSM: Chase state behavior
function executeChaseState(enemy) {
  // If path exists, follow it to player
  if (enemy.path.length > 0) {
    let nextPoint = enemy.path[0];
    let d = dist(enemy.x, enemy.y, nextPoint.x, nextPoint.y);
    
    if (d < 5) {
      enemy.path.shift();
    } else {
      // Move toward next point, faster in chase mode
      let angle = atan2(nextPoint.y - enemy.y, nextPoint.x - enemy.x);
      enemy.x += cos(angle) * (enemy.speed * 1.2);
      enemy.y += sin(angle) * (enemy.speed * 1.2);
    }
  } 
  // If no path, move directly to player
  else {
    let angle = atan2(player.y - enemy.y, player.x - enemy.x);
    enemy.x += cos(angle) * enemy.speed;
    enemy.y += sin(angle) * enemy.speed;
  }
}

// FSM: Flee state behavior
function executeFleeState(enemy) {
  // Move away from player
  let angle = atan2(enemy.y - player.y, enemy.x - player.x);
  
  // Find safe zone (away from player, within boundaries)
  let fleeX = enemy.x + cos(angle) * 100;
  let fleeY = enemy.y + sin(angle) * 100;
  
  // Constrain to game boundaries
  fleeX = constrain(fleeX, 50, width-50);
  fleeY = constrain(fleeY, 50, height-50);
  
  // Only recalculate path occasionally to save performance
  if (frameCount - enemy.lastPathfindTime > 45) {
    enemy.path = findPath(enemy.x, enemy.y, fleeX, fleeY);
    enemy.lastPathfindTime = frameCount;
  }
  
  // Follow flee path
  if (enemy.path.length > 0) {
    let nextPoint = enemy.path[0];
    let d = dist(enemy.x, enemy.y, nextPoint.x, nextPoint.y);
    
    if (d < 5) {
      enemy.path.shift();
    } else {
      // Move toward next point, desperate to get away
      let angle = atan2(nextPoint.y - enemy.y, nextPoint.x - enemy.x);
      enemy.x += cos(angle) * (enemy.speed * 1.3);
      enemy.y += sin(angle) * (enemy.speed * 1.3);
    }
  }
  
  // Slowly recover health when fleeing
  if (frameCount % 20 === 0) {
    enemy.health += 2;
    
    // Add healing particles
    createHealParticle(enemy.x, enemy.y);
  }
  
  // Leave trail particles when fleeing
  if (frameCount % 5 === 0) {
    createFleeParticle(enemy.x, enemy.y);
  }
}

// ANIMATION SYSTEMS

function updateProjectiles() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    let bullet = bullets[i];
    
    // Move bullet
    bullet.x += bullet.speed * cos(bullet.angle);
    bullet.y += bullet.speed * sin(bullet.angle);
    
    // Update trail
    bullet.trail.unshift({x: bullet.x, y: bullet.y});
    if (bullet.trail.length > bullet.trailLength) {
      bullet.trail.pop();
    }
    
    // Check for collisions with enemies
    for (let j = enemies.length - 1; j >= 0; j--) {
      let enemy = enemies[j];
      let d = dist(bullet.x, bullet.y, enemy.x, enemy.y);
      
      if (d < enemy.size/2 + bullet.size/2) {
        // Hit enemy
        enemy.health -= bullet.damage;
        enemy.damageEffect = 10;
        
        // Create hit particles
        for (let k = 0; k < 8; k++) {
          createHitParticle(bullet.x, bullet.y);
        }
        
        // Remove bullet
        bullets.splice(i, 1);
        
        if (enemy.health <= 0) {
          // Create death explosion
          for (let k = 0; k < 20; k++) {
            createDeathParticle(enemy.x, enemy.y);
          }
          
          enemies.splice(j, 1);
          gameState.score += 30;
        }
        
        // Exit collision check for this bullet
        break;
      }
    }
    
    // Continue to next bullet if this one was removed
    if (i >= bullets.length) continue;
    
    // Check for collisions with trees
    for (let tree of trees) {
      let d = dist(bullet.x, bullet.y, tree.x, tree.y);
      if (d < tree.size/2 + bullet.size/2) {
        // Create hit particles for tree
        for (let k = 0; k < 5; k++) {
          createLeafParticle(bullet.x, bullet.y);
        }
        
        bullets.splice(i, 1);
        break;
      }
    }
    
    // Continue to next bullet if this one was removed
    if (i >= bullets.length) continue;
    
    // Remove bullets that go off screen or expire
    if (bullet.x < 0 || bullet.x > width || bullet.y < 0 || bullet.y > height || 
        bullet.lifetime <= 0) {
      bullets.splice(i, 1);
      continue;
    }
    
    // Decrease lifetime
    bullet.lifetime--;
    
    // Draw bullet and trail
    drawBullet(bullet);
  }
}

function drawBullet(bullet) {
  // Draw trail
  for (let t = 0; t < bullet.trail.length; t++) {
    let trailPos = bullet.trail[t];
    let alpha = map(t, 0, bullet.trail.length-1, 150, 20);
    fill(bullet.color.r, bullet.color.g, bullet.color.b, alpha);
    let size = map(t, 0, bullet.trail.length-1, bullet.size * 0.8, bullet.size * 0.2);
    ellipse(trailPos.x, trailPos.y, size);
  }
  
  // Draw bullet with glow
  fill(255, 255, 255, 150);
  ellipse(bullet.x, bullet.y, bullet.size * 1.3);
  fill(bullet.color.r, bullet.color.g, bullet.color.b);
  ellipse(bullet.x, bullet.y, bullet.size);
}

function shootProjectile() {
  if (shootCooldown > 0 || !player.inventory.hasGun) return;
  
  // Get target direction (towards mouse)
  let angle = atan2(mouseY - player.y, mouseX - player.x);
  
  // Create bullet
  let bullet = {
    x: player.x + cos(angle) * (player.size/2),
    y: player.y + sin(angle) * (player.size/2),
    size: 8,
    speed: 10,
    angle: angle,
    damage: player.rangedDamage,
    lifetime: 60,
    color: {r: 100, g: 150, b: 255},
    trail: [],
    trailLength: 8
  };
  if (sounds.shoot) sounds.shoot.play();
  
  bullets.push(bullet);
  shootCooldown = 15;
  
  // Create muzzle flash
  createMuzzleFlash(player.x, player.y, angle);
  
  // Create recoil effect
  player.dashEffect = 5;
}

function updateEffects() {
  for (let i = effects.length - 1; i >= 0; i--) {
    let effect = effects[i];
    effect.lifetime--;
    
    if (effect.lifetime <= 0) {
      effects.splice(i, 1);
      continue;
    }
    
    // Draw muzzle flash
    if (effect.type === 'muzzle') {
      push();
      translate(effect.x, effect.y);
      rotate(effect.angle);
      fill(255, 255, 200, 200 * (effect.lifetime / effect.maxLife));
      noStroke();
      ellipse(0, 0, effect.size * 1.5, effect.size * 0.8);
      
      // Inner glow
      fill(255, 255, 255, 230 * (effect.lifetime / effect.maxLife));
      ellipse(0, 0, effect.size * 0.8, effect.size * 0.5);
      
      // Directional flash
      triangle(
        0, -effect.size/3, 
        effect.size * (1 + (effect.maxLife - effect.lifetime)/effect.maxLife), 0, 
        0, effect.size/3
      );
      pop();
    }
    
    // Draw spawn effect
    if (effect.type === 'spawn') {
      noFill();
      stroke(effect.color.r, effect.color.g, effect.color.b, 
             255 * (effect.lifetime / effect.maxLife));
      strokeWeight(2);
      
      let size = map(effect.lifetime, 0, effect.maxLife, effect.size * 2, 10);
      ellipse(effect.x, effect.y, size);
      
      // Inner circle
      if (effect.lifetime > effect.maxLife / 2) {
        let innerSize = map(effect.lifetime, effect.maxLife, effect.maxLife/2, 0, effect.size);
        ellipse(effect.x, effect.y, innerSize);
      }
      
      // Particles
      if (effect.lifetime % 3 === 0) {
        createSpawnParticle(effect.x, effect.y);
      }
    }
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    
    // Update position
    p.x += p.vx;
    p.y += p.vy;
    
    // Apply gravity or friction if needed
    p.vy += p.gravity;
    p.vx *= p.friction;
    p.vy *= p.friction;
    
    // Decrease lifetime
    p.lifetime--;
    
    // Remove dead particles
    if (p.lifetime <= 0) {
      particles.splice(i, 1);
      continue;
    }
    
    // Draw particle
    if (p.type === 'footstep') {
      fill(p.color.r, p.color.g, p.color.b, map(p.lifetime, 0, p.maxLife, 0, 100));
      ellipse(p.x, p.y, p.size);
    } 
    else if (p.type === 'attack') {
      fill(255, 255, 0, map(p.lifetime, 0, p.maxLife, 0, 150));
      let size = map(p.lifetime, 0, p.maxLife, p.size * 2, p.size / 2);
      ellipse(p.x, p.y, size);
    }
    else if (p.type === 'hit') {
      fill(255, 100, 50, map(p.lifetime, 0, p.maxLife, 0, 200));
      let size = map(p.lifetime, 0, p.maxLife, p.size * 1.5, p.size / 2);
      ellipse(p.x, p.y, size);
    }
    else if (p.type === 'collect') {
      fill(p.color.r, p.color.g, p.color.b, map(p.lifetime, 0, p.maxLife, 0, 200));
      
      // Rising effect
      p.y -= 0.5;
      ellipse(p.x, p.y, p.size * (p.lifetime / p.maxLife));
    }
    else if (p.type === 'damage') {
      fill(255, 0, 0, map(p.lifetime, 0, p.maxLife, 0, 150));
      let size = map(p.lifetime, 0, p.maxLife, p.size, p.size / 3);
      ellipse(p.x, p.y, size);
    }
    else if (p.type === 'death') {
      fill(p.color.r, p.color.g, p.color.b, map(p.lifetime, 0, p.maxLife, 0, 200));
      let size = map(p.lifetime, 0, p.maxLife, p.size / 2, p.size * 1.5);
      ellipse(p.x, p.y, size);
    }
    else if (p.type === 'leaf') {
      push();
      fill(50, 120, 50, map(p.lifetime, 0, p.maxLife, 0, 200));
      translate(p.x, p.y);
      rotate(frameCount * 0.1 + p.angle);
      ellipse(0, 0, p.size, p.size / 2);
      pop();
    }
    else if (p.type === 'ambient') {
      push();
      fill(p.color.r, p.color.g, p.color.b, map(p.lifetime, 0, p.maxLife, 0, 50));
      translate(p.x, p.y);
      rotate(p.angle);
      ellipse(0, 0, p.size, p.size / 2);
      pop();
    }
    else if (p.type === 'flee') {
      fill(150, 0, 0, map(p.lifetime, 0, p.maxLife, 0, 100));
      let size = map(p.lifetime, 0, p.maxLife, p.size, 0);
      ellipse(p.x, p.y, size);
    }
    else if (p.type === 'spawn') {
      fill(p.color.r, p.color.g, p.color.b, map(p.lifetime, 0, p.maxLife, 0, 150));
      let size = map(p.lifetime, 0, p.maxLife, 0, p.size);
      ellipse(p.x, p.y, size);
    }
    else if (p.type === 'heal') {
      fill(p.color.r, p.color.g, p.color.b, map(p.lifetime, 0, p.maxLife, 0, 180));
      let size = map(p.lifetime, 0, p.maxLife, p.size * 1.5, p.size / 2);
      ellipse(p.x, p.y, size);
      
      // Plus sign to represent healing
      stroke(p.color.r, p.color.g, p.color.b, map(p.lifetime, 0, p.maxLife, 0, 180));
      strokeWeight(1);
      line(p.x - size/2, p.y, p.x + size/2, p.y);
      line(p.x, p.y - size/2, p.x, p.y + size/2);
      noStroke();
    }
  }
}

// PARTICLE CREATION FUNCTIONS

function createFootstepParticle(x, y, color = {r: 150, g: 150, b: 150}) {
  particles.push({
    x: x + random(-5, 5),
    y: y + random(-5, 5),
    vx: random(-0.2, 0.2),
    vy: random(-0.2, 0.2),
    size: random(2, 4),
    lifetime: random(20, 30),
    maxLife: 30,
    gravity: 0,
    friction: 0.95,
    type: 'footstep',
    color: color
  });
}

function createAttackParticle(x, y) {
  particles.push({
    x: x,
    y: y,
    vx: random(-1, 1),
    vy: random(-1, 1),
    size: random(3, 6),
    lifetime: random(10, 15),
    maxLife: 15,
    gravity: 0,
    friction: 0.9,
    type: 'attack',
    color: {r: 255, g: 255, b: 0}
  });
}

function createHitParticle(x, y) {
  particles.push({
    x: x,
    y: y,
    vx: random(-2, 2),
    vy: random(-2, 2),
    size: random(3, 7),
    lifetime: random(10, 20),
    maxLife: 20,
    gravity: 0.05,
    friction: 0.95,
    type: 'hit',
    color: {r: 255, g: 100, b: 50}
  });
}

function createCollectParticle(x, y, itemType) {
  let color;
  
  if (itemType === 'food') {
    color = {r: 255, g: 255, b: 0};
  } else if (itemType === 'weapon') {
    color = {r: 200, g: 200, b: 200};
  } else { // gun
    color = {r: 100, g: 100, b: 255};
  }
  
  particles.push({
    x: x + random(-5, 5),
    y: y + random(-5, 5),
    vx: random(-0.5, 0.5),
    vy: random(-0.5, -2),
    size: random(3, 6),
    lifetime: random(20, 40),
    maxLife: 40,
    gravity: 0,
    friction: 0.98,
    type: 'collect',
    color: color
  });
}

function createDamageParticle(x, y) {
  particles.push({
    x: x + random(-5, 5),
    y: y + random(-5, 5),
    vx: random(-1.5, 1.5),
    vy: random(-1.5, 1.5),
    size: random(2, 5),
    lifetime: random(10, 20),
    maxLife: 20,
    gravity: 0,
    friction: 0.9,
    type: 'damage',
    color: {r: 255, g: 0, b: 0}
  });
}

function createDeathParticle(x, y) {
  particles.push({
    x: x,
    y: y,
    vx: random(-3, 3),
    vy: random(-3, 3),
    size: random(5, 10),
    lifetime: random(20, 40),
    maxLife: 40,
    gravity: 0.05,
    friction: 0.95,
    type: 'death',
    color: {r: 200 + random(-50, 50), g: random(50), b: random(50)}
  });
}

function createLeafParticle(x, y) {
  particles.push({
    x: x,
    y: y,
    vx: random(-1, 1),
    vy: random(-1, 0.5),
    size: random(3, 7),
    lifetime: random(20, 40),
    maxLife: 40,
    gravity: 0.03,
    friction: 0.98,
    type: 'leaf',
    angle: random(TWO_PI),
    color: {r: 50, g: 120, b: 50}
  });
}

function createAmbientParticle() {
  particles.push({
    x: random(width),
    y: random(height),
    vx: random(-0.2, 0.2),
    vy: random(-0.3, -0.1),
    size: random(2, 5),
    lifetime: random(100, 200),
    maxLife: 200,
    gravity: 0,
    friction: 0.99,
    type: 'ambient',
    angle: random(TWO_PI),
    color: {r: 200, g: 200, b: 220}
  });
}

function createFleeParticle(x, y) {
  particles.push({
    x: x,
    y: y,
    vx: 0,
    vy: 0,
    size: random(4, 8),
    lifetime: random(10, 20),
    maxLife: 20,
    gravity: 0,
    friction: 1,
    type: 'flee',
    color: {r: 150, g: 0, b: 0}
  });
}

function createMuzzleFlash(x, y, angle) {
  effects.push({
    type: 'muzzle',
    x: x + cos(angle) * (player.size/2),
    y: y + sin(angle) * (player.size/2),
    size: 20,
    lifetime: 5,
    maxLife: 5,
    angle: angle
  });
}

function createSpawnEffect(x, y) {
  effects.push({
    type: 'spawn',
    x: x,
    y: y,
    size: 30,
    lifetime: 30,
    maxLife: 30,
    color: {r: 255, g: 50, b: 50}
  });
}

function createSpawnParticle(x, y) {
  let angle = random(TWO_PI);
  let distance = random(5, 15);
  
  particles.push({
    x: x + cos(angle) * distance,
    y: y + sin(angle) * distance,
    vx: cos(angle) * random(0.5, 1.5),
    vy: sin(angle) * random(0.5, 1.5),
    size: random(2, 5),
    lifetime: random(10, 20),
    maxLife: 20,
    gravity: 0,
    friction: 0.95,
    type: 'spawn',
    color: {r: 255, g: 50, b: 50}
  });
}

function drawInstructions() {
  background(0);
  fill(255);
  textSize(32);
  textAlign(CENTER);
  text("Lost in the Cursed Woods", width/2, 100);
  textSize(18);
  text("Survive for 3 minutes in the haunted forest", width/2, 150);
  textSize(16);
  let instructions = [
    "WASD - Move your character",
    "E - Eat food from inventory",
    "LEFT CLICK - Shoot (when you have a gun)",
    "SPACEBAR - Attack enemies (when you have a weapon)",
    "",
    "• Collect food (yellow) to restore hunger",
    "• Find weapons (gray) to defend yourself",
    "• Find guns (blue) for ranged attacks",
    "• Enemies will wander, chase you when close, and flee when damaged",
    "• Enemies can navigate around obstacles to reach you",
    "• Don't let your health or hunger reach zero",
    "• Survive until the timer reaches zero"
  ];
  for (let i = 0; i < instructions.length; i++) {
    text(instructions[i], width/2, 200 + i * 25);
  }
  textSize(24);
  text("Press ENTER to start", width/2, height-100);
  textAlign(LEFT);
}

// A* Pathfinding algorithm
function findPath(startX, startY, targetX, targetY) {
  // Convert positions to grid coordinates
  const startCol = Math.floor(startX / GRID_SIZE);
  const startRow = Math.floor(startY / GRID_SIZE);
  const targetCol = Math.floor(targetX / GRID_SIZE);
  const targetRow = Math.floor(targetY / GRID_SIZE);
  
  // Don't pathfind if already at target
  if (startCol === targetCol && startRow === targetRow) {
    return [];
  }
  
  // Create obstacle grid
  let grid = createGrid();
  
  // A* algorithm data structures
  let openSet = [{
    col: startCol,
    row: startRow,
    g: 0,
    h: heuristic(startCol, startRow, targetCol, targetRow),
    f: heuristic(startCol, startRow, targetCol, targetRow),
    parent: null
  }];
  let closedSet = {};
  
  // A* search
  while (openSet.length > 0) {
    // Find node with lowest f score
    let lowestIndex = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].f < openSet[lowestIndex].f) {
        lowestIndex = i;
      }
    }
    
    let current = openSet[lowestIndex];
    
    // Check if we reached the target
    if (current.col === targetCol && current.row === targetRow) {
      // Reconstruct path
      let path = [];
      let temp = current;
      while (temp.parent) {
        // Convert back to world coordinates (center of cells)
        path.push({
          x: temp.col * GRID_SIZE + GRID_SIZE / 2,
          y: temp.row * GRID_SIZE + GRID_SIZE / 2
        });
        temp = temp.parent;
      }
      return path.reverse();
    }
    
    // Remove current from open set and add to closed set
    openSet.splice(lowestIndex, 1);
    closedSet[current.col + "," + current.row] = true;
    
    // Check neighbors
    const neighbors = [
      {col: current.col+1, row: current.row},
      {col: current.col-1, row: current.row},
      {col: current.col, row: current.row+1},
      {col: current.col, row: current.row-1},
      // Diagonals - makes movement more natural
      {col: current.col+1, row: current.row+1},
      {col: current.col-1, row: current.row-1},
      {col: current.col+1, row: current.row-1},
      {col: current.col-1, row: current.row+1}
    ];
    
    for (let neighbor of neighbors) {
      // Skip if out of bounds
      if (neighbor.col < 0 || neighbor.row < 0 || 
          neighbor.col >= GRID_COLS || neighbor.row >= GRID_ROWS) {
        continue;
      }
      
      // Skip if obstacle or in closed set
      if (grid[neighbor.row][neighbor.col] === 1 || 
          closedSet[neighbor.col + "," + neighbor.row]) {
        continue;
      }
      
      // Calculate g score (add penalty for diagonals)
      let isDiagonal = neighbor.col !== current.col && neighbor.row !== current.row;
      let movementCost = isDiagonal ? 1.4 : 1;
      let g = current.g + movementCost;
      
      // Check if this is a better path
      let exists = false;
      for (let i = 0; i < openSet.length; i++) {
        if (openSet[i].col === neighbor.col && openSet[i].row === neighbor.row) {
          exists = true;
          if (g < openSet[i].g) {
            openSet[i].g = g;
            openSet[i].f = g + openSet[i].h;
            openSet[i].parent = current;
          }
          break;
        }
      }
      
      // Add to open set if not already there
      if (!exists) {
        let h = heuristic(neighbor.col, neighbor.row, targetCol, targetRow);
        openSet.push({
          col: neighbor.col,
          row: neighbor.row,
          g: g,
          h: h,
          f: g + h,
          parent: current
        });
      }
    }
  }
  
  // No path found
  return [];
}

// Heuristic function for A*
function heuristic(col1, row1, col2, row2) {
  // Manhattan distance
  return Math.abs(col1 - col2) + Math.abs(row1 - row2);
}

// Create grid with obstacles
function createGrid() {
  // Initialize empty grid
  let grid = Array(GRID_ROWS).fill().map(() => Array(GRID_COLS).fill(0));
  
  // Mark tree locations as obstacles
  for (let tree of trees) {
    let col = Math.floor(tree.x / GRID_SIZE);
    let row = Math.floor(tree.y / GRID_SIZE);
    
    // Make sure col/row are within bounds
    if (col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS) {
      grid[row][col] = 1;
      
      // Add buffer around large trees
      if (tree.size > 40) {
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            let newCol = col + i;
            let newRow = row + j;
            if (newCol >= 0 && newCol < GRID_COLS && newRow >= 0 && newRow < GRID_ROWS) {
              grid[newRow][newCol] = 1;
            }
          }
        }
      }
    }
  }
  
  return grid;
}

function keyPressed() {
  if (keyCode === ENTER && gameState.showInstructions) {
    gameState.showInstructions = false;
    return;
  }
  
  if (key === 'r' && gameState.gameOver) {
    initGame();
    return;
  }
  
  // Add spacebar attack
  if (keyCode === 32 && player.inventory.weapon && player.attackCooldown === 0) {
    // Attack logic
    let hitEnemy = false;
    for (let enemy of enemies) {
      let d = dist(player.x, player.y, enemy.x, enemy.y);
      if (d < player.attackRange) {
        enemy.health -= player.meleeDamage;
        enemy.damageEffect = 10;
        hitEnemy = true;
        
        // Create hit effect
        for (let i = 0; i < 5; i++) {
          createHitParticle(enemy.x, enemy.y);
        }
        
        if (enemy.health <= 0) {
          // Create death explosion
          for (let i = 0; i < 15; i++) {
            createDeathParticle(enemy.x, enemy.y);
          }
          
          enemies.splice(enemies.indexOf(enemy), 1);
          gameState.score += 30;
        }
      }
    }
    
    player.attackCooldown = 20;
    player.attackEffectFrame = 10;
    player.attackAngle = atan2(mouseY - player.y, mouseX - player.x);
  }
}

function mousePressed() {
  // Left click for shooting
  if (mouseButton === LEFT && player.inventory.hasGun && shootCooldown === 0) {
    shootProjectile();
  }
}

function updateGameState() {
    if (typeof player === 'undefined' || !player || !player.inventory) {
    return; // Player isn't ready yet
  }

  gameState.timeLeft -= 1 / frameRate();

  if (gameState.timeLeft <= 0) {
    gameState.gameOver = true;
    gameState.won = true;
  }

  if (player.health <= 0 || player.hunger <= 0) {
    gameState.gameOver = true;
    gameState.won = false;
  }

  if (keyIsDown(69) && player.inventory.food > 0 && frameCount % 10 === 0) {
    player.inventory.food--;
    player.hunger = min(player.hunger + 30, 100);
    player.health = min(player.health + 5, 100);

    // Create healing particles
    for (let i = 0; i < 5; i++) {
      createCollectParticle(player.x, player.y, 'food');
    }
  }

}

function drawHUD() {
  fill(0, 0, 0, 150);
  rect(5, 5, 200, 170);
  
  // Health bar with pulsing effect for low health
  if (player.health < 30) {
    fill(255, 0, 0, 150 + sin(frameCount * 0.2) * 100);
  } else {
    fill(255, 0, 0);
  }
  rect(100, 20, player.health, 15);
  
  // Hunger bar
  fill(255, 165, 0);
  rect(100, 40, player.hunger, 15);
  
  fill(255);
  textSize(16);
  text(`Health:`, 10, 32);
  text(`Hunger:`, 10, 52);
  text(`Food: ${player.inventory.food}`, 10, 72);
  text(`Weapon: ${player.inventory.weapon ? 'Yes' : 'No'}`, 10, 92);
  text(`Gun: ${player.inventory.hasGun ? 'Yes' : 'No'}`, 10, 112);
  text(`Melee Dmg: ${player.meleeDamage}`, 10, 132);
  text(`Ranged Dmg: ${player.rangedDamage}`, 10, 152);
  
  fill(0, 0, 0, 150);
  rect(width-205, 5, 200, 50);
  fill(255);
  text(`Time Left: ${floor(gameState.timeLeft)}s`, width-200, 25);
  text(`Score: ${gameState.score}`, width-200, 45);
  
  fill(0, 0, 0, 150);
  rect(width/2-150, height-40, 300, 35);
  fill(255);
  textAlign(CENTER);
  text("WASD: Move | SPACEBAR: Attack | LEFT CLICK: Shoot | E: Eat", width/2, height-20);
  textAlign(LEFT);
}

function drawGameOver() {
  background(0, 0, 0, 200);
  textSize(32);
  fill(gameState.won ? 'green' : 'red');
  textAlign(CENTER);
  
  if (gameState.won) {
    text("You Survived!", width/2, height/2-60);
    
    // Create victory particles
    if (frameCount % 5 === 0) {
      particles.push({
        x: random(width),
        y: height + 10,
        vx: random(-1, 1),
        vy: random(-5, -2),
        size: random(5, 10),
        lifetime: random(60, 100),
        maxLife: 100,
        gravity: 0.05,
        friction: 0.99,
        type: 'collect',
        color: {
          r: random(180, 255), 
          g: random(180, 255), 
          b: random(180, 255)
        }
      });
    }
    
    textSize(24);
    fill(255);
    text(`Final Score: ${gameState.score + 100}`, width/2, height/2);
    text(`Waves Survived: ${gameState.waveCount}`, width/2, height/2 + 40);
  } else {
    text("Game Over", width/2, height/2-60);
    
    // Create defeat particles
    if (frameCount % 20 === 0) {
      particles.push({
        x: random(width),
        y: random(height),
        vx: random(-0.5, 0.5),
        vy: random(-0.5, 0.5),
        size: random(3, 8),
        lifetime: random(20, 40),
        maxLife: 40,
        gravity: 0,
        friction: 0.98,
        type: 'damage',
        color: {r: 200, g: 0, b: 0}
      });
    }
    
    textSize(24);
    fill(255);
    text(`Final Score: ${gameState.score}`, width/2, height/2);
    text(`Waves Survived: ${gameState.waveCount - 1}`, width/2, height/2 + 40);
  }
  
  // Pulsing restart message
  textSize(18);
  fill(255, 255, 255, 150 + sin(frameCount * 0.1) * 100);
  text("Press 'R' to restart", width/2, height/2+80);
  textAlign(LEFT);
  
  // Update particles even in game over screen
  updateParticles();
}

// New healing particle function
function createHealParticle(x, y) {
  particles.push({
    x: x + random(-5, 5),
    y: y + random(-5, 5),
    vx: random(-0.5, 0.5),
    vy: random(-1.5, -0.5), // Float upward
    size: random(3, 6),
    lifetime: random(15, 30),
    maxLife: 30,
    gravity: 0,
    friction: 0.98,
    type: 'heal',
    color: {r: 50, g: 200, b: 50} // Green color for healing
  });
}