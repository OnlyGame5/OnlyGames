# 🤖 The Betrayal Chamber 💥

Welcome to our project for the COMS3006A/COMS3025A Computer Graphics course! This isn't just another assignment; it's a 3D narrative puzzle game where your only friend might just be your greatest enemy. 😱

Built from the ground up with **Three.js**, this game challenges you to escape a mysterious high-tech bunker. Guided by a seemingly helpful AI, you'll solve puzzles and uncover dark secrets. But remember... **don't trust everything you hear**.

---

### 🗺️ **Quick Navigation**

- [The Mission](#-the-mission)
- [Core Features](#-core-features)
- [Our Tech Stack](#-our-tech-stack)
- [Get It Running!](#-get-it-running)
- [How To Play](#-how-to-play)
- [Matrix Sky Shader](#-matrix-sky-shader)
- [The Dev Team](#-the-dev-team)
- [License](#-license)
- [Special Thanks](#-special-thanks)

---

## 🎯 The Mission

Our goal is to create a fully immersive 3D game that runs smoothly in your browser, ticking all the boxes for the **Computer Graphics and Visualisation** project at the University of the Witwatersrand. We're aiming for an A+ experience that's engaging, polished, and technically impressive.

The story is simple: you wake up in a strange facility. An AI voice promises to help you escape. But as you explore, you'll find chilling messages left by those who came before you. Will you uncover the truth and make it out, or will you become just another failed test subject?

![Sci-fi hallway with flickering lights](https://media1.tenor.com/m/8Y5rg35jrdcAAAAC/the-expanse-space.gif)

---

## ✨ Core Features

- **📖 Gripping Narrative:** Journey through a story of trust and betrayal across three carefully crafted stages.
- **🧠 Brain-Busting Puzzles:** Sharpen your wits against circuit puzzles, memory challenges, and devious logic tests designed by the AI itself.
- **🕵️‍♀️ Interactive World:** Keep your eyes peeled! Discover hidden clues, eerie graffiti, and environmental secrets that tell a story the AI wants to keep hidden.
- **🤖 A Deceptive AI Companion:** Your guide and narrator is the central character. Listen as its warm, encouraging tone slowly twists into something more manipulative and sinister.
- **🎭 Your Choice Matters:** The final confrontation offers a critical choice. Your decision determines your fate and the AI's, leading to different endings.
- **🎨 Stunning 3D Effects:** We're leveraging the power of Three.js to implement advanced graphical effects, including multiple light sources, shadows, and a dynamic skybox, to build a truly atmospheric world.

---

## 💻 Our Tech Stack

- **🧊 Three.js:** Our go-to library for all things 3D in the browser.
- **📜 JavaScript:** The engine driving all our game logic, puzzles, and AI behavior.
- **뼈 HTML5 & 💅 CSS3:** For crafting a sleek UI, in-game menus, and a polished heads-up display.
- **🗿 Blender:** We're creating our own unique models and textures to make our game stand out!

---

## 🚀 Get It Running!

Ready to play? Let's get the project set up on your local machine.

### **Pre-flight Check**

Make sure you have **Node.js** and **npm** installed. If not, grab them from [nodejs.org](https://nodejs.org/).

- npm
  ```sh
  npm install npm@latest -g
  ```

### **Installation Steps**

1.  **Clone this awesome repo**

    ```sh
    git clone [https://github.com/](https://github.com/)[YourUsername]/[YourRepoName].git
    ```

2.  **Jump into the project folder**

    ```sh
    cd [YourRepoName]
    ```

3.  **Install all the magic dependencies**

    ```sh
    npm install
    ```

4.  **Launch it! 🚀**
    ```sh
    npm run dev
    ```
    The game should now be live on your local server (usually `http://localhost:3000`). Have fun!

---

## 🎮 How To Play

The controls are simple and intuitive.

- **🏃‍♂️ Movement:** W, A, S, D keys
- **👀 Look Around:** Mouse movement
- **✋ Interact:** E key or Left Mouse Click

Explore, solve, and survive!

---

## 🧑‍💻 The Dev Team

Meet the brilliant minds bringing this betrayal to life!

- Shervaan Govinder
- Abdullah Ali
- Kovendan Raman
- Jaishil Patel
- Umayr Gadat
- Muhammad Ahmed

---

## ⚖️ License

Distributed under the MIT License. See `LICENSE.txt` for the boring legal stuff.

---

## 🌌 Matrix Sky Shader

The game features a dynamic Matrix-rain skybox that creates an immersive simulation atmosphere. This animated skybox uses custom GLSL shaders to render falling green code columns in real-time.

### **Features:**
- **Animated Matrix Rain**: Falling green code columns with moving highlights
- **Performance Optimized**: Pure math-based shaders, no textures or video
- **Configurable**: Speed, intensity, and enable/disable controls
- **Atmospheric**: Dark green base (#020B05) with neon highlights (#10FF40)

### **Usage:**
The Matrix Sky is automatically enabled and runs in the background. You can control it through the game settings:

```javascript
// Enable/disable Matrix Sky
gameStore.settings.enableMatrixSky = true;

// Adjust animation speed
gameStore.settings.matrixSkySpeed = 0.002;

// Control intensity
gameStore.settings.matrixSkyIntensity = 1.0;
```

### **Performance Tips:**
- The shader is lightweight and designed for 60fps performance
- Disable if experiencing performance issues: `gameStore.settings.enableMatrixSky = false`
- Adjust speed for different visual effects
- The skybox uses a large inverted sphere (scale ≈ 100) for proper camera positioning

### **Technical Details:**
- **File**: `src/scene/MatrixSky.js`
- **Shader**: Custom GLSL with time-based animation
- **Integration**: Automatically added to main scene
- **Renderer**: Uses SRGB color space and ACES filmic tone mapping

---

## 🙏 Special Thanks

- The **University of the Witwatersrand** for this challenging and creative project.
- Our lecturers, **Branden Ingram** and **Damion Harvey**, for their wisdom and guidance.
- The entire **Three.js community** for creating such an amazing tool for web developers.
- All external assets will be given full credit in-game, as required.
