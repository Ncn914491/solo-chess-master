
import { Board, ChessPiece, GameState, Move, PieceColor, Position, PieceType, Square } from "../types/chess";

// Create a new game with the initial board setup
export function createNewGame(aiDifficulty: 'beginner' = 'beginner'): GameState {
  const board = createInitialBoard();
  
  return {
    board,
    currentPlayer: 'white',
    moveHistory: [],
    isCheck: false,
    isCheckmate: false,
    isStalemate: false,
    whiteKingPosition: { row: 7, col: 4 }, // E1
    blackKingPosition: { row: 0, col: 4 }, // E8
    aiDifficulty
  };
}

// Create the initial chess board setup
function createInitialBoard(): Board {
  const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Set up pawns
  for (let col = 0; col < 8; col++) {
    board[1][col] = { type: 'pawn', color: 'black' };
    board[6][col] = { type: 'pawn', color: 'white' };
  }
  
  // Set up other pieces
  const setupOrder: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
  
  for (let col = 0; col < 8; col++) {
    board[0][col] = { type: setupOrder[col], color: 'black' };
    board[7][col] = { type: setupOrder[col], color: 'white' };
  }
  
  return board;
}

// Get all legal moves for a piece at the given position
export function getLegalMoves(gameState: GameState, position: Position): Position[] {
  const { board, currentPlayer } = gameState;
  const piece = board[position.row][position.col];
  
  if (!piece || piece.color !== currentPlayer) {
    return [];
  }
  
  const potentialMoves = getPotentialMoves(gameState, position);
  
  // Filter out moves that would leave the king in check
  return potentialMoves.filter(move => {
    const simulatedGameState = simulateMove(gameState, { from: position, to: move, piece });
    return !isKingInCheck(simulatedGameState, currentPlayer);
  });
}

// Get potential moves without checking if they leave the king in check
function getPotentialMoves(gameState: GameState, position: Position): Position[] {
  const { board } = gameState;
  const piece = board[position.row][position.col];
  
  if (!piece) return [];
  
  switch (piece.type) {
    case 'pawn':
      return getPawnMoves(gameState, position);
    case 'knight':
      return getKnightMoves(gameState, position);
    case 'bishop':
      return getBishopMoves(gameState, position);
    case 'rook':
      return getRookMoves(gameState, position);
    case 'queen':
      return getQueenMoves(gameState, position);
    case 'king':
      return getKingMoves(gameState, position);
    default:
      return [];
  }
}

// Get all potential pawn moves
function getPawnMoves(gameState: GameState, position: Position): Position[] {
  const { board } = gameState;
  const piece = board[position.row][position.col]!;
  const direction = piece.color === 'white' ? -1 : 1;
  const startingRow = piece.color === 'white' ? 6 : 1;
  const moves: Position[] = [];
  
  // Forward move
  if (
    position.row + direction >= 0 &&
    position.row + direction < 8 &&
    !board[position.row + direction][position.col]
  ) {
    moves.push({ row: position.row + direction, col: position.col });
    
    // Double forward move from starting position
    if (
      position.row === startingRow &&
      !board[position.row + 2 * direction][position.col]
    ) {
      moves.push({ row: position.row + 2 * direction, col: position.col });
    }
  }
  
  // Captures
  const captureDirections = [
    { row: direction, col: -1 },
    { row: direction, col: 1 }
  ];
  
  for (const dir of captureDirections) {
    const newRow = position.row + dir.row;
    const newCol = position.col + dir.col;
    
    if (
      newRow >= 0 && newRow < 8 &&
      newCol >= 0 && newCol < 8 &&
      board[newRow][newCol] &&
      board[newRow][newCol]!.color !== piece.color
    ) {
      moves.push({ row: newRow, col: newCol });
    }
  }
  
  // TODO: En passant and promotion logic
  
  return moves;
}

// Get all potential knight moves
function getKnightMoves(gameState: GameState, position: Position): Position[] {
  const { board } = gameState;
  const piece = board[position.row][position.col]!;
  const moves: Position[] = [];
  
  const knightDirections = [
    { row: -2, col: -1 },
    { row: -2, col: 1 },
    { row: -1, col: -2 },
    { row: -1, col: 2 },
    { row: 1, col: -2 },
    { row: 1, col: 2 },
    { row: 2, col: -1 },
    { row: 2, col: 1 }
  ];
  
  for (const dir of knightDirections) {
    const newRow = position.row + dir.row;
    const newCol = position.col + dir.col;
    
    if (
      newRow >= 0 && newRow < 8 &&
      newCol >= 0 && newCol < 8 &&
      (!board[newRow][newCol] || board[newRow][newCol]!.color !== piece.color)
    ) {
      moves.push({ row: newRow, col: newCol });
    }
  }
  
  return moves;
}

// Get all potential bishop moves
function getBishopMoves(gameState: GameState, position: Position): Position[] {
  const directions = [
    { row: -1, col: -1 }, // top-left
    { row: -1, col: 1 },  // top-right
    { row: 1, col: -1 },  // bottom-left
    { row: 1, col: 1 }    // bottom-right
  ];
  
  return getSlidingMoves(gameState, position, directions);
}

// Get all potential rook moves
function getRookMoves(gameState: GameState, position: Position): Position[] {
  const directions = [
    { row: -1, col: 0 }, // up
    { row: 0, col: 1 },  // right
    { row: 1, col: 0 },  // down
    { row: 0, col: -1 }  // left
  ];
  
  return getSlidingMoves(gameState, position, directions);
}

// Get all potential queen moves
function getQueenMoves(gameState: GameState, position: Position): Position[] {
  // Queen moves are a combination of bishop and rook moves
  return [
    ...getBishopMoves(gameState, position),
    ...getRookMoves(gameState, position)
  ];
}

// Get all potential king moves
function getKingMoves(gameState: GameState, position: Position): Position[] {
  const { board } = gameState;
  const piece = board[position.row][position.col]!;
  const moves: Position[] = [];
  
  const kingDirections = [
    { row: -1, col: -1 },
    { row: -1, col: 0 },
    { row: -1, col: 1 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
    { row: 1, col: -1 },
    { row: 1, col: 0 },
    { row: 1, col: 1 }
  ];
  
  for (const dir of kingDirections) {
    const newRow = position.row + dir.row;
    const newCol = position.col + dir.col;
    
    if (
      newRow >= 0 && newRow < 8 &&
      newCol >= 0 && newCol < 8 &&
      (!board[newRow][newCol] || board[newRow][newCol]!.color !== piece.color)
    ) {
      moves.push({ row: newRow, col: newCol });
    }
  }
  
  // TODO: Castling logic
  
  return moves;
}

// Helper function for sliding pieces (bishop, rook, queen)
function getSlidingMoves(
  gameState: GameState, 
  position: Position,
  directions: { row: number; col: number }[]
): Position[] {
  const { board } = gameState;
  const piece = board[position.row][position.col]!;
  const moves: Position[] = [];
  
  for (const dir of directions) {
    let newRow = position.row + dir.row;
    let newCol = position.col + dir.col;
    
    while (
      newRow >= 0 && newRow < 8 &&
      newCol >= 0 && newCol < 8
    ) {
      if (!board[newRow][newCol]) {
        // Empty square
        moves.push({ row: newRow, col: newCol });
      } else {
        // Square has a piece
        if (board[newRow][newCol]!.color !== piece.color) {
          // Can capture opponent's piece
          moves.push({ row: newRow, col: newCol });
        }
        break; // Cannot move past a piece
      }
      
      newRow += dir.row;
      newCol += dir.col;
    }
  }
  
  return moves;
}

// Check if a king is in check
export function isKingInCheck(gameState: GameState, color: PieceColor): boolean {
  const { board, whiteKingPosition, blackKingPosition } = gameState;
  const kingPosition = color === 'white' ? whiteKingPosition : blackKingPosition;
  
  // Check if any opponent's piece can capture the king
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      
      if (piece && piece.color !== color) {
        const moves = getPotentialMoves(
          { ...gameState, currentPlayer: piece.color }, 
          { row, col }
        );
        
        for (const move of moves) {
          if (move.row === kingPosition.row && move.col === kingPosition.col) {
            return true;
          }
        }
      }
    }
  }
  
  return false;
}

// Simulate a move to check if it's legal (doesn't leave the king in check)
function simulateMove(gameState: GameState, move: Partial<Move>): GameState {
  const { board, whiteKingPosition, blackKingPosition } = gameState;
  const piece = move.piece!;
  
  // Create a deep copy of the board
  const newBoard = board.map(row => [...row]);
  
  // Update the board with the move
  newBoard[move.from!.row][move.from!.col] = null;
  newBoard[move.to!.row][move.to!.col] = piece;
  
  // Update king position if the king moved
  let newWhiteKingPosition = { ...whiteKingPosition };
  let newBlackKingPosition = { ...blackKingPosition };
  
  if (piece.type === 'king') {
    if (piece.color === 'white') {
      newWhiteKingPosition = { ...move.to! };
    } else {
      newBlackKingPosition = { ...move.to! };
    }
  }
  
  return {
    ...gameState,
    board: newBoard,
    whiteKingPosition: newWhiteKingPosition,
    blackKingPosition: newBlackKingPosition
  };
}

// Make a move and return the updated game state
export function makeMove(gameState: GameState, move: Move): GameState {
  const { board, currentPlayer, moveHistory } = gameState;
  const { from, to, piece } = move;
  
  // Create a deep copy of the board
  const newBoard = board.map(row => [...row]);
  
  // Update the board with the move
  newBoard[from.row][from.col] = null;
  newBoard[to.row][to.col] = piece;
  
  // Handle special moves
  // TODO: Implement castling, en passant, and promotion
  
  // Update king position if the king moved
  let newWhiteKingPosition = { ...gameState.whiteKingPosition };
  let newBlackKingPosition = { ...gameState.blackKingPosition };
  
  if (piece.type === 'king') {
    if (piece.color === 'white') {
      newWhiteKingPosition = { ...to };
    } else {
      newBlackKingPosition = { ...to };
    }
  }
  
  const nextPlayer = currentPlayer === 'white' ? 'black' : 'white';
  
  // Check for check, checkmate, or stalemate
  const newGameState: GameState = {
    ...gameState,
    board: newBoard,
    currentPlayer: nextPlayer,
    moveHistory: [...moveHistory, move],
    whiteKingPosition: newWhiteKingPosition,
    blackKingPosition: newBlackKingPosition
  };
  
  const inCheck = isKingInCheck(newGameState, nextPlayer);
  newGameState.isCheck = inCheck;
  
  // Check for checkmate or stalemate
  if (inCheck) {
    newGameState.isCheckmate = isCheckmate(newGameState);
  } else {
    newGameState.isStalemate = isStalemate(newGameState);
  }
  
  return newGameState;
}

// Check if the current player is in checkmate
function isCheckmate(gameState: GameState): boolean {
  return !hasLegalMoves(gameState);
}

// Check if the current player is in stalemate
function isStalemate(gameState: GameState): boolean {
  return !hasLegalMoves(gameState);
}

// Check if the current player has any legal moves
function hasLegalMoves(gameState: GameState): boolean {
  const { board, currentPlayer } = gameState;
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      
      if (piece && piece.color === currentPlayer) {
        const legalMoves = getLegalMoves(gameState, { row, col });
        
        if (legalMoves.length > 0) {
          return true;
        }
      }
    }
  }
  
  return false;
}

// Convert position to algebraic notation (e.g., "e4")
export function toAlgebraic(position: Position): string {
  const files = 'abcdefgh';
  const ranks = '87654321';
  
  return files[position.col] + ranks[position.row];
}

// Convert move to algebraic notation (e.g., "e2e4", "Nf3", etc.)
export function moveToAlgebraic(move: Move): string {
  const from = toAlgebraic(move.from);
  const to = toAlgebraic(move.to);
  
  return `${from}${to}`;
}

// Undo the last move
export function undoMove(gameState: GameState): GameState {
  const { moveHistory } = gameState;
  
  if (moveHistory.length === 0) {
    return gameState;
  }
  
  // TODO: Implement proper undo logic for special moves
  
  // Create a new game and replay all moves except the last one
  let newGameState = createNewGame(gameState.aiDifficulty);
  
  for (let i = 0; i < moveHistory.length - 1; i++) {
    newGameState = makeMove(newGameState, moveHistory[i]);
  }
  
  return newGameState;
}
