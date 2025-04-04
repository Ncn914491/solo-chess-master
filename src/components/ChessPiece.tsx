
import React from "react";
import { ChessPiece as ChessPieceType } from "../types/chess";

interface ChessPieceProps {
  piece: ChessPieceType;
  isDragging?: boolean;
}

const ChessPiece: React.FC<ChessPieceProps> = ({ piece, isDragging }) => {
  const pieceSymbols: Record<string, string> = {
    "white-king": "♔",
    "white-queen": "♕",
    "white-rook": "♖",
    "white-bishop": "♗",
    "white-knight": "♘",
    "white-pawn": "♙",
    "black-king": "♚",
    "black-queen": "♛",
    "black-rook": "♜",
    "black-bishop": "♝",
    "black-knight": "♞",
    "black-pawn": "♟",
  };

  const pieceKey = `${piece.color}-${piece.type}`;
  const pieceSymbol = pieceSymbols[pieceKey] || "";

  return (
    <div
      className={`w-full h-full flex items-center justify-center text-4xl sm:text-5xl cursor-grab 
      ${isDragging ? "opacity-50" : "opacity-100"}`}
    >
      {pieceSymbol}
    </div>
  );
};

export default ChessPiece;
