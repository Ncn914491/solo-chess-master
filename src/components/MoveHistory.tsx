
import React from "react";
import { Move } from "../types/chess";

interface MoveHistoryProps {
  moves: Move[];
}

const MoveHistory: React.FC<MoveHistoryProps> = ({ moves }) => {
  // Convert position to algebraic notation (e.g., "e4")
  const toAlgebraic = (position: { row: number; col: number }): string => {
    const files = 'abcdefgh';
    const ranks = '87654321';
    
    return files[position.col] + ranks[position.row];
  };

  // Format a move in a simplified algebraic notation (e.g., "e2e4" instead of full "Pe2-e4")
  const formatMove = (move: Move, index: number): string => {
    const from = toAlgebraic(move.from);
    const to = toAlgebraic(move.to);
    const isCapture = move.capturedPiece ? 'x' : '-';
    
    let notation = `${from}${isCapture}${to}`;
    
    if (move.isCheck) {
      notation += '+';
    }
    
    if (move.isCheckmate) {
      notation += '#';
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
            <tr key={pair.number} className="border-b">
              <td className="px-3 py-2 text-gray-500">{pair.number}</td>
              <td className="px-3 py-2">{formatMove(pair.white, pair.number * 2 - 2)}</td>
              <td className="px-3 py-2">{pair.black ? formatMove(pair.black, pair.number * 2 - 1) : ''}</td>
            </tr>
          ))}
          {/* Add an extra row if there's an odd number of moves (white's move without black's response) */}
          {moves.length % 2 === 1 && (
            <tr className="border-b">
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
