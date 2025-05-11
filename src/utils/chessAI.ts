import { GameState, Move, Position, AIDifficulty, PieceType } from "../types/chess";
import { getLegalMoves, makeMove, isKingInCheck } from "./chessEngine";
import { isValidPosition } from "./boardUtils";
import { computeZobristHash } from "./zobrist";

interface AIStrategy {
  getMove(gameState: GameState): Move | null;
}

// Simplified piece values
const PIECE_VALUES: Record<PieceType, number> = {
  pawn: 10,
  knight: 30,
  bishop: 30,
  rook: 50,
  queen: 90,
  king: 900
};

// Simplified positional values
const POSITION_VALUES: Record<PieceType, number[][]> = {
  pawn: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [5, 5, 5, 5, 5, 5, 5, 5],
    [1, 1, 2, 3, 3, 2, 1, 1],
    [0.5, 0.5, 1, 2.5, 2.5, 1, 0.5, 0.5],
    [0, 0, 0, 2, 2, 0, 0, 0],
    [0.5, -0.5, -1, 0, 0, -1, -0.5, 0.5],
    [0.5, 1, 1, -2, -2, 1, 1, 0.5],
    [0, 0, 0, 0, 0, 0, 0, 0]
  ],
  knight: [
    [-5, -4, -3, -3, -3, -3, -4, -5],
    [-4, -2, 0, 0, 0, 0, -2, -4],
    [-3, 0, 1, 1.5, 1.5, 1, 0, -3],
    [-3, 0.5, 1.5, 2, 2, 1.5, 0.5, -3],
    [-3, 0, 1.5, 2, 2, 1.5, 0, -3],
    [-3, 0.5, 1, 1.5, 1.5, 1, 0.5, -3],
    [-4, -2, 0, 0.5, 0.5, 0, -2, -4],
    [-5, -4, -3, -3, -3, -3, -4, -5]
  ],
  bishop: [
    [-2, -1, -1, -1, -1, -1, -1, -2],
    [-1, 0, 0, 0, 0, 0, 0, -1],
    [-1, 0, 0.5, 1, 1, 0.5, 0, -1],
    [-1, 0.5, 0.5, 1, 1, 0.5, 0.5, -1],
    [-1, 0, 1, 1, 1, 1, 0, -1],
    [-1, 1, 1, 1, 1, 1, 1, -1],
    [-1, 0.5, 0, 0, 0, 0, 0.5, -1],
    [-2, -1, -1, -1, -1, -1, -1, -2]
  ],
  rook: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0.5, 1, 1, 1, 1, 1, 1, 0.5],
    [-0.5, 0, 0, 0, 0, 0, 0, -0.5],
    [-0.5, 0, 0, 0, 0, 0, 0, -0.5],
    [-0.5, 0, 0, 0, 0, 0, 0, -0.5],
    [-0.5, 0, 0, 0, 0, 0, 0, -0.5],
    [-0.5, 0, 0, 0, 0, 0, 0, -0.5],
    [0, 0, 0, 0.5, 0.5, 0, 0, 0]
  ],
  queen: [
    [-2, -1, -1, -0.5, -0.5, -1, -1, -2],
    [-1, 0, 0, 0, 0, 0, 0, -1],
    [-1, 0, 0.5, 0.5, 0.5, 0.5, 0, -1],
    [-0.5, 0, 0.5, 0.5, 0.5, 0.5, 0, -0.5],
    [0, 0, 0.5, 0.5, 0.5, 0.5, 0, -0.5],
    [-1, 0.5, 0.5, 0.5, 0.5, 0.5, 0, -1],
    [-1, 0, 0.5, 0, 0, 0, 0, -1],
    [-2, -1, -1, -0.5, -0.5, -1, -1, -2]
  ],
  king: [
    [-3, -4, -4, -5, -5, -4, -4, -3],
    [-3, -4, -4, -5, -5, -4, -4, -3],
    [-3, -4, -4, -5, -5, -4, -4, -3],
    [-3, -4, -4, -5, -5, -4, -4, -3],
    [-2, -3, -3, -4, -4, -3, -3, -2],
    [-1, -2, -2, -2, -2, -2, -2, -1],
    [2, 2, 0, 0, 0, 0, 2, 2],
    [2, 3, 1, 0, 0, 1, 3, 2]
  ]
};

// Optimized evaluation function
function evaluatePosition(gameState: GameState): number {
  const { board, currentPlayer } = gameState;
  let score = 0;

  // Material and positional evaluation
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        const value = PIECE_VALUES[piece.type];
        const positionValue = POSITION_VALUES[piece.type][row][col];
        const multiplier = piece.color === currentPlayer ? 1 : -1;
        score += (value + positionValue) * multiplier;
      }
    }
  }

  // Mobility bonus
  const mobility = calculateMobility(gameState);
  score += mobility * 0.1;

  // King safety
  const kingSafety = evaluateKingSafety(gameState);
  score += kingSafety * 0.2;

  return score;
}

// Simplified mobility calculation
function calculateMobility(gameState: GameState): number {
  const { board, currentPlayer } = gameState;
  let mobility = 0;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === currentPlayer) {
        const moves = getLegalMoves(gameState, { row, col });
        mobility += moves.length;
      }
    }
  }

  return mobility;
}

// Simplified king safety evaluation
function evaluateKingSafety(gameState: GameState): number {
  const { board, currentPlayer, whiteKingPosition, blackKingPosition } = gameState;
  const kingPosition = currentPlayer === 'white' ? whiteKingPosition : blackKingPosition;
  let safety = 0;

  // Check for pawn shield
  const direction = currentPlayer === 'white' ? -1 : 1;
  for (let col = kingPosition.col - 1; col <= kingPosition.col + 1; col++) {
    if (col >= 0 && col < 8) {
      const pawn = board[kingPosition.row + direction][col];
      if (pawn && pawn.type === 'pawn' && pawn.color === currentPlayer) {
        safety += 1;
      }
    }
  }

  return safety;
}

// Quiescence search to handle tactical positions beyond main search depth
function quiescenceSearch(
  gameState: GameState,
  alpha: number,
  beta: number,
  maximizingPlayer: boolean
): number {
  const standPatScore = evaluatePosition(gameState);

  if (maximizingPlayer) {
    if (standPatScore >= beta) {
      return beta; // Fail-hard beta cutoff
    }
    alpha = Math.max(alpha, standPatScore);
  } else {
    if (standPatScore <= alpha) {
      return alpha; // Fail-hard alpha cutoff
    }
    beta = Math.min(beta, standPatScore);
  }

  const captureMoves = getAllLegalMoves(gameState).filter(move => move.capturedPiece);
  if (captureMoves.length === 0 && !gameState.isCheck) {
    return standPatScore; // Only evaluate captures or checks in quiescence
  }

  if (maximizingPlayer) {
    let score = standPatScore;
    for (const move of captureMoves) {
      const newGameState = makeMove(gameState, move);
      score = Math.max(score, quiescenceSearch(newGameState, alpha, beta, false));
      alpha = Math.max(alpha, score);
      if (alpha >= beta) {
        break; // Beta cutoff
      }
    }
    return score;
  } else {
    let score = standPatScore;
    for (const move of captureMoves) {
      const newGameState = makeMove(gameState, move);
      score = Math.min(score, quiescenceSearch(newGameState, alpha, beta, true));
      beta = Math.min(beta, score);
      if (alpha >= beta) {
        break; // Alpha cutoff
      }
    }
    return score;
  }
}

// --- Constants for Transposition Table ---
const TT_EXACT = 0;
const TT_LOWER_BOUND = 1; // Alpha cutoff
const TT_UPPER_BOUND = 2; // Beta cutoff

interface TTEntry {
  depth: number;
  score: number;
  boundType: typeof TT_EXACT | typeof TT_LOWER_BOUND | typeof TT_UPPER_BOUND;
  bestMove?: Move; // Store best move for move ordering
}

// Simple Map-based Transposition Table
const transpositionTable = new Map<bigint, TTEntry>();
let ttHits = 0; // For debugging/stats
let ttMisses = 0;

// Optimized minimax with alpha-beta pruning, quiescence search, and Transposition Table
function minimax(
  gameState: GameState,
  depth: number,
  alpha: number,
  beta: number,
  maximizingPlayer: boolean,
  currentHash: bigint // Pass current hash
): { score: number; bestMove?: Move } {
  const originalAlpha = alpha;
  let bestMoveForNode: Move | undefined = undefined;

  // --- Transposition Table Lookup ---
  const ttEntry = transpositionTable.get(currentHash);
  if (ttEntry && ttEntry.depth >= depth) {
    ttHits++;
    if (ttEntry.boundType === TT_EXACT) {
      return { score: ttEntry.score, bestMove: ttEntry.bestMove };
    }
    if (ttEntry.boundType === TT_LOWER_BOUND) {
      alpha = Math.max(alpha, ttEntry.score);
    }
    if (ttEntry.boundType === TT_UPPER_BOUND) {
      beta = Math.min(beta, ttEntry.score);
    }
    if (alpha >= beta) {
      return { score: ttEntry.score, bestMove: ttEntry.bestMove }; // Cutoff based on TT entry
    }
    bestMoveForNode = ttEntry.bestMove; // Use stored move for ordering
  } else {
    ttMisses++;
  }

  // --- Base Cases (Checkmate, Stalemate, Quiescence) ---
  if (gameState.isCheckmate) {
    return { score: maximizingPlayer ? -Infinity : Infinity };
  }
  if (gameState.isStalemate) {
    return { score: 0 };
  }
  if (depth === 0) {
    // Note: Quiescence search currently doesn't use TT or return best move info
    const quiescenceScore = quiescenceSearch(gameState, alpha, beta, maximizingPlayer);
    return { score: quiescenceScore };
  }

  // --- Recursive Search ---
  const moves = getAllLegalMoves(gameState); // Sorted by capture value
  // Prioritize TT best move if available
  if (bestMoveForNode) {
      moves.sort((a, b) => {
          if (a.from.row === bestMoveForNode!.from.row && a.from.col === bestMoveForNode!.from.col &&
              a.to.row === bestMoveForNode!.to.row && a.to.col === bestMoveForNode!.to.col) return -1;
          if (b.from.row === bestMoveForNode!.from.row && b.from.col === bestMoveForNode!.from.col &&
              b.to.row === bestMoveForNode!.to.row && b.to.col === bestMoveForNode!.to.col) return 1;
          // Keep original capture sort otherwise
          const scoreA = a.capturedPiece ? PIECE_VALUES[a.capturedPiece.type] : 0;
          const scoreB = b.capturedPiece ? PIECE_VALUES[b.capturedPiece.type] : 0;
          return scoreB - scoreA;
      });
  }

  if (moves.length === 0) {
    return { score: evaluatePosition(gameState) }; // Should be stalemate/checkmate, but fallback
  }

  let bestScore = maximizingPlayer ? -Infinity : Infinity;

  if (maximizingPlayer) {
    for (const move of moves) {
      // TODO: Implement incremental Zobrist hash updates in makeMove/undoMove for performance
      // For now, recompute hash (slower)
      const nextGameState = makeMove(gameState, move);
      const nextHash = computeZobristHash(nextGameState);

      const result = minimax(nextGameState, depth - 1, alpha, beta, false, nextHash);
      if (result.score > bestScore) {
        bestScore = result.score;
        bestMoveForNode = move;
      }
      alpha = Math.max(alpha, bestScore);
      if (beta <= alpha) break; // Beta cutoff
    }
  } else { // Minimizing player
    for (const move of moves) {
      const nextGameState = makeMove(gameState, move);
      const nextHash = computeZobristHash(nextGameState);

      const result = minimax(nextGameState, depth - 1, alpha, beta, true, nextHash);
      if (result.score < bestScore) {
        bestScore = result.score;
        bestMoveForNode = move;
      }
      beta = Math.min(beta, bestScore);
      if (beta <= alpha) break; // Alpha cutoff
    }
  }

  // --- Transposition Table Store ---
  let boundType: typeof TT_EXACT | typeof TT_LOWER_BOUND | typeof TT_UPPER_BOUND;
  if (bestScore <= originalAlpha) {
    boundType = TT_UPPER_BOUND; // Failed low (Beta cutoff occurred)
  } else if (bestScore >= beta) {
    boundType = TT_LOWER_BOUND; // Failed high (Alpha cutoff occurred)
  } else {
    boundType = TT_EXACT;
  }

  // Only store if the new entry is better (deeper search) or replaces an old entry
  const existingEntry = transpositionTable.get(currentHash);
  if (!existingEntry || depth >= existingEntry.depth) {
      transpositionTable.set(currentHash, { depth, score: bestScore, boundType, bestMove: bestMoveForNode });
  }

  return { score: bestScore, bestMove: bestMoveForNode };
}

// Get all legal moves for the current player, sorted heuristically
function getAllLegalMoves(gameState: GameState): Move[] {
  const { board, currentPlayer } = gameState;
  const moves: Move[] = [];

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === currentPlayer) {
        const legalMoves = getLegalMoves(gameState, { row, col });
        for (const to of legalMoves) {
          const capturedPiece = board[to.row][to.col] || undefined;
          moves.push({
            from: { row, col },
            to,
            piece,
            capturedPiece
          });
        }
      }
    }
  }

  // Sort moves: captures first (higher value captures first), then others
  moves.sort((a, b) => {
    const scoreA = a.capturedPiece ? PIECE_VALUES[a.capturedPiece.type] : 0;
    const scoreB = b.capturedPiece ? PIECE_VALUES[b.capturedPiece.type] : 0;
    return scoreB - scoreA; // Higher score first
  });

  return moves;
}

// Helper to set search depth based on difficulty
function getSearchDepth(difficulty: AIDifficulty): number {
  switch (difficulty) {
    case 'beginner': return 1;
    case 'intermediate': return 2;
    case 'advanced': return 3;
    case 'expert': return 4;
    default: return 1;
  }
}

class BeginnerAI implements AIStrategy {
  getMove(gameState: GameState): Move | null {
    try {
      const moves = getAllLegalMoves(gameState);
      if (moves.length === 0) return null;

      // Beginner AI makes random moves but prefers captures
      const captureMoves = moves.filter(move => move.capturedPiece);
      if (captureMoves.length > 0) {
        return captureMoves[Math.floor(Math.random() * captureMoves.length)];
      }

      return moves[Math.floor(Math.random() * moves.length)];
    } catch (error) {
      console.error("Error in BeginnerAI.getMove:", error);
      return null;
    }
  }
}

class IntermediateAI implements AIStrategy {
  getMove(gameState: GameState): Move | null {
    try {
      const moves = getAllLegalMoves(gameState);
      if (moves.length === 0) return null;

      // Intermediate AI uses basic evaluation
      let bestMove = moves[0];
      let bestScore = -Infinity;

      for (const move of moves) {
        const newGameState = makeMove(gameState, move);
        const score = evaluatePosition(newGameState);
        
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }

      return bestMove;
    } catch (error) {
      console.error("Error in IntermediateAI.getMove:", error);
      return null;
    }
  }
}

class AdvancedAI implements AIStrategy {
  getMove(gameState: GameState): Move | null {
    try {
      const depth = getSearchDepth(gameState.aiDifficulty); // use dynamic depth
      const startHash = computeZobristHash(gameState);
      ttHits = 0; ttMisses = 0; transpositionTable.clear(); // Clear TT for new move
      const startTime = performance.now();

      const result = minimax(gameState, depth, -Infinity, Infinity, true, startHash);

      const endTime = performance.now();
      console.log(`Advanced AI: Depth ${depth}, Score: ${result.score}, Time: ${endTime - startTime}ms, TT Hits: ${ttHits}, TT Misses: ${ttMisses}`);

      return result.bestMove || getAllLegalMoves(gameState)[0] || null; // Fallback
    } catch (error) {
      console.error("Error in AdvancedAI.getMove:", error);
      return null;
    }
  }
}

class ExpertAI implements AIStrategy {
  getMove(gameState: GameState): Move | null {
    try {
      const maxDepth = getSearchDepth(gameState.aiDifficulty);
      const startHash = computeZobristHash(gameState);
      ttHits = 0; ttMisses = 0; transpositionTable.clear(); // Clear TT for new move
      const startTime = performance.now();
      const timeLimit = 1000; // 1 second time limit for move search

      let bestMoveOverall: Move | undefined = undefined;
      let depthSearched = 1;
      let result;

      while (depthSearched <= maxDepth) {
        result = minimax(gameState, depthSearched, -Infinity, Infinity, true, startHash);
        if (result.bestMove) bestMoveOverall = result.bestMove;
        console.log(`Expert AI: Depth ${depthSearched}, Score: ${result.score}, Best Move: ${result.bestMove ? `${result.bestMove.from.row}${result.bestMove.from.col}->${result.bestMove.to.row}${result.bestMove.to.col}` : 'None'}, Time: ${performance.now() - startTime}ms`);
        if (performance.now() - startTime > timeLimit) break;
        depthSearched++;
      }

      const endTime = performance.now();
      console.log(`Expert AI: Total Time: ${endTime - startTime}ms, TT Hits: ${ttHits}, TT Misses: ${ttMisses}`);

      return bestMoveOverall || getAllLegalMoves(gameState)[0] || null; // Fallback
    } catch (error) {
      console.error("Error in ExpertAI.getMove:", error);
      return null;
    }
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
  try {
    const { aiDifficulty } = gameState;
    const ai = AIFactory.createAI(aiDifficulty);
    return ai.getMove(gameState);
  } catch (error) {
    console.error("Error in getAIMove:", error);
    return null;
  }
}
