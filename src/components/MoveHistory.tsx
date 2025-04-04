
import React from "react";
import { Move } from "../types/chess";
import { positionToString } from "../utils/boardUtils";

interface MoveHistoryProps {
  moves: Move[];
}

const MoveHistory: React.FC<MoveHistoryProps> = ({ moves }) => {
  // Format a move in a simplified algebraic notation
  const formatMove = (move: Move, index: number): string => {
    const from = positionToString(move.from);
    const to = positionToString(move.to);
    
    // Special move notations
    if (move.isCastling) {
      // Kingside or queenside castling
      return move.to.col === 6 ? 'O-O' : 'O-O-O';
    }
    
    let notation = '';
    
    // Add piece symbol for non-pawns
    if (move.piece.type !== 'pawn') {
      const pieceSymbols: Record<string, string> = {
        knight: 'N',
        bishop: 'B',
        rook: 'R',
        queen: 'Q',
        king: 'K',
      };
      notation += pieceSymbols[move.piece.type];
    }
    
    // Add the from position
    notation += from;
    
    // Add capture symbol
    if (move.capturedPiece || move.isEnPassant) {
      notation += 'x';
    } else {
      notation += '-';
    }
    
    // Add the to position
    notation += to;
    
    // Add en passant suffix
    if (move.isEnPassant) {
      notation += ' e.p.';
    }
    
    // Add promotion piece
    if (move.isPromotion && move.promotionPiece) {
      const promotionSymbols: Record<string, string> = {
        knight: 'N',
        bishop: 'B',
        rook: 'R',
        queen: 'Q',
      };
      notation += '=' + promotionSymbols[move.promotionPiece];
    }
    
    // Add check/checkmate symbols
    if (move.isCheckmate) {
      notation += '#';
    } else if (move.isCheck) {
      notation += '+';
    }
    
    return notation;
  };

  // Group moves into pairs (white and black)
  const movePairs = [];
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      number: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1]
    });
  }

  return (
    <div className="w-full max-h-60 overflow-y-auto bg-white rounded shadow">
      <table className="w-full text-sm text-left border-collapse">
        <thead className="bg-gray-100 sticky top-0">
          <tr className="border-b">
            <th className="px-3 py-2 w-10">#</th>
            <th className="px-3 py-2">White</th>
            <th className="px-3 py-2">Black</th>
          </tr>
        </thead>
        <tbody>
          {movePairs.map(pair => (
            <tr key={pair.number} className="border-b hover:bg-gray-50">
              <td className="px-3 py-2 text-gray-500">{pair.number}</td>
              <td className="px-3 py-2">{formatMove(pair.white, pair.number * 2 - 2)}</td>
              <td className="px-3 py-2">{pair.black ? formatMove(pair.black, pair.number * 2 - 1) : ''}</td>
            </tr>
          ))}
          {/* Add an extra row if there's an odd number of moves (white's move without black's response) */}
          {moves.length % 2 === 1 && (
            <tr className="border-b hover:bg-gray-50">
              <td className="px-3 py-2 text-gray-500">{Math.floor(moves.length / 2) + 1}</td>
              <td className="px-3 py-2">{formatMove(moves[moves.length - 1], moves.length - 1)}</td>
              <td className="px-3 py-2"></td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default MoveHistory;
