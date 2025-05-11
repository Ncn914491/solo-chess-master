export type PieceType = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';
export type PieceColor = 'white' | 'black';

export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
}

export type Square = ChessPiece | null;
export type Board = Square[][];

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  from: Position;
  to: Position;
  piece: ChessPiece;
  capturedPiece?: ChessPiece;
  isCheck?: boolean;
  isCheckmate?: boolean;
  isPromotion?: boolean;
  promotionPiece?: PieceType;
  isCastling?: boolean;
  isEnPassant?: boolean;
}

export interface CastlingRights {
  whiteKingSide: boolean;
  whiteQueenSide: boolean;
  blackKingSide: boolean;
  blackQueenSide: boolean;
}

export interface GameState {
  board: Board;
  currentPlayer: PieceColor;
  moveHistory: Move[];
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  whiteKingPosition: Position;
  blackKingPosition: Position;
  aiDifficulty: AIDifficulty;
  gameMode: GameMode;
  castlingRights: CastlingRights;
  enPassantTarget: Position | null;
  showSuggestions?: boolean;
  showThreats?: boolean;
}

export type AIDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type GameMode = 'ai' | 'twoPlayer';
