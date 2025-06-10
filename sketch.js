// --- Global Variables ---
let mic;
let audioStarted = false;
let overlay;
let globalRotation = 0;

// --- Mandala Parameters ---
let numSegments;
let strokeW;
let radii = [];
let shapeTypes = [];
let noiseSeeds = [];

// --- p5.js Setup Function ---
function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 1);
  angleMode(DEGREES);
  background(0);

  overlay = createDiv('Tap or click to start');
  overlay.id('overlay');
  overlay.mousePressed(startAudio);

  randomSeed(Math.floor(random(10000)));
  noiseSeed(Math.floor(random(10000)));
  generateMandalaParameters();
}

// --- p5.js Draw Function ---
function draw() {
  if (!audioStarted) {
    return;
  }

  background(0, 0, 0, 0.1); 
  translate(width / 2, height / 2);

  const maxDist = dist(0, 0, width / 2, height / 2);
  const mouseDist = dist(mouseX, mouseY, width / 2, height / 2);
  const mouseScale = map(mouseDist, 0, maxDist, 0.2, 1.0, true);
  const rotationSpeed = map(mouseDist, 0, maxDist, 0.5, 0.01, true);
  globalRotation += rotationSpeed;
  
  rotate(globalRotation);
  
  let vol = mic.getLevel();
  let hue = map(vol, 0, 0.05, 180, 360);
  let dynamicStrokeWeight = map(vol, 0, 0.05, strokeW, strokeW * 5, true);

  // The main draw loop no longer sets any styles.
  // It only calculates positions and loops.

  let angleStep = 360 / numSegments;
  for (let i = 0; i < numSegments; i++) {
    push();
    rotate(i * angleStep);
    drawMandalaSegment(dynamicStrokeWeight, hue, mouseScale);
    pop();
  }
}

// --- Helper Functions ---

/**
 * Draws a single segment of the mandala.
 * This function now isolates the state of every single shape.
 */
function drawMandalaSegment(dynamicStrokeWeight, baseHue, mouseScale) {
  for (let j = 0; j < radii.length; j++) {
    let r = radii[j];
    let type = shapeTypes[j];
    let noiseFactor = noise(frameCount * 0.005 + noiseSeeds[j]);
    let animatedRadius = r + map(noiseFactor, 0, 1, -20, 20);
    let finalRadius = animatedRadius * mouseScale;
    
    // **THE FIX:** Use push() and pop() for EVERY shape to create a perfectly
    // isolated drawing environment for it.
    push();
    
    // Set the styles for this specific shape inside its own isolated state.
    let layerStrokeWeight = map(j, 0, radii.length, dynamicStrokeWeight, dynamicStrokeWeight * 0.5);
    let layerHue = (baseHue + j * 20) % 360;
    
    // Draw the shape, passing all style info it needs.
    drawShape(type, finalRadius, r, layerHue, layerStrokeWeight);
    
    pop(); // Discard the state. The next shape will be totally unaffected.
  }
}

/**
 * Draws a specific geometric shape. It now sets its own styles.
 */
function drawShape(type, finalRadius, r, layerHue, layerStrokeWeight) {
  switch (type) {
    case 0: // Ellipses with center dot
      strokeWeight(layerStrokeWeight);
      stroke(layerHue, 90, 90, 0.8);
      noFill();
      ellipse(finalRadius, 0, r * 0.2, r * 0.5);
      push();
        fill(layerHue, 90, 100);
        noStroke();
        circle(finalRadius, 0, layerStrokeWeight);
      pop();
      break;
    case 1: // Lines
      strokeWeight(layerStrokeWeight);
      stroke(layerHue, 90, 90, 0.8);
      noFill();
      line(0, 0, finalRadius, 0);
      break;
    case 2: // Arcs
      strokeWeight(layerStrokeWeight);
      stroke(layerHue, 90, 90, 0.8);
      noFill();
      arc(0, 0, finalRadius * 1.5, finalRadius * 1.5, -30, 30);
      break;
    case 3: // Symmetrical Bezier curves
      strokeWeight(layerStrokeWeight);
      stroke(layerHue, 90, 90, 0.8);
      noFill();
      let controlOffset = r * 0.5;
      bezier(0, 0, controlOffset, -controlOffset, finalRadius - controlOffset, -controlOffset, finalRadius, 0);
      bezier(0, 0, controlOffset, controlOffset, finalRadius - controlOffset, controlOffset, finalRadius, 0);
      break;
    case 4: // Ornate Petal using curves
      strokeWeight(layerStrokeWeight);
      stroke(layerHue, 90, 90, 0.8);
      noFill();
      curve(finalRadius, 0, finalRadius * 0.9, 0, finalRadius * 0.8, finalRadius * 0.2, finalRadius * 0.7, finalRadius * 0.3);
      curve(finalRadius, 0, finalRadius * 0.9, 0, finalRadius * 0.8, -finalRadius * 0.2, finalRadius * 0.7, -finalRadius * 0.3);
      break;
    case 5: // Triangle Fan
      noStroke();
      fill(layerHue, 80, 90, 0.5);
      triangle(0, 0, finalRadius, -10, finalRadius, 10);
      break;
    case 6: // Dotted Circle
      noStroke();
      fill(layerHue, 90, 90, 0.7);
      for(let k = 0; k < 12; k++) {
        let angle = k * (360/12);
        let x = finalRadius * cos(angle);
        let y = finalRadius * sin(angle);
        circle(x, y, layerStrokeWeight * 1.5);
      }
      break;
  }
}

function startAudio() {
  userStartAudio();
  mic = new p5.AudioIn();
  mic.start();
  audioStarted = true;
  overlay.remove();
}

function generateMandalaParameters() {
  radii = [];
  shapeTypes = [];
  noiseSeeds = [];

  numSegments = floor(random(16, 48));
  strokeW = random(0.5, 3);
  let numLayers = floor(random(8, 20));
  
  for (let i = 0; i < numLayers; i++) {
    radii.push(random(50, min(width, height) * 0.45) * (i * 0.15 + 1));
    shapeTypes.push(floor(random(7)));
    noiseSeeds.push(random(1000));
  }
}

function mousePressed() {
  if (audioStarted) {
    randomSeed(millis());
    noiseSeed(millis() + 1000);
    generateMandalaParameters();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  generateMandalaParameters(); 
}
