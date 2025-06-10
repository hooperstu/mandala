// --- Global Variables ---
let mic;
let audioStarted = false;
let overlay;
let globalRotation = 0; // New variable to control overall rotation

// --- Mandala Parameters ---
let numSegments;
let strokeW;
let radii = [];
let shapeTypes = [];
let noiseSeeds = [];

// --- p5.js Setup Function ---
// This runs once when the sketch starts.
function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 1);
  angleMode(DEGREES);
  background(0);

  // Create the initial overlay to prompt user interaction for audio.
  overlay = createDiv('Tap or click to start');
  overlay.id('overlay');
  overlay.mousePressed(startAudio);

  // Generate the first mandala pattern.
  randomSeed(Math.floor(random(10000)));
  noiseSeed(Math.floor(random(10000)));
  generateMandalaParameters();
}

// --- p5.js Draw Function ---
// This runs in a continuous loop.
function draw() {
  // Don't draw anything until the user has started the audio.
  if (!audioStarted) {
    return;
  }

  // Use a semi-transparent background to create a trail effect.
  background(0, 0, 0, 0.1); 
  translate(width / 2, height / 2);

  // --- Mouse Interaction Logic ---
  // Calculate distance of mouse from the centre of the canvas.
  const maxDist = dist(0, 0, width / 2, height / 2);
  const mouseDist = dist(mouseX, mouseY, width / 2, height / 2);

  // Map mouse distance to a scale factor for the diameter.
  // Closer to centre = smaller (min 20% size). Further = larger (max 100% size).
  const mouseScale = map(mouseDist, 0, maxDist, 0.2, 1.0, true);

  // Map mouse distance to rotation speed.
  // Closer to centre = faster rotation. Further = slower rotation.
  const rotationSpeed = map(mouseDist, 0, maxDist, 0.5, 0.01, true);
  globalRotation += rotationSpeed; // Update the global rotation angle.
  
  // Apply the continuous rotation influenced by the mouse.
  rotate(globalRotation);
  
  // --- Audio Interaction Logic ---
  // Get the current volume level from the microphone.
  let vol = mic.getLevel();
  
  // Map the volume to visual properties (hue and stroke weight).
  let hue = map(vol, 0, 0.05, 180, 360);
  let dynamicStrokeWeight = map(vol, 0, 0.05, strokeW, strokeW * 5, true);

  // Set the base drawing style for the frame.
  strokeWeight(dynamicStrokeWeight);
  stroke(hue, 90, 90, 0.8);
  noFill();

  // Draw the complete mandala by rotating around the center.
  let angleStep = 360 / numSegments;
  for (let i = 0; i < numSegments; i++) {
    push();
    rotate(i * angleStep);
    // Pass the mouseScale factor into the drawing function.
    drawMandalaSegment(dynamicStrokeWeight, hue, mouseScale);
    pop();
  }
}

// --- Helper Functions ---

/**
 * Draws a single segment of the mandala, which is then rotated.
 * @param {number} dynamicStrokeWeight - The base stroke weight based on volume.
 * @param {number} baseHue - The base hue based on volume.
 * @param {number} mouseScale - The scaling factor based on mouse position.
 */
function drawMandalaSegment(dynamicStrokeWeight, baseHue, mouseScale) {
  for (let j = 0; j < radii.length; j++) {
    let r = radii[j];
    let type = shapeTypes[j];
    let noiseFactor = noise(frameCount * 0.005 + noiseSeeds[j]);
    let animatedRadius = r + map(noiseFactor, 0, 1, -20, 20);
    // Apply the mouse-controlled scale to the final radius.
    let finalRadius = animatedRadius * mouseScale;
    let layerHue = (baseHue + j * 20) % 360;

    push();
    strokeWeight(map(j, 0, radii.length, dynamicStrokeWeight, dynamicStrokeWeight * 0.5));
    stroke(layerHue, 90, 90, 0.8);
    
    // Draw the specific shape for this layer of the segment.
    drawShape(type, finalRadius, r, layerHue, dynamicStrokeWeight);
    pop();
  }
}

/**
 * Draws a specific geometric shape based on its type.
 * @param {number} type - The integer representing the shape type.
 * @param {number} finalRadius - The final calculated radius for the shape.
 * @param {number} r - The original base radius (used for some shape calculations).
 * @param {number} layerHue - The hue for this specific layer.
 * @param {number} dynamicStrokeWeight - The current stroke weight.
 */
function drawShape(type, finalRadius, r, layerHue, dynamicStrokeWeight) {
  switch (type) {
    case 0: // Ellipses with center dot
      ellipse(finalRadius, 0, r * 0.2, r * 0.5);
      fill(layerHue, 90, 100);
      noStroke();
      circle(finalRadius, 0, dynamicStrokeWeight);
      noFill();
      stroke(layerHue, 90, 90, 0.8);
      break;
    case 1: // Lines
      line(0, 0, finalRadius, 0);
      break;
    case 2: // Arcs
      arc(0, 0, finalRadius * 1.5, finalRadius * 1.5, -30, 30);
      break;
    case 3: // Symmetrical Bezier curves
      let controlOffset = r * 0.5;
      // Draw the first curve bending one way.
      bezier(0, 0, controlOffset, -controlOffset, finalRadius - controlOffset, -controlOffset, finalRadius, 0);
      // Draw the second, mirrored curve bending the other way.
      bezier(0, 0, controlOffset, controlOffset, finalRadius - controlOffset, controlOffset, finalRadius, 0);
      break;
    case 4: // Ornate Petal using curves
      noFill();
      curve(
        finalRadius, 0,
        finalRadius * 0.9, 0,
        finalRadius * 0.8, finalRadius * 0.2,
        finalRadius * 0.7, finalRadius * 0.3
      );
      curve(
        finalRadius, 0,
        finalRadius * 0.9, 0,
        finalRadius * 0.8, -finalRadius * 0.2,
        finalRadius * 0.7, -finalRadius * 0.3
      );
      break;
    case 5: // Triangle Fan
      fill(layerHue, 80, 90, 0.5);
      noStroke();
      triangle(0, 0, finalRadius, -10, finalRadius, 10);
      break;
    case 6: // Dotted Circle
      noFill();
      stroke(layerHue, 90, 90, 0.7);
      for(let k = 0; k < 12; k++) {
        let angle = k * (360/12);
        let x = finalRadius * cos(angle);
        let y = finalRadius * sin(angle);
        circle(x, y, dynamicStrokeWeight * 1.5);
      }
      break;
  }
}

/**
 * Initialises the audio input after a user gesture.
 */
function startAudio() {
  userStartAudio();
  mic = new p5.AudioIn();
  mic.start();
  audioStarted = true;
  overlay.remove();
}

/**
 * Generates a new set of random parameters for the mandala.
 */
function generateMandalaParameters() {
  // Clear previous parameters
  radii = [];
  shapeTypes = [];
  noiseSeeds = [];

  // Generate new parameters for complexity and variety
  numSegments = floor(random(16, 48));
  strokeW = random(0.5, 3);
  let numLayers = floor(random(8, 20));
  
  for (let i = 0; i < numLayers; i++) {
    radii.push(random(50, min(width, height) * 0.45) * (i * 0.15 + 1));
    shapeTypes.push(floor(random(7))); // More shape options available
    noiseSeeds.push(random(1000));
  }
}

// --- Event Handlers ---

/**
 * p5.js built-in function that is called on any click.
 */
function mousePressed() {
  // We only want to regenerate AFTER the initial audio start
  if (audioStarted) {
    // Use a new random seed for a completely new pattern
    randomSeed(millis());
    noiseSeed(millis() + 1000);
    generateMandalaParameters();
  }
}

/**
 * p5.js built-in function that is called when the window is resized.
 */
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // Regenerate the mandala to fit the new size
  generateMandalaParameters(); 
}
