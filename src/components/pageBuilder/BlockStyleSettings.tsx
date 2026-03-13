/**
 * Block Style Settings
 * Per-block styling controls for background, padding, shadow, animation, etc.
 */

import { BlockStyle } from "@/types/pageBuilder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface BlockStyleSettingsProps {
    style: BlockStyle;
    onStyleChange: (style: BlockStyle) => void;
}

const gradientPresets = [
    { label: "None", value: "" },
    { label: "Sunset", value: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" },
    { label: "Ocean", value: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" },
    { label: "Forest", value: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)" },
    { label: "Purple", value: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
    { label: "Warm", value: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)" },
    { label: "Dark", value: "linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 100%)" },
    { label: "Slate", value: "linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)" },
];

export function BlockStyleSettings({ style, onStyleChange }: BlockStyleSettingsProps) {
    const update = (key: keyof BlockStyle, value: any) => {
        onStyleChange({ ...style, [key]: value || undefined });
    };

    return (
        <div className="space-y-5">
            {/* Background */}
            <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Background</Label>
                <div className="space-y-2">
                    <div className="flex gap-2">
                        <Input
                            type="color"
                            value={style.backgroundColor || "#ffffff"}
                            onChange={(e) => update("backgroundColor", e.target.value)}
                            className="w-12 h-9 p-1"
                        />
                        <Input
                            type="text"
                            value={style.backgroundColor || ""}
                            onChange={(e) => update("backgroundColor", e.target.value)}
                            placeholder="No background"
                            className="flex-1 h-9 text-sm"
                        />
                        {style.backgroundColor && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 px-2 text-xs"
                                onClick={() => update("backgroundColor", undefined)}
                            >
                                Clear
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Gradient */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Gradient</Label>
                <div className="grid grid-cols-4 gap-1.5">
                    {gradientPresets.map((preset) => (
                        <button
                            key={preset.label}
                            onClick={() => update("backgroundGradient", preset.value)}
                            className={`h-8 rounded border text-xs transition-all ${
                                style.backgroundGradient === preset.value
                                    ? "ring-2 ring-primary ring-offset-1"
                                    : "hover:ring-1 hover:ring-gray-300"
                            }`}
                            style={{
                                background: preset.value || "#f9fafb",
                            }}
                            title={preset.label}
                        />
                    ))}
                </div>
            </div>

            {/* Text Color */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Text Color</Label>
                <div className="flex gap-2">
                    <Input
                        type="color"
                        value={style.textColor || "#1f2937"}
                        onChange={(e) => update("textColor", e.target.value)}
                        className="w-12 h-9 p-1"
                    />
                    <Input
                        type="text"
                        value={style.textColor || ""}
                        onChange={(e) => update("textColor", e.target.value)}
                        placeholder="Inherit from theme"
                        className="flex-1 h-9 text-sm"
                    />
                </div>
            </div>

            {/* Padding */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Padding</Label>
                <div className="grid grid-cols-4 gap-1.5">
                    {(["none", "small", "medium", "large"] as const).map((p) => (
                        <Button
                            key={p}
                            variant={(style.padding || "none") === p ? "default" : "outline"}
                            size="sm"
                            onClick={() => update("padding", p)}
                            className="capitalize text-xs h-8"
                        >
                            {p}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Border Radius */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Corners</Label>
                <div className="grid grid-cols-5 gap-1.5">
                    {(["none", "small", "medium", "large", "full"] as const).map((r) => (
                        <Button
                            key={r}
                            variant={(style.borderRadius || "none") === r ? "default" : "outline"}
                            size="sm"
                            onClick={() => update("borderRadius", r)}
                            className="capitalize text-xs h-8 px-1"
                        >
                            {r}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Shadow */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Shadow</Label>
                <div className="grid grid-cols-5 gap-1.5">
                    {(["none", "small", "medium", "large", "glow"] as const).map((s) => (
                        <Button
                            key={s}
                            variant={(style.shadow || "none") === s ? "default" : "outline"}
                            size="sm"
                            onClick={() => update("shadow", s)}
                            className="capitalize text-xs h-8 px-1"
                        >
                            {s}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Animation */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Entrance Animation</Label>
                <Select
                    value={style.animation || "none"}
                    onValueChange={(value) => update("animation", value)}
                >
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="fadeIn">Fade In</SelectItem>
                        <SelectItem value="slideUp">Slide Up</SelectItem>
                        <SelectItem value="slideLeft">Slide from Left</SelectItem>
                        <SelectItem value="slideRight">Slide from Right</SelectItem>
                        <SelectItem value="scaleIn">Scale In</SelectItem>
                        <SelectItem value="bounce">Bounce</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Reset */}
            <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => onStyleChange({})}
            >
                Reset All Styles
            </Button>
        </div>
    );
}
