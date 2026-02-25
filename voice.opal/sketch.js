// Becomes Opal v2 - 感情リリースアプリ
// 変更点: ①丸の数削減 ②レモン形 ③音声入力

let particles = [];
let deepGlows = [];
let frameTimer = 0;
let voiceText = "";
let voiceParticles = [];
let micBtn;
let recognition;
let isListening = false;

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 1);
  noStroke();

  // ① 数を減らす: 12 → 5
  for (let i = 0; i < 5; i++) {
    deepGlows.push(new DeepOpal());
  }

  setupVoice(); // ③ 音声設定
}

function draw() {
  background(220, 30, 5, 0.05);
  frameTimer++;

  for (let g of deepGlows) {
    g.update();
    g.display();
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].display();
    if (particles[i].isFinished()) particles.splice(i, 1);
  }

  // 音声テキストパーティクル表示
  for (let i = voiceParticles.length - 1; i >= 0; i--) {
    voiceParticles[i].update();
    voiceParticles[i].display();
    if (voiceParticles[i].isFinished()) voiceParticles.splice(i, 1);
  }

  if (particles.length === 0 && voiceParticles.length === 0) {
    push();
    fill(200, 20, 90, 0.3 + sin(frameCount * 0.02) * 0.15);
    textAlign(CENTER);
    textSize(13);
    textFont('Georgia');
    text("tap to release your feelings", width / 2, height / 2);
    text("🎤 mic button → speak your heart", width / 2, height / 2 + 28);
    pop();
  }
}

function mousePressed() {
  // ① マウスクリックでの追加も控えめに: 25→12
  for (let i = 0; i < 12; i++) particles.push(new Particle(mouseX, mouseY));
  deepGlows.push(new DeepOpal(mouseX, mouseY));
  // ① 上限も削減: 20→8
  if (deepGlows.length > 8) deepGlows.shift();
}

// ③ 音声認識セットアップ
function setupVoice() {
  // マイクボタン作成
  micBtn = createButton("🎤");
  micBtn.position(20, 20);
  micBtn.style("font-size", "24px");
  micBtn.style("background", "rgba(0,0,0,0.5)");
  micBtn.style("color", "white");
  micBtn.style("border", "1px solid rgba(100,200,255,0.4)");
  micBtn.style("border-radius", "50%");
  micBtn.style("width", "52px");
  micBtn.style("height", "52px");
  micBtn.style("cursor", "pointer");
  micBtn.style("z-index", "100");
  micBtn.mousePressed(startVoice);

  // Web Speech API
  if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = "ja-JP";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      voiceText = event.results[0][0].transcript;
      releaseVoice(voiceText);
      isListening = false;
      micBtn.html("🎤");
      micBtn.style("background", "rgba(0,0,0,0.5)");
    };

    recognition.onerror = () => {
      isListening = false;
      micBtn.html("🎤");
    };
  }
}

function startVoice() {
  if (!recognition) {
    alert("お使いのブラウザは音声認識に対応していません（Chrome推奨）");
    return;
  }
  if (isListening) {
    recognition.stop();
    isListening = false;
    micBtn.html("🎤");
    micBtn.style("background", "rgba(0,0,0,0.5)");
  } else {
    recognition.start();
    isListening = true;
    micBtn.html("⏹");
    micBtn.style("background", "rgba(200,50,50,0.6)");
  }
}

// ③ 声をパーティクルとして解放
function releaseVoice(text) {
  let cx = width / 2;
  let cy = height / 2;
  // テキストを光として中央から広げる
  for (let i = 0; i < 40; i++) {
    voiceParticles.push(new VoiceParticle(cx, cy, text));
  }
  deepGlows.push(new DeepOpal(cx, cy));
  if (deepGlows.length > 8) deepGlows.shift();
}

// ② レモン形を描くカスタム関数
function drawLemon(x, y, w, h) {
  push();
  translate(x, y);
  beginShape();
  // レモン形: 楕円を上下に尖らせる
  for (let a = 0; a < TWO_PI; a += 0.1) {
    let px = (w / 2) * cos(a);
    let py = (h / 2) * sin(a) * (1 - 0.25 * abs(cos(a)));
    // 上下を少し尖らせる
    let pointFactor = 1 + 0.3 * pow(abs(sin(a)), 8);
    vertex(px, py * pointFactor);
  }
  endShape(CLOSE);
  pop();
}

class DeepOpal {
  constructor(x, y) {
    this.x = x ? x + random(-150, 150) : random(width);
    this.y = y ? y + random(-150, 150) : random(height);
    this.z = 0;
    this.targetZ = random(0.3, 0.9);
    this.zSpeed = random(0.0005, 0.002);
    this.baseHue = random([170, 185, 200, 215, 230, 245, 260]);
    this.size = random(40, 120);
    this.alpha = 0;
    this.phase = random(TWO_PI);
    this.arrived = false;
    this.fadeOut = false;
    this.fadeOutTimer = 0;
  }
  update() {
    if (!this.fadeOut) {
      this.z += this.zSpeed;
      this.alpha = this.z * 0.5;
      if (this.z >= this.targetZ) {
        this.arrived = true;
        this.fadeOutTimer++;
        if (this.fadeOutTimer > 300) this.fadeOut = true;
      }
    } else {
      this.alpha -= 0.001;
    }
    this.x += sin(frameCount * 0.008 + this.phase) * 0.3;
    this.y += cos(frameCount * 0.006 + this.phase) * 0.2;
  }
  display() {
    if (this.alpha <= 0) return;
    push();
    translate(this.x, this.y);
    let sc = 0.2 + this.z * 0.8;

    // ② レモン形で描画
    for (let layer = 3; layer >= 0; layer--) {
      let hue = (this.baseHue + frameCount * 0.3 + layer * 25 + sin(frameCount * 0.05) * 40) % 360;
      let layerW = this.size * sc * (1 + layer * 0.4);
      let layerH = layerW * 1.5; // 縦長レモン比率
      let layerAlpha = this.alpha * (0.15 - layer * 0.03);
      fill(hue, 45, 80, max(0, layerAlpha));
      drawLemon(0, 0, layerW, layerH);
    }

    // コア
    let coreHue = (this.baseHue + frameCount * 0.5) % 360;
    fill(coreHue, 20, 85, this.alpha * 0.8);
    let coreSize = this.size * sc * 0.3;
    drawLemon(0, 0, coreSize, coreSize * 1.5);
    pop();
  }
  isDone() { return this.alpha <= 0; }
}

class Particle {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D().mult(random(0.3, 2.0));
    this.acc = createVector(0, 0.015);
    this.lifespan = 1.0;
    this.baseHue = random([170, 190, 205, 220, 235, 250]);
    this.size = random(4, 10);
    this.phase = random(TWO_PI);
  }
  update() {
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.lifespan -= 0.004;
  }
  display() {
    let hueValue = (this.baseHue + sin(frameCount * 0.05 + this.phase) * 40) % 360;
    fill(hueValue, 30, 85, this.lifespan * 0.3);
    // ② パーティクルもレモン形に
    drawLemon(this.pos.x, this.pos.y, this.size * 2.5, this.size * 3.5);
    fill(hueValue, 20, 85, this.lifespan);
    drawLemon(this.pos.x, this.pos.y, this.size, this.size * 1.5);
  }
  isFinished() { return this.lifespan < 0; }
}

// ③ 声パーティクル
class VoiceParticle {
  constructor(x, y, text) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D().mult(random(1, 4));
    this.acc = createVector(0, -0.02);
    this.lifespan = 1.0;
    this.text = text;
    this.size = random(3, 7);
    this.hue = random(170, 260);
    this.showText = random() < 0.15; // 一部だけテキスト表示
  }
  update() {
    this.vel.add(this.acc);
    this.vel.mult(0.99);
    this.pos.add(this.vel);
    this.lifespan -= 0.006;
  }
  display() {
    push();
    if (this.showText) {
      fill(this.hue, 30, 90, this.lifespan * 0.8);
      textSize(11 + this.size);
      textAlign(CENTER);
      textFont('Georgia');
      text(this.text, this.pos.x, this.pos.y);
    } else {
      fill(this.hue, 40, 90, this.lifespan * 0.6);
      drawLemon(this.pos.x, this.pos.y, this.size * 2, this.size * 3);
    }
    pop();
  }
  isFinished() { return this.lifespan < 0; }
}

function touchStarted() {
  for (let i = 0; i < 12; i++) particles.push(new Particle(mouseX, mouseY));
  deepGlows.push(new DeepOpal(mouseX, mouseY));
  if (deepGlows.length > 8) deepGlows.shift();
  return false;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}