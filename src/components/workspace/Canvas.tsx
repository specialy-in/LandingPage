import React, { useCallback, useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Stage, Layer, Image as KonvaImage, Line, Circle, Group, Rect } from 'react-konva';
const StageAny = Stage as any;
const LayerAny = Layer as any;
const GroupAny = Group as any;
const KonvaImageAny = KonvaImage as any;
const LineAny = Line as any;
const CircleAny = Circle as any;
const RectAny = Rect as any;
import { useDropzone, DropzoneOptions } from 'react-dropzone';
import { ImageIcon, Loader2, ZoomIn, ZoomOut, Maximize2, Check, X, Brush, Home } from 'lucide-react';
import { Wall, ProductPlacement } from './types';
import { ToolType } from './LeftToolbar';
import Konva from 'konva';

// Image Interface
export interface CanvasImage {
    id: string;
    url: string;
    timestamp: Date;
    isOriginal: boolean;
    name?: string;
}

interface CanvasProps {
    // Replaced single imageUrl with images array
    images?: CanvasImage[];
    selectedImageId?: string | null;
    onSelectImage?: (id: string) => void;
    // Legacy support (optional for transition)
    imageUrl?: string | null;

    isUploading: boolean;
    uploadProgress: number;
    onFileSelect: (file: File) => void;
    activeTool: ToolType;
    walls: Wall[];
    selectedWallId: string | null;
    isDrawing: boolean;
    currentPoints: number[];
    onCanvasClick: (x: number, y: number) => void;
    onClosePolygon: () => void;
    onCancelDrawing: () => void;
    onEmptyClick?: () => void;
    showWalls?: boolean;
    // Product Placement Props
    pendingPlacements?: ProductPlacement[];
    activePlacementId?: string | null;
    onUpdatePlacementStrokes?: (placementId: string, strokes: number[][]) => void;
    // AI Mask Props
    aiMaskStrokes?: number[][];
    aiBrushSize?: number;
    onUpdateAIMaskStrokes?: (strokes: number[][]) => void;
    isAiBrushActive?: boolean;
}

export interface CanvasHandle {
    getStageRef: () => Konva.Stage | null;
    exportReferenceImage: () => string | null;
    exportMaskImage: () => string | null;
}

// Denormalize 0-1 scale to pixel coordinates
const denormalizePoints = (points: number[], w: number, h: number): number[] =>
    points.map((c, i) => i % 2 === 0 ? c * w : c * h);

export const Canvas = forwardRef<CanvasHandle, CanvasProps>(({
    images = [], // New prop
    selectedImageId, // New prop
    onSelectImage, // New prop
    imageUrl,
    isUploading,
    uploadProgress,
    onFileSelect,
    activeTool,
    walls,
    selectedWallId,
    isDrawing,
    currentPoints,
    onCanvasClick,
    onClosePolygon,
    onCancelDrawing,
    onEmptyClick,
    showWalls = true,
    // Product Placement
    pendingPlacements = [],
    activePlacementId,
    onUpdatePlacementStrokes,
    // AI Mask
    aiMaskStrokes = [],
    aiBrushSize = 50,
    onUpdateAIMaskStrokes,
    isAiBrushActive = false
}, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<Konva.Stage>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    // Map of loaded images: ID -> HTMLImageElement
    const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>({});
    // Legacy support for single image state
    const [image, setImage] = useState<HTMLImageElement | null>(null);

    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    // const [imageSize, setImageSize] = useState({ width: 0, height: 0 }); // Removed as per multi-image support

    // Brush state
    const [isBrushing, setIsBrushing] = useState(false);
    const [currentStroke, setCurrentStroke] = useState<number[]>([]);

    // Constants for Layout
    const GAP = 100;

    // Get active placement
    const activePlacement = pendingPlacements.find(p => p.id === activePlacementId);
    const isPlacementMode = !!activePlacementId && pendingPlacements.length > 0;
    const isAIMode = activeTool === 'ai' && isAiBrushActive;

    // Expose stage ref to parent
    // Expose stage ref to parent
    useImperativeHandle(ref, () => ({
        getStageRef: () => stageRef.current,
        exportReferenceImage: () => {
            // Export selected or first image
            const activeId = selectedImageId || (images.length > 0 ? images[0].id : 'default');
            const img = loadedImages[activeId];
            if (!stageRef.current || !img) return null;

            const stage = stageRef.current;
            const originalWidth = stage.width();
            const originalHeight = stage.height();
            const originalScaleX = stage.scaleX();
            const originalScaleY = stage.scaleY();
            const originalX = stage.x();
            const originalY = stage.y();

            // Create a temp staging for export is complex with infinite canvas
            // For now, simpler approach: rely on the fact that we can isolate the node?
            // Actually, simplest is to just return the image url if we are just "saving" the view?
            // But existing logic creates a dataURL from the stage.
            // Let's defer strict export logic for "infinite canvas" and focus on visuals.
            // Fallback:
            return img.src;
        },
        exportMaskImage: () => {
            // Generate mask for the active image
            const activeId = selectedImageId || (images.length > 0 ? images[0].id : 'default');
            const img = loadedImages[activeId];
            if (!img || aiMaskStrokes.length === 0) return null;

            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;

            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, img.width, img.height);
            ctx.strokeStyle = 'white';
            ctx.fillStyle = 'white';
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = aiBrushSize;

            aiMaskStrokes.forEach(stroke => {
                if (stroke.length < 4) return;
                ctx.beginPath();
                ctx.moveTo(stroke[0], stroke[1]);
                for (let i = 2; i < stroke.length; i += 2) {
                    ctx.lineTo(stroke[i], stroke[i + 1]);
                }
                ctx.stroke();
            });
            return canvas.toDataURL('image/png');
        }
    }));

    // Handle container resize
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight });
            }
        };
        updateDimensions();
        const resizeObserver = new ResizeObserver(updateDimensions);
        if (containerRef.current) resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // Handle mouse move (cursor)
    const handleContainerMouseMove = useCallback((e: React.MouseEvent) => {
        if ((isPlacementMode || isAIMode) && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            // Note: Cursor tracking might need adjustment for Infinite Canvas if we want it to follow "local" coords?
            // But CSS cursor is screen-space usually.
            // Keeping it simple relative to container.
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            containerRef.current.style.setProperty('--mouse-x', `${x}px`);
            containerRef.current.style.setProperty('--mouse-y', `${y}px`);
        }
    }, [isPlacementMode, isAIMode]);

    // Load images
    useEffect(() => {
        if (images.length > 0) {
            images.forEach(imgData => {
                if (loadedImages[imgData.id]) return;
                const img = new window.Image();
                img.crossOrigin = 'anonymous';
                img.src = imgData.url;
                img.onload = () => {
                    setLoadedImages(prev => ({ ...prev, [imgData.id]: img }));
                };
            });
        } else if (imageUrl && !loadedImages['default']) {
            const img = new window.Image();
            img.crossOrigin = 'anonymous';
            img.src = imageUrl;
            img.onload = () => {
                setLoadedImages(prev => ({ ...prev, 'default': img }));
            };
        }
    }, [images, imageUrl]); // Intentionally not including loadedImages in deps to avoid loop

    // Dropzone setup - NO CHANGE needed usually, but I'll keep it short
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) onFileSelect(acceptedFiles[0]);
    }, [onFileSelect]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        maxFiles: 1,
        disabled: isUploading || isPlacementMode,
        multiple: false
    } as any);

    // Zoom controls
    const handleZoomIn = () => setScale(prev => Math.min(prev * 1.2, 3));
    const handleZoomOut = () => setScale(prev => Math.max(prev / 1.2, 0.1));
    const handleFitToScreen = () => {
        let totalWidth = 0;
        let maxHeight = 0;

        const imageList = images.length > 0 ? images.map(i => loadedImages[i.id]).filter(Boolean) : [loadedImages['default']].filter(Boolean);
        if (imageList.length === 0) return;

        imageList.forEach((img, i) => {
            totalWidth += img.width;
            maxHeight = Math.max(maxHeight, img.height);
            if (i < imageList.length - 1) totalWidth += GAP;
        });

        const scaleX = (dimensions.width * 0.9) / totalWidth;
        const scaleY = (dimensions.height * 0.9) / maxHeight;
        const newScale = Math.min(scaleX, scaleY, 1);

        setScale(newScale);
        setPosition({
            x: (dimensions.width - totalWidth * newScale) / 2,
            y: (dimensions.height - maxHeight * newScale) / 2
        });
    };

    // Calculate Image Layout (Memoized)
    const imageLayoutMap = React.useMemo(() => {
        const map: Record<string, number> = {};
        let currentX = 0;
        const list = images.length > 0 ? images : (imageUrl ? [{ id: 'default' }] : []);
        list.forEach(img => {
            const w = loadedImages[img.id]?.width || 0;
            map[img.id] = currentX;
            currentX += w + GAP;
        });
        return map;
    }, [images, imageUrl, loadedImages]);

    // Wheel handler for Ctrl+Scroll zoom and Shift+Scroll pan
    const handleWheel = useCallback((e: WheelEvent) => {
        if (!containerRef.current?.contains(e.target as Node)) return;

        if (e.ctrlKey) {
            // Ctrl + Scroll = Zoom at pointer position
            e.preventDefault();
            const rect = containerRef.current.getBoundingClientRect();
            const pointerX = e.clientX - rect.left;
            const pointerY = e.clientY - rect.top;

            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            const newScale = Math.min(Math.max(scale * zoomFactor, 0.25), 3);

            // Adjust position to zoom at pointer
            const scaleRatio = newScale / scale;
            const newX = pointerX - (pointerX - position.x) * scaleRatio;
            const newY = pointerY - (pointerY - position.y) * scaleRatio;

            setScale(newScale);
            setPosition({ x: newX, y: newY });
        } else if (e.shiftKey) {
            // Shift + Scroll = Horizontal pan
            e.preventDefault();
            setPosition(prev => ({ x: prev.x - e.deltaY, y: prev.y }));
        }
    }, [scale, position]);

    // Attach wheel event listener
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, [handleWheel]);

    // Convert screen coords to image coords (Active Image Aware)
    const screenToImageCoords = (pointer: { x: number; y: number }) => {
        const activeId = selectedImageId || (images.length > 0 ? images[0].id : 'default');
        const imageX = imageLayoutMap[activeId] || 0;

        const x = (pointer.x - position.x) / scale - imageX;
        const y = (pointer.y - position.y) / scale;
        return { x, y };
    };

    // Check if point is within image bounds
    const isWithinImage = (x: number, y: number) => {
        const activeId = selectedImageId || (images.length > 0 ? images[0].id : 'default');
        const img = loadedImages[activeId];
        if (!img) return false;

        return x >= 0 && y >= 0 && x <= img.width && y <= img.height;
    };

    // Brush handlers for product placement AND AI mask mode
    const handleBrushStart = (e: any) => {
        // Handle both AI mode and placement mode
        if (!isPlacementMode && !isAIMode) return;
        if (isPlacementMode && !activePlacement) return;

        const stage = e.target.getStage();
        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        const { x, y } = screenToImageCoords(pointer);
        if (!isWithinImage(x, y)) return;

        setIsBrushing(true);
        setCurrentStroke([x, y]);
    };

    const handleBrushMove = (e: any) => {
        if (!isBrushing) return;
        if (!isPlacementMode && !isAIMode) return;
        if (isPlacementMode && !activePlacement) return;

        const stage = e.target.getStage();
        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        const { x, y } = screenToImageCoords(pointer);
        if (!isWithinImage(x, y)) return;

        setCurrentStroke(prev => [...prev, x, y]);
    };

    const handleBrushEnd = () => {
        if (!isBrushing || currentStroke.length < 4) {
            setIsBrushing(false);
            setCurrentStroke([]);
            return;
        }

        // AI Mode: add to AI mask strokes
        if (isAIMode) {
            const updatedStrokes = [...aiMaskStrokes, currentStroke];
            onUpdateAIMaskStrokes?.(updatedStrokes);
        }
        // Placement Mode: add to placement strokes
        else if (isPlacementMode && activePlacement) {
            const updatedStrokes = [...activePlacement.strokePoints, currentStroke];
            onUpdatePlacementStrokes?.(activePlacement.id, updatedStrokes);
        }

        setIsBrushing(false);
        setCurrentStroke([]);
    };

    // Handle stage click for polygon drawing or deselection
    const handleStageClick = (e: any) => {
        // If in placement mode or AI mode, don't handle as click (brushing handles it)
        if (isPlacementMode || isAIMode) return;

        // If not in walls tool or not drawing, trigger empty click for deselection
        if (activeTool !== 'walls' || !isDrawing) {
            onEmptyClick?.();
            return;
        }

        const stage = e.target.getStage();
        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        const { x, y } = screenToImageCoords(pointer);
        if (!isWithinImage(x, y)) return;

        // Check if clicking first point to close polygon (within 15px)
        if (currentPoints.length >= 6) {
            const firstX = currentPoints[0];
            const firstY = currentPoints[1];
            const dist = Math.sqrt((x - firstX) ** 2 + (y - firstY) ** 2);
            if (dist < 15) {
                onClosePolygon();
                return;
            }
        }

        onCanvasClick(x, y);
    };

    // Check if can finish polygon (3+ points = 6+ coords)
    const canFinish = currentPoints.length >= 6;

    // Render upload state
    if (!imageUrl && !isUploading) {
        return (
            <div ref={containerRef} className="flex-1 flex items-center justify-center bg-slate-950/40">
                <div
                    {...getRootProps()}
                    className={`
                        w-full max-w-lg mx-8 p-12 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all
                        ${isDragActive ? 'border-orange-500 bg-orange-500/10' : 'border-white/10 hover:border-white/30 hover:bg-white/[0.02]'}
                    `}
                >
                    <input {...getInputProps()} />
                    <div className="w-20 h-20 mx-auto mb-6 bg-white/[0.02] rounded-full flex items-center justify-center border border-white/[0.06]">
                        <ImageIcon size={40} className="text-gray-600" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-200 mb-2">Upload Your Room Photo</h3>
                    <p className="text-sm text-gray-500 mb-6">Drag & drop or click to browse</p>
                    <button className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium rounded-lg transition-colors">
                        Choose File
                    </button>
                    <p className="text-xs text-gray-600 mt-4">Supported: JPG, PNG (max 10MB)</p>
                </div>
            </div>
        );
    }

    // Render uploading state
    if (isUploading) {
        return (
            <div ref={containerRef} className="flex-1 flex items-center justify-center bg-slate-950/40">
                <div className="text-center">
                    <Loader2 size={48} className="mx-auto text-orange-500 animate-spin mb-4" />
                    <p className="text-gray-300 font-medium mb-2">Uploading...</p>
                    <div className="w-48 h-2 bg-white/10 rounded-full overflow-hidden mx-auto">
                        <div className="h-full bg-orange-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{Math.round(uploadProgress)}%</p>
                </div>
            </div>
        );
    }

    // Cursor style based on mode
    let cursorStyle = 'default';
    if (activeTool === 'walls' && isDrawing) {
        cursorStyle = 'crosshair';
    } else if (isPlacementMode || isAIMode) {
        cursorStyle = 'none'; // We'll render a custom cursor
    }

    return (
        <div
            ref={containerRef}
            className="flex-1 relative bg-slate-950/40 overflow-hidden"
            onMouseMove={handleContainerMouseMove}
            style={{ cursor: cursorStyle }}
        >
            {/* Placement Active Banner */}
            {isPlacementMode && activePlacement && (
                <div
                    className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 px-4 py-2 
                               bg-slate-900/95 backdrop-blur-xl border rounded-lg shadow-xl"
                    style={{ borderColor: activePlacement.color }}
                >
                    <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: activePlacement.color }}
                    />
                    <span className="text-sm text-white font-medium">
                        Placing: {activePlacement.name}
                    </span>
                    <Brush size={16} className="text-gray-400" />
                    <span className="text-xs text-gray-500">Draw where to place</span>
                </div>
            )}

            {/* Custom Brush Cursor - Product Placement */}
            {isPlacementMode && activePlacement && (
                <div
                    className="pointer-events-none absolute z-50 -translate-x-1/2 -translate-y-1/2
                               rounded-full border-2 opacity-80 shadow-sm"
                    style={{
                        width: 24,
                        height: 24,
                        borderColor: activePlacement.color,
                        backgroundColor: `${activePlacement.color}30`,
                        left: 'var(--mouse-x, -50px)',
                        top: 'var(--mouse-y, -50px)',
                        transition: 'transform 0.05s linear'
                    }}
                    id="brush-cursor"
                />
            )}

            {/* Custom Brush Cursor - AI Mode */}
            {isAIMode && (
                <div
                    className="pointer-events-none absolute z-50 -translate-x-1/2 -translate-y-1/2
                               rounded-full border-2 opacity-70"
                    style={{
                        width: aiBrushSize * scale,
                        height: aiBrushSize * scale,
                        borderColor: '#FF0000',
                        backgroundColor: 'rgba(255, 0, 0, 0.15)',
                        left: 'var(--mouse-x, -50px)',
                        top: 'var(--mouse-y, -50px)',
                        transition: 'width 0.1s, height 0.1s'
                    }}
                    id="ai-brush-cursor"
                />
            )}

            <StageAny
                ref={stageRef}
                width={dimensions.width}
                height={dimensions.height}
                scaleX={scale}
                scaleY={scale}
                x={position.x}
                y={position.y}
                draggable={!isDrawing && !isPlacementMode && !isAIMode}
                onDragEnd={(e: any) => {
                    if (!isDrawing && !isPlacementMode) {
                        setPosition({ x: e.target.x(), y: e.target.y() });
                    }
                }}
                onClick={handleStageClick}
                onTap={handleStageClick}
                onMouseDown={handleBrushStart}
                onMouseMove={handleBrushMove}
                onMouseUp={handleBrushEnd}
                onMouseLeave={handleBrushEnd}
                onTouchStart={handleBrushStart}
                onTouchMove={handleBrushMove}
                onTouchEnd={handleBrushEnd}
            >
                <LayerAny>
                    {(images.length > 0 ? images : (imageUrl ? [{ id: 'default', url: imageUrl, isOriginal: true }] : [])).map(imgData => {
                        const img = loadedImages[imgData.id];
                        if (!img) return null;

                        const xOffset = imageLayoutMap[imgData.id] || 0;
                        const isSelected = selectedImageId ? selectedImageId === imgData.id : imgData.isOriginal;
                        // Focus Mode: Opacity 40% if not selected and tool is active
                        const opacity = activeTool && activeTool !== 'boq' && !isSelected ? 0.4 : 1;

                        const imageWalls = walls.filter(w => w.createdOnImageId === imgData.id || (!w.createdOnImageId && imgData.isOriginal));

                        return (
                            <GroupAny
                                key={imgData.id}
                                x={xOffset}
                                y={0}
                                opacity={opacity}
                                onClick={(e: any) => {
                                    if (!isDrawing && !isPlacementMode && !isAIMode && onSelectImage) {
                                        onSelectImage(imgData.id);
                                        e.cancelBubble = true;
                                    }
                                }}
                            >
                                {/* Base Image */}
                                <KonvaImageAny image={img} />

                                {/* Selected Selection Border */}
                                {isSelected && (
                                    <RectAny
                                        width={img.width}
                                        height={img.height}
                                        stroke="#F97316"
                                        strokeWidth={4}
                                        cornerRadius={4}
                                        listening={false}
                                        shadowColor="#F97316"
                                        shadowBlur={20}
                                        shadowOpacity={0.3}
                                    />
                                )}

                                {/* Walls Layer */}
                                {showWalls && imageWalls.map(wall => (
                                    <GroupAny key={wall.id}>
                                        <LineAny
                                            points={denormalizePoints(wall.polygonPoints, img.width, img.height)}
                                            closed stroke="#f97316" strokeWidth={3}
                                            fill={wall.color ? `${wall.color}40` : 'rgba(59, 130, 246, 0.1)'}
                                            listening={false}
                                        />
                                    </GroupAny>
                                ))}

                                {/* Product Placements - Only on Selected */}
                                {isSelected && pendingPlacements.map(placement => (
                                    <React.Fragment key={placement.id}>
                                        {placement.strokePoints.map((stroke, idx) => (
                                            <LineAny
                                                key={`${placement.id}-stroke-${idx}`}
                                                points={stroke}
                                                stroke={placement.color}
                                                strokeWidth={20}
                                                lineCap="round"
                                                lineJoin="round"
                                                opacity={0.7}
                                                tension={0.5}
                                            />
                                        ))}
                                    </React.Fragment>
                                ))}

                                {/* Drawing Placement Stroke */}
                                {isSelected && isBrushing && activePlacement && currentStroke.length >= 4 && (
                                    <LineAny
                                        points={currentStroke}
                                        stroke={activePlacement.color}
                                        strokeWidth={20}
                                        lineCap="round"
                                        lineJoin="round"
                                        opacity={0.7}
                                        tension={0.5}
                                    />
                                )}

                                {/* AI Mask Layer */}
                                {isSelected && aiMaskStrokes.map((stroke, idx) => (
                                    <LineAny
                                        key={`ai-mask-stroke-${idx}`}
                                        points={stroke}
                                        stroke="rgba(255, 0, 0, 0.4)"
                                        strokeWidth={aiBrushSize}
                                        lineCap="round"
                                        lineJoin="round"
                                        listening={false}
                                    />
                                ))}

                                {/* AI Brush Stroke */}
                                {isSelected && isBrushing && isAIMode && currentStroke.length >= 4 && (
                                    <LineAny
                                        points={currentStroke}
                                        stroke="rgba(255, 0, 0, 0.4)"
                                        strokeWidth={aiBrushSize}
                                        lineCap="round"
                                        lineJoin="round"
                                        listening={false}
                                    />
                                )}

                                {/* Wall Drawing Layer */}
                                {isSelected && isDrawing && currentPoints.length >= 2 && (
                                    <>
                                        <LineAny
                                            points={currentPoints}
                                            stroke="#fbbf24"
                                            strokeWidth={2}
                                            dash={[6, 3]}
                                            lineCap="round"
                                            lineJoin="round"
                                        />
                                        {Array.from({ length: currentPoints.length / 2 }).map((_, i) => {
                                            const x = currentPoints[i * 2];
                                            const y = currentPoints[i * 2 + 1];
                                            const isFirst = i === 0;
                                            return (
                                                <CircleAny
                                                    key={i}
                                                    x={x}
                                                    y={y}
                                                    radius={isFirst && currentPoints.length >= 6 ? 8 : 5}
                                                    fill={isFirst ? '#3b82f6' : '#fbbf24'}
                                                    stroke={isFirst ? '#1d4ed8' : '#d97706'}
                                                    strokeWidth={2}
                                                />
                                            );
                                        })}
                                    </>
                                )}
                            </GroupAny>
                        );
                    })}
                </LayerAny>
            </StageAny>

            {/* Drawing Controls */}
            {
                isDrawing && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-lg px-4 py-2 shadow-xl">
                        <span className="text-xs text-gray-400">
                            {currentPoints.length / 2} point{currentPoints.length !== 2 ? 's' : ''}
                        </span>
                        {canFinish && (
                            <button
                                onClick={onClosePolygon}
                                className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs font-medium rounded flex items-center gap-1"
                            >
                                <Check size={12} /> Finish
                            </button>
                        )}
                        <button
                            onClick={onCancelDrawing}
                            className="px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-medium rounded flex items-center gap-1"
                        >
                            <X size={12} /> Cancel
                        </button>
                    </div>
                )
            }

            {/* Zoom Controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-lg p-1">
                <button onClick={handleZoomOut} className="p-2 hover:bg-white/10 rounded transition-colors" title="Zoom Out (Ctrl+Scroll)">
                    <ZoomOut size={18} className="text-gray-300" />
                </button>
                <span className="text-xs text-gray-400 w-12 text-center">{Math.round(scale * 100)}%</span>
                <button onClick={handleZoomIn} className="p-2 hover:bg-white/10 rounded transition-colors" title="Zoom In (Ctrl+Scroll)">
                    <ZoomIn size={18} className="text-gray-300" />
                </button>
                <div className="w-px h-4 bg-white/10" />
                <button onClick={handleFitToScreen} className="p-2 hover:bg-white/10 rounded transition-colors" title="Fit to Screen">
                    <Maximize2 size={18} className="text-gray-300" />
                </button>
                <button onClick={handleFitToScreen} className="p-2 hover:bg-orange-500/20 rounded transition-colors" title="Reset View">
                    <Home size={18} className="text-orange-400" />
                </button>
            </div>
        </div >
    );
});

Canvas.displayName = 'Canvas';
