
import { GameState, Move, Position } from "../types/chess";
import { getLegalMoves, makeMove } from "./chessEngine";

// Get a move from the AI based on the current game state and difficulty
export function getAIMove(gameState: GameState): Move | null {
  const { aiDifficulty } = gameState;
  
  switch (aiDifficulty) {
    case 'beginner':
      return getBeginnerMove(gameState);
    case 'intermediate':
      // TODO: Implement intermediate AI
      return getBeginnerMove(gameState);
    case 'advanced':
      // TODO: Implement advanced AI
      return getBeginnerMove(gameState);
    case 'expert':
      // TODO: Implement expert AI
      return getBeginnerMove(gameState);
    default:
      return getBeginnerMove(gameState);
  }
}

// Get a move from the beginner AI (random legal moves with basic capture priority)
function getBeginnerMove(gameState: GameState): Move | null {
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
