
import { GameState, Move, Position, AIDifficulty } from "../types/chess";
import { getLegalMoves, makeMove } from "./chessEngine";
import { isValidPosition } from "./boardUtils";

interface AIStrategy {
  getMove(gameState: GameState): Move | null;
}

class BeginnerAI implements AIStrategy {
  getMove(gameState: GameState): Move | null {
    const { board, currentPlayer } = gameState;
    const aiColor = currentPlayer;
    let possibleMoves: { from: Position; to: Position }[] = [];
    let captureMoves: { from: Position; to: Position }[] = [];
    
    // Collect all possible moves for the AI
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        
        if (piece && piece.color === aiColor) {
          const fromPosition = { row, col };
          const legalMoves = getLegalMoves(gameState, fromPosition);
          
          for (const toPosition of legalMoves) {
            // Verify position is valid before adding
            if (!isValidPosition(toPosition)) {
              continue;
            }
            
            const move = { from: fromPosition, to: toPosition };
            
            // Check if it's a capture move
            if (board[toPosition.row][toPosition.col]) {
              captureMoves.push(move);
            } else {
              possibleMoves.push(move);
            }
          }
        }
      }
    }
    
    // Prefer capture moves 70% of the time
    const allMoves = [...possibleMoves, ...captureMoves, ...captureMoves, ...captureMoves];
    
    if (allMoves.length === 0) {
      return null;
    }
    
    const randomMove = allMoves[Math.floor(Math.random() * allMoves.length)];
    const { from, to } = randomMove;
    
    return {
      from,
      to,
      piece: board[from.row][from.col]!,
      capturedPiece: board[to.row][to.col] || undefined
    };
  }
}

class IntermediateAI implements AIStrategy {
  getMove(gameState: GameState): Move | null {
    // For now, this is just a placeholder that uses the beginner AI
    // In the future, this would have more sophisticated logic
    const beginnerAI = new BeginnerAI();
    return beginnerAI.getMove(gameState);
  }
}

class AdvancedAI implements AIStrategy {
  getMove(gameState: GameState): Move | null {
    // For now, this is just a placeholder that uses the beginner AI
    // In the future, this would have more sophisticated logic
    const beginnerAI = new BeginnerAI();
    return beginnerAI.getMove(gameState);
  }
}

class ExpertAI implements AIStrategy {
  getMove(gameState: GameState): Move | null {
    // For now, this is just a placeholder that uses the beginner AI
    // In the future, this would have more sophisticated logic
    const beginnerAI = new BeginnerAI();
    return beginnerAI.getMove(gameState);
  }
}

// AI Factory to create the appropriate AI strategy based on difficulty
class AIFactory {
  static createAI(difficulty: AIDifficulty): AIStrategy {
    switch (difficulty) {
      case 'beginner':
        return new BeginnerAI();
      case 'intermediate':
        return new IntermediateAI();
      case 'advanced':
        return new AdvancedAI();
      case 'expert':
        return new ExpertAI();
      default:
        return new BeginnerAI();
    }
  }
}

// Get a move from the AI based on the current game state and difficulty
export function getAIMove(gameState: GameState): Move | null {
  const { aiDifficulty } = gameState;
  const ai = AIFactory.createAI(aiDifficulty);
  return ai.getMove(gameState);
}
