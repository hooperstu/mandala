Interactive Mandala Generator
Project Overview
This is a web application that uses the p5.js library to generate intricate, randomised mandala patterns in your web browser. The application listens to your computer's microphone input and uses the volume to change the colours and thickness of the mandala in real-time.

This project was created as an exploration of generative art and interactive web experiences. It demonstrates the power of p5.js for both visual creation and for interfacing with browser hardware like the microphone.

Features
Generative Art: Every mandala pattern is unique, created from a random set of parameters when the page loads.

Audio-Reactive: The colours and line weights of the mandala shift and change based on the volume of sound picked up by your microphone. The louder the sound, the more dramatic the change.

Interactive: Simply click anywhere on the canvas to generate a completely new, random mandala pattern.

Responsive: The canvas will automatically resize to fit your browser window.

How to Run This Project
Because this application requires access to the microphone, modern web browsers require it to be run from a secure context (https:// or a local server) for security reasons. You cannot simply open the index.html file directly in your browser from your file system.

The easiest way to run this locally is to use a simple local server.

Download the Files: Make sure index.html, style.css, and sketch.js are all in the same folder.

Start a Local Server:

If you have Python installed, open a terminal or command prompt in the folder containing the files and run one of the following commands:

For Python 3: python -m http.server

For Python 2: python -m SimpleHTTPServer

If you have Node.js installed, you can use the serve package. First, install it globally: npm install -g serve. Then, in the project folder, run: serve.

Open in Browser: Open your web browser and navigate to http://localhost:8000 (or the address provided by your server command).

Grant Permission: The browser will ask for permission to use your microphone. You must grant permission for the audio-reactive features to work.

File Structure
index.html: The main HTML file. It sets up the page structure and loads the required p5.js libraries and the sketch.js file.

style.css: Contains the styling for the page, including the initial overlay and the full-screen canvas.

sketch.js: This is the core of the application. All the p5.js logic for drawing the mandala, handling audio input, and managing user interaction resides here.

Customisation
You can easily modify the behaviour of the mandala by editing the sketch.js file.

Sensitivity: In the draw() function, find the map() functions that set the hue and dynamicStrokeWeight. The second-to-last number in these functions (e.g., 0.05) controls the volume sensitivity. A smaller number makes it more sensitive.

Shapes: In the generateMandalaParameters() function, you can change the shapeTypes array to include different shapes or alter the logic in the draw() function's switch statement to create new visual elements.

Colours: In the draw() function, you can change the range of the hue variable in the map() function to produce different colour palettes.
