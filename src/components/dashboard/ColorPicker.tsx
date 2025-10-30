import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface ColorPickerProps {
    label: string;
    value: string;
    onChange: (color: string) => void;
    description?: string;
}

const PRESET_COLORS = [
    "#3B82F6", // Blue
    "#10B981", // Green
    "#F59E0B", // Amber
    "#EF4444", // Red
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#06B6D4", // Cyan
    "#F97316", // Orange
    "#1F2937", // Gray Dark
    "#6B7280", // Gray
];

export function ColorPicker({
    label,
    value,
    onChange,
    description,
}: ColorPickerProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleColorChange = (newColor: string) => {
        onChange(newColor);
    };

    return (
        <div className="space-y-2">
            <Label htmlFor={label}>{label}</Label>
            {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
            )}

            <div className="flex gap-2">
                {/* Color preview + picker trigger */}
                <Popover open={isOpen} onOpenChange={setIsOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className="w-12 h-10 p-0 border-2"
                            style={{ backgroundColor: value }}
                            aria-label={`Pick ${label}`}
                        />
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-4">
                        <div className="space-y-4">
                            {/* Preset colors */}
                            <div>
                                <p className="text-sm font-medium mb-2">
                                    Preset Colors
                                </p>
                                <div className="grid grid-cols-5 gap-2">
                                    {PRESET_COLORS.map((color) => (
                                        <button
                                            key={color}
                                            className="w-10 h-10 rounded border-2 hover:scale-110 transition-transform"
                                            style={{ backgroundColor: color }}
                                            onClick={() => {
                                                handleColorChange(color);
                                                setIsOpen(false);
                                            }}
                                            aria-label={`Select ${color}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Custom color picker */}
                            <div>
                                <p className="text-sm font-medium mb-2">
                                    Custom Color
                                </p>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={value}
                                        onChange={(e) =>
                                            handleColorChange(e.target.value)
                                        }
                                        className="w-12 h-10 rounded border cursor-pointer"
                                    />
                                    <Input
                                        type="text"
                                        value={value}
                                        onChange={(e) =>
                                            handleColorChange(e.target.value)
                                        }
                                        placeholder="#000000"
                                        className="flex-1 font-mono text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Hex input */}
                <Input
                    type="text"
                    value={value}
                    onChange={(e) => handleColorChange(e.target.value)}
                    placeholder="#000000"
                    className="flex-1 font-mono"
                />
            </div>
        </div>
    );
}
