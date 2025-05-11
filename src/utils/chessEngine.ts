import { Board, ChessPiece, GameState, Move, PieceColor, Position, PieceType, Square, AIDifficulty, GameMode } from "../types/chess";
import { isValidPosition } from "../utils/boardUtils";
import { getAIMove } from "../utils/chessAI";

// Create a new game with the initial board setup
export function createNewGame(aiDifficulty: AIDifficulty = 'beginner', gameMode: GameMode = 'ai', showSuggestions = false, showThreats = false): GameState {
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
    aiDifficulty,
    gameMode,
    castlingRights: {
      whiteKingSide: true,
      whiteQueenSide: true,
      blackKingSide: true,
      blackQueenSide: true
    },
    enPassantTarget: null,
    showSuggestions,
    showThreats
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
  const { board, enPassantTarget } = gameState;
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
      newCol >= 0 && newCol < 8
    ) {
      // Regular capture
      if (board[newRow][newCol] && board[newRow][newCol]!.color !== piece.color) {
        moves.push({ row: newRow, col: newCol });
      }

      // En passant capture
      if (enPassantTarget &&
          newRow === enPassantTarget.row &&
          newCol === enPassantTarget.col) {
        moves.push({ row: newRow, col: newCol });
      }
    }
  }

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
  const { board, castlingRights } = gameState;
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

  // Castling
  if (piece.color === 'white') {
    // White king-side castling
    if (castlingRights.whiteKingSide &&
        !board[7][5] && !board[7][6] &&
        board[7][7]?.type === 'rook' && board[7][7]?.color === 'white') {
      // Check if king is not in check and doesn't pass through check
      if (!isSquareAttacked(gameState, { row: 7, col: 4 }, 'black') &&
          !isSquareAttacked(gameState, { row: 7, col: 5 }, 'black') &&
          !isSquareAttacked(gameState, { row: 7, col: 6 }, 'black')) {
        moves.push({ row: 7, col: 6 }); // g1
      }
    }

    // White queen-side castling
    if (castlingRights.whiteQueenSide &&
        !board[7][1] && !board[7][2] && !board[7][3] &&
        board[7][0]?.type === 'rook' && board[7][0]?.color === 'white') {
      // Check if king is not in check and doesn't pass through check
      if (!isSquareAttacked(gameState, { row: 7, col: 4 }, 'black') &&
          !isSquareAttacked(gameState, { row: 7, col: 3 }, 'black') &&
          !isSquareAttacked(gameState, { row: 7, col: 2 }, 'black')) {
        moves.push({ row: 7, col: 2 }); // c1
      }
    }
  } else {
    // Black king-side castling
    if (castlingRights.blackKingSide &&
        !board[0][5] && !board[0][6] &&
        board[0][7]?.type === 'rook' && board[0][7]?.color === 'black') {
      // Check if king is not in check and doesn't pass through check
      if (!isSquareAttacked(gameState, { row: 0, col: 4 }, 'white') &&
          !isSquareAttacked(gameState, { row: 0, col: 5 }, 'white') &&
          !isSquareAttacked(gameState, { row: 0, col: 6 }, 'white')) {
        moves.push({ row: 0, col: 6 }); // g8
      }
    }

    // Black queen-side castling
    if (castlingRights.blackQueenSide &&
        !board[0][1] && !board[0][2] && !board[0][3] &&
        board[0][0]?.type === 'rook' && board[0][0]?.color === 'black') {
      // Check if king is not in check and doesn't pass through check
      if (!isSquareAttacked(gameState, { row: 0, col: 4 }, 'white') &&
          !isSquareAttacked(gameState, { row: 0, col: 3 }, 'white') &&
          !isSquareAttacked(gameState, { row: 0, col: 2 }, 'white')) {
        moves.push({ row: 0, col: 2 }); // c8
      }
    }
  }

  return moves;
}

// Check if a square is attacked by a specific color
function isSquareAttacked(gameState: GameState, position: Position, attackingColor: PieceColor): boolean {
  const { board } = gameState;

  // Check for pawn attacks
  const pawnDirection = attackingColor === 'white' ? -1 : 1;
  const pawnAttacks = [
    { row: position.row + pawnDirection, col: position.col - 1 },
    { row: position.row + pawnDirection, col: position.col + 1 }
  ];

  for (const attack of pawnAttacks) {
    if (attack.row >= 0 && attack.row < 8 && attack.col >= 0 && attack.col < 8) {
      const piece = board[attack.row][attack.col];
      if (piece && piece.type === 'pawn' && piece.color === attackingColor) {
        return true;
      }
    }
  }

  // Check for knight attacks
  const knightMoves = [
    { row: -2, col: -1 },
    { row: -2, col: 1 },
    { row: -1, col: -2 },
    { row: -1, col: 2 },
    { row: 1, col: -2 },
    { row: 1, col: 2 },
    { row: 2, col: -1 },
    { row: 2, col: 1 }
  ];

  for (const move of knightMoves) {
    const newRow = position.row + move.row;
    const newCol = position.col + move.col;

    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
      const piece = board[newRow][newCol];
      if (piece && piece.type === 'knight' && piece.color === attackingColor) {
        return true;
      }
    }
  }

  // Check for sliding piece attacks (bishop, rook, queen)
  const directions = [
    { row: -1, col: -1 }, // bishop/queen
    { row: -1, col: 0 },  // rook/queen
    { row: -1, col: 1 },  // bishop/queen
    { row: 0, col: -1 },  // rook/queen
    { row: 0, col: 1 },   // rook/queen
    { row: 1, col: -1 },  // bishop/queen
    { row: 1, col: 0 },   // rook/queen
    { row: 1, col: 1 }    // bishop/queen
  ];

  for (const dir of directions) {
    let newRow = position.row + dir.row;
    let newCol = position.col + dir.col;

    while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
      const piece = board[newRow][newCol];

      if (piece) {
        if (piece.color === attackingColor) {
          const isDiagonal = dir.row !== 0 && dir.col !== 0;
          const isOrthogonal = dir.row === 0 || dir.col === 0;

          if ((isDiagonal && (piece.type === 'bishop' || piece.type === 'queen')) ||
              (isOrthogonal && (piece.type === 'rook' || piece.type === 'queen'))) {
            return true;
          }

          // King can attack adjacent squares
          if ((Math.abs(newRow - position.row) <= 1 &&
               Math.abs(newCol - position.col) <= 1) &&
              piece.type === 'king') {
            return true;
          }
        }
        break; // Can't see through pieces
      }

      newRow += dir.row;
      newCol += dir.col;
    }
  }

  return false;
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
  const { board, currentPlayer, moveHistory, castlingRights } = gameState;
  const { from, to, piece } = move;

  // Create a new game state
  let newGameState = {
    ...gameState,
    board: board.map(row => [...row]),
    moveHistory: [...moveHistory, move],
    enPassantTarget: null // Reset en passant target by default
  };

  // Update castling rights if king or rook moves
  if (piece.type === 'king') {
    if (piece.color === 'white') {
      newGameState.castlingRights = {
        ...newGameState.castlingRights,
        whiteKingSide: false,
        whiteQueenSide: false
      };
    } else {
      newGameState.castlingRights = {
        ...newGameState.castlingRights,
        blackKingSide: false,
        blackQueenSide: false
      };
    }
  } else if (piece.type === 'rook') {
    // Update castling rights for rook moves
    if (piece.color === 'white') {
      if (from.row === 7 && from.col === 0) { // a1
        newGameState.castlingRights = {
          ...newGameState.castlingRights,
          whiteQueenSide: false
        };
      } else if (from.row === 7 && from.col === 7) { // h1
        newGameState.castlingRights = {
          ...newGameState.castlingRights,
          whiteKingSide: false
        };
      }
    } else {
      if (from.row === 0 && from.col === 0) { // a8
        newGameState.castlingRights = {
          ...newGameState.castlingRights,
          blackQueenSide: false
        };
      } else if (from.row === 0 && from.col === 7) { // h8
        newGameState.castlingRights = {
          ...newGameState.castlingRights,
          blackKingSide: false
        };
      }
    }
  }

  // Handle pawn double move (set en passant target)
  if (piece.type === 'pawn') {
    const startRow = piece.color === 'white' ? 6 : 1;
    const moveDistance = Math.abs(from.row - to.row);

    if (from.row === startRow && moveDistance === 2) {
      // Set the en passant target to the square the pawn skipped over
      const enPassantRow = piece.color === 'white' ? from.row - 1 : from.row + 1;
      newGameState.enPassantTarget = { row: enPassantRow, col: from.col };
    }

    // Handle en passant capture
    const isEnPassant = to.col !== from.col && !board[to.row][to.col];
    if (isEnPassant) {
      // Remove the captured pawn
      const capturedPawnRow = from.row;
      const capturedPawnCol = to.col;
      newGameState.board[capturedPawnRow][capturedPawnCol] = null;
      move.isEnPassant = true;
      move.capturedPiece = board[capturedPawnRow][capturedPawnCol]!;
    }

    // Handle promotion
    const promotionRow = piece.color === 'white' ? 0 : 7;
    if (to.row === promotionRow) {
      // Default promotion to queen if not specified
      const promotionPiece = move.promotionPiece || 'queen';
      newGameState.board[to.row][to.col] = {
        type: promotionPiece,
        color: piece.color
      };
      move.isPromotion = true;
      move.promotionPiece = promotionPiece;
    } else {
      // Normal pawn move
      newGameState.board[to.row][to.col] = piece;
    }
  } else {
    // Handle castling for king
    if (piece.type === 'king') {
      const isCastling = Math.abs(from.col - to.col) > 1;
      if (isCastling) {
        move.isCastling = true;

        // Move the rook as well
        if (to.col === 2) { // Queen-side castling
          // Move the rook from a1/a8 to d1/d8
          const rookFromCol = 0;
          const rookToCol = 3;
          newGameState.board[to.row][rookToCol] = newGameState.board[to.row][rookFromCol];
          newGameState.board[to.row][rookFromCol] = null;
        } else if (to.col === 6) { // King-side castling
          // Move the rook from h1/h8 to f1/f8
          const rookFromCol = 7;
          const rookToCol = 5;
          newGameState.board[to.row][rookToCol] = newGameState.board[to.row][rookFromCol];
          newGameState.board[to.row][rookFromCol] = null;
        }
      }
    }

    // Standard piece movement
    newGameState.board[to.row][to.col] = piece;
  }

  // Clear the original position
  newGameState.board[from.row][from.col] = null;

  // Update king position if the king moved
  if (piece.type === 'king') {
    if (piece.color === 'white') {
      newGameState.whiteKingPosition = { ...to };
    } else {
      newGameState.blackKingPosition = { ...to };
    }
  }

  // Switch player
  newGameState.currentPlayer = currentPlayer === 'white' ? 'black' : 'white';

  // Check if the opponent is in check
  const inCheck = isKingInCheck(newGameState, newGameState.currentPlayer);
  newGameState.isCheck = inCheck;
  move.isCheck = inCheck;

  // Check for checkmate or stalemate
  if (inCheck) {
    newGameState.isCheckmate = isCheckmate(newGameState);
    move.isCheckmate = newGameState.isCheckmate;
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
  const { moveHistory, showSuggestions, showThreats } = gameState;

  if (moveHistory.length === 0) {
    return gameState;
  }

  // TODO: Implement proper undo logic for special moves

  // Create a new game and replay all moves except the last one
  let newGameState = createNewGame(gameState.aiDifficulty, gameState.gameMode, showSuggestions, showThreats);

  for (let i = 0; i < moveHistory.length - 1; i++) {
    newGameState = makeMove(newGameState, moveHistory[i]);
  }

  return newGameState;
}

// Get the best move suggestion for the current player
export function getBestMoveSuggestion(gameState: GameState): Move | null {
  // For simplicity, we'll use the AI's move selection logic
  // This will provide a move suggestion based on the current difficulty level
  // We're already importing getAIMove at the top of the file
  return getAIMove(gameState);
}

// Get all squares that are under attack by the opponent
export function getThreatenedSquares(gameState: GameState): Position[] {
  const { board, currentPlayer } = gameState;
  const opponentColor = currentPlayer === 'white' ? 'black' : 'white';
  const threatenedSquares: Position[] = [];

  // Check all opponent pieces
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];

      if (piece && piece.color === opponentColor) {
        // Get all squares this piece can attack
        // Create a temporary game state with the opponent as the current player
        const tempGameState = {
          ...gameState,
          currentPlayer: opponentColor
        };

        const attackMoves = getPotentialMoves(tempGameState, { row, col });

        // Add these squares to the threatened list
        for (const move of attackMoves) {
          // Only add squares that have the current player's pieces
          const targetPiece = board[move.row][move.col];
          if (targetPiece && targetPiece.color === currentPlayer) {
            // Check if this position is already in the list
            if (!threatenedSquares.some(pos => pos.row === move.row && pos.col === move.col)) {
              threatenedSquares.push(move);
            }
          }
        }
      }
    }
  }

  return threatenedSquares;
}
