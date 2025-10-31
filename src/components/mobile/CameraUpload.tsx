/**
 * Camera Upload Component
 * Allows taking photos with device camera and uploading with compression
 */

import { useState, useRef } from "react";
import { Camera, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CameraUploadProps {
    onImagesSelected: (files: File[]) => void;
    maxFiles?: number;
    maxSizeMB?: number;
    className?: string;
}

export function CameraUpload({
    onImagesSelected,
    maxFiles = 10,
    maxSizeMB = 2,
    className,
}: CameraUploadProps) {
    const [previews, setPreviews] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const compressImage = async (file: File): Promise<File> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");
                    if (!ctx) {
                        reject(new Error("Failed to get canvas context"));
                        return;
                    }

                    // Calculate new dimensions (max 1920x1080)
                    let width = img.width;
                    let height = img.height;
                    const maxWidth = 1920;
                    const maxHeight = 1080;

                    if (width > maxWidth || height > maxHeight) {
                        const ratio = Math.min(
                            maxWidth / width,
                            maxHeight / height
                        );
                        width = width * ratio;
                        height = height * ratio;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    // Draw and compress
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                reject(new Error("Failed to compress image"));
                                return;
                            }

                            const compressedFile = new File([blob], file.name, {
                                type: "image/jpeg",
                                lastModified: Date.now(),
                            });

                            resolve(compressedFile);
                        },
                        "image/jpeg",
                        0.85
                    );
                };
                img.onerror = () => reject(new Error("Failed to load image"));
                img.src = e.target?.result as string;
            };
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsDataURL(file);
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        if (files.length + previews.length > maxFiles) {
            toast.error(`Maximum ${maxFiles} images allowed`);
            return;
        }

        setLoading(true);

        try {
            const compressedFiles: File[] = [];
            const newPreviews: string[] = [];

            for (const file of files) {
                // Check file size before compression
                if (file.size > maxSizeMB * 1024 * 1024 * 10) {
                    toast.error(
                        `${file.name} is too large (max ${
                            maxSizeMB * 10
                        }MB before compression)`
                    );
                    continue;
                }

                // Compress image
                const compressed = await compressImage(file);

                // Check compressed size
                if (compressed.size > maxSizeMB * 1024 * 1024) {
                    toast.warning(`${file.name} compressed but still large`);
                }

                compressedFiles.push(compressed);

                // Create preview
                const preview = URL.createObjectURL(compressed);
                newPreviews.push(preview);
            }

            setPreviews([...previews, ...newPreviews]);
            onImagesSelected(compressedFiles);
            toast.success(`${compressedFiles.length} image(s) added`);
        } catch (error) {
            console.error("Error processing images:", error);
            toast.error("Failed to process images");
        } finally {
            setLoading(false);
            // Reset input
            if (e.target) {
                e.target.value = "";
            }
        }
    };

    const removePreview = (index: number) => {
        const newPreviews = previews.filter((_, i) => i !== index);
        setPreviews(newPreviews);
        // Note: You'd also want to update the parent component about removed images
    };

    const clearAll = () => {
        previews.forEach(URL.revokeObjectURL);
        setPreviews([]);
    };

    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex gap-2 flex-wrap">
                {/* Take Photo Button */}
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={loading || previews.length >= maxFiles}
                    className="flex items-center gap-2"
                >
                    <Camera className="w-4 h-4" />
                    Take Photo
                </Button>

                {/* Choose from Gallery Button */}
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading || previews.length >= maxFiles}
                    className="flex items-center gap-2"
                >
                    <ImageIcon className="w-4 h-4" />
                    Choose from Gallery
                </Button>

                {previews.length > 0 && (
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={clearAll}
                        className="ml-auto"
                    >
                        Clear All
                    </Button>
                )}
            </div>

            {/* Hidden file inputs */}
            <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
                aria-label="Take photo with camera"
            />
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
                aria-label="Choose photos from gallery"
            />

            {/* Image Previews */}
            {previews.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                    {previews.map((preview, index) => (
                        <div
                            key={preview}
                            className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
                        >
                            <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                            <button
                                type="button"
                                onClick={() => removePreview(index)}
                                className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
                                aria-label={`Remove image ${index + 1}`}
                            >
                                <X className="w-4 h-4" />
                            </button>
                            {index === 0 && (
                                <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                    Primary
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {loading && (
                <div className="text-center text-sm text-gray-600">
                    Processing images...
                </div>
            )}

            <p className="text-xs text-gray-500">
                {previews.length}/{maxFiles} images • Max {maxSizeMB}MB per
                image
            </p>
        </div>
    );
}
