import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { db } from '../../../lib/firebase';
import {
    collection, query, where, onSnapshot, updateDoc, doc, addDoc,
    serverTimestamp, Timestamp, getDoc
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FolderOpen, Plus, ExternalLink, Upload, Eye, Sofa, BedDouble,
    ChefHat, Home, Loader2, Search, Copy
} from 'lucide-react';

// --- Types ---
interface Project {
    id: string;
    userId: string;
    name: string;
    roomType: string;
    uploadedImageUrl: string | null;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    status: string;
    clientName?: string;
    sharedVersion?: string;
    originalProjectId?: string;
    sharedWithArchitects?: string[];
}

const getRoomIcon = (roomType: string) => {
    const map: Record<string, React.ReactNode> = {
        'Living Room': <Sofa size={18} className="text-orange-400" />,
        'Bedroom': <BedDouble size={18} className="text-blue-400" />,
        'Kitchen': <ChefHat size={18} className="text-green-400" />,
    };
    return map[roomType] || <Home size={18} className="text-gray-400" />;
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    draft: { label: 'Draft', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
    in_progress: { label: 'In Progress', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    published: { label: 'Published', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    shared: { label: 'Shared', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
};

interface ProjectsTabProps {
    userPlan: string;
}

const ProjectsTab: React.FC<ProjectsTabProps> = ({ userPlan }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [publishing, setPublishing] = useState<string | null>(null);
    const [importing, setImporting] = useState(false);
    const [importUrl, setImportUrl] = useState('');
    const [showImportModal, setShowImportModal] = useState(false);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, 'projects'), where('userId', '==', user.uid));
        const unsub = onSnapshot(q, (snap) => {
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Project));
            docs.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
            setProjects(docs);
            setLoading(false);
        });
        return () => unsub();
    }, [user]);

    const handlePublish = async (project: Project) => {
        setPublishing(project.id);
        try {
            const version = `v${(Math.random() * 3 + 1).toFixed(1)}`;
            await updateDoc(doc(db, 'projects', project.id), {
                sharedVersion: version,
                status: 'published',
                publishedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            toast.success(`Design ${version} published to Homeowner dashboard.`, { duration: 4000, icon: '🚀' });
        } catch (err) {
            console.error(err);
            toast.error('Failed to publish');
        }
        setPublishing(null);
    };

    const handleImportProject = async (originalId: string) => {
        if (!user) return;
        setImporting(true);
        try {
            const origSnap = await getDoc(doc(db, 'projects', originalId));
            if (!origSnap.exists()) {
                toast.error('Project not found');
                setImporting(false);
                return;
            }
            const origData = origSnap.data();
            const newDoc = await addDoc(collection(db, 'projects'), {
                userId: user.uid,
                name: `${origData.name} (Imported)`,
                roomType: origData.roomType || 'Living Room',
                uploadedImageUrl: origData.uploadedImageUrl || null,
                originalProjectId: originalId,
                status: 'draft',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                sharedWithArchitects: [],
                wallsEdited: 0,
            });
            toast.success('Project imported successfully');
            navigate(`/workspace/${newDoc.id}`);
        } catch (err) {
            console.error(err);
            toast.error('Failed to import project');
        }
        setImporting(false);
        setShowImportModal(false);
        setImportUrl('');
    };

    const filtered = projects.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 size={32} className="text-orange-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-gray-300 text-sm rounded-xl transition-colors flex items-center gap-2"
                    >
                        <Copy size={16} /> Import
                    </button>
                    <button
                        onClick={() => navigate('/workspace/new')}
                        className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-orange-900/30"
                    >
                        <Plus size={16} /> New Project
                    </button>
                </div>
            </div>

            {/* Project Grid */}
            {filtered.length === 0 ? (
                <div className="text-center py-24">
                    <FolderOpen size={56} className="mx-auto text-gray-600 mb-4" />
                    <h3 className="text-lg font-medium text-gray-300 mb-1">No projects yet</h3>
                    <p className="text-sm text-gray-500">Create your first project or import one from a client.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <AnimatePresence>
                        {filtered.map((project, idx) => {
                            const st = statusConfig[project.status] || statusConfig.draft;
                            return (
                                <motion.div
                                    key={project.id}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: idx * 0.04 }}
                                    className="group bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl overflow-hidden transition-all duration-300"
                                >
                                    {/* Thumbnail */}
                                    <div className="relative h-40 bg-gradient-to-br from-gray-800/40 to-gray-900/40 overflow-hidden">
                                        {project.uploadedImageUrl ? (
                                            <img
                                                src={project.uploadedImageUrl}
                                                alt={project.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                {getRoomIcon(project.roomType)}
                                            </div>
                                        )}
                                        {/* Status Badge */}
                                        <div className={`absolute top-3 right-3 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full border ${st.bg} ${st.color}`}>
                                            {st.label}
                                        </div>
                                        {project.originalProjectId && (
                                            <div className="absolute top-3 left-3 px-2 py-1 text-[10px] font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full">
                                                Imported
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="p-4 space-y-3">
                                        <div>
                                            <h3 className="text-sm font-semibold text-white truncate">{project.name}</h3>
                                            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                                                {getRoomIcon(project.roomType)}
                                                {project.roomType || 'Room'}
                                                {project.clientName && (
                                                    <> · <span className="text-gray-400">{project.clientName}</span></>
                                                )}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => navigate(`/workspace/${project.id}`)}
                                                className="flex-1 px-3 py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-gray-300 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
                                            >
                                                <Eye size={13} /> Open
                                            </button>
                                            <button
                                                onClick={() => handlePublish(project)}
                                                disabled={publishing === project.id}
                                                className="flex-1 px-3 py-2 bg-orange-600/90 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                                            >
                                                {publishing === project.id ? (
                                                    <Loader2 size={13} className="animate-spin" />
                                                ) : (
                                                    <Upload size={13} />
                                                )}
                                                Publish
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* Import Modal */}
            <AnimatePresence>
                {showImportModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowImportModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-[#12121A] border border-white/[0.08] rounded-2xl p-6 w-full max-w-md shadow-2xl"
                        >
                            <h3 className="text-lg font-semibold text-white mb-1">Import Project</h3>
                            <p className="text-sm text-gray-500 mb-5">Paste the original project ID to create your working copy.</p>
                            <input
                                value={importUrl}
                                onChange={e => setImportUrl(e.target.value)}
                                placeholder="Project ID..."
                                className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/40 mb-4"
                            />
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setShowImportModal(false)}
                                    className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleImportProject(importUrl.trim())}
                                    disabled={!importUrl.trim() || importing}
                                    className="px-5 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
                                >
                                    {importing && <Loader2 size={14} className="animate-spin" />}
                                    Import
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProjectsTab;
