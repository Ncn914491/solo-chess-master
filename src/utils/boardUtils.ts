
import { Position } from "../types/chess";

/**
 * Checks if a position is valid on the chess board (within bounds)
 * @param position The position to validate
 * @returns True if the position is valid, false otherwise
 */
export function isValidPosition(position: Position): boolean {
  return (
    position.row >= 0 && position.row < 8 && 
    position.col >= 0 && position.col < 8
  );
}

/**
 * Safely accesses a position on the board, returning undefined if out of bounds
 * This provides a type-safe way to check positions without risking out-of-bounds errors
 */
export function safeGetPosition<T>(board: T[][], position: Position): T | undefined {
  if (!isValidPosition(position)) {
    return undefined;
  }
  return board[position.row][position.col];
}

/**
 * Converts a position to a string representation (e.g., { row: 0, col: 0 } -> "a8")
 */
export function positionToString(position: Position): string {
  if (!isValidPosition(position)) {
    return "invalid";
  }
  const files = 'abcdefgh';
  const ranks = '87654321';
  return files[position.col] + ranks[position.row];
}

/**
 * Parses a string representation to a position (e.g., "a8" -> { row: 0, col: 0 })
 */
export function stringToPosition(str: string): Position | null {
  if (str.length !== 2) {
    return null;
  }
  
  const files = 'abcdefgh';
  const ranks = '87654321';
  
  const col = files.indexOf(str[0].toLowerCase());
  const row = ranks.indexOf(str[1]);
  
  if (col === -1 || row === -1) {
    return null;
  }
  
  return { row, col };
}
