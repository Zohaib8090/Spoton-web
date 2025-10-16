
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { usePlayer } from "@/context/player-context";
import { RotateCcw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator";

const BANDS = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
const PRESETS = {
  "default": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  "rock": [5, 3, 1, -2, -1, 2, 4, 5, 6, 7],
  "pop": [-2, -1, 0, 2, 4, 4, 2, 0, -1, -2],
  "jazz": [4, 2, 1, 3, -1, -1, 0, 2, 3, 4],
  "classical": [5, 4, 3, 2, -2, -2, 0, 2, 3, 4],
  "bass-boost": [8, 6, 4, 2, 1, -1, -2, -3, -4, -5],
  "vocal-boost": [-2, -1, 0, 2, 4, 4, 2, 0, -1, -2],
};

type PresetName = keyof typeof PRESETS;

interface EqualiserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EqualiserDialog({ isOpen, onOpenChange }: EqualiserDialogProps) {
  const { equaliserSettings, setEqualiserSettings, isEqEnabled, toggleEq } = usePlayer();
  const [localSettings, setLocalSettings] = useState(equaliserSettings);
  const [activePreset, setActivePreset] = useState<PresetName>("default");
  const [bassBoost, setBassBoost] = useState(0);
  const [isManualBass, setIsManualBass] = useState(false);

  useEffect(() => {
    setLocalSettings(equaliserSettings);
    // Initialize bass boost based on settings if not manually adjusted
    if (!isManualBass) {
        const avgBass = Math.round((equaliserSettings[0] + equaliserSettings[1]) / 2);
        setBassBoost(avgBass);
    }
  }, [equaliserSettings, isOpen, isManualBass]);

  const handleSliderChange = (index: number, value: number) => {
    const newSettings = [...localSettings];
    newSettings[index] = value;
    setLocalSettings(newSettings);
    setActivePreset("default");
    
    // If user touches bass sliders, disconnect the main bass boost slider
    if (index === 0 || index === 1) {
        setIsManualBass(true);
    }
  };
  
  const handlePresetChange = (presetName: PresetName) => {
    const presetValues = PRESETS[presetName];
    setLocalSettings(presetValues);
    setActivePreset(presetName);
    setIsManualBass(false); // Re-enable bass boost slider on preset change
    const avgBass = Math.round((presetValues[0] + presetValues[1]) / 2);
    setBassBoost(avgBass);
  };

  const handleBassBoostChange = (value: number) => {
    setBassBoost(value);
    const newSettings = [...localSettings];
    newSettings[0] = value; // Apply to 32Hz
    newSettings[1] = Math.max(0, value - 2); // Apply slightly less to 64Hz
    setLocalSettings(newSettings);
    setActivePreset("default");
    setIsManualBass(false); // This change is from the bass slider
  }

  const handleSaveChanges = () => {
    setEqualiserSettings(localSettings);
    onOpenChange(false);
  };

  const handleReset = () => {
    setLocalSettings(PRESETS["default"]);
    setActivePreset("default");
    setBassBoost(0);
    setIsManualBass(false);
  };

  const handleToggleEq = () => {
    toggleEq();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>10-Band Equaliser</DialogTitle>
          <DialogDescription>
            Fine-tune your audio by adjusting the frequency bands. Changes are applied live.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col md:flex-row gap-8 py-4">
            <div className="flex-1 grid grid-cols-10 gap-4 items-end px-4 min-h-[250px]">
            {BANDS.map((band, index) => (
                <div key={band} className="flex flex-col items-center justify-end gap-2">
                <Slider
                    orientation="vertical"
                    min={-12}
                    max={12}
                    step={1}
                    value={[localSettings[index]]}
                    onValueChange={(value) => handleSliderChange(index, value[0])}
                    className="h-48"
                    disabled={!isEqEnabled || (!isManualBass && (index === 0 || index === 1))}
                />
                <Label htmlFor={`band-${band}`} className="text-xs text-muted-foreground">{band < 1000 ? band : `${band/1000}k`}Hz</Label>
                <span className="text-xs font-mono w-10 text-center">{localSettings[index]}dB</span>
                </div>
            ))}
            </div>
            <div className="w-full md:w-56 space-y-4">
                <Button onClick={handleToggleEq} className="w-full">
                    {isEqEnabled ? "Disable" : "Enable"} Equaliser
                </Button>
                
                <div className="space-y-3 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="bass-boost">Bass Boost</Label>
                        <span className="text-sm font-bold w-12 text-right">{bassBoost > 0 ? `+${bassBoost}`: bassBoost}dB</span>
                    </div>
                    <Slider
                        id="bass-boost"
                        min={-6}
                        max={12}
                        step={1}
                        value={[bassBoost]}
                        onValueChange={(v) => handleBassBoostChange(v[0])}
                        disabled={!isEqEnabled}
                    />
                </div>

                 <Select onValueChange={(value) => handlePresetChange(value as PresetName)} value={activePreset} disabled={!isEqEnabled}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a preset" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="default">Custom</SelectItem>
                        <SelectItem value="bass-boost">Bass Boost</SelectItem>
                        <SelectItem value="rock">Rock</SelectItem>
                        <SelectItem value="pop">Pop</SelectItem>
                        <SelectItem value="jazz">Jazz</SelectItem>
                        <SelectItem value="classical">Classical</SelectItem>
                        <SelectItem value="vocal-boost">Vocal Boost</SelectItem>
                    </SelectContent>
                </Select>
                 <Button variant="outline" onClick={handleReset} className="w-full" disabled={!isEqEnabled}>
                    <RotateCcw className="mr-2 h-4 w-4" /> Reset
                </Button>
            </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSaveChanges}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
