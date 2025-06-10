let mic;
let audioStarted = false;
let overlay;

// Mandala parameters
let numSegments;
let strokeW;
let radii = [];
let shapeTypes = [];
let noiseSeeds = [];

// --- Variables for continuous ambient baseline ---
let smoothedVolume = 0;
let ambientBaseline = 0;
// We'll store the last couple of seconds of volume readings
let volumeHistory = []; 
// The number of frames to average over for the baseline (e.g., 2 seconds at 60fps)
const baselineSampleCount = 120; 

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 1);
  angleMode(DEGREES);
  background(0);

  // --- Create overlay ---
  // The text is simplified as there's no longer a distinct calibration phase.
  overlay = createDiv("Tap to start");
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
  overlay.remove(); // Remove overlay immediately
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
    radii.push(random(50, min(width, height) * 0.45) * (i * 0.2 + 1));
    shapeTypes.push(floor(random(4)));
    noiseSeeds.push(random(1000));
  }
}

function draw() {
  // Wait until audio is started
  if (!audioStarted) {
    return;
  }
  
  background(0, 0, 0, 0.1); // Trail effect
  translate(width / 2, height / 2);

  // --- Continuously update the ambient baseline ---
  let rawVol = mic.getLevel();
  volumeHistory.push(rawVol);
  
  // Keep the history array at a fixed size by removing the oldest value
  if (volumeHistory.length > baselineSampleCount) {
    volumeHistory.shift();
  }
  
  // Calculate the average of the recent volume history
  if (volumeHistory.length > 0) {
      let sum = volumeHistory.reduce((a, b) => a + b, 0);
      let avg = sum / volumeHistory.length;
      // Set the baseline slightly above the average to avoid reacting to tiny fluctuations
      ambientBaseline = avg * 1.2;
  }
  
  // Smooth the raw volume to make changes less jittery
  smoothedVolume = lerp(smoothedVolume, rawVol, 0.2); 
  // Calculate how much the current smoothed volume is above the dynamic ambient baseline
  let volAboveBaseline = max(0, smoothedVolume - ambientBaseline);

  // --- Map the volume ABOVE baseline to visuals ---
  let hue = map(volAboveBaseline, 0, 0.1, 180, 360);
  let dynamicStrokeWeight = map(volAboveBaseline, 0, 0.1, strokeW, strokeW * 7, true);

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
