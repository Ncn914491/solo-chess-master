# Solo Chess Master

A modern web-based chess application allowing you to play against a configurable AI opponent or challenge a friend in offline two-player mode. Built with React, TypeScript, Vite, and ShadCN UI.

![Gameplay Screenshot](public/screenshot.png)  <!-- Optional: Add a screenshot later -->

## Features

*   **Play Against AI**: Challenge an AI opponent with adjustable strength.
*   **Configurable AI Strength**:
    *   Select predefined difficulty levels (Beginner, Intermediate, Advanced, Expert).
    *   Set a specific target Elo rating (400-2400) for the AI.
*   **Two-Player Offline Mode**: Play against a friend on the same device.
*   **Standard Chess Rules**: Includes castling, en passant, pawn promotion.
*   **Game Controls**: Undo moves, restart the game, open settings.
*   **Visual Aids**:
    *   Highlights legal moves for the selected piece.
    *   Indicates check status.
    *   Highlights the last move made.
*   **Move History**: View a list of all moves made in the current game.
*   **Clean UI**: Built with ShadCN UI and Tailwind CSS for a modern look and feel.

## Tech Stack

*   **Framework**: React
*   **Language**: TypeScript
*   **Build Tool**: Vite
*   **UI Components**: ShadCN UI
*   **Styling**: Tailwind CSS
*   **Chess Logic**: Custom chess engine and AI implementation

## Getting Started

### Prerequisites

*   Node.js (v18 or later recommended)
*   npm (comes with Node.js)

### Installation & Running Locally

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Ncn914491/solo-chess-master.git
    cd solo-chess-master
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

4.  Open your browser and navigate to `http://localhost:8080` (or the port specified in the console).

## How to Play

1.  **Select Game Mode**: Click the "Settings" button. Choose between "AI Opponent" and "Two Player".
2.  **Configure AI (if AI Opponent selected)**: Use the "Target AI Elo" input to set the desired strength (400-2400). The internal difficulty level will adjust automatically.
3.  **Start Playing**:
    *   Click on one of your pieces to see its legal moves highlighted.
    *   Click on a highlighted square to make the move.
    *   In "AI Opponent" mode, the AI will automatically make its move after yours.
    *   In "Two Player" mode, players take turns making moves.
4.  **Use Controls**: Use the buttons below the board to "Undo" the last move(s), "Restart" the game, or access "Settings".

## AI Implementation Details

The chess AI uses several standard techniques:

*   **Minimax Algorithm**: A core search algorithm to explore possible game states.
*   **Alpha-Beta Pruning**: Optimizes the minimax search by cutting off branches that won't affect the final decision.
*   **Quiescence Search**: Extends the search depth for "noisy" positions (captures, checks) to avoid the horizon effect and improve tactical accuracy.
*   **Transposition Tables**: Stores previously evaluated positions (using Zobrist hashing) to avoid redundant calculations and speed up the search.
*   **Move Ordering**: Prioritizes searching more promising moves (captures, TT best moves) first to enhance pruning efficiency.
*   **Evaluation Function**: Evaluates board positions based on material balance, piece positional values, mobility, and king safety.
*   **Difficulty Levels**:
    *   **Beginner**: Random moves with a preference for captures.
    *   **Intermediate**: Uses the basic evaluation function without deep search.
    *   **Advanced**: Minimax search with a depth of 2.
    *   **Expert**: Minimax search with a depth of 3 and iterative deepening.
