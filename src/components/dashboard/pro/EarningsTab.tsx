import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { db, storage } from '../../../lib/firebase';
import {
    collection, query, where, onSnapshot, addDoc, serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DollarSign, Clock, Gift, Upload, CheckCircle2, X,
    FileText, Loader2, TrendingUp, ShoppingBag, ExternalLink, ReceiptText
} from 'lucide-react';

// --- Types ---
interface Commission {
    id: string;
    userId: string;
    productId: string;
    productName: string;
    brand: string;
    price: number;
    commissionAmount: number;
    receiptUrl?: string;
    status: 'pending' | 'verified' | 'rejected';
    createdAt: Timestamp;
}

interface InventoryItem {
    id: string;
    productId: string;
    productName: string;
    brand: string;
    price: number;
    projectName: string;
    potentialCommission: number;
    claimed: boolean;
}

interface EarningsTabProps {
    userPlan: string;
}

const EarningsTab: React.FC<EarningsTabProps> = ({ userPlan }) => {
    const { user } = useAuth();
    const [commissions, setCommissions] = useState<Commission[]>([]);
    const [loading, setLoading] = useState(true);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [uploading, setUploading] = useState(false);
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Mock inventory data (would come from project renders in production)
    const [inventory] = useState<InventoryItem[]>([
        { id: 'inv1', productId: 'sp1', productName: 'Oslo Accent Chair', brand: 'Urban Ladder', price: 62000, projectName: 'Modern Living Room', potentialCommission: 3100, claimed: false },
        { id: 'inv2', productId: 'sp2', productName: 'Marble Floor Tiles', brand: 'Kajaria', price: 85000, projectName: 'Master Bedroom', potentialCommission: 4250, claimed: false },
        { id: 'inv3', productId: 'sp3', productName: 'Velvet 3-Seater Sofa', brand: 'Pepperfry', price: 48000, projectName: 'Modern Living Room', potentialCommission: 2400, claimed: false },
        { id: 'inv4', productId: 'sp4', productName: 'Pendant Light Cluster', brand: 'Philips', price: 12500, projectName: 'Dining Area', potentialCommission: 625, claimed: true },
    ]);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'commissions'),
            where('userId', '==', user.uid)
        );
        const unsub = onSnapshot(q, (snap) => {
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Commission));
            setCommissions(docs);
            setLoading(false);
        }, () => setLoading(false));

        return () => unsub();
    }, [user]);

    const totalEarned = commissions
        .filter(c => c.status === 'verified')
        .reduce((sum, c) => sum + c.commissionAmount, 0);

    const pendingVerification = commissions.filter(c => c.status === 'pending').length;

    const cashbackAvailable = inventory
        .filter(i => !i.claimed)
        .reduce((sum, i) => sum + i.potentialCommission, 0);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            toast.error('File too large. Max 10MB.');
            return;
        }

        setReceiptFile(file);
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = () => setReceiptPreview(reader.result as string);
            reader.readAsDataURL(file);
        } else {
            setReceiptPreview(null);
        }
    };

    const handleUploadReceipt = async () => {
        if (!user || !receiptFile || !selectedItem) return;

        setUploading(true);
        try {
            let receiptUrl = '';

            // Upload receipt file
            if (storage) {
                const fileRef = ref(storage, `commissions/${user.uid}/${Date.now()}_${receiptFile.name}`);
                const uploadTask = uploadBytesResumable(fileRef, receiptFile);

                await new Promise<void>((resolve, reject) => {
                    uploadTask.on('state_changed', null,
                        (error) => reject(error),
                        async () => {
                            receiptUrl = await getDownloadURL(uploadTask.snapshot.ref);
                            resolve();
                        }
                    );
                });
            }

            // Save to commissions collection
            await addDoc(collection(db, 'commissions'), {
                userId: user.uid,
                productId: selectedItem.productId,
                productName: selectedItem.productName,
                brand: selectedItem.brand,
                price: selectedItem.price,
                commissionAmount: selectedItem.potentialCommission,
                receiptUrl,
                status: 'pending',
                createdAt: serverTimestamp(),
            });

            toast.success('Receipt uploaded! Commission pending verification.', { icon: '✅', duration: 4000 });
            setShowReceiptModal(false);
            setReceiptFile(null);
            setReceiptPreview(null);
            setSelectedItem(null);
        } catch (err) {
            console.error(err);
            toast.error('Failed to upload receipt');
        }
        setUploading(false);
    };

    const openReceiptModal = (item: InventoryItem) => {
        setSelectedItem(item);
        setShowReceiptModal(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 size={32} className="text-orange-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <DollarSign size={20} className="text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Total Earned</p>
                            <p className="text-2xl font-bold text-white">₹{totalEarned.toLocaleString('en-IN')}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-emerald-400">
                        <TrendingUp size={12} />
                        <span>5% commission on verified sales</span>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                            <Clock size={20} className="text-amber-400" />
                        </div>
                        <div>
                            <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Pending Verification</p>
                            <p className="text-2xl font-bold text-white">{pendingVerification}</p>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500">Receipts under review</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                            <Gift size={20} className="text-orange-400" />
                        </div>
                        <div>
                            <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Cashback Available</p>
                            <p className="text-2xl font-bold text-white">₹{cashbackAvailable.toLocaleString('en-IN')}</p>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500">Upload receipts to claim</p>
                </motion.div>
            </div>

            {/* Workspace Inventory */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <ShoppingBag size={18} className="text-orange-400" />
                    <h2 className="text-lg font-semibold text-white">Workspace Inventory</h2>
                    <span className="text-xs text-gray-500 bg-white/[0.04] px-2 py-0.5 rounded-full">
                        {inventory.length} products
                    </span>
                </div>

                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/[0.06] text-[11px] text-gray-500 uppercase tracking-wider font-medium">
                        <div className="col-span-4">Product</div>
                        <div className="col-span-2">Brand</div>
                        <div className="col-span-2">Price</div>
                        <div className="col-span-2">Commission</div>
                        <div className="col-span-2 text-right">Action</div>
                    </div>

                    {/* Table Rows */}
                    {inventory.map((item, idx) => {
                        const hasPendingClaim = commissions.some(
                            c => c.productId === item.productId && c.status === 'pending'
                        );
                        const isVerified = commissions.some(
                            c => c.productId === item.productId && c.status === 'verified'
                        );

                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors items-center"
                            >
                                <div className="col-span-4">
                                    <p className="text-sm font-medium text-white">{item.productName}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{item.projectName}</p>
                                </div>
                                <div className="col-span-2 text-sm text-gray-400">{item.brand}</div>
                                <div className="col-span-2 text-sm text-gray-300">₹{item.price.toLocaleString('en-IN')}</div>
                                <div className="col-span-2">
                                    <span className="text-sm font-semibold text-emerald-400">
                                        ₹{item.potentialCommission.toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <div className="col-span-2 flex justify-end">
                                    {isVerified ? (
                                        <span className="px-2.5 py-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1">
                                            <CheckCircle2 size={10} /> Verified
                                        </span>
                                    ) : hasPendingClaim ? (
                                        <span className="px-2.5 py-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center gap-1">
                                            <Clock size={10} /> Pending
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => openReceiptModal(item)}
                                            className="px-3 py-1.5 bg-orange-600/90 hover:bg-orange-500 text-white text-[11px] font-medium rounded-lg transition-colors flex items-center gap-1.5"
                                        >
                                            <Upload size={12} /> Upload Receipt
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </section>

            {/* Upload Receipt Modal */}
            <AnimatePresence>
                {showReceiptModal && selectedItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        onClick={() => {
                            setShowReceiptModal(false);
                            setReceiptFile(null);
                            setReceiptPreview(null);
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.92, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.92, opacity: 0, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-[#12121A] border border-white/[0.08] rounded-2xl p-6 w-full max-w-md shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <ReceiptText size={20} className="text-orange-400" />
                                    Get 5% Commission
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowReceiptModal(false);
                                        setReceiptFile(null);
                                        setReceiptPreview(null);
                                    }}
                                    className="p-1.5 hover:bg-white/[0.06] rounded-lg transition-colors"
                                >
                                    <X size={18} className="text-gray-500" />
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mb-5">
                                Upload the purchase receipt for <span className="text-white font-medium">{selectedItem.productName}</span> to claim your commission.
                            </p>

                            {/* Commission Summary */}
                            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4 mb-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-gray-500">Product Price</p>
                                        <p className="text-sm font-medium text-gray-300">₹{selectedItem.price.toLocaleString('en-IN')}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">Your Commission (5%)</p>
                                        <p className="text-lg font-bold text-emerald-400">₹{selectedItem.potentialCommission.toLocaleString('en-IN')}</p>
                                    </div>
                                </div>
                            </div>

                            {/* File Upload */}
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${receiptFile
                                    ? 'border-orange-500/30 bg-orange-500/5'
                                    : 'border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.02]'
                                    }`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,application/pdf"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                {receiptPreview ? (
                                    <img src={receiptPreview} alt="Receipt" className="max-h-36 mx-auto rounded-lg mb-2" />
                                ) : receiptFile ? (
                                    <div className="flex items-center justify-center gap-2 text-orange-400">
                                        <FileText size={20} />
                                        <span className="text-sm font-medium">{receiptFile.name}</span>
                                    </div>
                                ) : (
                                    <>
                                        <Upload size={28} className="mx-auto text-gray-600 mb-2" />
                                        <p className="text-sm text-gray-400">Click to upload receipt</p>
                                        <p className="text-xs text-gray-600 mt-1">PNG, JPG, or PDF (max 10MB)</p>
                                    </>
                                )}
                            </div>

                            {/* Submit */}
                            <button
                                onClick={handleUploadReceipt}
                                disabled={!receiptFile || uploading}
                                className="w-full mt-5 px-4 py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" /> Uploading...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 size={16} /> Submit for Verification
                                    </>
                                )}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default EarningsTab;
