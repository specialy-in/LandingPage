import React from 'react';
import { Check, Clock } from 'lucide-react';

export interface ImageVersion {
    id: string;
    url: string;
    timestamp: Date;
    isOriginal: boolean;
    changes: string[];
}

interface ImageGalleryProps {
    images: ImageVersion[];
    selectedImageId: string | null;
    onSelectImage: (id: string) => void;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
    images,
    selectedImageId,
    onSelectImage
}) => {
    if (images.length === 0) {
        return null;
    }

    return (
        <div className="h-24 bg-slate-950/40 border-b border-white/5 px-4 py-2">
            <div className="flex items-center gap-2 h-full overflow-x-auto">
                <span className="text-xs text-gray-500 mr-2 flex items-center gap-1 shrink-0">
                    <Clock size={12} />
                    History
                </span>
                {images.map((image, index) => (
                    <button
                        key={image.id}
                        onClick={() => onSelectImage(image.id)}
                        className={`
                            relative h-16 w-24 rounded-lg overflow-hidden border-2 transition-all shrink-0
                            ${selectedImageId === image.id
                                ? 'border-orange-500 ring-2 ring-orange-500/30'
                                : 'border-white/10 hover:border-white/30'
                            }
                        `}
                    >
                        <img
                            src={image.url}
                            alt={`Version ${index + 1}`}
                            className="w-full h-full object-cover"
                        />
                        {image.isOriginal && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[9px] text-center py-0.5 text-gray-300">
                                Original
                            </div>
                        )}
                        {selectedImageId === image.id && (
                            <div className="absolute top-1 right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                                <Check size={10} className="text-white" />
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};
