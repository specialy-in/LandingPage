import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, serverTimestamp, Timestamp, collection, query, orderBy, limit, getDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { ProjectService } from '../../services/projectService';
import { useAuth } from '../../hooks/useAuth';
import toast, { Toaster } from 'react-hot-toast';
import { ArrowLeft, Download, Plus, Save, ChevronRight, ChevronLeft, Loader2, Edit3, Layers, Grid3X3, Sparkles, DoorOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import { LeftToolbar, ToolType } from './LeftToolbar';
import { RightPanel } from './RightPanel';
import { ImageGallery, ImageVersion } from './ImageGallery';
import { Canvas, CanvasHandle } from './Canvas';
import { WallNamingModal } from './WallNamingModal';
import { PendingChangesIndicator } from './PendingChangesIndicator';
import { ApplyChangesButton, FullScreenLoader } from './ApplyChangesButton';
import { ApplyChangesPill } from './ApplyChangesPill';
import { Wall, PendingChanges, ProductPlacement, PLACEMENT_COLORS, AICredits, AIPromptValidation } from './types';
import { createMarkedImage, validatePolygon } from '../../utils/markedImageUtils';
import { UniversalCatalog } from './UniversalCatalog';
import { CatalogTab, CatalogItem, WallFinish } from './catalogTypes';
import { SaveIndicator } from './SaveIndicator';
import { useAutoSave } from '../../hooks/useAutoSave';
import { useCatalogStore } from '../../stores/useCatalogStore';
import { BOQModal } from './BOQModal';

// --- Coordinate Utility Functions ---
const normalizePoints = (points: number[], w: number, h: number): number[] =>
    points.map((c, i) => i % 2 === 0 ? c / w : c / h);

const denormalizePoints = (points: number[], w: number, h: number): number[] =>
    points.map((c, i) => i % 2 === 0 ? c * w : c * h);

const validateNormalizedPolygon = (points: number[]): boolean => {
    if (points.length < 6) return false;
    return points.every(c => c >= 0 && c <= 1);
};

// Types
interface ProjectImage {
    id: string;
    url: string;
    timestamp: Timestamp;
    isOriginal: boolean;
    changes: string[];
    canvas_state?: any; // Stores walls, floor, and placements state
}

interface Project {
    id: string;
    userId: string;
    name: string;
    roomType: string;
    uploadedImageUrl: string | null;
    images?: ProjectImage[];
    currentImageId?: string;
    lastSaved?: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

const Workspace: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Data State
    const [project, setProject] = useState<Project | null>(null);
    const [walls, setWalls] = useState<Wall[]>([]);

    // UI State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTool, setActiveTool] = useState<ToolType>(null);
    const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
    const [selectedWallId, setSelectedWallId] = useState<string | null>(null);
    const [localImages, setLocalImages] = useState<any[]>([]); // Store mock renders locally to prevent onSnapshot overwrite

    // Drawing UI State
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPoints, setCurrentPoints] = useState<number[]>([]);
    const [showNamingModal, setShowNamingModal] = useState(false);
    const [pendingPolygon, setPendingPolygon] = useState<number[] | null>(null);

    // Pending Changes State
    const [pendingChanges, setPendingChanges] = useState<PendingChanges>({
        walls: {},
        floor: undefined,
        windows: {},
        doors: {}
    });
    const [isApplying, setIsApplying] = useState(false);

    // Rendering State
    const [renderProgress, setRenderProgress] = useState(0);
    const [renderStep, setRenderStep] = useState('');
    const [renderError, setRenderError] = useState<string | null>(null);
    const [imageSize, setImageSize] = useState({ width: 1920, height: 1080 });

    // Misc State
    const [isSaving, setIsSaving] = useState(false);
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isEditingName, setIsEditingName] = useState(false);
    const [editableName, setEditableName] = useState('');

    // Universal Catalog State
    const [showCatalog, setShowCatalog] = useState(false);
    const [catalogTab, setCatalogTab] = useState<CatalogTab>('flooring');

    // BOQ Modal State
    const [showBOQModal, setShowBOQModal] = useState(false);

    // Collapsible Sidebar State
    const [isLeftCollapsed, setIsLeftCollapsed] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1440);
    const [isRightCollapsed, setIsRightCollapsed] = useState(false);
    const [rightHandleFlash, setRightHandleFlash] = useState(false);
    const [leftHandleFlash, setLeftHandleFlash] = useState(false);

    // Product Placement State
    const [pendingPlacements, setPendingPlacements] = useState<ProductPlacement[]>([]);
    const [activePlacementId, setActivePlacementId] = useState<string | null>(null);
    const canvasRef = useRef<CanvasHandle>(null);

    // AI Editor State
    const [aiMaskStrokes, setAiMaskStrokes] = useState<number[][]>([]);
    const [aiBrushSize, setAiBrushSize] = useState(50);
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiPromptError, setAiPromptError] = useState<string | null>(null);
    const [aiReferenceImage, setAiReferenceImage] = useState<File | null>(null);
    const [aiReferencePreview, setAiReferencePreview] = useState<string | null>(null);
    const [aiCredits, setAiCredits] = useState<AICredits>({ used: 0, limit: 5, resetDate: new Date().toISOString() });
    const [isAiApplying, setIsAiApplying] = useState(false);
    const [smartPlaceholder, setSmartPlaceholder] = useState('');
    const [editSuccess, setEditSuccess] = useState<{ prompt: string; time: number; creditUsed: boolean } | null>(null);
    const [aiBrushActive, setAiBrushActive] = useState(false);

    // Reset AI brush when tool changes
    useEffect(() => {
        if (activeTool !== 'ai') {
            setAiBrushActive(false);
        }
    }, [activeTool]);

    // Current image URL helper
    const allImages = [...(project?.images || []), ...localImages];
    const currentImage = allImages.find(img => img.id === selectedImageId);
    const currentImageUrl = currentImage?.url || project?.uploadedImageUrl || null;
    const hasImage = !!currentImageUrl;
    const isRenderedImage = currentImage?.isOriginal === false; // AI-rendered image
    const pendingCount = Object.keys(pendingChanges.walls).length +
        (pendingChanges.floor ? 1 : 0) +
        pendingPlacements.filter(p => p.strokePoints.length > 0).length;

    // --- Update Image Size on Load ---
    useEffect(() => {
        if (!currentImageUrl) return;

        const img = new window.Image();
        img.src = currentImageUrl;
        img.onload = () => {
            setImageSize({ width: img.width, height: img.height });
        };
    }, [currentImageUrl]);

    // --- Auto Save Hook ---
    const { status: saveStatus, lastSaved, debouncedSaveSurfaces, saveImmediate } = useAutoSave(projectId, { walls, floor: pendingChanges.floor });

    // --- Catalog Store ---
    const fetchCatalog = useCatalogStore(state => state.fetchCatalog);
    const catalogProducts = useCatalogStore(state => state.products);
    const getProduct = useCatalogStore(state => state.getProduct);

    // Fetch catalog on mount
    useEffect(() => {
        fetchCatalog();
    }, [fetchCatalog]);

    // Fetch smart AI suggestion when AI tool opens
    useEffect(() => {
        if (activeTool === 'ai' && currentImageUrl && !smartPlaceholder) {
            const fetchSuggestion = async () => {
                try {
                    const response = await fetch('http://localhost:3001/api/suggest-ai-edit', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            imageUrl: currentImageUrl,
                            roomType: project?.roomType || 'Living Room'
                        })
                    });
                    const result = await response.json();
                    if (result.success && result.suggestion) {
                        setSmartPlaceholder(result.suggestion);
                    }
                } catch (err) {
                    console.warn('Failed to fetch smart suggestion:', err);
                }
            };
            fetchSuggestion();
        }
    }, [activeTool, currentImageUrl, project?.roomType, smartPlaceholder]);

    // Auto-dismiss edit success after 3 seconds
    useEffect(() => {
        if (editSuccess) {
            const timer = setTimeout(() => {
                setEditSuccess(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [editSuccess]);

    // Keyboard shortcuts for sidebar toggle
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger if user is typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if (e.key === '[') {
                setIsLeftCollapsed(prev => !prev);
                // Trigger flash animation on handle
                setLeftHandleFlash(true);
                setTimeout(() => setLeftHandleFlash(false), 300);
            } else if (e.key === ']') {
                setIsRightCollapsed(prev => !prev);
                // Trigger flash animation on handle
                setRightHandleFlash(true);
                setTimeout(() => setRightHandleFlash(false), 300);
            }
        };

        const handleResize = () => {
            // Optional: Auto-collapse on very small screens, but let's keep it manual for now to avoid confusion
            if (window.innerWidth < 1024) {
                setIsLeftCollapsed(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // --- Data Fetching ---
    useEffect(() => {
        if (!projectId || !user) return;

        // Listen to main project doc
        const unsubscribeProject = onSnapshot(doc(db, 'projects', projectId), (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                if (data.userId !== user.uid) {
                    setError('Access denied');
                    setLoading(false);
                    return;
                }
                setProject({ id: snapshot.id, ...data } as Project);
                setEditableName(data.name);

                // Always prioritize loading walls from surfaces if available
                if (data.surfaces?.walls) {
                    const surfaceWalls = data.surfaces.walls;
                    // Convert object format to array if needed
                    const loadedWalls = Array.isArray(surfaceWalls)
                        ? surfaceWalls
                        : Object.values(surfaceWalls);
                    if (!isDrawing) {
                        // Only update if data actually changed (prevents infinite loop with auto-save)
                        setWalls(prev => {
                            const prevArr = Array.isArray(prev) ? prev : [];
                            if (JSON.stringify(prevArr) === JSON.stringify(loadedWalls)) {
                                return prev; // No change, return same reference
                            }
                            return loadedWalls as Wall[];
                        });
                    }
                } else if (data.walls && !isDrawing) {
                    // Fallback for legacy - ensure it's an array
                    const legacyWalls = Array.isArray(data.walls)
                        ? data.walls
                        : Object.values(data.walls);
                    setWalls(prev => {
                        const prevArr = Array.isArray(prev) ? prev : [];
                        if (JSON.stringify(prevArr) === JSON.stringify(legacyWalls)) {
                            return prev;
                        }
                        return legacyWalls as Wall[];
                    });
                }

                if (data.currentImageId && !selectedImageId) setSelectedImageId(data.currentImageId);
            } else {
                setError('Project not found');
            }
            setLoading(false);
        }, (err) => {
            console.error(err);
            setError(err.message);
            setLoading(false);
        });

        // Listen to images subcollection
        const unsubscribeImages = onSnapshot(
            query(collection(db, 'projects', projectId, 'images'), orderBy('timestamp', 'desc'), limit(50)),
            (snapshot) => {
                const fetchedImages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                // Merge with local images (optimistic updates)
                // In reality, we just rely on the subcollection data now
                // setLocalImages is less needed if backend saves fast enough, but keep for now
            }
        );

        return () => {
            unsubscribeProject();
            unsubscribeImages();
        };
    }, [projectId, user, selectedImageId]);

    // Auto-save trigger for changes
    useEffect(() => {
        const wallsArr = Array.isArray(walls) ? walls : [];
        if (wallsArr.length > 0) {
            // Convert array to object map for storage
            const wallsMap = wallsArr.reduce((acc, w) => ({ ...acc, [w.id]: w }), {});
            debouncedSaveSurfaces({ walls: wallsMap });
        }
    }, [walls, debouncedSaveSurfaces]);

    // --- Drawing Logic ---
    useEffect(() => {
        const wallsArrForTool = Array.isArray(walls) ? walls : [];
        if (activeTool === 'walls' && !isDrawing && wallsArrForTool.length === 0) setIsDrawing(true);
        else if (activeTool !== 'walls') {
            setIsDrawing(false);
            setCurrentPoints([]);
        }
    }, [activeTool, walls.length, isDrawing]);

    // --- ESC Key Handling ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;

            // Priority 1: Close catalog modal if open
            if (showCatalog) {
                setShowCatalog(false);
                return;
            }

            // Priority 2: Cancel drawing mode if active
            if (isDrawing && currentPoints.length > 0) {
                setCurrentPoints([]);
                toast('Drawing cancelled', { icon: '❌' });
                return;
            }

            // Priority 3: Cancel drawing mode completely
            if (isDrawing) {
                setIsDrawing(false);
                return;
            }

            // Priority 4: Deselect wall if one is selected
            if (selectedWallId) {
                setSelectedWallId(null);
                return;
            }

            // Priority 5: Deselect tool if one is active
            if (activeTool) {
                setActiveTool(null);
                return;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [showCatalog, isDrawing, currentPoints.length, selectedWallId, activeTool]);

    const handleCanvasClick = (x: number, y: number) => setCurrentPoints(prev => [...prev, x, y]);

    const handleClosePolygon = () => {
        if (currentPoints.length >= 6) {
            setPendingPolygon([...currentPoints]);
            setShowNamingModal(true);
        }
    };

    const getNextWallName = () => {
        const wallsArray = Array.isArray(walls) ? walls : [];
        const existingNumbers = wallsArray.map(w => parseInt(w.label.match(/^Wall (\d+)$/)?.[1] || '0')).filter(n => n > 0);
        return `Wall ${(existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0) + 1}`;
    };


    const handleSaveWall = async (name: string) => {
        if (!pendingPolygon || !currentImageUrl) return;

        try {
            // Validate polygon
            const validation = validatePolygon(pendingPolygon, imageSize.width, imageSize.height);
            if (!validation.valid) {
                toast.error(validation.error || 'Invalid polygon');
                return;
            }

            // Check for duplicate name
            const wallsArray = Array.isArray(walls) ? walls : [];
            if (wallsArray.some(w => w.label.toLowerCase() === name.toLowerCase())) {
                toast.error('A wall with this name already exists');
                return;
            }

            const wallId = `wall_${Date.now()}`;
            const loadingToast = toast.loading('Creating wall marker...');

            // Create marked image
            const markedBlob = await createMarkedImage(
                currentImageUrl,
                pendingPolygon,
                imageSize.width,
                imageSize.height
            );

            // Upload marked image to Firebase Storage
            let markedImageUrl = '';
            if (storage && projectId) {
                const markedRef = ref(storage, `projects/${projectId}/marked/${wallId}_marked.png`);
                const uploadTask = uploadBytesResumable(markedRef, markedBlob);

                await new Promise<void>((resolve, reject) => {
                    uploadTask.on('state_changed', null,
                        (error) => reject(error),
                        async () => {
                            markedImageUrl = await getDownloadURL(uploadTask.snapshot.ref);
                            resolve();
                        }
                    );
                });
            }

            // Normalize polygon to 0-1 scale
            const normalizedPoints = normalizePoints(pendingPolygon, imageSize.width, imageSize.height);

            const newWall: Wall = {
                id: wallId,
                label: name,
                polygonPoints: normalizedPoints,
                createdOnImageId: selectedImageId || undefined,
                markedImageUrl,
                markedOnImageId: selectedImageId || undefined
            };

            setWalls(prev => [...(Array.isArray(prev) ? prev : []), newWall]);
            setSelectedWallId(newWall.id);
            setPendingPolygon(null);
            setCurrentPoints([]);
            setIsDrawing(false);
            setShowNamingModal(false);

            toast.dismiss(loadingToast);
            toast.success(`${name} created`);

            // Trigger immediate save for new wall
            saveImmediate(async () => {
                const wallsArr = Array.isArray(walls) ? walls : [];
                const updatedWalls = [...wallsArr, newWall];
                const wallsMap = updatedWalls.reduce((acc, w) => ({ ...acc, [w.id]: w }), {});
                await ProjectService.saveSurfaces(projectId, { walls: wallsMap });
            });

        } catch (error) {
            console.error('Failed to create wall:', error);
            toast.error('Failed to create wall marker. Try again.');
        }
    };

    // --- Add New Wall Handler ---
    const handleAddNewWall = () => {
        if (!hasImage) {
            toast.error('Upload an image first');
            return;
        }
        setActiveTool('walls');
        setIsDrawing(true);
        setSelectedWallId(null);
    };

    // --- Rename Wall Handler ---
    const handleRenameWall = (wallId: string, newName: string) => {
        // Check for duplicate
        const wallsArrForRename = Array.isArray(walls) ? walls : [];
        if (wallsArrForRename.some(w => w.id !== wallId && w.label.toLowerCase() === newName.toLowerCase())) {
            toast.error('A wall with this name already exists');
            return;
        }
        setWalls(prev => (Array.isArray(prev) ? prev : []).map(w => w.id === wallId ? { ...w, label: newName } : w));
        toast.success('Wall renamed');
    };

    // --- Delete Wall Handler ---
    const handleDeleteWall = async (wallId: string) => {
        const wallsArrForFind = Array.isArray(walls) ? walls : [];
        const wall = wallsArrForFind.find(w => w.id === wallId);
        if (!wall) return;

        // Remove from pending changes if present
        if (pendingChanges.walls[wallId]) {
            handleRemoveChange('walls', wallId);
        }

        // Delete marked image from Storage if exists
        if (wall.markedImageUrl && storage && projectId) {
            try {
                const markedRef = ref(storage, `projects/${projectId}/marked/${wallId}_marked.png`);
                // Note: deleteObject would need to be imported from firebase/storage
                // For now, we'll just remove from state
            } catch (e) {
                console.warn('Could not delete marked image:', e);
            }
        }

        setWalls(prev => (Array.isArray(prev) ? prev : []).filter(w => w.id !== wallId));
        if (selectedWallId === wallId) setSelectedWallId(null);
        toast.success('Wall deleted');
    };

    // --- Canvas State Logic ---
    const getCanvasStateSnapshot = () => {
        const wallsArrSnapshot = Array.isArray(walls) ? walls : [];
        return {
            walls: wallsArrSnapshot.reduce((acc, w) => ({ ...acc, [w.id]: w }), {}),
            floor: pendingChanges.floor,
            placements: pendingPlacements
        };
    };

    const restoreCanvasState = (imageId: string) => {
        const image = allImages.find(img => img.id === imageId);
        if (image?.canvas_state) {
            // Restore from snapshot
            const state = image.canvas_state;

            // Restore walls
            if (state.walls) {
                setWalls(state.walls && typeof state.walls === 'object' ? Object.values(state.walls) : []);
            } else {
                setWalls([]);
            }

            // Restore floor
            if (state.floor) {
                handleUpdatePendingChange('floor', 'floor', state.floor);
            } else {
                handleRemoveChange('floor'); // Clear floor if not in snapshot
            }

            // Restore placements
            if (state.placements) {
                setPendingPlacements(state.placements);
            } else {
                setPendingPlacements([]);
            }

            toast.success('Restored items from this version');
        } else {
            // Legacy image or no state - Keep current state or clear? 
            // Better to clear to avoid confusion, or keep if it's the original image?
            // User request: "active workspace state so the polygons... match that specific image"
            // So if no state, maybe likely it's an old render or original.
            // For now, let's keep it safe: do nothing if no state found (preserve current work), 
            // OR clear if it's a generated image without state.

            if (!image?.isOriginal) {
                // It's a generated image but has no state (legacy)
                // Maybe warn user?
                // toast('No editable data for this version');
            }
        }
    };

    // --- Image Selection Handler ---
    const handleSelectImage = (imageId: string) => {
        setSelectedImageId(imageId);
        // Clear all transient state/tools when switching images
        setIsDrawing(false);
        setCurrentPoints([]);
        setSelectedWallId(null);

        // Restore state for this image
        restoreCanvasState(imageId);
    };

    // --- Pending Changes Logic ---
    const handleUpdatePendingChange = (type: 'walls' | 'floor', id: string, data: any) => {
        setPendingChanges(prev => {
            if (type === 'walls') return { ...prev, walls: { ...prev.walls, [id]: data } };
            if (type === 'floor') return { ...prev, floor: data };
            return prev;
        });
    };

    const handleRemoveChange = (type: 'walls' | 'floor', id?: string) => {
        setPendingChanges(prev => {
            if (type === 'walls' && id) {
                const newWalls = { ...prev.walls };
                delete newWalls[id];
                return { ...prev, walls: newWalls };
            }
            if (type === 'floor') return { ...prev, floor: undefined };
            return prev;
        });
    };

    const handleClearAllChanges = () => {
        setPendingChanges({ walls: {}, floor: undefined, windows: {}, doors: {} });
    };

    // --- Catalog Handlers ---
    const handleOpenCatalog = (tab: CatalogTab) => {
        setCatalogTab(tab);
        setShowCatalog(true);
    };

    const handleCatalogSelect = (item: CatalogItem) => {
        // Dispatch based on category, not current tab (handles search results across tabs)
        switch (item.category) {
            case 'flooring':
                handleUpdatePendingChange('floor', 'floor', {
                    materialId: item.id,
                    materialName: item.name,
                    sponsoredProductId: item.isSponsored ? item.id : undefined,
                    price: item.price,
                    brand: item.brand,
                    textureImageUrl: item.imageUrl // Pass image URL so visual logic works if needed
                });
                setActiveTool('flooring');
                break;

            case 'products':
            case 'windows-doors': // Treat windows/doors as placeable products
                // Handle product selection - Enter placement mode
                enterPlacementMode(item);
                break;

            case 'wall-finishes':
                // For now, wall finishes might need a selected wall.
                // If a wall is selected, apply it?
                if (selectedWallId) {
                    const wallItem = item as WallFinish;
                    // Note: type is 'walls', id is selectedWallId
                    handleUpdatePendingChange('walls', selectedWallId, {
                        color: wallItem.colorCode || '#808080',
                        material: wallItem.type === 'wallpaper' ? 'Wallpaper' : 'Paint',
                        finish: wallItem.finish,
                        // Always store product ID so we can display it in the sidebar
                        sponsoredProductId: item.id,
                        sponsoredProductName: item.name,
                        // Store thumbnail URL for display
                        thumbnailUrl: item.imageUrl
                    });
                    toast.success(`${item.name} selected for ${walls.find(w => w.id === selectedWallId)?.label || 'wall'}`);
                } else {
                    // Maybe prompt user to select a wall? Or set active tool to walls?
                    setActiveTool('walls');
                    toast('Select a wall first to apply this finish');
                }
                break;
        }
        setShowCatalog(false);
    };

    // --- Product Placement Handlers ---
    const enterPlacementMode = (product: CatalogItem) => {
        // Check if we already have 5 placements (max colors)
        if (pendingPlacements.length >= PLACEMENT_COLORS.length) {
            toast.error('Maximum 5 products can be placed at once');
            return;
        }

        // Assign next available color
        const usedColors = pendingPlacements.map(p => p.color);
        const availableColor = PLACEMENT_COLORS.find(c => !usedColors.includes(c)) || PLACEMENT_COLORS[0];

        const newPlacement: ProductPlacement = {
            id: `placement_${Date.now()}`,
            productId: product.id,
            name: product.name,
            brand: product.brand || 'Unknown',
            price: product.price || 0,
            buyLink: undefined, // CatalogItem doesn't have buyLink currently
            thumbnail: product.imageUrl,
            productImageUrl: product.imageUrl,
            color: availableColor,
            strokePoints: []
        };

        setPendingPlacements(prev => [...prev, newPlacement]);
        setActivePlacementId(newPlacement.id);
        setActiveTool('products');
        toast.success(`${product.name} added - brush where to place it`);
    };

    const handleUpdatePlacementStrokes = (placementId: string, strokes: number[][]) => {
        setPendingPlacements(prev => prev.map(p =>
            p.id === placementId ? { ...p, strokePoints: strokes } : p
        ));
    };

    const handleRemovePlacement = (placementId: string) => {
        setPendingPlacements(prev => prev.filter(p => p.id !== placementId));
        if (activePlacementId === placementId) {
            setActivePlacementId(null);
        }
        toast.success('Product removed');
    };

    const handleSetActivePlacement = (id: string | null) => {
        setActivePlacementId(id);
    };

    // --- Apply Product Placements ---
    const handleApplyPlacements = async () => {
        if (!projectId || !currentImageUrl || pendingPlacements.length === 0) return;

        // Check that at least one placement has strokes
        const placementsWithStrokes = pendingPlacements.filter(p => p.strokePoints.length > 0);
        if (placementsWithStrokes.length === 0) {
            toast.error('Draw at least one placement area on the canvas');
            return;
        }

        // Validate that every placement has a productImageUrl
        if (placementsWithStrokes.some(p => !p.productImageUrl)) {
            toast.error('Missing product images. Try reselecting products.');
            return;
        }

        setIsApplying(true);
        setRenderProgress(0);
        setRenderStep('Preparing placements...');
        setRenderError(null);

        const estimatedTime = placementsWithStrokes.length * 15;
        const progressInterval = setInterval(() => {
            setRenderProgress(prev => prev >= 95 ? prev : Math.min(prev + (100 / (estimatedTime * 2)), 95));
        }, 500);

        const steps = ['Preparing images...', 'Sending to AI...', 'Rendering products...', 'Finalizing...'];
        let stepIdx = 0;
        const stepInterval = setInterval(() => {
            if (stepIdx < steps.length) {
                setRenderStep(steps[stepIdx]);
                stepIdx++;
            }
        }, estimatedTime * 250);

        try {
            // Generate reference image from canvas (includes brush strokes)
            const referenceImage = canvasRef.current?.exportReferenceImage();
            if (!referenceImage) {
                throw new Error('Failed to generate reference image');
            }

            // Call backend placement endpoint (explicit URL to avoid 404)
            const response = await fetch('http://localhost:3001/api/render-placement', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    originalImage: currentImageUrl,
                    referenceImage,
                    placements: placementsWithStrokes.map(p => ({
                        productId: p.productId,
                        name: p.name,
                        brand: p.brand,
                        price: p.price,
                        color: p.color,
                        // Include high-res URL for backend (zero Firestore reads)
                        highResImageUrl: p.productImageUrl,
                        productImageUrl: p.productImageUrl
                    }))
                })
            });

            clearInterval(progressInterval);
            clearInterval(stepInterval);

            const result = await response.json();

            if (result.success && result.renderedImageUrl) {
                setRenderProgress(100);
                setRenderStep('Complete!');

                // Add to local images for immediate display
                const newImage = {
                    id: result.imageId,
                    url: result.renderedImageUrl,
                    timestamp: Timestamp.now(),
                    isOriginal: false,
                    changes: [`Placed: ${placementsWithStrokes.map(p => p.name).join(', ')}`],
                    canvas_state: getCanvasStateSnapshot()
                };
                setLocalImages(prev => [...prev, newImage]);
                setSelectedImageId(result.imageId);

                // Persist canvas state
                try {
                    updateDoc(doc(db, 'projects', projectId, 'images', result.imageId), {
                        canvas_state: getCanvasStateSnapshot()
                    }).catch(e => console.warn('Failed to persist canvas state:', e));
                } catch (e) { console.warn('Error saving canvas state:', e); }

                // Clear placements
                setPendingPlacements([]);
                setActivePlacementId(null);

                setTimeout(() => {
                    setIsApplying(false);
                    toast.success(`Products placed in ${result.renderTime?.toFixed(1)}s!`);
                }, 1000);
            } else {
                // Log backend details if available
                if (result.details) {
                    console.error('[Placement] Backend Details:', result.details);
                }
                throw new Error(result.error || 'Placement failed');
            }
        } catch (err: any) {
            clearInterval(progressInterval);
            clearInterval(stepInterval);
            console.error('[Placement] Error:', err);
            // Log details from backend if available
            if (err.details) {
                console.error('[Placement] Details:', err.details);
            }
            setRenderError(err.message || 'An unexpected error occurred');
        }
    };

    // ============================================
    // AI EDITOR HANDLERS
    // ============================================

    // Fetch AI credits on mount
    useEffect(() => {
        const fetchAICredits = async () => {
            if (!user) return;
            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    const customAI = data.customAI || {};

                    // Check if month has changed -> reset credits
                    const thisMonth = new Date().toISOString().slice(0, 7);
                    const lastReset = (customAI.lastResetDate || '').slice(0, 7);

                    if (thisMonth !== lastReset) {
                        // Month changed, credits should reset
                        setAiCredits({
                            used: 0,
                            limit: customAI.editsLimit || 5,
                            resetDate: new Date().toISOString()
                        });
                    } else {
                        setAiCredits({
                            used: customAI.editsUsed || 0,
                            limit: customAI.editsLimit || 5,
                            resetDate: customAI.lastResetDate || new Date().toISOString()
                        });
                    }
                }
            } catch (err) {
                console.error('Failed to fetch AI credits:', err);
            }
        };
        fetchAICredits();
    }, [user]);

    // Validate AI prompt
    const validateAIPrompt = useCallback((prompt: string): AIPromptValidation => {
        if (prompt.trim().length < 10) {
            return { valid: false, error: 'Prompt must be at least 10 characters' };
        }

        // Block patterns that overlap with wall/floor tools
        const blockedPatterns = [
            { regex: /change\s*(the\s*)?(wall|walls)/i, error: 'Use the Walls tool to change wall colors' },
            { regex: /paint\s*(the\s*)?(wall|walls)/i, error: 'Use the Walls tool to paint walls' },
            { regex: /change\s*(the\s*)?(floor|flooring)/i, error: 'Use the Flooring tool to change flooring' },
            { regex: /replace\s*(the\s*)?(floor|flooring)/i, error: 'Use the Flooring tool to replace flooring' },
            { regex: /add\s*(a\s*)?(sofa|couch|chair|table|bed|desk)/i, error: 'Use the Products tool to add furniture' },
            { regex: /place\s*(a\s*)?(sofa|couch|chair|table|bed|desk)/i, error: 'Use the Products tool to place furniture' },
        ];

        for (const pattern of blockedPatterns) {
            if (pattern.regex.test(prompt)) {
                return { valid: false, error: pattern.error };
            }
        }

        return { valid: true };
    }, []);

    // Handle prompt change with validation
    const handleAiPromptChange = useCallback((prompt: string) => {
        setAiPrompt(prompt);
        if (prompt.trim().length >= 10) {
            const validation = validateAIPrompt(prompt);
            setAiPromptError(validation.valid ? null : validation.error || null);
        } else {
            setAiPromptError(null);
        }
    }, [validateAIPrompt]);

    // Handle reference image selection
    const handleAiReferenceSelect = useCallback((file: File) => {
        setAiReferenceImage(file);
        const reader = new FileReader();
        reader.onload = (e) => {
            setAiReferencePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    }, []);

    // Handle reference image removal
    const handleAiReferenceRemove = useCallback(() => {
        setAiReferenceImage(null);
        setAiReferencePreview(null);
    }, []);

    // Clear AI mask
    const handleClearAiMask = useCallback(() => {
        setAiMaskStrokes([]);
    }, []);

    // Helper: convert file to base64
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    // Apply AI Edit
    const handleApplyAiEdit = async () => {
        if (!projectId || !currentImageUrl || !user) {
            toast.error('Missing required data');
            return;
        }

        // Validate credits
        const remainingCredits = aiCredits.limit - aiCredits.used;
        if (remainingCredits <= 0) {
            toast.error('No credits remaining. Resets next month.');
            return;
        }

        // Validate mask
        if (aiMaskStrokes.length === 0) {
            toast.error('Brush an area to edit first');
            return;
        }

        // Validate prompt
        const validation = validateAIPrompt(aiPrompt);
        if (!validation.valid) {
            toast.error(validation.error || 'Invalid prompt');
            return;
        }

        // Confirm usage
        const confirmed = window.confirm(
            `This will use 1 AI edit credit.\n${remainingCredits - 1} credit${remainingCredits - 1 !== 1 ? 's' : ''} will remain this month.\n\nContinue?`
        );
        if (!confirmed) return;

        // Generate mask image
        const maskBase64 = canvasRef.current?.exportMaskImage();
        if (!maskBase64) {
            toast.error('Failed to generate mask image');
            return;
        }

        // Prepare reference image if provided
        let referenceBase64 = null;
        if (aiReferenceImage) {
            try {
                referenceBase64 = await fileToBase64(aiReferenceImage);
            } catch (err) {
                console.warn('Failed to convert reference image:', err);
            }
        }

        setIsAiApplying(true);
        const startTime = Date.now();

        try {
            // Frontend validation logging
            console.log('🎨 Custom AI Edit - Sending request:');
            console.log('  projectId:', projectId);
            console.log('  userId:', user.uid);
            console.log('  userEmail:', user.email);
            console.log('  currentImageUrl:', currentImageUrl?.substring(0, 100));
            console.log('  aiPrompt:', aiPrompt?.substring(0, 50));

            if (!currentImageUrl) {
                toast.error('No image selected for editing');
                setIsAiApplying(false);
                return;
            }

            const response = await fetch('http://localhost:3001/api/custom-ai-edit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    userId: user.uid,
                    userEmail: user.email,
                    currentImageUrl,
                    maskImageBase64: maskBase64,
                    prompt: aiPrompt,
                    referenceImageBase64: referenceBase64,
                    brushSize: aiBrushSize
                })
            });

            const result = await response.json();

            if (result.success && result.renderedImageUrl) {
                // Calculate render time
                const endTime = Date.now();
                const renderTime = (endTime - startTime) / 1000;

                // Add to local images
                const newImage = {
                    id: result.imageId,
                    url: result.renderedImageUrl,
                    timestamp: Timestamp.now(),
                    isOriginal: false,
                    changes: [`AI Edit: ${aiPrompt.slice(0, 50)}${aiPrompt.length > 50 ? '...' : ''}`],
                    canvas_state: getCanvasStateSnapshot()
                };
                setLocalImages(prev => [...prev, newImage]);
                setSelectedImageId(result.imageId);

                // Update credits locally (backend already incremented)
                setAiCredits(prev => ({ ...prev, used: prev.used + 1 }));

                // Set edit success for summary panel
                setEditSuccess({
                    prompt: aiPrompt,
                    time: renderTime,
                    creditUsed: true
                });

                // Clear AI state
                setAiMaskStrokes([]);
                setAiPrompt('');
                setAiPromptError(null);
                setAiReferenceImage(null);
                setAiReferencePreview(null);
                setSmartPlaceholder(''); // Reset to fetch new suggestion

                toast.success('AI edit applied successfully!');
            } else {
                throw new Error(result.error || 'AI edit failed');
            }
        } catch (err: any) {
            console.error('[AI Edit] Error:', err);
            toast.error(err.message || 'Failed to apply AI edit');
        } finally {
            setIsAiApplying(false);
        }
    };


    // --- Apply Changes (API Call) ---
    const buildChangesArray = () => {
        const changes: any[] = [];
        const wallsArrForChanges = Array.isArray(walls) ? walls : [];
        (Object.entries(pendingChanges.walls) as [string, any][]).forEach(([wallId, change]) => {
            const wall = wallsArrForChanges.find(w => w.id === wallId);
            if (wall) {
                changes.push({
                    type: 'wall',
                    wallId,
                    polygonPoints: wall.polygonPoints,
                    color: change.color,
                    sponsoredProductId: change.sponsoredProductId,
                    sponsoredProductName: change.sponsoredProductName,
                    label: change.label
                });
            }
        });
        if (pendingChanges.floor) {
            changes.push({
                type: 'floor',
                material: pendingChanges.floor.materialName,
                materialId: pendingChanges.floor.materialId,
                sponsoredProductId: pendingChanges.floor.sponsoredProductId,
                textureImageUrl: pendingChanges.floor.textureImageUrl,
                customPrompt: pendingChanges.floor.customPrompt,
                price: pendingChanges.floor.price,
                brand: pendingChanges.floor.brand
            });
        }
        return changes;
    };

    const handleApplyChanges = async () => {
        if (!projectId || !currentImageUrl) return;

        setIsApplying(true);
        setRenderProgress(0);
        setRenderStep('Preparing changes...');
        setRenderError(null);

        // Build changes array and convert custom image file to base64 if present
        const changes = buildChangesArray();

        // Convert custom flooring image file to base64 if present
        if (pendingChanges.floor?.customImageFile) {
            const file = pendingChanges.floor.customImageFile;
            const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target?.result as string);
                reader.readAsDataURL(file);
            });
            // Find and update the floor change with base64
            const floorChange = changes.find((c: any) => c.type === 'floor');
            if (floorChange) {
                floorChange.customImageBase64 = base64;
            }
        }

        const estimatedTime = changes.length * 10;

        const progressInterval = setInterval(() => {
            setRenderProgress(prev => prev >= 95 ? prev : Math.min(prev + (100 / (estimatedTime * 2)), 95));
        }, 500);

        const steps = ['Downloading image...', 'Creating regions...', 'Calling AI...', 'Processing...', 'Finalizing...'];
        let stepIndex = 0;
        const stepInterval = setInterval(() => {
            stepIndex = Math.min(stepIndex + 1, steps.length - 1);
            setRenderStep(steps[stepIndex]);
        }, 3000);

        try {
            const apiUrl = 'http://localhost:3001';
            const response = await fetch(`${apiUrl}/api/render-changes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    currentImageUrl,
                    changes,
                    canvasWidth: 800,
                    canvasHeight: 600,
                    imageWidth: imageSize.width,
                    imageHeight: imageSize.height
                })
            });

            clearInterval(progressInterval);
            clearInterval(stepInterval);

            const result = await response.json();

            if (result.success) {
                setRenderProgress(100);
                setRenderStep('Complete!');

                const wallsArrForUpdate = Array.isArray(walls) ? walls : [];
                const updatedWalls = wallsArrForUpdate.map(w => {
                    const change = pendingChanges.walls[w.id];
                    if (change) {
                        return { ...w, color: change.color, sponsoredProductId: change.sponsoredProductId, sponsoredProductName: change.sponsoredProductName };
                    }
                    return w;
                });
                setWalls(updatedWalls);

                // Add the new image to the project locally (for mock mode without Firebase)
                if (result.renderedImageUrl && project) {
                    console.log('[Render] ✅ Success! Adding image to project:', {
                        imageId: result.imageId,
                        urlLength: result.renderedImageUrl?.length,
                        urlStart: result.renderedImageUrl?.substring(0, 50)
                    });

                    const newImage = {
                        id: result.imageId,
                        url: result.renderedImageUrl,
                        timestamp: { toDate: () => new Date() } as any,
                        isOriginal: false,
                        changes: Object.values(pendingChanges.walls).map((c: any) => `${c.label}: ${c.color}`),
                        canvas_state: getCanvasStateSnapshot()
                    };
                    setLocalImages(prev => [...prev, newImage]);

                    // Persist canvas state to Firestore (since backend might not have it)
                    try {
                        const imageRef = doc(db, 'projects', projectId, 'images', result.imageId);
                        // We use setDoc with merge because we are unsure if backend finished writing or if we are writing first
                        // But typically backend returns ID meaning it created it? 
                        // Let's use updateDoc and catch error, or setDoc with merge: true
                        // Safest is updateDoc if we assume it exists, but setDoc with merge is consistent.
                        // However, backend likely writes metadata. 
                        // Let's just update the canvas_state field.
                        updateDoc(imageRef, {
                            canvas_state: getCanvasStateSnapshot()
                        }).catch(e => console.warn('Failed to persist canvas state:', e));
                    } catch (e) {
                        console.warn('Error saving canvas state:', e);
                    }

                    // Set selected image ID immediately (same render cycle)
                    console.log('[Render] Setting selectedImageId to:', result.imageId);
                    setSelectedImageId(result.imageId);
                } else {
                    console.log('[Render] ⚠️ No renderedImageUrl in result:', result);
                }

                setTimeout(() => {
                    handleClearAllChanges();
                    setIsApplying(false);
                    toast.success(`Changes applied in ${result.renderTime?.toFixed(1)}s!`);
                }, 1000);
            } else {
                throw new Error(result.error || 'Rendering failed');
            }
        } catch (err: any) {
            clearInterval(progressInterval);
            clearInterval(stepInterval);
            console.error('[Render] Error:', err);
            setRenderError(err.message || 'An unexpected error occurred');
        }
    };

    const handleDismissRenderError = () => {
        setRenderError(null);
        setIsApplying(false);
    };

    // --- File Upload ---
    const handleFileSelect = useCallback(async (file: File) => {
        if (!projectId || !user) return;
        setIsUploading(true);
        setUploadProgress(0);
        try {
            const storageRef = ref(storage, `projects/${projectId}/original_${Date.now()}.jpg`);
            const uploadTask = uploadBytesResumable(storageRef, file);
            uploadTask.on('state_changed',
                (snap) => setUploadProgress((snap.bytesTransferred / snap.totalBytes) * 100),
                (err) => { console.error(err); toast.error('Upload failed'); setIsUploading(false); },
                async () => {
                    const url = await getDownloadURL(uploadTask.snapshot.ref);
                    const newImageId = `img_${Date.now()}`;
                    await updateDoc(doc(db, 'projects', projectId), {
                        images: [{ id: newImageId, url, timestamp: Timestamp.now(), isOriginal: true, changes: [] }],
                        currentImageId: newImageId,
                        uploadedImageUrl: url,
                        updatedAt: serverTimestamp()
                    });
                    setSelectedImageId(newImageId);
                    setIsUploading(false);
                    toast.success('Image uploaded');
                }
            );
        } catch (err) { console.error(err); toast.error('Upload failed'); setIsUploading(false); }
    }, [projectId, user]);

    // --- Render ---
    if (loading) return <div className="h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-orange-500" size={48} /></div>;
    if (error) return <div className="h-screen bg-slate-950 flex items-center justify-center text-red-400">{error}</div>;

    const changesForLoader = [
        ...Object.values(pendingChanges.walls).map((c: any) => ({ label: c.label, color: c.color })),
        ...(pendingChanges.floor ? [{ label: 'Floor', color: pendingChanges.floor.materialName }] : [])
    ];

    return (
        <>
            <Toaster position="bottom-right" toastOptions={{ style: { background: '#18181b', color: '#fff', border: '1px solid #27272a' } }} />

            <FullScreenLoader
                isVisible={isApplying}
                count={pendingCount}
                progress={renderProgress}
                currentStep={renderStep}
                changes={changesForLoader}
                error={renderError || undefined}
                onDismissError={handleDismissRenderError}
            />

            <WallNamingModal
                isOpen={showNamingModal}
                defaultName={getNextWallName()}
                existingNames={(Array.isArray(walls) ? walls : []).map(w => w.label)}
                onSave={handleSaveWall}
                onCancel={() => { setShowNamingModal(false); setPendingPolygon(null); }}
            />

            <BOQModal
                isOpen={showBOQModal}
                onClose={() => setShowBOQModal(false)}
                projectName={project?.name || 'Untitled Project'}
                selectedImageUrl={currentImageUrl || undefined}
                selectedImageName={currentImage?.name || (currentImage?.isOriginal ? 'Original' : 'Render')}
            />

            <ApplyChangesButton pendingCount={pendingCount} onApply={handleApplyChanges} isApplying={isApplying} />

            <div className={`h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-zinc-950 flex flex-col transition-all duration-300 ${showBOQModal ? 'blur-md scale-[0.98] opacity-60 pointer-events-none' : ''}`}>
                {/* Header */}
                <header className="h-16 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 flex items-center px-4 shrink-0">
                    <div className="flex items-center gap-4 flex-1">
                        <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white/5 rounded-lg">
                            <ArrowLeft size={20} className="text-gray-400" />
                        </button>
                        <div className="flex items-center gap-2 group cursor-pointer hover:bg-white/5 px-3 py-1.5 rounded-lg transition-all">
                            <h1 className="text-lg font-medium text-white">{project?.name || 'Untitled'}</h1>
                            <Edit3 size={14} className="text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </div>
                    <div className="flex-1 flex justify-center">
                        <PendingChangesIndicator pendingChanges={pendingChanges} onClearAll={handleClearAllChanges} onRemoveChange={handleRemoveChange} />
                    </div>
                    <div className="flex items-center gap-3 flex-1 justify-end">
                        <SaveIndicator status={saveStatus} lastSaved={lastSaved} />
                        <button className="px-4 py-2 bg-white/5 text-white text-sm rounded-lg flex items-center gap-2" onClick={() => setIsExportOpen(true)}><Download size={16} /> Export</button>
                    </div>
                </header>

                {/* Body */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Sidebar without Persistent Handle */}
                    <motion.div
                        initial={false}
                        animate={{ width: isLeftCollapsed ? 0 : 240 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="relative flex flex-shrink-0 z-20"
                    >
                        <div className="w-[240px] h-full overflow-hidden">
                            <LeftToolbar
                                activeTool={activeTool}
                                onToolSelect={(t) => {
                                    if (t === 'boq') {
                                        setShowBOQModal(true);
                                    } else {
                                        setActiveTool(t);
                                    }
                                }}
                                disabled={!hasImage}
                                walls={walls}
                                selectedWallId={selectedWallId}
                                onSelectWall={setSelectedWallId}
                                onEditWall={() => { }}
                                onDeleteWall={handleDeleteWall}
                                onAddNewWall={handleAddNewWall}
                                onRenameWall={handleRenameWall}
                                isDrawing={isDrawing}
                                pendingFloor={pendingChanges.floor}
                                hasPendingPlacements={pendingPlacements.length > 0}
                                selectedImageName={currentImage?.name || (currentImage?.isOriginal ? 'Original' : undefined)}
                            />
                        </div>
                    </motion.div>

                    <div className="flex-1 flex flex-col overflow-hidden relative">
                        <Canvas
                            ref={canvasRef}
                            images={allImages}
                            selectedImageId={selectedImageId}
                            onSelectImage={(id) => setSelectedImageId(id)}
                            imageUrl={currentImageUrl}
                            isUploading={isUploading}
                            uploadProgress={uploadProgress}
                            onFileSelect={handleFileSelect}
                            activeTool={activeTool}
                            walls={walls}
                            selectedWallId={selectedWallId}
                            isDrawing={isDrawing}
                            currentPoints={currentPoints}
                            onCanvasClick={handleCanvasClick}
                            onClosePolygon={handleClosePolygon}
                            onCancelDrawing={() => { setIsDrawing(false); setCurrentPoints([]); }}
                            onEmptyClick={() => {
                                // Deselect wall first, then tool if wall was already null
                                if (selectedWallId) {
                                    setSelectedWallId(null);
                                } else if (activeTool) {
                                    setActiveTool(null);
                                }
                            }}
                            showWalls={!isRenderedImage}
                            // Removed imageSize props as Canvas now handles multiple images internally
                            pendingPlacements={pendingPlacements}
                            activePlacementId={activePlacementId}
                            onUpdatePlacementStrokes={handleUpdatePlacementStrokes}
                            // AI Mask Props
                            aiMaskStrokes={aiMaskStrokes}
                            aiBrushSize={aiBrushSize}
                            onUpdateAIMaskStrokes={setAiMaskStrokes}
                            isAiBrushActive={aiBrushActive}
                        />

                        {/* Floating Sidebar Toggles - Always Visible */}
                        {/* Left Sidebar Toggle */}
                        <button
                            onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full 
                                     bg-slate-800/90 backdrop-blur-md border border-white/10 text-white 
                                     hover:bg-orange-500 hover:border-orange-500 hover:scale-110 
                                     transition-all shadow-lg"
                            title={isLeftCollapsed ? "Expand Tools" : "Collapse Tools"}
                        >
                            {isLeftCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                        </button>

                        {/* Right Sidebar Toggle */}
                        <button
                            onClick={() => setIsRightCollapsed(!isRightCollapsed)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full 
                                     bg-slate-800/90 backdrop-blur-md border border-white/10 text-white 
                                     hover:bg-orange-500 hover:border-orange-500 hover:scale-110 
                                     transition-all shadow-lg"
                            title={isRightCollapsed ? "Expand Properties" : "Collapse Properties"}
                        >
                            {isRightCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                        </button>
                    </div>

                    {/* Right Sidebar without Persistent Handle */}
                    <motion.div
                        initial={false}
                        animate={{ width: isRightCollapsed ? 0 : 450 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="relative border-l border-white/5 bg-[#0a0a0a] flex flex-shrink-0 z-20"
                    >
                        {/* Right Panel Content */}
                        <div className="w-[450px] h-full overflow-hidden">
                            <RightPanel
                                activeTool={activeTool}
                                hasImage={hasImage}
                                walls={walls}
                                selectedWallId={selectedWallId}
                                pendingChanges={pendingChanges}
                                onSelectWall={setSelectedWallId}
                                onUpdatePendingChange={handleUpdatePendingChange}
                                onClearFloorChange={() => handleRemoveChange('floor')}
                                onOpenCatalog={handleOpenCatalog}
                                pendingPlacements={pendingPlacements}
                                activePlacementId={activePlacementId}
                                onSetActivePlacement={handleSetActivePlacement}
                                onRemovePlacement={handleRemovePlacement}
                                onApplyPlacements={handleApplyPlacements}
                                // AI Props
                                aiCredits={project?.aiCredits}
                                aiBrushSize={aiBrushSize}
                                onAiBrushSizeChange={setAiBrushSize}
                                aiPrompt={aiPrompt}
                                onAiPromptChange={setAiPrompt}
                                aiPromptError={aiPromptError}
                                aiMaskStrokes={aiMaskStrokes}
                                onClearAiMask={() => setAiMaskStrokes([])}
                                aiReferencePreview={aiReferencePreview}
                                onAiReferenceSelect={handleAiReferenceSelect}
                                onAiReferenceRemove={() => {
                                    setAiReferenceImage(null);
                                    setAiReferencePreview(null);
                                }}
                                onApplyAiEdit={handleApplyAiEdit}
                                isAiApplying={isAiApplying}
                                smartPlaceholder={smartPlaceholder}
                                editSuccess={editSuccess}
                                onClearEditSuccess={() => setEditSuccess(null)}
                                aiBrushActive={aiBrushActive}
                                onAiBrushActiveChange={setAiBrushActive}
                                // General Apply Changes (Footer)
                                onApplyChanges={handleApplyChanges}
                                isApplyingChanges={isApplying}
                            />
                        </div>
                    </motion.div>

                    {/* Floating Apply Changes Pill */}
                    <ApplyChangesPill
                        pendingCount={(activeTool === 'ai' && aiMaskStrokes.length > 0) ? 1 : pendingCount}
                        isLoading={isApplying}
                        onApply={() => {
                            if (activeTool === 'ai') {
                                handleApplyAiEdit();
                            } else if (pendingPlacements.some(p => p.strokePoints.length > 0)) {
                                handleApplyPlacements();
                            } else {
                                handleApplyChanges();
                            }
                        }}
                    />
                </div>


                {/* Universal Catalog Modal */}
                <UniversalCatalog
                    isOpen={showCatalog}
                    onClose={() => setShowCatalog(false)}
                    openToTab={catalogTab}
                    roomType={project?.roomType || 'Living Room'}
                    onSelectMaterial={handleCatalogSelect}
                    onSelectProduct={handleCatalogSelect}
                />
            </div>
        </>
    );
};

export default Workspace;
