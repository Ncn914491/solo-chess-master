import { GameState, PieceColor, PieceType, Position, Square } from "../types/chess";

// Define the structure for Zobrist keys
interface ZobristKeys {
  pieceSquare: bigint[][][]; // [pieceType][color][squareIndex]
  sideToMove: bigint;         // Key for black to move
  castlingRights: bigint[]; // Keys for each possible castling right state (0-15)
  enPassantFile: bigint[];  // Keys for each possible en passant file (0-7, plus one for none)
}

const NUM_SQUARES = 64;
const NUM_PIECE_TYPES = 6; // pawn, knight, bishop, rook, queen, king
const NUM_COLORS = 2; // white, black
const NO_EN_PASSANT_INDEX = 8;

// Helper to map PieceType to index
const pieceTypeToIndex: Record<PieceType, number> = {
  pawn: 0,
  knight: 1,
  bishop: 2,
  rook: 3,
  queen: 4,
  king: 5
};

// Helper to map PieceColor to index
const colorToIndex: Record<PieceColor, number> = {
  white: 0,
  black: 1
};

let zobristKeys: ZobristKeys | null = null;

// Function to generate a random 64-bit BigInt
function randomBigInt(): bigint {
  // Simple pseudo-random generator for BigInt (can be improved for better randomness)
  const low = BigInt(Math.floor(Math.random() * (2 ** 32)));
  const high = BigInt(Math.floor(Math.random() * (2 ** 32)));
  return (high << 32n) | low;
}

// Initialize the Zobrist keys
function initializeZobristKeys() {
  if (zobristKeys) return;

  const keys: ZobristKeys = {
    pieceSquare: Array(NUM_PIECE_TYPES).fill(0).map(() =>
      Array(NUM_COLORS).fill(0).map(() =>
        Array(NUM_SQUARES).fill(0n).map(() => randomBigInt())
      )
    ),
    sideToMove: randomBigInt(),
    castlingRights: Array(16).fill(0n).map(() => randomBigInt()),
    enPassantFile: Array(NO_EN_PASSANT_INDEX + 1).fill(0n).map(() => randomBigInt())
  };

  zobristKeys = keys;
  console.log("Zobrist keys initialized.");
}

// Compute the Zobrist hash for a given game state
export function computeZobristHash(gameState: GameState): bigint {
  if (!zobristKeys) {
    initializeZobristKeys();
    if (!zobristKeys) throw new Error("Zobrist keys failed to initialize");
  }

  let hash = 0n;
  const { board, currentPlayer, castlingRights, enPassantTarget } = gameState;

  // Board pieces
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece) {
        const pieceIndex = pieceTypeToIndex[piece.type];
        const colorIndex = colorToIndex[piece.color];
        const squareIndex = r * 8 + c;
        hash ^= zobristKeys.pieceSquare[pieceIndex][colorIndex][squareIndex];
      }
    }
  }

  // Side to move
  if (currentPlayer === 'black') {
    hash ^= zobristKeys.sideToMove;
  }

  // Castling rights
  let castlingIndex = 0;
  if (castlingRights.whiteKingSide) castlingIndex |= 1;
  if (castlingRights.whiteQueenSide) castlingIndex |= 2;
  if (castlingRights.blackKingSide) castlingIndex |= 4;
  if (castlingRights.blackQueenSide) castlingIndex |= 8;
  hash ^= zobristKeys.castlingRights[castlingIndex];

  // En passant target
  const epIndex = enPassantTarget ? enPassantTarget.col : NO_EN_PASSANT_INDEX;
  hash ^= zobristKeys.enPassantFile[epIndex];

  return hash;
}

// --- Incremental Update Functions (To be added later if needed) ---
// These would be integrated into makeMove/undoMove for efficiency
// export function updateHashForMove(hash: bigint, gameState: GameState, move: Move): bigint { ... } 