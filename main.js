import * as THREE from 'https://cdn.skypack.dev/three';
import { OrbitControls } from 'https://cdn.skypack.dev/three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.skypack.dev/three/examples/jsm/loaders/GLTFLoader.js';

// Initialize Scene
const scene = new THREE.Scene();

// Initialize Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);
camera.position.z = 10000;

// Initialize Renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create Earth Sphere
const geometry = new THREE.SphereGeometry(6378, 64, 64);
let material;
let earth; // Make earth variable accessible for naming and potential future direct reference

const textureLoader = new THREE.TextureLoader();
textureLoader.load(
    'earth.jpg',
    function (texture) {
        // Texture loaded successfully
        material = new THREE.MeshBasicMaterial({ map: texture });
        earth = new THREE.Mesh(geometry, material); // Assign to the higher-scoped 'earth'
        earth.name = "initial_earth_sphere"; // Assign name
        scene.add(earth);
    },
    undefined, // onProgress callback not needed
    function (err) {
        // Error loading texture, use fallback material
        console.error('Error loading texture:', err);
        material = new THREE.MeshBasicMaterial({ color: 0x0000ff }); // Blue sphere
        earth = new THREE.Mesh(geometry, material); // Assign to the higher-scoped 'earth'
        earth.name = "initial_earth_sphere"; // Assign name
        scene.add(earth);
    }
);

// Set up Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.maxDistance = 20000;

// Rendering Loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// Handle Window Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Dynamic positioning for the overlay
// Ensure this code runs after the camera and info-panel element are available

// Wait for the DOM to be fully loaded before trying to access elements
document.addEventListener('DOMContentLoaded', (event) => {
    // Info Panel Positioning Logic
    const infoPanel = document.getElementById('info-panel');
    if (infoPanel) {
        const examplePoint3D = new THREE.Vector3(5000, 3000, 0); // An arbitrary point on/near the sphere

        function project3DPointToScreen(point3D, camera) {
            const vector = point3D.clone();
            vector.project(camera); // Projects to NDC
            const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
            const y = (-vector.y * 0.5 + 0.5) * window.innerHeight; // Y is inverted
            return { x, y };
        }

        const screenPos = project3DPointToScreen(examplePoint3D, camera);
        infoPanel.style.left = `${screenPos.x}px`;
        infoPanel.style.top = `${screenPos.y}px`;
        // Comment: For sticky behavior, projection should be in animate loop.
    } else {
        console.error('Info panel not found');
    }

    // ---------------------------------------------------------------------------
    // STEP 4: Implement the Time Travel Earth Feature (Basic Structure)
    // ---------------------------------------------------------------------------
    const timelineSlider = document.getElementById('timeline-slider');
    const timelineYearDisplay = document.getElementById('timeline-year');
    
    let loader;
    try {
        // GLTFLoader is imported at the top of the file via:
        // import { GLTFLoader } from 'https://cdn.skypack.dev/three/examples/jsm/loaders/GLTFLoader.js';
        loader = new GLTFLoader(); 
    } catch (e) {
        console.error("Failed to instantiate GLTFLoader. Ensure it's correctly imported.", e);
    }

    if (timelineSlider && timelineYearDisplay && loader) {
        timelineSlider.addEventListener('input', (event) => {
            const year = event.target.value;
            timelineYearDisplay.textContent = year;

            console.log(`Timeline changed to year: ${year}. Attempting to load model: models/earth-${year}.gltf`);

            // Remove previously loaded GLTF model, if any
            const existingGltfModel = scene.getObjectByName('earth_model_gltf');
            if (existingGltfModel) {
                scene.remove(existingGltfModel);
            }

            // Remove or hide the initial Earth sphere
            // The 'earth' variable is the initial sphere, named 'initial_earth_sphere'
            const initialSphere = scene.getObjectByName('initial_earth_sphere');
            if (initialSphere) {
                // Option 1: Remove it permanently (if GLTFs are expected to always replace it)
                scene.remove(initialSphere);
                // Option 2: Hide it (if you want to show it again on GLTF load errors)
                // initialSphere.visible = false; 
            }
            
            loader.load(
                `models/earth-${year}.gltf`, // Path to the model
                (gltf) => {
                    console.log(`Successfully loaded model for year ${year}.`);
                    const model = gltf.scene;
                    model.name = 'earth_model_gltf'; // Name it for easy removal later
                    scene.add(model);
                    
                    // If using visible = false for initialSphere, ensure it's hidden now
                    // if (initialSphere) initialSphere.visible = false;
                },
                undefined, // onProgress callback (optional)
                (error) => {
                    console.error(`Error loading model for year ${year}:`, error);
                    // If a model fails to load, consider showing the initial sphere again
                    // if (initialSphere) initialSphere.visible = true;
                    // Or add a placeholder error model/indicator
                }
            );
        });
        
        // Initial naming of the earth sphere is done where 'earth' mesh is created.
        // if (earth) { earth.name = "initial_earth_sphere"; } // This is already handled

    } else {
        if (!timelineSlider) console.error("Timeline slider not found.");
        if (!timelineYearDisplay) console.error("Timeline year display not found.");
        if (!loader) console.error("GLTFLoader not initialized or available, Time Travel feature disabled.");
    }
});

// ---------------------------------------------------------------------------
// STEP 3: Integrate Real-Time Data and AI (Conceptual Examples)
// ---------------------------------------------------------------------------

// 1. Fetch real-time data (Example: OpenStreetMap placeholder)
console.log("Attempting to fetch data from OpenStreetMap placeholder...");
fetch('https://api.openstreetmap.org/api/0.6/map?bbox=11.54,48.14,11.543,48.145') // Example OSM API call for a small area
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    // OSM API typically returns XML, so response.text() might be more appropriate
    // For a JSON API, response.json() would be used.
    // This is a placeholder, actual data processing will vary.
    return response.text(); 
  })
  .then(data => {
    console.log("OSM Data (raw text/XML):", data.substring(0, 200) + "..."); // Log snippet
    // In a real application, you would parse this data (e.g., XML parser)
    // and then update an overlay or 3D visualization.
    // For example: document.getElementById('some-overlay-element').textContent = 'OSM Data Loaded';
  })
  .catch(error => {
    console.error("Error fetching OpenStreetMap data:", error);
    // Display error in an overlay or console
  });

// 2. Example AI integration (Pseudo-code for sentiment analysis)
console.log("Conceptual AI Sentiment Analysis:");
// Hypothetical GoogleCloudAI class/SDK (this will not run without a real library)
class GoogleCloudAI {
  analyzeSentiment(text) {
    return new Promise((resolve, reject) => {
      console.log(`[AI Pseudo-code] Analyzing sentiment for: "${text}"`);
      // Simulate API call
      setTimeout(() => {
        const sentiments = ["positive", "neutral", "negative"];
        const randomSentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
        resolve({ sentiment: randomSentiment, score: Math.random() });
      }, 1000);
    });
  }
}

const aiService = new GoogleCloudAI(); // Hypothetical API
const sampleTextForAnalysis = "This is a wonderful project with great potential!";
aiService.analyzeSentiment(sampleTextForAnalysis)
  .then(result => {
    console.log("[AI Pseudo-code] Sentiment Result:", result);
    // In a real app, display this on an overlay:
    // document.getElementById('sentiment-display').textContent = `Sentiment: ${result.sentiment} (Score: ${result.score.toFixed(2)})`;
  })
  .catch(error => {
    console.error("[AI Pseudo-code] Error analyzing sentiment:", error);
  });

// 3. Blockchain carbon tracking (Pseudo-code using ethers.js)
console.log("Conceptual Blockchain Carbon Tracking (ethers.js):");
// This requires ethers.js library and a connected wallet/provider.
// For example: import { ethers } from "https://cdn.ethers.io/lib/ethers-5.2.esm.min.js";

// --- Start of ethers.js pseudo-code section ---
// console.log("Attempting to load ethers.js for conceptual blockchain interaction...");
// // Dynamically load ethers.js for this conceptual example if not already imported
// if (typeof ethers === 'undefined') {
//     const script = document.createElement('script');
//     script.src = "https://cdn.ethers.io/lib/ethers-5.2.esm.min.js"; // Using a CDN for ethers
//     script.type = "module"; // If it's an ES module
//     script.onload = () => {
//         console.log("ethers.js loaded conceptually.");
//         // setupConceptualBlockchainInteraction(); // Call the function that uses ethers
//     };
//     script.onerror = () => console.error("Failed to load ethers.js conceptually.");
//     document.head.appendChild(script);
// } else {
//     // setupConceptualBlockchainInteraction();
// }

// function setupConceptualBlockchainInteraction() {
//     // This code will only execute if ethers.js is available.
//     // It remains pseudo-code as it won't connect to a real contract without setup.
//     try {
//         const contractAddress = "0xYOUR_CONTRACT_ADDRESS"; // Replace with actual address
//         const contractABI = [ /* Replace with your contract's ABI */ ];
//         // const provider = new ethers.providers.Web3Provider(window.ethereum); // Requires MetaMask or similar
//         // const signer = provider.getSigner();
//         // const contract = new ethers.Contract(contractAddress, contractABI, signer);
//         console.log("[Blockchain Pseudo-code] Hypothetical contract instance created for address:", contractAddress);
//         
//         async function recordCarbonEmission(amount) {
//           console.log(`[Blockchain Pseudo-code] Attempting to record carbon emission of ${amount} units.`);
//           // const tx = await contract.recordCarbonEmission(amount); // Actual contract call
//           // console.log("[Blockchain Pseudo-code] Transaction sent:", tx.hash);
//           // await tx.wait();
//           // console.log("[Blockchain Pseudo-code] Transaction confirmed.");
//           console.log("[Blockchain Pseudo-code] Carbon emission of " + amount + " units recorded (simulated).");
//         }
//         
//         recordCarbonEmission(100); // Example call
//     } catch (e) {
//         console.error("[Blockchain Pseudo-code] Error setting up conceptual blockchain interaction:", e.message);
//     }
// }
// For now, we will just log the conceptual nature without trying to load ethers.js to avoid actual network calls or errors if the CDN is blocked.
console.log("[Blockchain Pseudo-code] To implement, you would use a library like ethers.js, connect to a provider (e.g., MetaMask), get a signer, and interact with your smart contract.");
console.log("[Blockchain Pseudo-code] Example: const contract = new ethers.Contract(address, abi, signer); await contract.recordCarbonEmission(amount);");
// --- End of ethers.js pseudo-code section ---

console.log("Conceptual examples for Step 3 added.");

// ---------------------------------------------------------------------------
// STEP 5: Add Gamification and User Engagement (Conceptual/Basic)
// ---------------------------------------------------------------------------

// 1. Firebase for points (Conceptual Example)
console.log("Conceptual Firebase Firestore interaction for user points:");

// This is pseudo-code. Actual Firebase integration requires SDK import and initialization.
// e.g., import firebase from 'firebase/app'; import 'firebase/firestore';
// firebase.initializeApp({ ... });

// Hypothetical Firestore interaction:
const conceptualFirebase = {
    firestore: () => ({
        collection: (collectionName) => ({
            doc: (docId) => ({
                update: (dataToUpdate) => {
                    console.log(`[Firebase Pseudo-code] Firestore: Document '${docId}' in collection '${collectionName}' would be updated with:`, dataToUpdate);
                    return Promise.resolve();
                },
                // Dummy get method for completeness if needed by other pseudo-code
                get: () => Promise.resolve({ exists: true, data: () => ({ points: 0 }) }) 
            })
        }),
        // Dummy FieldValue for the conceptual increment
        FieldValue: {
            increment: (value) => ({ type: 'increment', value })
        }
    })
};

const db = conceptualFirebase.firestore();
const exampleUserId = "user123";
if (db && db.FieldValue) { // Check if FieldValue is defined
    db.collection('users').doc(exampleUserId).update({
        points: db.FieldValue.increment(10) // Increment points by 10
    }).then(() => {
        console.log(`[Firebase Pseudo-code] Points for user '${exampleUserId}' conceptually incremented.`);
    }).catch(error => {
        console.error(`[Firebase Pseudo-code] Error conceptually incrementing points for user '${exampleUserId}':`, error);
    });
} else {
    console.error("[Firebase Pseudo-code] db.FieldValue is undefined. Cannot increment points.");
}


// 2. Avatar Customization (Basic 3D Placeholder)
console.log("Adding a basic 3D placeholder for an avatar.");

// Create a simple box geometry to represent an avatar
const avatarGeometry = new THREE.BoxGeometry(100, 300, 100); // Dimensions in km (adjust as needed)
const avatarMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff }); // Bright color (e.g., magenta)
const avatar = new THREE.Mesh(avatarGeometry, avatarMaterial);

// Position the avatar somewhere visible, e.g., slightly above the Earth's surface
// Earth radius is 6378. Position it near the camera's typical view.
avatar.position.set(0, 6378 + 150, 0); // Positioned on top of the Earth at North Pole, raised by its half-height + a bit
avatar.name = "user_avatar_placeholder";
scene.add(avatar);

console.log("Conceptual examples and basic avatar for Step 5 added.");
