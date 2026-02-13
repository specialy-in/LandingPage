import React, { useState, useEffect, useRef } from 'react';
import {
    Plus, X, Loader2, Search, ArrowRight,
    Sparkles, Home, Sofa, BedDouble, ChefHat, UtensilsCrossed, BookOpen, Briefcase, Bath
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, getDoc, doc, Timestamp } from 'firebase/firestore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { PageContainer } from '../common/PageContainer';

// Import Tab Views
import Marketplace from '../marketplace/Marketplace';
import BrowseArchitects from '../architects/BrowseArchitects';

// --- Types ---
interface Project {
    id: string;
    userId: string;
    name: string;
    roomType: string;
    uploadedImageUrl: string | null;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    status: 'draft' | 'shared' | 'in_progress';
    sharedWithArchitects: string[];
    wallsEdited?: number;
}

interface UserProfile {
    selectedPlan?: string;
    role?: string;
}

// --- Room Type Icons ---
const roomTypeOptions = [
    { id: 'living-room', label: 'Living Room', icon: Sofa },
    { id: 'bedroom', label: 'Bedroom', icon: BedDouble },
    { id: 'kitchen', label: 'Kitchen', icon: ChefHat },
    { id: 'dining-room', label: 'Dining Room', icon: UtensilsCrossed },
    { id: 'study', label: 'Study', icon: BookOpen },
    { id: 'bathroom', label: 'Bathroom', icon: Bath },
    { id: 'office', label: 'Office', icon: Briefcase },
    { id: 'other', label: 'Other', icon: Home }
];

const getRoomIcon = (roomType: string, size: number = 24) => {
    const opt = roomTypeOptions.find(r => r.label === roomType);
    const Icon = opt ? opt.icon : Home;
    return <Icon size={size} className="text-gray-400" />;
};

// --- Create Project Modal ---
const CreateProjectModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    userId: string;
}> = ({ isOpen, onClose, userId }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [roomType, setRoomType] = useState('living-room');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
        else { setName(''); setRoomType('living-room'); }
    }, [isOpen]);

    const handleCreate = async () => {
        if (!name.trim()) { toast.error('Please enter a project name'); return; }
        setCreating(true);
        try {
            const selectedRoom = roomTypeOptions.find(r => r.id === roomType);
            const docRef = await addDoc(collection(db, 'projects'), {
                userId,
                name: name.trim(),
                roomType: selectedRoom?.label || 'Living Room',
                uploadedImageUrl: null,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                status: 'draft',
                sharedWithArchitects: [],
                wallsEdited: 0
            });
            toast.success('Project created');
            navigate(`/workspace/${docRef.id}`);
        } catch (error) {
            console.error("Error creating project:", error);
            toast.error('Failed to create project');
            setCreating(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-[101] flex items-center justify-center pointer-events-none"
                    >
                        <div className="w-full max-w-lg bg-[#0F0F13] border border-white/10 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto">
                            <div className="p-6 border-b border-white/10 flex justify-between items-center">
                                <h3 className="text-lg font-serif font-bold text-white">Create New Canvas</h3>
                                <button onClick={onClose}><X size={20} className="text-gray-500 hover:text-white" /></button>
                            </div>
                            <div className="p-6 space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Project Name</label>
                                    <input
                                        ref={inputRef}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                                        placeholder="e.g. Dream Living Room"
                                        className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm focus:border-orange-500/50 outline-none transition-all placeholder:text-gray-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-3 uppercase tracking-widest">Space Type</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {roomTypeOptions.map((room) => {
                                            const Icon = room.icon;
                                            const isSelected = roomType === room.id;
                                            return (
                                                <button
                                                    key={room.id}
                                                    onClick={() => setRoomType(room.id)}
                                                    className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${isSelected ? 'bg-orange-500/10 border-orange-500/50 ring-1 ring-orange-500/20' : 'bg-white/[0.02] border-white/5 hover:bg-white/5'}`}
                                                >
                                                    <Icon size={20} className={isSelected ? 'text-orange-400' : 'text-gray-500'} />
                                                    <span className={`text-[10px] uppercase font-bold tracking-wider truncate w-full text-center ${isSelected ? 'text-orange-300' : 'text-gray-500'}`}>{room.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-white/[0.01] border-t border-white/10 flex justify-end gap-3">
                                <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-400 hover:text-white transition-colors">Cancel</button>
                                <button
                                    onClick={handleCreate}
                                    disabled={creating || !name.trim()}
                                    className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold tracking-wide rounded-xl flex items-center gap-2 shadow-lg shadow-orange-900/20 disabled:opacity-50"
                                >
                                    {creating ? <Loader2 size={16} className="animate-spin" /> : 'Create Project'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

// --- Elite Project Card ---
const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
    const navigate = useNavigate();
    const formattedDate = project.updatedAt?.toDate().toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => navigate(`/workspace/${project.id}`)}
            className="group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer bg-[#131318] border border-white/5 hover:border-orange-500/30 transition-all duration-500 shadow-2xl hover:shadow-orange-900/10"
        >
            {/* Full Bleed Image */}
            <div className="absolute inset-0 bg-[#050505]">
                {project.uploadedImageUrl ? (
                    <img
                        src={project.uploadedImageUrl}
                        alt={project.name}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center opacity-30 group-hover:opacity-50 transition-opacity">
                        {getRoomIcon(project.roomType, 64)}
                    </div>
                )}
            </div>

            {/* Glass Overlay Logic - Only show on hover or always show bottom bar? 
                Request: "Glassmorphism overlay at the bottom"
            */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

            <div className="absolute bottom-0 left-0 right-0 p-6 backdrop-blur-md border-t border-white/5 bg-black/40 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-[10px] uppercase tracking-widest text-orange-400 font-bold mb-1">{project.roomType}</p>
                        <h3 className="text-xl font-serif font-bold text-white leading-tight">{project.name}</h3>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] uppercase tracking-widest text-gray-500 block">Last Edited</span>
                        <span className="text-xs text-gray-300 font-medium">{formattedDate}</span>
                    </div>
                </div>
            </div>

            {/* Edit Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="bg-white/10 backdrop-blur-md border border-white/10 px-6 py-2 rounded-full text-white text-sm font-medium flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                    <Sparkles size={14} className="text-orange-400" />
                    Open Workspace
                </div>
            </div>
        </motion.div>
    );
};

// --- Projects View ---
const ProjectsView: React.FC<{ searchQuery: string }> = ({ searchQuery }) => {
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (!user) return;
        setLoading(true);
        const q = query(collection(db, 'projects'), where('userId', '==', user.uid));
        const unsubscribe = onSnapshot(q, (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Project));
            list.sort((a, b) => (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0));
            setProjects(list);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const filtered = projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <PageContainer>
            <div className="mb-12 flex items-end justify-between">
                <div>
                    <h1 className="text-5xl font-serif font-bold text-white tracking-tight mb-3">Your Portfolio</h1>
                    <p className="text-gray-400 max-w-xl text-lg font-light">
                        Where your vision comes to life. Manage your active designs.
                    </p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white font-bold tracking-wide rounded-full shadow-2xl shadow-orange-900/20 hover:shadow-orange-900/40 transition-all transform hover:-translate-y-1 flex items-center gap-2"
                >
                    <Plus size={20} strokeWidth={3} />
                    <span>Create New Project</span>
                </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => <div key={i} className="aspect-[4/3] bg-white/5 rounded-2xl animate-pulse" />)}
                </div>
            ) : projects.length === 0 ? (
                /* Onboarding Empty State - No Projects Created Yet */
                <div className="min-h-[400px] flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
                    <div className="w-48 h-48 mb-6 opacity-30">
                        {/* Placeholder Line Art Illustration */}
                        <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-500">
                            <rect x="40" y="40" width="120" height="120" rx="10" />
                            <path d="M40 80 H160" />
                            <path d="M100 80 V160" />
                            <circle cx="70" cy="120" r="15" />
                            <path d="M130 110 L150 130" />
                        </svg>
                    </div>
                    <h3 className="text-3xl font-serif font-bold text-white mb-4">Your canvas is empty.</h3>
                    <p className="text-gray-500 mb-8 max-w-md text-center">
                        Every masterpiece starts with a blank slate. Create your first project to start designing.
                    </p>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors"
                    >
                        Start Designing
                    </button>
                </div>
            ) : filtered.length === 0 ? (
                /* Search Empty State - Projects Exist but No Match */
                <div className="min-h-[300px] flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                    <Search className="text-gray-600 mb-4" size={48} />
                    <h3 className="text-xl font-medium text-white mb-2">No projects found</h3>
                    <p className="text-gray-500">We couldn't find any projects matching "{searchQuery}"</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
                    {filtered.map(p => (
                        <div key={p.id}>
                            <ProjectCard project={p} />
                        </div>
                    ))}
                </div>
            )}

            <CreateProjectModal
                isOpen={isCreating}
                onClose={() => setIsCreating(false)}
                userId={user?.uid || ''}
            />
        </PageContainer>
    );
};

// --- Main Container ---
const HomeownerDashboard: React.FC = () => {
    const [searchParams] = useSearchParams();
    const tab = searchParams.get('tab') || 'projects';
    const searchQuery = searchParams.get('q') || '';

    // Framer Motion Variants for Tab Switching
    const variants = {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -10 }
    };

    return (
        <div className="min-h-screen">
            <Toaster position="bottom-right" toastOptions={{
                style: { background: '#111', color: '#fff', border: '1px solid #333' }
            }} />

            <AnimatePresence mode="wait">
                <motion.div
                    key={tab}
                    variants={variants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                >
                    {tab === 'projects' && <ProjectsView searchQuery={searchQuery} />}
                    {tab === 'marketplace' && <Marketplace />}
                    {tab === 'architects' && <BrowseArchitects />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default HomeownerDashboard;

