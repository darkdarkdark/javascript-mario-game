"use strict";

const canvas = document.querySelector("canvas");
canvas.width = 1024;
canvas.height = 576;

const c = canvas.getContext("2d");

function createImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

const plateFormImage = await createImage("./static/images/platform.png");
const plateFormSmallImage = await createImage(
  "./static/images/platformSmallTall.png"
);
const backgroundImage = await createImage("./static/images/background.png");
const hillsImage = await createImage("./static/images/hills.png");

const spriteRunLeft = await createImage("./static/images/spriteRunLeft.png");
const spriteRunRight = await createImage("./static/images/spriteRunRight.png");
const spriteStandLeft = await createImage(
  "./static/images/spriteStandLeft.png"
);
const spriteStandRight = await createImage(
  "./static/images/spriteStandRight.png"
);

const gravity = 1;

class Player {
  constructor() {
    this.position = {
      x: 100,
      y: 100,
    };
    this.velocity = {
      x: 0,
      y: 20,
    };
    this.width = 66;
    this.height = 150;
    this.speed = 5;

    this.image = spriteStandRight;
    this.frames = 0;
    this.sprites = {
      stand: {
        right: spriteStandRight,
        left: spriteStandLeft,
        cropWidth: 177,
        width: 66,
      },
      run: {
        right: spriteRunRight,
        left: spriteRunLeft,
        cropWidth: 341,
        width: 127.875,
      },
    };

    this.currentSprite = this.sprites.stand.right;
    this.currentCropWidth = 177;
  }

  draw() {
    c.drawImage(
      this.currentSprite,
      this.currentCropWidth * this.frames,
      0,
      this.currentCropWidth,
      400,
      this.position.x,
      this.position.y,
      this.width,
      this.height
    );
  }

  update() {
    this.frames++;
    if (
      this.frames > 59 &&
      (this.currentSprite === this.sprites.stand.right ||
        this.currentSprite === this.sprites.stand.left)
    ) {
      this.frames = 0;
    } else if (
      this.frames > 29 &&
      (this.currentSprite === this.sprites.run.right ||
        this.currentSprite === this.sprites.run.left)
    ) {
      this.frames = 0;
    }
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    // 가장 하단까지만 이동
    if (this.position.y + this.height + this.velocity.y <= canvas.height) {
      this.velocity.y += gravity;
    } else {
      this.velocity.y = 0;
    }
  }
}

class Platform {
  constructor({ x, y, image }) {
    this.position = {
      x,
      y,
    };

    this.image = image;
    this.width = image.width;
    this.height = image.height;
  }

  draw() {
    c.drawImage(this.image, this.position.x, this.position.y);
  }
}

class GenericObject {
  constructor({ x, y, image }) {
    this.position = {
      x,
      y,
    };

    this.image = image;
    this.width = image.width;
    this.height = image.height;
  }

  draw() {
    c.drawImage(this.image, this.position.x, this.position.y);
  }
}

let player = new Player();

let platforms = [];
let genericObjects = [];
let keys = {};
let scrollOffset = 0;
let lastKey = "";

function init() {
  player = new Player();

  platforms = [
    new Platform({ x: -1, y: 470, image: plateFormImage }),
  ];

  genericObjects = [
    new GenericObject({
      x: 0,
      y: 0,
      image: backgroundImage,
    }),
    new GenericObject({
      x: 0,
      y: 0,
      image: hillsImage,
    }),
  ];

  keys = {
    right: {
      pressed: false,
    },
    left: {
      pressed: false,
    },
  };

  scrollOffset = 0;
}

function animate() {
  requestAnimationFrame(animate);

  c.fillStyle = "white";
  c.fillRect(0, 0, canvas.width, canvas.height);
  genericObjects.forEach((genericObject) => {
    genericObject.draw();
  });
  platforms.forEach((platform) => {
    platform.draw();
  });
  player.update();

  // 플레이어 x좌표 이동 설정
  if (keys.right.pressed && player.position.x < 400) {
    player.velocity.x = player.speed;
  } else if (
    (keys.left.pressed && player.position.x > 100) ||
    (keys.left.pressed && scrollOffset === 0 && player.position.x > 0)
  ) {
    player.velocity.x = -player.speed;
  } else {
    player.velocity.x = 0;
    if (keys.right.pressed) {
      scrollOffset += player.speed;
      platforms.forEach((platform) => {
        platform.position.x -= player.speed;
      });
      genericObjects.forEach((genericObject) => {
        genericObject.position.x -= player.speed * 0.66;
      });
    } else if (keys.left.pressed && scrollOffset > 0) {
      scrollOffset -= player.speed;
      platforms.forEach((platform) => {
        platform.position.x += player.speed;
      });
      genericObjects.forEach((genericObject) => {
        genericObject.position.x += player.speed * 0.66;
      });
    }
  }

  // 플랫폼과 충돌 시
  platforms.forEach((platform) => {
    if (
      player.position.y + player.height <= platform.position.y &&
      player.position.y + player.height + player.velocity.y >=
        platform.position.y &&
      player.position.x + player.width >= platform.position.x &&
      player.position.x <= platform.position.x + platform.width
    ) {
      player.velocity.y = 0;
    }
  });

  if (
    keys.right.pressed &&
    lastKey === "right" &&
    player.currentSprite !== player.sprites.run.right
  ) {
    player.frames = 1;
    player.currentSprite = player.sprites.run.right;
    player.currentCropWidth = player.sprites.run.cropWidth;
    player.width = player.sprites.run.width;
  } else if (
    keys.left.pressed &&
    lastKey === "left" &&
    player.currentSprite !== player.sprites.run.left
  ) {
    player.currentSprite = player.sprites.run.left;
    player.currentCropWidth = player.sprites.run.cropWidth;
    player.width = player.sprites.run.width;
  } else if (
    !keys.left.pressed &&
    lastKey === "left" &&
    player.currentSprite !== player.sprites.stand.left
  ) {
    player.currentSprite = player.sprites.stand.left;
    player.currentCropWidth = player.sprites.stand.cropWidth;
    player.width = player.sprites.stand.width;
  } else if (
    !keys.right.pressed &&
    lastKey === "right" &&
    player.currentSprite !== player.sprites.stand.right
  ) {
    player.currentSprite = player.sprites.stand.right;
    player.currentCropWidth = player.sprites.stand.cropWidth;
    player.width = player.sprites.stand.width;
  }

  // 승리 조건
  if (scrollOffset > plateFormImage.width * 5 + 300 - 2) {
    console.log("game win");
  }

  // 패배 조건
  if (player.position.y + player.height > canvas.height) {
    console.log("game lose");
    init();
  }
}

addEventListener("keydown", ({ keyCode }) => {
  console.log(keyCode);
  switch (keyCode) {
    case 65:
      console.log("left");
      keys.left.pressed = true;
      lastKey = "left";
      break;
    case 83:
      console.log("down");
      break;
    case 68:
      console.log("right");
      keys.right.pressed = true;
      lastKey = "right";
      break;
    case 87:
      console.log("up");
      player.velocity.y -= 25;
      break;
  }
});

addEventListener("keyup", ({ keyCode }) => {
  switch (keyCode) {
    case 65:
      console.log("left");
      keys.left.pressed = false;
      lastKey = "left";
      break;
    case 83:
      console.log("down");
      break;
    case 68:
      console.log("right");
      keys.right.pressed = false;
      lastKey = "right";
      break;
    case 87:
      console.log("up");
      // player.velocity.y -= 10;
      break;
  }
});

init();
animate();
