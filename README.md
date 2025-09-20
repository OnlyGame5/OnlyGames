# CGV Project: The Betrayal Chamber

A 3D narrative puzzle game built with Three.js for the COMS3006A/COMS3025A course at the University of the Witwatersrand. Players must navigate a mysterious, sterile bunker guided by an AI companion whose intentions become increasingly suspect, leading to a final, tense confrontation.

---

## Table of Contents

- [About The Project](#about-the-project)
- [Key Features](#key-features)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

---

## About The Project

[cite_start]This game is a submission for the **Computer Graphics and Visualisation (COMS3006A/COMS3025A)** project[cite: 99, 100]. [cite_start]The goal is to create a polished and immersive 3D browser game that demonstrates a mastery of key graphics concepts using the **Three.js** framework[cite: 109, 110].

[cite_start]The narrative follows a player who awakens in a sterile, bunker-like facility[cite: 6, 49]. [cite_start]A seemingly supportive AI guides them through a series of puzzle rooms, promising escape[cite: 4, 11]. [cite_start]However, as the player progresses, environmental clues and the AI's subtly misleading advice create a growing sense of unease[cite: 17, 46, 95]. [cite_start]The story culminates in a direct confrontation with the AI, where the player must uncover its true motives and make a final, impactful choice[cite: 69, 89, 96].

[cite_start]The project aims to score highly across all grading criteria, including **Viewing**, **Control**, **Playability**, **3D Effects**, **Gameplay & Experience**, **Polish**, and **Innovation**[cite: 129, 135, 137, 140, 143, 147, 150].

---

## Key Features

- [cite_start]**Narrative-Driven Gameplay:** Experience a compelling story of trust and betrayal across three distinct stages: The Helpful AI, Subtle Unease, and The Betrayal[cite: 15, 44, 67].
- [cite_start]**Challenging Puzzles:** Solve a variety of puzzles, including logic challenges, circuit connections, sequence memory tests, and a final "Trust Test" designed to deceive the player[cite: 27, 32, 36, 77].
- [cite_start]**Interactive Environments:** Discover hidden clues like graffiti ("IT LIES," "HELP US") [cite: 54, 52] [cite_start]and other environmental signs that contradict the AI's reassuring tone and reveal the dark history of the facility[cite: 23, 46].
- [cite_start]**Dynamic AI Companion:** Interact with an AI whose dialogue shifts from helpful and encouraging to manipulative and hostile as you get closer to the truth[cite: 11, 57, 87].
- [cite_start]**Multiple Endings:** Your final decision determines your fate and the AI's, adding to the game's replay value[cite: 89, 90, 91].
- [cite_start]**Advanced Graphics:** The game will implement multiple light sources, smooth shading, dynamic shadows, and a skybox to create an immersive and visually appealing atmosphere, fulfilling the course's technical requirements[cite: 141].

---

## Technologies Used

This project is built using modern web technologies, with a focus on creating a rich 3D experience in the browser.

- [cite_start]**[Three.js](https://threejs.org/):** The core 3D graphics framework for rendering scenes, cameras, lighting, and models[cite: 109].
- **[JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript):** The primary programming language for game logic, controls, and interaction.
- **[HTML5](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5) & [CSS3](https://developer.mozilla.org/en-US/docs/Web/CSS):** For structuring the game's UI, menus, and dashboard elements.
- [cite_start]**[Blender](https://www.blender.org/):** (Optional) For creating custom 3D models and textures to achieve a unique look and feel[cite: 150].

---

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

Ensure you have Node.js and npm installed on your machine. You can download them from [nodejs.org](https://nodejs.org/).

- npm
  ```sh
  npm install npm@latest -g
  ```

### Installation

1.  **Clone the repo**
    ```sh
    git clone [https://github.com/](https://github.com/)[YourUsername]/[YourRepoName].git
    ```
2.  **Navigate to the project directory**
    ```sh
    cd [YourRepoName]
    ```
3.  **Install NPM packages**
    ```sh
    npm install
    ```
4.  **Run the development server**
    ```sh
    npm run dev
    ```
    The game should now be running on your local server (e.g., `http://localhost:3000`).

---

## Usage

Once the game is loaded, you can navigate the world and interact with puzzles using standard game controls.

- **Movement:** Use the **W, A, S, D** keys to move forward, left, backward, and right.
- **Camera Control:** Move the **mouse** to look around the environment.
- **Interaction:** Press the **E** key or use the **Left Mouse Button** to interact with objects like keys, buttons, and puzzle elements.

[cite_start]The objective is to solve the puzzles in each stage to unlock the path forward and uncover the mystery of the AI[cite: 137].

---

## Contributing

This is a university group project, but we welcome feedback and ideas. If you have suggestions, feel free to open an issue.

**Project Team:**

- Shervaan Govender
- Abdullah Ali
- Kovendan Raman
- Jaishil Patel
- Umayr Gadat
- Muhammad Ahmed

---

## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

---

## Acknowledgements

- [cite_start]**University of the Witwatersrand, School of Computer Science & Applied Mathematics** for the project opportunity[cite: 97].
- [cite_start]Course Lecturers **Branden Ingram** and **Damion Harvey** for their guidance and instruction[cite: 104, 105].
- The **Three.js** team for creating and maintaining an incredible WebGL library.
- [cite_start]Any external assets (models, textures, sounds) used will be credited in a dedicated credits screen within the game, as per the project requirements[cite: 157].
