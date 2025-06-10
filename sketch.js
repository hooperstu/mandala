let mic;
let audioStarted = false;
let overlay;

// Mandala parameters - will be randomized in setup
let numSegments;
let strokeW;
let radii = [];
let shapeTypes = [];
let noiseSeeds = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 1);
  angleMode(DEGREES);
  background(0);

  // --- Create overlay ---
  overlay = createDiv("Tap or click to start");
  overlay.id("overlay");
  overlay.mousePressed(startAudio);

  // --- Generate initial random parameters for the mandala ---
  randomSeed(Math.floor(random(10000)));
  noiseSeed(Math.floor(random(10000)));
  generateMandalaParameters();
}

function startAudio() {
  // This function is called only once by the overlay
  userStartAudio();
  mic = new p5.AudioIn();
  mic.start();
  audioStarted = true;
  overlay.remove();
}

function generateMandalaParameters() {
  // Clear previous parameters to ensure a fresh start
  radii = [];
  shapeTypes = [];
  noiseSeeds = [];

  // Generate new random parameters
  numSegments = floor(random(12, 36));
  strokeW = random(0.5, 3);
  let numLayers = floor(random(5, 15));

  for (let i = 0; i < numLayers; i++) {
    // Progressively larger radii
    radii.push(random(50, min(width, height) * 0.45) * (i * 0.2 + 1));
    // Random shape type for each layer
    shapeTypes.push(floor(random(4)));
    // Noise seeds for organic movement
    noiseSeeds.push(random(1000));
  }
}

function draw() {
  if (!audioStarted) {
    return;
  }

  background(0, 0, 0, 0.1); // Trail effect
  translate(width / 2, height / 2);

  let vol = mic.getLevel();

  // --- SENSITIVITY CHANGE ---
  // The maximum input volume was changed from 0.1 to 0.05.
  // This means a quieter sound will now produce a stronger visual effect.
  let hue = map(vol, 0, 0.05, 180, 360);
  let dynamicStrokeWeight = map(vol, 0, 0.05, strokeW, strokeW * 5, true);

  strokeWeight(dynamicStrokeWeight);
  stroke(hue, 90, 90, 0.8);
  noFill();

  let angleStep = 360 / numSegments;

  for (let i = 0; i < numSegments; i++) {
    push();
    rotate(i * angleStep);

    for (let j = 0; j < radii.length; j++) {
      let r = radii[j];
      let type = shapeTypes[j];
      let noiseFactor = noise(frameCount * 0.005 + noiseSeeds[j]);
      let animatedRadius = r + map(noiseFactor, 0, 1, -20, 20);

      push();
      strokeWeight(
        map(j, 0, radii.length, dynamicStrokeWeight, dynamicStrokeWeight * 0.5)
      );
      let layerHue = (hue + j * 20) % 360;
      stroke(layerHue, 90, 90, 0.8);

      switch (type) {
        case 0: // Ellipses
          ellipse(animatedRadius, 0, r * 0.2, r * 0.5);
          break;
        case 1: // Lines
          line(0, 0, animatedRadius, 0);
          break;
        case 2: // Arcs
          arc(0, 0, animatedRadius * 1.5, animatedRadius * 1.5, -30, 30);
          break;
        case 3: // Bezier curves
          let controlOffset = r * 0.5;
          bezier(
            0,
            0,
            controlOffset,
            -controlOffset,
            animatedRadius - controlOffset,
            -controlOffset,
            animatedRadius,
            0
          );
          break;
      }
      pop();
    }
    pop();
  }
}

// --- p5.js built-in function that is called on any click ---
function mousePressed() {
  // We only want to regenerate AFTER the initial audio start
  if (audioStarted) {
    // Use a new random seed for a completely new pattern
    randomSeed(millis()); // Using millis() for a unique seed
    noiseSeed(millis() + 1000); // And a new noise seed
    generateMandalaParameters();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // Regenerate the mandala to fit the new size
  generateMandalaParameters();
}
