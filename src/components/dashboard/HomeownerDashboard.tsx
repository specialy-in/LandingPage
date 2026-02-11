import React, { useState, useEffect, useRef } from 'react';
import {
    Plus,
    Camera,
    Edit,
    Share2,
    Trash2,
    LogOut,
    Settings,
    User as UserIcon,
    Search,
    ChevronDown,
    RefreshCw,
    AlertCircle,
    Home,
    Utensils,
    Bed,
    Sofa,
    Bath,
    ArrowRight,
    Sparkles,
    ShoppingBag,
    Users,
    PlayCircle,
    ExternalLink,
    X,
    Loader2,
    BedDouble,
    ChefHat,
    UtensilsCrossed,
    BookOpen,
    Briefcase,
    Upload,
    Ruler,
    Clock,
    PenTool
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, getDoc, Timestamp, getDocs, orderBy } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { PageContainer } from '../common/PageContainer';
import { UniversalFilterBar } from '../common/UniversalFilterBar';

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

type FilterType = 'all' | 'active' | 'archived' | 'completed';

// --- Room Type Icons ---
const getRoomIcon = (roomType: string, size: number = 48) => {
    const iconProps = { size, className: "text-gray-500" };
    switch (roomType?.toLowerCase()) {
        case 'kitchen': return <Utensils {...iconProps} />;
        case 'bedroom': return <Bed {...iconProps} />;
        case 'living room': return <Sofa {...iconProps} />;
        case 'bathroom': return <Bath {...iconProps} />;
        default: return <Home {...iconProps} />;
    }
};



// --- Room Type Options with Icons ---
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
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setName('');
            setRoomType('living-room');
        }
    }, [isOpen]);

    const handleCreate = async () => {
        if (!name.trim()) {
            toast.error('Please enter a project name');
            return;
        }

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
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
                    >
                        <div className="w-full max-w-lg bg-gradient-to-b from-[#0f0f0f] to-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto">
                            {/* Header */}
                            <div className="p-6 border-b border-white/10 flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-semibold text-white">New Project</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">Start designing your space</p>
                                </div>
                                <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-lg">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-6">
                                {/* Project Name */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Project Name</label>
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                                        placeholder="e.g. Summer Renovation"
                                        className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-gray-100 text-sm 
                                                   focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all
                                                   placeholder:text-gray-600"
                                    />
                                </div>

                                {/* Room Type Selection */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">Room Type</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {roomTypeOptions.map((room) => {
                                            const Icon = room.icon;
                                            const isSelected = roomType === room.id;
                                            return (
                                                <button
                                                    key={room.id}
                                                    type="button"
                                                    onClick={() => setRoomType(room.id)}
                                                    className={`relative p-3 rounded-xl border transition-all duration-200 flex flex-col items-center gap-2 group
                                                        ${isSelected
                                                            ? 'bg-orange-500/10 border-orange-500/50 ring-2 ring-orange-500/20'
                                                            : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/10'
                                                        }`}
                                                >
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors
                                                        ${isSelected ? 'bg-orange-500/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
                                                        <Icon size={16} className={isSelected ? 'text-orange-400' : 'text-gray-400 group-hover:text-gray-300'} />
                                                    </div>
                                                    <span className={`text-xs font-medium transition-colors truncate w-full text-center
                                                        ${isSelected ? 'text-orange-300' : 'text-gray-400 group-hover:text-gray-300'}`}>
                                                        {room.label}
                                                    </span>
                                                    {isSelected && (
                                                        <motion.div
                                                            layoutId="room-selection"
                                                            className="absolute inset-0 rounded-xl border-2 border-orange-500/30"
                                                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                                                        />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-4 bg-white/[0.02] border-t border-white/10 flex justify-end gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2.5 text-sm font-medium text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={creating || !name.trim()}
                                    className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 
                                               text-white text-sm font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed
                                               flex items-center gap-2 shadow-lg shadow-orange-500/20"
                                >
                                    {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                    {creating ? 'Creating...' : 'Create Project'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

// --- Minimal Project Card ---
const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
    const navigate = useNavigate();

    const handleCardClick = () => {
        navigate(`/workspace/${project.id}`);
    };

    const getRelativeTime = (timestamp: Timestamp | null) => {
        if (!timestamp?.toDate) return 'Just now';
        const date = timestamp.toDate();
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays <= 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div
            onClick={handleCardClick}
            className="group cursor-pointer bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.04] transition-all duration-200 rounded-lg overflow-hidden flex flex-col"
        >
            {/* Thumbnail - 240px fixed height */}
            <div className="h-[240px] bg-[#050505] relative overflow-hidden flex items-center justify-center">
                {project.uploadedImageUrl ? (
                    <img
                        src={project.uploadedImageUrl}
                        alt={project.name}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                ) : (
                    <div className="text-center opacity-40 group-hover:opacity-60 transition-opacity">
                        {getRoomIcon(project.roomType, 48)}
                    </div>
                )}

                {/* Open Button Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button className="px-6 py-2 bg-white text-black text-sm font-medium rounded shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-all duration-200">
                        Open Workspace
                    </button>
                </div>
            </div>

            {/* Info */}
            <div className="p-4 border-t border-white/[0.04]">
                <div className="flex justify-between items-start mb-1">
                    <h3 className="text-gray-200 font-medium text-sm truncate pr-4">{project.name}</h3>
                    {project.status === 'shared' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5" title="Completed" />
                    )}
                </div>
                <p className="text-gray-500 text-xs mb-3">{project.roomType}</p>

                <div className="flex items-center justify-between text-[11px] text-gray-600 border-t border-white/[0.04] pt-3 mt-1">
                    <span>{project.wallsEdited ? `${project.wallsEdited} changes` : 'No activity'}</span>
                    <span>{getRelativeTime(project.updatedAt)}</span>
                </div>
            </div>
        </div>
    );
};

// --- Main Dashboard Component ---
const HomeownerDashboard: React.FC = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [projects, setProjects] = useState<Project[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [filter, setFilter] = useState<FilterType>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const FREE_PROJECT_LIMIT = 3;

    // Fetch user profile
    useEffect(() => {
        if (!user) return;
        const fetchProfile = async () => {
            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) setUserProfile(userDoc.data() as UserProfile);
            } catch (err) { console.warn('Failed to fetch user profile:', err); }
        };
        fetchProfile();
    }, [user]);

    // Fetch projects
    useEffect(() => {
        if (!user) return;
        setLoading(true);
        const q = query(collection(db, 'projects'), where('userId', '==', user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedProjects: Project[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
            fetchedProjects.sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));
            setProjects(fetchedProjects);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching projects:", err);
            setError(err.message);
            setLoading(false);
        });
        return unsubscribe;
    }, [user]);

    // Filter logic
    const filteredProjects = projects.filter(project => {
        const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.roomType.toLowerCase().includes(searchQuery.toLowerCase());
        let matchesFilter = true;
        if (filter === 'active') matchesFilter = project.status === 'in_progress' || project.status === 'draft';
        else if (filter === 'completed') matchesFilter = project.status === 'shared';
        else if (filter === 'archived') matchesFilter = false;
        return matchesSearch && matchesFilter;
    });

    const activeCount = projects.filter(p => p.status === 'in_progress' || p.status === 'draft').length;
    const completedCount = projects.filter(p => p.status === 'shared').length;
    const archivedCount = 0; // Future

    const filterLabels: Record<FilterType, string> = {
        all: 'All Projects',
        active: 'Active',
        completed: 'Completed',
        archived: 'Archived'
    };

    const handleNewProject = () => {
        if (userProfile?.selectedPlan === 'homeowner' && projects.length >= FREE_PROJECT_LIMIT) {
            toast.error('Free limit reached');
            return;
        }
        setIsCreating(true);
    };

    return (
        <>
            <Toaster position="bottom-right" toastOptions={{
                style: { background: '#18181b', color: '#fff', border: '1px solid #27272a' }
            }} />

            <main className="max-w-[1400px] mx-auto px-8 py-12">
                {/* Minimal Header */}
                <div className="flex items-end justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-white mb-2">Projects</h1>
                        <p className="text-sm text-gray-400">Manage and organize your design projects</p>
                    </div>
                    <div className="flex gap-4 items-center">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search..."
                                className="pl-9 pr-4 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-gray-300 placeholder-gray-600 text-sm focus:border-white/10 outline-none w-64 transition-all"
                            />
                        </div>
                        <button
                            onClick={handleNewProject}
                            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                        >
                            <Plus size={16} /> New Project
                        </button>
                    </div>
                </div>

                {/* Stats Bar & Tabs */}
                <div className="flex items-center justify-between border-b border-white/[0.06] mb-8 pb-1">
                    {/* Text Tabs */}
                    <div className="flex gap-6">
                        {(Object.keys(filterLabels) as FilterType[]).map((key) => (
                            <button
                                key={key}
                                onClick={() => setFilter(key)}
                                className={`pb-3 text-sm font-medium transition-all relative ${filter === key ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                                    }`}
                            >
                                {filterLabels[key]}
                                {filter === key && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-orange-500"
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Stats Line */}
                    <div className="flex items-center gap-6 pb-3 text-sm font-medium">
                        <div className="text-gray-600">
                            {projects.length} Projects <span className="mx-1.5 text-gray-700">•</span>
                            {activeCount} Active <span className="mx-1.5 text-gray-700">•</span>
                            {completedCount} Completed
                        </div>

                        {userProfile?.selectedPlan === 'homeowner' && (
                            <div className="flex items-center gap-3 pl-6 border-l border-white/10">
                                <span className={`${projects.length >= FREE_PROJECT_LIMIT ? 'text-orange-500' : 'text-gray-400'}`}>
                                    Free Plan: {projects.length} / {FREE_PROJECT_LIMIT} used
                                </span>
                                {projects.length >= FREE_PROJECT_LIMIT && (
                                    <button className="text-xs bg-orange-500/10 text-orange-500 px-2 py-1 rounded hover:bg-orange-500/20 transition-colors">
                                        Upgrade for Unlimited
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-white/[0.02] border border-white/[0.04] rounded-lg h-[340px] animate-pulse" />
                        ))}
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <div className="py-24 text-center border border-dashed border-white/5 rounded-xl">
                        <p className="text-gray-500 text-sm">No projects found.</p>
                        {filter !== 'all' && (
                            <button onClick={() => setFilter('all')} className="text-orange-500 text-sm mt-2 hover:underline">
                                Clear filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
                        {filteredProjects.map(project => (
                            <ProjectCard key={project.id} project={project} />
                        ))}
                    </div>
                )}
            </main>

            <CreateProjectModal
                isOpen={isCreating}
                onClose={() => setIsCreating(false)}
                userId={user?.uid || ''}
            />
        </>
    );
};

export default HomeownerDashboard;

