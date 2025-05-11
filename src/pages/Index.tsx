import React, { useState, useEffect } from "react";
import ChessBoard from "../components/ChessBoard";
import MoveHistory from "../components/MoveHistory";
import GameControls from "../components/GameControls";
import { createNewGame, undoMove } from "../utils/chessEngine";
import { GameState, AIDifficulty, GameMode } from "../types/chess";
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
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

const Index = () => {
  const [difficulty, setDifficulty] = useState<AIDifficulty>("beginner");
  const [gameMode, setGameMode] = useState<GameMode>("ai");
  const [targetElo, setTargetElo] = useState<number>(1000); // Default Elo
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showThreats, setShowThreats] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { toast } = useToast();

  // Map Elo to internal difficulty (simplified)
  const mapEloToDifficulty = (elo: number): AIDifficulty => {
    if (elo < 800) return 'beginner';
    if (elo < 1200) return 'intermediate';
    if (elo < 1600) return 'advanced';
    return 'expert';
  };

  // Initialize game state with the correct difficulty based on default Elo
  const [gameState, setGameState] = useState<GameState>(() => {
    const initialDifficulty = mapEloToDifficulty(targetElo);
    return createNewGame(initialDifficulty, gameMode, showSuggestions, showThreats);
  });

  useEffect(() => {
    // Update internal difficulty if Elo changes while settings are closed
    // (or could trigger restart immediately)
    const newDifficulty = mapEloToDifficulty(targetElo);
    if (newDifficulty !== difficulty) {
      setDifficulty(newDifficulty);
      // Optional: Automatically restart game if Elo changes significantly?
      // setGameState(createNewGame(newDifficulty, gameMode));
    }
  }, [targetElo]); // Re-run when targetElo changes

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
    // For AI mode: Undo the last player move and the AI's response
    // For two-player mode: Only undo the last move
    if (gameState.gameMode === 'ai') {
      let newState = undoMove(gameState);

      // If we just undid the AI move, also undo the player's move
      if (newState.currentPlayer !== 'white') {
        newState = undoMove(newState);
      }

      setGameState(newState);

      toast({
        title: "Move Undone",
        description: "The last moves have been undone."
      });
    } else {
      // Two-player mode: just undo once
      const newState = undoMove(gameState);
      setGameState(newState);

      toast({
        title: "Move Undone",
        description: "The last move has been undone."
      });
    }
  };

  const handleRestart = () => {
    const currentDifficulty = mapEloToDifficulty(targetElo);
    setGameState(createNewGame(currentDifficulty, gameMode, showSuggestions, showThreats));
    toast({
      title: "Game Restarted",
      description: `New game started (${gameMode === 'ai' ? `AI Elo: ${targetElo}` : 'Two Player'}).`
    });
  };

  // Handles changes from the Elo input field
  const handleEloChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newElo = parseInt(event.target.value, 10);
    if (!isNaN(newElo)) {
        // Basic validation (e.g., min 400, max 2400)
        const validatedElo = Math.max(400, Math.min(2400, newElo));
        setTargetElo(validatedElo);
        // Update internal difficulty immediately for display/potential restart
        const newDifficulty = mapEloToDifficulty(validatedElo);
        setDifficulty(newDifficulty);
        // Restart game when Elo changes
        setGameState(createNewGame(newDifficulty, gameMode, showSuggestions, showThreats));
         toast({
            title: "AI Strength Updated",
            description: `AI set to approximately ${validatedElo} Elo (${newDifficulty}).`
        });
    }
  };

  const handleGameModeChange = (newGameMode: GameMode) => {
    setGameMode(newGameMode);
    const currentDifficulty = mapEloToDifficulty(targetElo);
    setGameState(createNewGame(currentDifficulty, newGameMode, showSuggestions, showThreats));
    toast({
      title: "Game Mode Changed",
      description: `Game mode set to ${newGameMode === 'ai' ? `AI Opponent (Elo: ${targetElo})` : 'Two Player'}.`
    });
  };

  const handleSuggestionsToggle = (enabled: boolean) => {
    setShowSuggestions(enabled);
    // Update the game state with the new setting
    setGameState({
      ...gameState,
      showSuggestions: enabled
    });

    toast({
      title: enabled ? "Suggestions Enabled" : "Suggestions Disabled",
      description: enabled ? "Move suggestions will be shown on the board." : "Move suggestions are now hidden."
    });
  };

  const handleThreatsToggle = (enabled: boolean) => {
    setShowThreats(enabled);
    // Update the game state with the new setting
    setGameState({
      ...gameState,
      showThreats: enabled
    });

    toast({
      title: enabled ? "Threat Detection Enabled" : "Threat Detection Disabled",
      description: enabled ? "Threatened squares will be highlighted on the board." : "Threatened squares are now hidden."
    });
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
                  <p><strong>Game Mode:</strong> {gameState.gameMode === 'ai' ? 'AI Opponent' : 'Two Player'}</p>
                  {gameState.gameMode === 'ai' && (
                    <>
                      <p><strong>Target AI Elo:</strong> {targetElo}</p>
                      <p><strong>AI Difficulty Level:</strong> {difficulty}</p>
                    </>
                  )}
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
                <Label htmlFor="gameMode" className="text-right">
                  Game Mode
                </Label>
                <Select
                  onValueChange={(value) => handleGameModeChange(value as GameMode)}
                  value={gameMode}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select game mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ai">AI Opponent</SelectItem>
                    <SelectItem value="twoPlayer">Two Player</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* AI Elo Input (only show in AI mode) */}
              {gameMode === 'ai' && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="elo" className="text-right">
                    Target AI Elo
                  </Label>
                  <Input
                    id="elo"
                    type="number"
                    min="400"
                    max="2400" // Adjust max based on AI capabilities
                    step="50"
                    value={targetElo}
                    onChange={handleEloChange}
                    className="col-span-3"
                  />
                </div>
              )}

              {/* Move Suggestions Toggle */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="suggestions" className="text-right">
                  Show Suggestions
                </Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Switch
                    id="suggestions"
                    checked={showSuggestions}
                    onCheckedChange={handleSuggestionsToggle}
                  />
                  <Label htmlFor="suggestions" className="text-sm text-gray-500">
                    Highlights recommended moves
                  </Label>
                </div>
              </div>

              {/* Threat Detection Toggle */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="threats" className="text-right">
                  Show Threats
                </Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Switch
                    id="threats"
                    checked={showThreats}
                    onCheckedChange={handleThreatsToggle}
                  />
                  <Label htmlFor="threats" className="text-sm text-gray-500">
                    Highlights squares under attack
                  </Label>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Index;
