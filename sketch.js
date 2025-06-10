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

  // --- Mouse Interaction ---
  const maxDist = dist(0, 0, width / 2, height / 2);
  const mouseDist = dist(mouseX, mouseY, width / 2, height / 2);
  const mouseScale = map(mouseDist, 0, maxDist, 0.2, 1.0, true);
  const rotationSpeed = map(mouseDist, 0, maxDist, 0.5, 0.01, true);
  globalRotation += rotationSpeed;
  
  rotate(globalRotation);
  
  // --- Audio Interaction ---
  let vol = mic.getLevel();
  let hue = map(vol, 0, 0.05, 180, 360);
  let dynamicStrokeWeight = map(vol, 0, 0.05, strokeW, strokeW * 5, true);

  // --- New Drawing Logic: Layer by Layer ---
  // This is the fundamental change to ensure perfect symmetry.
  // We loop through each LAYER of the mandala first.
  for (let j = 0; j < radii.length; j++) {
    // Get all the properties for this specific layer.
    let r = radii[j];
    let type = shapeTypes[j];
    let noiseFactor = noise(frameCount * 0.005 + noiseSeeds[j]);
    let animatedRadius = r + map(noiseFactor, 0, 1, -20, 20);
    let finalRadius = animatedRadius * mouseScale;
    let layerHue = (hue + j * 20) % 360;
    let layerStrokeWeight = map(j, 0, radii.length, dynamicStrokeWeight, dynamicStrokeWeight * 0.5);

    // Then, for this single layer, we draw a shape in every SEGMENT.
    let angleStep = 360 / numSegments;
    for (let i = 0; i < numSegments; i++) {
        // Isolate each segment's rotation.
        push();
        rotate(i * angleStep);
        
        // Draw the single, correctly-styled shape.
        drawShape(type, finalRadius, r, layerHue, layerStrokeWeight);
        
        pop(); // Discard the rotation state.
    }
  }
}

// --- Helper Functions ---

/**
 * Draws a specific geometric shape. 
 * This function is now completely self-contained and sets its own styles.
 */
function drawShape(type, finalRadius, r, layerHue, layerStrokeWeight) {
  // Each case is responsible for setting its own complete style.
  switch (type) {
    case 0: // Ellipses with center dot
      push();
        strokeWeight(layerStrokeWeight);
        stroke(layerHue, 90, 90, 0.8);
        noFill();
        ellipse(finalRadius, 0, r * 0.2, r * 0.5);
        fill(layerHue, 90, 100);
        noStroke();
        circle(finalRadius, 0, layerStrokeWeight);
      pop();
      break;
    case 1: // Lines
      push();
        strokeWeight(layerStrokeWeight);
        stroke(layerHue, 90, 90, 0.8);
        noFill();
        line(0, 0, finalRadius, 0);
      pop();
      break;
    case 2: // Arcs
      push();
        strokeWeight(layerStrokeWeight);
        stroke(layerHue, 90, 90, 0.8);
        noFill();
        arc(0, 0, finalRadius * 1.5, finalRadius * 1.5, -30, 30);
      pop();
      break;
    case 3: // Symmetrical Bezier curves
      push();
        strokeWeight(layerStrokeWeight);
        stroke(layerHue, 90, 90, 0.8);
        noFill();
        let controlOffset = r * 0.5;
        bezier(0, 0, controlOffset, -controlOffset, finalRadius - controlOffset, -controlOffset, finalRadius, 0);
        bezier(0, 0, controlOffset, controlOffset, finalRadius - controlOffset, controlOffset, finalRadius, 0);
      pop();
      break;
    case 4: // Ornate Petal using curves
      push();
        strokeWeight(layerStrokeWeight);
        stroke(layerHue, 90, 90, 0.8);
        noFill();
        curve(finalRadius, 0, finalRadius * 0.9, 0, finalRadius * 0.8, finalRadius * 0.2, finalRadius * 0.7, finalRadius * 0.3);
        curve(finalRadius, 0, finalRadius * 0.9, 0, finalRadius * 0.8, -finalRadius * 0.2, finalRadius * 0.7, -finalRadius * 0.3);
      pop();
      break;
    case 5: // Triangle Fan
      push();
        noStroke();
        fill(layerHue, 80, 90, 0.5);
        triangle(0, 0, finalRadius, -10, finalRadius, 10);
      pop();
      break;
    case 6: // Dotted Circle
      push();
        noStroke();
        fill(layerHue, 90, 90, 0.7);
        for(let k = 0; k < 12; k++) {
          let angle = k * (360/12);
          let x = finalRadius * cos(angle);
          let y = finalRadius * sin(angle);
          circle(x, y, layerStrokeWeight * 1.5);
        }
      pop();
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
