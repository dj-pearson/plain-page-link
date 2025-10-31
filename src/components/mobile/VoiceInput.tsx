/**
 * Voice Input Component
 * Enables speech-to-text for textarea inputs using Web Speech API
 */

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface VoiceInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    maxLength?: number;
    className?: string;
    disabled?: boolean;
}

// Check if browser supports speech recognition
const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

export function VoiceInput({
    value,
    onChange,
    placeholder = "Tap to type or use voice input...",
    maxLength = 1000,
    className,
    disabled = false,
}: VoiceInputProps) {
    const [isListening, setIsListening] = useState(false);
    const [isSupported] = useState(() => !!SpeechRecognition);
    const recognitionRef = useRef<any>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (!isSupported || !SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => {
            console.log("[VoiceInput] Speech recognition started");
            setIsListening(true);
        };

        recognition.onend = () => {
            console.log("[VoiceInput] Speech recognition ended");
            setIsListening(false);
        };

        recognition.onerror = (event: any) => {
            console.error(
                "[VoiceInput] Speech recognition error:",
                event.error
            );
            setIsListening(false);

            if (event.error === "not-allowed") {
                toast.error(
                    "Microphone permission denied. Please enable it in your browser settings."
                );
            } else if (event.error === "no-speech") {
                toast.warning("No speech detected. Try again.");
            } else {
                toast.error(`Speech recognition error: ${event.error}`);
            }
        };

        recognition.onresult = (event: any) => {
            let interimTranscript = "";
            let finalTranscript = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + " ";
                } else {
                    interimTranscript += transcript;
                }
            }

            if (finalTranscript) {
                // Append final transcript to existing value
                const newValue = value + finalTranscript;
                if (newValue.length <= maxLength) {
                    onChange(newValue);
                } else {
                    toast.warning(
                        `Maximum length of ${maxLength} characters reached`
                    );
                    recognition.stop();
                }
            }
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [isSupported, maxLength]);

    const toggleListening = () => {
        if (!recognitionRef.current) return;

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            try {
                recognitionRef.current.start();
                toast.info("Listening... Speak now", { duration: 2000 });
            } catch (error) {
                console.error(
                    "[VoiceInput] Failed to start recognition:",
                    error
                );
                toast.error("Failed to start voice input");
            }
        }
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        if (newValue.length <= maxLength) {
            onChange(newValue);
        }
    };

    return (
        <div className={cn("relative", className)}>
            <textarea
                ref={textareaRef}
                value={value}
                onChange={handleTextChange}
                placeholder={placeholder}
                disabled={disabled || isListening}
                className={cn(
                    "w-full min-h-[120px] p-3 pr-12 border rounded-lg resize-y",
                    "focus:outline-none focus:ring-2 focus:ring-primary",
                    "disabled:bg-gray-50 disabled:cursor-not-allowed",
                    isListening && "bg-blue-50 border-blue-300"
                )}
                maxLength={maxLength}
                aria-label="Text input with voice support"
            />

            {/* Character count */}
            <div className="absolute bottom-3 left-3 text-xs text-gray-500">
                {value.length}/{maxLength}
            </div>

            {/* Voice input button */}
            {isSupported ? (
                <Button
                    type="button"
                    size="sm"
                    variant={isListening ? "destructive" : "ghost"}
                    onClick={toggleListening}
                    disabled={disabled}
                    className={cn(
                        "absolute bottom-2 right-2",
                        isListening && "animate-pulse"
                    )}
                    aria-label={
                        isListening ? "Stop voice input" : "Start voice input"
                    }
                >
                    {isListening ? (
                        <>
                            <MicOff className="w-4 h-4 mr-1" />
                            Stop
                        </>
                    ) : (
                        <>
                            <Mic className="w-4 h-4 mr-1" />
                            Dictate
                        </>
                    )}
                </Button>
            ) : (
                <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                    Voice input not supported
                </div>
            )}

            {isListening && (
                <div className="absolute top-2 right-2 flex items-center text-sm text-blue-600">
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Listening...
                </div>
            )}
        </div>
    );
}
