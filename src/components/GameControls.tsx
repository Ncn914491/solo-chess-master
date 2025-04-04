
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, Settings } from "lucide-react";

interface GameControlsProps {
  onUndo: () => void;
  onRestart: () => void;
  onSettings: () => void;
}

const GameControls: React.FC<GameControlsProps> = ({ onUndo, onRestart, onSettings }) => {
  return (
    <div className="flex items-center justify-center gap-2 my-4">
      <Button variant="outline" onClick={onUndo} className="flex items-center gap-1">
        <ArrowLeft size={18} />
        <span>Undo</span>
      </Button>
      
      <Button variant="outline" onClick={onRestart} className="flex items-center gap-1">
        <RotateCcw size={18} />
        <span>Restart</span>
      </Button>
      
      <Button variant="outline" onClick={onSettings} className="flex items-center gap-1">
        <Settings size={18} />
        <span>Settings</span>
      </Button>
    </div>
  );
};

export default GameControls;
