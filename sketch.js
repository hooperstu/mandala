// --- Global Variables ---
let mic;
let audioStarted = false;
let overlay;
let globalRotation = 0;
let palettes = [];
let currentPalette = [];

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

  // Generate the library of color palettes on startup.
  generatePalettes();
  // Set the initial mandala and its palette.
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

  // --- Mouse still controls rotation speed ---
  const maxDist = dist(0, 0, width / 2, height / 2);
  const mouseDist = dist(mouseX, mouseY, width / 2, height / 2);
  const rotationSpeed = map(mouseDist, 0, maxDist, 0.5, 0.01, true);
  globalRotation += rotationSpeed;
  
  rotate(globalRotation);
  
  // --- Audio Interaction ---
  let vol = mic.getLevel();
  
  // Volume now controls brightness, saturation, and the new size scale.
  let dynamicBrightness = map(vol, 0, 0.1, 60, 100, true);
  let dynamicSaturation = map(vol, 0, 0.1, 70, 100, true);
  let dynamicStrokeWeight = map(vol, 0, 0.05, strokeW, strokeW * 5, true);
  let volumeScale = map(vol, 0, 0.1, 0.3, 1.2, true); // <-- New size control

  // --- Drawing Logic: Layer by Layer ---
  for (let j = 0; j < radii.length; j++) {
    // Get all the properties for this specific layer.
    let r = radii[j];
    let type = shapeTypes[j];
    let noiseFactor = noise(frameCount * 0.005 + noiseSeeds[j]);
    let animatedRadius = r + map(noiseFactor, 0, 1, -20, 20);
    
    // The final radius is now scaled by volume, not mouse position.
    let finalRadius = animatedRadius * volumeScale;
    
    // Get the hue for this layer from the current, randomly selected palette.
    let layerHue = currentPalette[j % currentPalette.length];
    let layerStrokeWeight = map(j, 0, radii.length, dynamicStrokeWeight, dynamicStrokeWeight * 0.5);

    // Then, for this single layer, we draw a shape in every SEGMENT.
    let angleStep = 360 / numSegments;
    for (let i = 0; i < numSegments; i++) {
        push();
        rotate(i * angleStep);
        // Pass all style parameters to the drawing function.
        drawShape(type, finalRadius, r, layerHue, layerStrokeWeight, dynamicBrightness, dynamicSaturation);
        pop();
    }
  }
}

// --- Helper Functions ---

/**
 * Draws a specific geometric shape. 
 * It now receives brightness and saturation for its styling.
 */
function drawShape(type, finalRadius, r, layerHue, layerStrokeWeight, brightness, saturation) {
  // Each case is responsible for setting its own complete style.
  switch (type) {
    case 0: // Ellipses with center dot
      push();
        strokeWeight(layerStrokeWeight);
        stroke(layerHue, saturation, brightness, 0.8);
        noFill();
        ellipse(finalRadius, 0, r * 0.2, r * 0.5);
        fill(layerHue, saturation, brightness);
        noStroke();
        circle(finalRadius, 0, layerStrokeWeight);
      pop();
      break;
    case 1: // Lines
      push();
        strokeWeight(layerStrokeWeight);
        stroke(layerHue, saturation, brightness, 0.8);
        noFill();
        line(0, 0, finalRadius, 0);
      pop();
      break;
    case 2: // Arcs
      push();
        strokeWeight(layerStrokeWeight);
        stroke(layerHue, saturation, brightness, 0.8);
        noFill();
        arc(0, 0, finalRadius * 1.5, finalRadius * 1.5, -30, 30);
      pop();
      break;
    case 3: // Symmetrical Bezier curves
      push();
        strokeWeight(layerStrokeWeight);
        stroke(layerHue, saturation, brightness, 0.8);
        noFill();
        let controlOffset = r * 0.5;
        bezier(0, 0, controlOffset, -controlOffset, finalRadius - controlOffset, -controlOffset, finalRadius, 0);
        bezier(0, 0, controlOffset, controlOffset, finalRadius - controlOffset, controlOffset, finalRadius, 0);
      pop();
      break;
    case 4: // Ornate Petal using curves
      push();
        strokeWeight(layerStrokeWeight);
        stroke(layerHue, saturation, brightness, 0.8);
        noFill();
        curve(finalRadius, 0, finalRadius * 0.9, 0, finalRadius * 0.8, finalRadius * 0.2, finalRadius * 0.7, finalRadius * 0.3);
        curve(finalRadius, 0, finalRadius * 0.9, 0, finalRadius * 0.8, -finalRadius * 0.2, finalRadius * 0.7, -finalRadius * 0.3);
      pop();
      break;
    case 5: // Triangle Fan
      push();
        noStroke();
        fill(layerHue, saturation * 0.9, brightness, 0.5);
        triangle(0, 0, finalRadius, -10, finalRadius, 10);
      pop();
      break;
    case 6: // Single Dot
      push();
        noStroke();
        fill(layerHue, saturation, brightness, 0.7);
        circle(finalRadius, 0, layerStrokeWeight * 2);
      pop();
      break;
  }
}

/**
 * Procedurally generates 1000 harmonious color palettes.
 */
function generatePalettes() {
  for (let i = 0; i < 1000; i++) {
    let palette = [];
    let baseHue = random(360);
    let numColors = floor(random(3, 7)); // Palettes of 3 to 6 colors
    for (let j = 0; j < numColors; j++) {
      // Create analogous colors by taking small steps on the color wheel.
      let newHue = (baseHue + j * random(15, 35)) % 360; 
      palette.push(newHue);
    }
    palettes.push(palette);
  }
}

function startAudio() {
  userStartAudio();
  mic = new p5.AudioIn();
  mic.start();
  audioStarted = true;
  overlay.remove();
}

/**
 * Generates parameters for a new mandala and selects a new random color palette.
 */
function generateMandalaParameters() {
  radii = [];
  shapeTypes = [];
  noiseSeeds = [];

  // Select a new palette from the pre-generated library.
  currentPalette = random(palettes);

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
