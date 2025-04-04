
import React, { useState, useEffect } from "react";
import { Board, ChessPiece as ChessPieceType, GameState, Move, Position, PieceType } from "../types/chess";
import ChessPiece from "./ChessPiece";
import { getLegalMoves, makeMove } from "../utils/chessEngine";
import { getAIMove } from "../utils/chessAI";
import { isValidPosition } from "../utils/boardUtils";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";

interface ChessBoardProps {
  gameState: GameState;
  onMove: (newGameState: GameState) => void;
  playerColor?: "white" | "black";
  showCoordinates?: boolean;
}

const ChessBoard: React.FC<ChessBoardProps> = ({
  gameState,
  onMove,
  playerColor = "white",
  showCoordinates = true,
}) => {
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [legalMoves, setLegalMoves] = useState<Position[]>([]);
  const [animating, setAnimating] = useState(false);
  const [promotionMove, setPromotionMove] = useState<{from: Position, to: Position, piece: ChessPieceType} | null>(null);
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);

  const { board, currentPlayer, moveHistory, isCheck, isCheckmate, isStalemate } = gameState;
  
  // Flip the board if playing as black
  const displayBoard = playerColor === "black" ? 
    [...board].reverse().map(row => [...row].reverse()) : board;

  // AI move logic
  useEffect(() => {
    if (currentPlayer !== playerColor && !isCheckmate && !isStalemate && !animating) {
      const makeAIMove = async () => {
        // Add a slight delay to make the AI's move feel more natural
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const aiMove = getAIMove(gameState);
        
        if (aiMove) {
          setAnimating(true);
          const newGameState = makeMove(gameState, aiMove);
          onMove(newGameState);
          
          // Wait for animation to complete
          setTimeout(() => setAnimating(false), 300);
        }
      };
      
      makeAIMove();
    }
  }, [currentPlayer, gameState, isCheckmate, isStalemate, onMove, playerColor, animating]);

  const handlePromotionSelect = (promotionPiece: PieceType) => {
    if (!promotionMove) return;
    
    const { from, to, piece } = promotionMove;
    
    // Create the move with promotion piece
    const move: Move = {
      from,
      to,
      piece,
      capturedPiece: board[to.row][to.col] || undefined,
      isPromotion: true,
      promotionPiece
    };
    
    // Apply the move
    const newGameState = makeMove(gameState, move);
    onMove(newGameState);
    
    // Reset promotion state
    setPromotionMove(null);
    setShowPromotionDialog(false);
    setSelectedPosition(null);
    setLegalMoves([]);
    
    // Wait for animation to complete
    setTimeout(() => setAnimating(false), 300);
  };

  const handleSquareClick = (position: Position) => {
    // Don't allow moves during animation or promotion dialog
    if (animating || showPromotionDialog) return;
    
    // Don't allow moves if it's not the player's turn
    if (currentPlayer !== playerColor) return;
    
    const { row, col } = playerColor === "black" ? 
      { row: 7 - position.row, col: 7 - position.col } : position;

    // Make sure the position is valid
    if (!isValidPosition({ row, col })) {
      console.error("Invalid position clicked:", row, col);
      return;
    }

    const clickedPiece = board[row][col];

    // If no piece is selected and clicked on empty square, do nothing
    if (!selectedPosition && !clickedPiece) {
      return;
    }

    // If no piece is selected and clicked on a piece
    if (!selectedPosition) {
      // Can only select own pieces
      if (clickedPiece && clickedPiece.color === currentPlayer) {
        setSelectedPosition({ row, col });
        setLegalMoves(getLegalMoves(gameState, { row, col }));
      }
      return;
    }

    // Make sure the selected position is valid
    if (!isValidPosition(selectedPosition)) {
      setSelectedPosition(null);
      setLegalMoves([]);
      return;
    }

    // If a piece is already selected
    const selectedPiece = board[selectedPosition.row][selectedPosition.col];

    // If clicked on another own piece, select that piece instead
    if (clickedPiece && clickedPiece.color === currentPlayer) {
      setSelectedPosition({ row, col });
      setLegalMoves(getLegalMoves(gameState, { row, col }));
      return;
    }

    // Check if the move is legal
    const isLegalMove = legalMoves.some(
      move => move.row === row && move.col === col
    );

    if (isLegalMove && selectedPiece) {
      // Check for pawn promotion
      const isPawnPromotion = selectedPiece.type === 'pawn' && 
        ((selectedPiece.color === 'white' && row === 0) || 
         (selectedPiece.color === 'black' && row === 7));
         
      if (isPawnPromotion) {
        setPromotionMove({
          from: selectedPosition,
          to: { row, col },
          piece: selectedPiece
        });
        setAnimating(true);
        setShowPromotionDialog(true);
        return;
      }
      
      // Regular move (not a promotion)
      const move: Move = {
        from: selectedPosition,
        to: { row, col },
        piece: selectedPiece,
        capturedPiece: board[row][col] || undefined
      };

      setAnimating(true);
      
      // Apply the move and update the game state
      const newGameState = makeMove(gameState, move);
      onMove(newGameState);

      // Reset selection
      setSelectedPosition(null);
      setLegalMoves([]);
      
      // Wait for animation to complete
      setTimeout(() => setAnimating(false), 300);
    } else {
      // Invalid move, just deselect
      setSelectedPosition(null);
      setLegalMoves([]);
    }
  };

  const renderSquare = (position: Position) => {
    const { row, col } = position;
    const isLight = (row + col) % 2 === 0;
    const piece = displayBoard[row][col];

    // Determine if this square is selected
    const isSelected = selectedPosition && 
                      ((playerColor === "black" ? 7 - selectedPosition.row : selectedPosition.row) === row) && 
                      ((playerColor === "black" ? 7 - selectedPosition.col : selectedPosition.col) === col);

    // Determine if this is a legal move
    const isLegalMove = legalMoves.some(move => 
      (playerColor === "black" ? 7 - move.row : move.row) === row && 
      (playerColor === "black" ? 7 - move.col : move.col) === col
    );

    // Determine if this is part of the last move
    const lastMove = moveHistory.length > 0 ? moveHistory[moveHistory.length - 1] : null;
    const isLastMoveFrom = lastMove && 
                          (playerColor === "black" ? 7 - lastMove.from.row : lastMove.from.row) === row && 
                          (playerColor === "black" ? 7 - lastMove.from.col : lastMove.from.col) === col;
    const isLastMoveTo = lastMove && 
                        (playerColor === "black" ? 7 - lastMove.to.row : lastMove.to.row) === row && 
                        (playerColor === "black" ? 7 - lastMove.to.col : lastMove.to.col) === col;

    // Determine if the king is in check
    const actualRow = playerColor === "black" ? 7 - row : row;
    const actualCol = playerColor === "black" ? 7 - col : col;
    const isKingInCheck = isCheck && 
                        piece && 
                        piece.type === "king" && 
                        piece.color === currentPlayer;

    return (
      <div
        key={`${row}-${col}`}
        className={`relative w-full h-full flex items-center justify-center
                    ${isLight ? "bg-chess-light-square" : "bg-chess-dark-square"}
                    ${isSelected ? "ring-2 ring-inset ring-yellow-400" : ""}`}
        onClick={() => handleSquareClick({ row, col })}
      >
        {/* Highlight last move */}
        {(isLastMoveFrom || isLastMoveTo) && (
          <div className="absolute inset-0 bg-chess-last-move" />
        )}
        
        {/* Highlight selected square */}
        {isSelected && (
          <div className="absolute inset-0 bg-chess-selected" />
        )}
        
        {/* Highlight legal moves */}
        {isLegalMove && (
          <div className={`absolute inset-0 flex items-center justify-center ${piece ? "bg-chess-possible-move" : ""}`}>
            {!piece && (
              <div className="w-3 h-3 rounded-full bg-chess-possible-move opacity-80" />
            )}
          </div>
        )}
        
        {/* Highlight king in check */}
        {isKingInCheck && (
          <div className="absolute inset-0 bg-chess-check" />
        )}
        
        {/* Render the piece */}
        {piece && (
          <div className={`w-full h-full ${isLastMoveTo ? "animate-piece-move" : ""}`}>
            <ChessPiece piece={piece} />
          </div>
        )}
        
        {/* Show coordinates */}
        {showCoordinates && (
          <>
            {col === 0 && (
              <span className="absolute text-xs top-0 left-0 m-0.5 text-gray-700 font-medium">
                {playerColor === "white" ? 8 - row : row + 1}
              </span>
            )}
            {row === 7 && (
              <span className="absolute text-xs bottom-0 right-0 m-0.5 text-gray-700 font-medium">
                {playerColor === "white" ? String.fromCharCode(97 + col) : String.fromCharCode(97 + (7 - col))}
              </span>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="w-full aspect-square max-w-md mx-auto border-2 border-gray-800 shadow-lg">
        <div className="grid grid-cols-8 grid-rows-8 h-full w-full">
          {Array.from({ length: 8 }, (_, row) =>
            Array.from({ length: 8 }, (_, col) => renderSquare({ row, col }))
          )}
        </div>
      </div>
      
      {/* Pawn Promotion Dialog */}
      <Dialog open={showPromotionDialog} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="text-center">Choose promotion piece</DialogTitle>
          <div className="flex justify-center space-x-4 p-4">
            <Button onClick={() => handlePromotionSelect('queen')} className="px-6 py-6">
              <ChessPiece piece={{ type: 'queen', color: currentPlayer }} />
            </Button>
            <Button onClick={() => handlePromotionSelect('rook')} className="px-6 py-6">
              <ChessPiece piece={{ type: 'rook', color: currentPlayer }} />
            </Button>
            <Button onClick={() => handlePromotionSelect('bishop')} className="px-6 py-6">
              <ChessPiece piece={{ type: 'bishop', color: currentPlayer }} />
            </Button>
            <Button onClick={() => handlePromotionSelect('knight')} className="px-6 py-6">
              <ChessPiece piece={{ type: 'knight', color: currentPlayer }} />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChessBoard;
