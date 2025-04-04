
import React, { useState } from "react";
import ChessBoard from "../components/ChessBoard";
import MoveHistory from "../components/MoveHistory";
import GameControls from "../components/GameControls";
import { createNewGame, undoMove } from "../utils/chessEngine";
import { GameState, AIDifficulty } from "../types/chess";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const Index = () => {
  const [gameState, setGameState] = useState<GameState>(createNewGame('beginner')); // Explicitly pass 'beginner'
  const [difficulty, setDifficulty] = useState<AIDifficulty>("beginner");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { toast } = useToast();

  const handleMove = (newGameState: GameState) => {
    setGameState(newGameState);
    
    // Show toast notifications for special events
    if (newGameState.isCheck) {
      toast({
        title: "Check!",
        description: `${newGameState.currentPlayer === 'white' ? 'White' : 'Black'}'s king is in check.`
      });
    }
    
    if (newGameState.isCheckmate) {
      toast({
        title: "Checkmate!",
        description: `${newGameState.currentPlayer === 'white' ? 'Black' : 'White'} wins the game.`,
        duration: 5000
      });
    }
    
    if (newGameState.isStalemate) {
      toast({
        title: "Stalemate!",
        description: "The game is a draw.",
        duration: 5000
      });
    }
  };

  const handleUndo = () => {
    // Undo the last player move and the AI's response
    let newState = undoMove(gameState);
    
    // If we just undid the AI move, also undo the player's move
    if (newState.currentPlayer !== 'white') {
      newState = undoMove(newState);
    }
    
    setGameState(newState);
    
    toast({
      title: "Move Undone",
      description: "The last move has been undone."
    });
  };

  const handleRestart = () => {
    setGameState(createNewGame(difficulty)); // Pass the current difficulty
    
    toast({
      title: "Game Restarted",
      description: "A new chess game has begun."
    });
  };

  const handleDifficultyChange = (newDifficulty: AIDifficulty) => {
    setDifficulty(newDifficulty);
    
    // Restart the game with the new difficulty
    setGameState(createNewGame(newDifficulty)); // Pass new difficulty
    
    toast({
      title: "Difficulty Changed",
      description: `AI opponent set to ${newDifficulty} difficulty.`
    });
    
    setSettingsOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Solo Chess Master</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Chess Board */}
          <div className="md:col-span-2">
            <Card className="border shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  {gameState.isCheckmate 
                    ? `Checkmate! ${gameState.currentPlayer === 'white' ? 'Black' : 'White'} wins!` 
                    : gameState.isStalemate 
                      ? 'Stalemate! The game is a draw.' 
                      : `${gameState.currentPlayer === 'white' ? 'White' : 'Black'} to move`}
                </CardTitle>
                <CardDescription>
                  {gameState.isCheck && !gameState.isCheckmate && 'Check!'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChessBoard 
                  gameState={gameState} 
                  onMove={handleMove} 
                  playerColor="white" 
                  showCoordinates={true} 
                />
              </CardContent>
            </Card>
            
            <GameControls 
              onUndo={handleUndo} 
              onRestart={handleRestart} 
              onSettings={() => setSettingsOpen(true)} 
            />
          </div>
          
          {/* Side Panel */}
          <div>
            <Card className="border shadow-md mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Game Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm mb-4">
                  <p><strong>Current Player:</strong> {gameState.currentPlayer === 'white' ? 'White' : 'Black'}</p>
                  <p><strong>AI Difficulty:</strong> {gameState.aiDifficulty}</p>
                  <p><strong>Total Moves:</strong> {gameState.moveHistory.length}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Move History</CardTitle>
              </CardHeader>
              <CardContent>
                <MoveHistory moves={gameState.moveHistory} />
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Settings Dialog */}
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Game Settings</DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="difficulty" className="text-right">
                  AI Difficulty
                </Label>
                <Select 
                  onValueChange={(value) => handleDifficultyChange(value as AIDifficulty)} 
                  value={difficulty}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Additional settings can be added here */}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Index;
