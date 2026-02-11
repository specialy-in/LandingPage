import React, { useState } from 'react';
import {
    Layers,
    Grid3X3,
    DoorClosed,
    Package,
    Sparkles,
    FileText,
    ChevronDown,
    ChevronRight,
    Edit2,
    Trash2,
    Plus,
    Clock,
    AppWindow,
    Check
} from 'lucide-react';
import { Wall, FloorChange } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { CatalogTab } from './catalogTypes';

export type ToolType = 'walls' | 'flooring' | 'windows' | 'doors' | 'products' | 'ai' | 'boq' | null;

// ============================================
// PROPS INTERFACE
// ============================================

interface LeftToolbarProps {
    activeTool: ToolType;
    onToolSelect: (tool: ToolType) => void;
    disabled: boolean;
    walls: Wall[];
    selectedWallId: string | null;
    onSelectWall: (id: string) => void;
    onEditWall: (id: string) => void;
    onDeleteWall: (id: string) => void;
    onAddNewWall: () => void;
    onRenameWall?: (id: string, newName: string) => void;
    isDrawing: boolean;
    pendingFloor?: FloorChange;
    historyCount?: number;
    boqEstimate?: number;
    hasPendingPlacements?: boolean;
    selectedImageName?: string;
}

// ============================================
// HIDDEN SCROLLBAR STYLES
// ============================================
const scrollbarHideStyles: React.CSSProperties = {
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
};

// ============================================
// MAIN COMPONENT
// ============================================

export const LeftToolbar: React.FC<LeftToolbarProps> = ({
    activeTool,
    onToolSelect,
    disabled,
    walls,
    selectedWallId,
    onSelectWall,
    onEditWall,
    onDeleteWall,
    onAddNewWall,
    onRenameWall,
    isDrawing,
    pendingFloor,
    historyCount = 0,
    boqEstimate = 0,
    hasPendingPlacements = false,
    selectedImageName
}) => {
    // Expanded sections state (for Walls list mainly)
    const [wallsExpanded, setWallsExpanded] = useState(true);
    const [editingWallId, setEditingWallId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');

    const startEditing = (e: React.MouseEvent, id: string, currentName: string) => {
        e.stopPropagation();
        setEditingWallId(id);
        setEditingName(currentName);
    };

    const saveEditing = (id: string) => {
        if (editingName.trim() && onRenameWall) {
            onRenameWall(id, editingName.trim());
        }
        setEditingWallId(null);
    };

    const GroupLabel = ({ children }: { children: React.ReactNode }) => (
        <div className="px-4 py-2 mt-2 mb-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                {children}
            </span>
        </div>
    );

    const ToolButton = ({
        id,
        icon: Icon,
        label,
        isActive,
        onClick,
        showChevron = false,
        expanded = false,
        indicator = null
    }: {
        id: ToolType,
        icon: any,
        label: string,
        isActive: boolean,
        onClick: () => void,
        showChevron?: boolean,
        expanded?: boolean,
        indicator?: React.ReactNode
    }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`w-full flex items-center justify-between py-2 px-4 mx-2 rounded-lg transition-all relative text-sm group max-w-[calc(100%-16px)]
                ${isActive
                    ? 'bg-orange-500/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] border border-orange-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.03] border border-transparent'}`}
        >
            <div className="flex items-center gap-3">
                <div className={`${isActive ? 'text-orange-400 drop-shadow-[0_0_6px_rgba(249,115,22,0.4)]' : 'text-gray-500 group-hover:text-gray-300'}`}>
                    <Icon size={16} />
                </div>
                <span className="font-medium">{label}</span>
            </div>

            <div className="flex items-center gap-2">
                {indicator}
                {showChevron && (
                    <ChevronRight
                        size={14}
                        className={`text-gray-500 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
                    />
                )}
            </div>
        </button>
    );

    return (
        <div className="flex flex-col h-full bg-slate-950/90 backdrop-blur-xl border-r border-white/[0.06]">
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto py-2 space-y-1" style={scrollbarHideStyles}>

                {/* --- SURFACES GROUP --- */}
                <GroupLabel>Surfaces</GroupLabel>

                {/* Walls Tool */}
                <div>
                    <ToolButton
                        id="walls"
                        icon={Layers}
                        label="Walls"
                        isActive={activeTool === 'walls'}
                        onClick={() => {
                            onToolSelect('walls');
                            setWallsExpanded(!wallsExpanded);
                        }}
                        showChevron={true}
                        expanded={wallsExpanded}
                        indicator={
                            <span className="bg-white/10 text-gray-400 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                                {walls.length}
                            </span>
                        }
                    />

                    {/* Collapsible Wall List */}
                    <AnimatePresence>
                        {wallsExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                <div className="pl-4 pr-2 py-1 space-y-0.5">
                                    {walls.map(wall => (
                                        <div
                                            key={wall.id}
                                            onClick={() => onSelectWall(wall.id)}
                                            className={`group flex items-center justify-between py-1.5 px-3 rounded-md text-xs cursor-pointer transition-all border
                                                ${selectedWallId === wall.id
                                                    ? 'bg-orange-500/10 border-orange-500/20 text-orange-200'
                                                    : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]'}`}
                                        >
                                            <div className="flex items-center gap-2 truncate flex-1">
                                                <div className={`w-1.5 h-1.5 rounded-full ${selectedWallId === wall.id ? 'bg-orange-500' : 'bg-gray-600'}`} />
                                                {editingWallId === wall.id ? (
                                                    <input
                                                        type="text"
                                                        value={editingName}
                                                        onChange={(e) => setEditingName(e.target.value)}
                                                        onBlur={() => saveEditing(wall.id)}
                                                        onKeyDown={(e) => e.key === 'Enter' && saveEditing(wall.id)}
                                                        autoFocus
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="bg-black/50 text-white px-1 rounded w-full border border-orange-500/50 outline-none"
                                                    />
                                                ) : (
                                                    <span className="truncate">{wall.label}</span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {editingWallId !== wall.id && (
                                                    <>
                                                        <button
                                                            onClick={(e) => startEditing(e, wall.id, wall.label)}
                                                            className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"
                                                        >
                                                            <Edit2 size={10} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); onDeleteWall(wall.id); }}
                                                            className="p-1 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400"
                                                        >
                                                            <Trash2 size={10} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Add Wall Button */}
                                    <button
                                        onClick={onAddNewWall}
                                        className="w-full flex items-center justify-center gap-1.5 py-1.5 mt-1 rounded-md border border-dashed border-white/10 text-gray-500 hover:text-orange-400 hover:border-orange-500/30 text-xs transition-all"
                                    >
                                        <Plus size={10} />
                                        <span>Add Wall segment</span>
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Flooring Tool */}
                <ToolButton
                    id="flooring"
                    icon={Grid3X3}
                    label="Flooring"
                    isActive={activeTool === 'flooring'}
                    onClick={() => onToolSelect('flooring')}
                    indicator={
                        pendingFloor ? (
                            <span className="bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                <Check size={8} /> Active
                            </span>
                        ) : null
                    }
                />

                <div className="h-2" />

                {/* --- OPENINGS GROUP --- */}
                <GroupLabel>Openings</GroupLabel>

                {/* Windows Tool */}
                <ToolButton
                    id="windows"
                    icon={AppWindow}
                    label="Windows"
                    isActive={activeTool === 'windows'}
                    onClick={() => onToolSelect('windows')}
                />

                {/* Doors Tool */}
                <ToolButton
                    id="doors"
                    icon={DoorClosed}
                    label="Doors"
                    isActive={activeTool === 'doors'}
                    onClick={() => onToolSelect('doors')}
                />

                <div className="h-2" />

                {/* --- ELEMENTS GROUP --- */}
                <GroupLabel>Elements</GroupLabel>

                {/* Products Tool */}
                <ToolButton
                    id="products"
                    icon={Package}
                    label="Products"
                    isActive={activeTool === 'products'}
                    onClick={() => onToolSelect('products')}
                    indicator={
                        hasPendingPlacements ? (
                            <span className="bg-orange-500 w-2 h-2 rounded-full ring-2 ring-slate-950" />
                        ) : null
                    }
                />

                {/* Custom AI Tool */}
                <ToolButton
                    id="ai"
                    icon={Sparkles}
                    label="Custom AI"
                    isActive={activeTool === 'ai'}
                    onClick={() => onToolSelect('ai')}
                    indicator={<span className="text-[10px] font-bold text-amber-500">NEW</span>}
                />

                <div className="h-2" />

                {/* --- MANAGEMENT GROUP --- */}
                <GroupLabel>Management</GroupLabel>

                {/* BOQ Tool */}
                <ToolButton
                    id="boq"
                    icon={FileText}
                    label={selectedImageName ? `BOQ: ${selectedImageName}` : 'Project BOQ'}
                    isActive={activeTool === 'boq'}
                    onClick={() => onToolSelect('boq')}
                    indicator={
                        boqEstimate > 0 ? (
                            <span className="text-[10px] font-medium text-gray-500">₹{(boqEstimate / 1000).toFixed(1)}k</span>
                        ) : null
                    }
                />

            </div>

            {/* Version / Info Footer */}
            <div className="p-4 border-t border-white/[0.06] text-[10px] text-gray-600 font-mono text-center">
                DesignFlow v2.4 Beta
            </div>
        </div>
    );
};
