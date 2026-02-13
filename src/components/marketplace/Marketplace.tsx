import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Package,
    Search,
    Filter,
    ShoppingCart,
    Heart,
    Star,
    ChevronDown,
    ChevronRight,
    X,
    Eye,
    Image,
    ArrowRight,
    Plus,
    Minus,
    Upload
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { UniversalFilterBar } from '../common/UniversalFilterBar';
import { PageContainer } from '../common/PageContainer';

// --- Types ---
interface Product {
    id: string;
    name: string;
    brand: string;
    price: number;
    originalPrice?: number;
    images: string[];
    category: string;
    subcategory: string;
    style: string;
    rating: number;
    reviews: number;
    isSponsored: boolean;
    inStock: boolean;
    limitedStock?: boolean;
    aspectRatio: number;
    specifications: {
        dimensions?: string;
        material?: string;
        finish?: string;
        weight?: string;
        assembly?: string;
    };
    description: string;
}

// --- Mock Data ---
const categories = ['All Categories', 'Furniture', 'Lighting', 'Decor', 'Materials'];
const priceRanges = [
    { label: 'Any Price', min: 0, max: Infinity },
    { label: 'Under ₹5,000', min: 0, max: 5000 },
    { label: '₹5,000 - ₹20,000', min: 5000, max: 20000 },
    { label: '₹20,000 - ₹50,000', min: 20000, max: 50000 },
    { label: '₹50,000+', min: 50000, max: Infinity },
];
const styles = ['All Styles', 'Modern', 'Minimalist', 'Industrial', 'Scandinavian', 'Traditional'];

const generateMockProducts = (count: number): Product[] => {
    const productNames = [
        'Oslo Lounge Chair', 'Copenhagen Coffee Table', 'Berlin Bookshelf', 'Stockholm Sofa',
        'Vienna Pendant Light', 'Milan Floor Lamp', 'Tokyo Wall Sconce', 'Paris Ceramic Vase',
        'Lisbon Woven Rug', 'Amsterdam Canvas Art', 'Barcelona Side Table', 'Prague Leather Ottoman',
        'Munich Brass Mirror', 'Helsinki Linen Curtains', 'Dublin Accent Chair', 'Athens Console Table'
    ];
    const brands = ['HAY', 'Muuto', 'Ferm Living', 'Menu', 'Normann Copenhagen', 'String', 'Vitra'];
    const descriptions = [
        'Crafted with meticulous attention to detail, this piece embodies the essence of Scandinavian design principles. The clean lines and natural materials create a sense of calm sophistication.',
        'A contemporary interpretation of classic design, featuring premium materials and expert craftsmanship. Perfect for both residential and commercial spaces.',
        'Inspired by minimalist architecture, this design balances form and function beautifully. Each element serves a purpose while contributing to the overall aesthetic.'
    ];

    return Array.from({ length: count }, (_, i) => ({
        id: `prod-${i}`,
        name: productNames[i % productNames.length],
        brand: brands[i % brands.length],
        price: Math.floor(Math.random() * 80000) + 5000,
        originalPrice: Math.random() > 0.7 ? Math.floor(Math.random() * 100000) + 20000 : undefined,
        images: Array.from({ length: 4 }, (_, j) => `https://picsum.photos/800/800?random=${i * 10 + j}`),
        category: categories[1 + (i % 4)], // Skip 'All Categories'
        subcategory: '',
        style: styles[1 + (i % 5)], // Skip 'All Styles'
        rating: Math.round((4 + Math.random() * 1) * 10) / 10,
        reviews: Math.floor(Math.random() * 500) + 10,
        isSponsored: i < 2 || Math.random() > 0.92,
        inStock: Math.random() > 0.1,
        limitedStock: Math.random() > 0.8,
        aspectRatio: [0.85, 1, 1, 1.15, 1.3][i % 5],
        specifications: {
            dimensions: `${60 + i * 5}W × ${40 + i * 3}D × ${80 + i * 2}H cm`,
            material: ['Solid Oak', 'Walnut Veneer', 'Powder-coated Steel', 'Natural Marble'][i % 4],
            finish: ['Matte', 'Satin', 'Lacquered', 'Natural Oil'][i % 4],
            weight: `${5 + i * 2} kg`,
            assembly: i % 3 === 0 ? 'Required' : 'Not Required'
        },
        description: descriptions[i % descriptions.length]
    }));
};

const allProducts = generateMockProducts(48);

// --- Format Price ---
const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);
};

// --- Dropdown Component ---
const FilterDropdown: React.FC<{
    label: string;
    options: string[];
    value: string;
    onChange: (value: string) => void;
}> = ({ label, options, value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-neutral-300 hover:bg-white/10 transition-colors"
            >
                {value || label}
                <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute top-full left-0 mt-2 w-48 bg-[#111] border border-white/10 rounded-xl py-1 z-50 shadow-xl"
                    >
                        {options.map((option) => (
                            <button
                                key={option}
                                onClick={() => { onChange(option); setIsOpen(false); }}
                                className={`w-full text-left px-4 py-2 text-sm transition-colors ${value === option ? 'text-amber-400 bg-white/5' : 'text-neutral-300 hover:bg-white/5'
                                    }`}
                            >
                                {option}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- Product Card ---
const ProductCard: React.FC<{
    product: Product;
    onClick: () => void;
    onAddToCart: (e: React.MouseEvent) => void;
    onBuyNow: (e: React.MouseEvent) => void;
    onVisualize: (e: React.MouseEvent) => void;
}> = ({ product, onClick, onAddToCart, onBuyNow, onVisualize }) => {
    const [imageLoaded, setImageLoaded] = useState(false);

    return (
        <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className={`group cursor-pointer rounded-xl overflow-hidden bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] hover:border-white/10 shadow-xl shadow-black/10 hover:shadow-2xl transition-all duration-300 h-full flex flex-col ${product.isSponsored ? 'ring-1 ring-orange-500/20' : ''}`}
            onClick={onClick}
        >
            {/* Image Container */}
            <div className="relative h-60 flex-shrink-0 bg-gray-900/50 overflow-hidden">
                {!imageLoaded && (
                    <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-900 animate-pulse" />
                )}
                <img
                    src={product.images[0]}
                    alt={product.name}
                    onLoad={() => setImageLoaded(true)}
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'
                        }`}
                    loading="lazy"
                />

                {/* Sponsored Badge - Subtle */}
                {product.isSponsored && (
                    <span className="absolute top-3 right-3 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider bg-amber-600/20 border border-amber-600/30 text-amber-400/80 rounded-sm backdrop-blur-md">
                        Sponsored
                    </span>
                )}
            </div>

            {/* Card Footer */}
            <div className="flex-1 p-6 bg-white/[0.02] backdrop-blur-xl border-t border-white/[0.06] flex flex-col">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 truncate">{product.brand}</p>
                <h3 className="text-lg font-medium text-gray-100 mb-2 line-clamp-2 h-12">{product.name}</h3>

                <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-xl font-bold text-gray-100">{formatPrice(product.price)}</span>
                    {product.originalPrice && (
                        <span className="text-sm text-gray-600 line-through">{formatPrice(product.originalPrice)}</span>
                    )}
                </div>

                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1">
                        <Star size={12} className="text-gray-400 fill-gray-400" />
                        <span className="text-sm text-gray-500">{product.rating}</span>
                        <span className="text-xs text-gray-600">({product.reviews})</span>
                    </div>
                    <span className={`text-xs ${product.inStock
                        ? product.limitedStock ? 'text-amber-500' : 'text-emerald-500'
                        : 'text-red-500'
                        }`}>
                        {product.inStock ? (product.limitedStock ? 'Low Stock' : 'In Stock') : 'Out of Stock'}
                    </span>
                </div>

                <div className="mt-auto flex gap-2 pt-2">
                    <button
                        onClick={onBuyNow}
                        disabled={!product.inStock}
                        className="flex-1 px-4 py-2.5 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Buy Now
                    </button>
                    <button
                        onClick={onAddToCart}
                        disabled={!product.inStock}
                        className="w-10 h-10 flex items-center justify-center bg-white/[0.08] border border-white/10 text-gray-100 rounded-lg hover:bg-white/[0.12] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ShoppingCart size={18} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

// --- Product Detail Modal ---
const ProductDetailModal: React.FC<{
    product: Product | null;
    currentProductId: string | null;
    allProducts: Product[];
    onClose: () => void;
    onVisualize: () => void;
    onProductSelect: (p: Product) => void;
}> = ({ product, currentProductId, allProducts, onClose, onVisualize, onProductSelect }) => {
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [expandedSpecs, setExpandedSpecs] = useState(true);

    if (!product) return null;

    const isFurniture = product.category === 'Furniture';

    // Suggest products based on same category, excluding current
    const relatedProducts = useMemo(() => {
        return allProducts
            .filter(p => p.category === product.category && p.id !== product.id)
            .slice(0, 5);
    }, [product, allProducts]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
            onClick={onClose}
        >
            <style>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl w-[95vw] max-w-5xl h-[90vh] max-h-[800px] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-30 p-2 text-neutral-400 hover:text-white transition-colors bg-black/40 rounded-full backdrop-blur-sm"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col lg:flex-row h-full">
                    {/* Left - 60% Images with Vertical Thumbnails */}
                    <div className="lg:w-[60%] bg-zinc-950 p-6 flex">
                        {/* Vertical Thumbnail Strip */}
                        <div className="flex flex-col gap-2 mr-4 overflow-y-auto max-h-full">
                            {product.images.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedImage(idx)}
                                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === idx ? 'border-orange-500 opacity-100' : 'border-transparent opacity-50 hover:opacity-80'}`}
                                >
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                        {/* Main Image */}
                        <div className="flex-1 flex items-center justify-center">
                            <div className="aspect-square w-full max-w-lg rounded-xl overflow-hidden bg-gray-900 shadow-2xl">
                                <img src={product.images[selectedImage]} alt={product.name} className="w-full h-full object-cover" />
                            </div>
                        </div>
                    </div>

                    {/* Right - 40% Details */}
                    <div className="lg:w-[40%] bg-[#0A0E27] flex flex-col border-l border-white/[0.06] h-full">
                        {/* Scrollable Content Area */}
                        <div className="flex-1 overflow-y-auto px-6 pt-6 pb-4 hide-scrollbar">
                            {/* Breadcrumb */}
                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                                <span>Marketplace</span>
                                <ChevronRight size={10} />
                                <span>{product.category}</span>
                                <ChevronRight size={10} />
                                <span className="text-gray-300">{product.name}</span>
                            </div>

                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{product.brand}</p>
                            <h2 className="text-2xl font-medium text-gray-100 mb-2">{product.name}</h2>

                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-2xl font-bold text-gray-100">{formatPrice(product.price)}</span>
                                {product.originalPrice && (
                                    <span className="text-sm text-gray-600 line-through">{formatPrice(product.originalPrice)}</span>
                                )}
                            </div>

                            <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/[0.08]">
                                <div className="flex items-center gap-1">
                                    <Star size={12} className="text-amber-500 fill-amber-500" />
                                    <span className="text-gray-300 font-medium text-sm">{product.rating}</span>
                                    <span className="text-gray-500 text-xs">({product.reviews})</span>
                                </div>
                                <span className={`text-xs font-medium ${product.inStock ? (product.limitedStock ? 'text-amber-500' : 'text-emerald-500') : 'text-red-500'}`}>
                                    {product.inStock ? (product.limitedStock ? '⚠️ Limited' : '✓ In Stock') : '✗ Out of Stock'}
                                </span>
                            </div>

                            {/* Description - Compact */}
                            <div className="mb-3">
                                <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">
                                    {product.description}
                                </p>
                            </div>

                            {/* Specifications - Collapsed by default */}
                            <div className="border-t border-white/[0.08] pt-3">
                                <button
                                    onClick={() => setExpandedSpecs(!expandedSpecs)}
                                    className="flex items-center justify-between w-full text-left py-1"
                                >
                                    <span className="text-xs font-medium text-gray-300">Product Details</span>
                                    <ChevronDown size={14} className={`text-gray-500 transition-transform ${expandedSpecs ? 'rotate-180' : ''}`} />
                                </button>
                                <AnimatePresence>
                                    {expandedSpecs && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="pt-2 space-y-1 text-xs hide-scrollbar">
                                                {Object.entries(product.specifications).map(([key, value]) => (
                                                    <div key={key} className="flex justify-between py-1">
                                                        <span className="text-gray-500 capitalize">{key}</span>
                                                        <span className="text-gray-300">{value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Fixed Actions Footer */}
                        <div className="flex-shrink-0 bg-[#0A0E27] border-t border-white/[0.06] px-6 py-4">
                            {/* Quantity Selector - Only for non-furniture */}
                            {!isFurniture && (
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-xs text-gray-500">Qty:</span>
                                    <div className="flex items-center bg-white/[0.06] rounded-lg p-1">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="p-1.5 hover:bg-white/10 rounded text-gray-300"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <span className="w-8 text-center text-gray-100 text-sm font-medium">{quantity}</span>
                                        <button
                                            onClick={() => setQuantity(quantity + 1)}
                                            className="p-1.5 hover:bg-white/10 rounded text-gray-300"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 mb-3">
                                <button
                                    disabled={!product.inStock}
                                    className="flex-1 py-3 border border-white/20 text-gray-100 font-medium rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50 text-sm"
                                    onClick={() => toast.success('Added to cart')}
                                >
                                    Add to Cart
                                </button>
                                <button
                                    disabled={!product.inStock}
                                    className="flex-1 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-500 transition-colors disabled:opacity-50 text-sm"
                                    onClick={() => toast.success('Proceeding to checkout...')}
                                >
                                    Buy Now
                                </button>
                            </div>

                            <button
                                onClick={onVisualize}
                                className="w-full py-3 border border-white/10 bg-white/[0.02] text-gray-300 font-medium rounded-lg hover:bg-white/[0.05] transition-all flex items-center justify-center gap-2 text-sm"
                            >
                                <Eye size={16} />
                                <span>View in AR</span>
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

// --- Visualize Method Modal ---
const VisualizeModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    productName: string;
}> = ({ isOpen, onClose, productName }) => {
    const navigate = useNavigate();
    const [method, setMethod] = useState<'project' | 'upload'>('project');
    const [selectedProject, setSelectedProject] = useState('');

    const mockProjects = [
        { id: '1', name: 'Living Room Makeover' },
        { id: '2', name: 'Kitchen Renovation' },
        { id: '3', name: 'Bedroom Redesign' },
    ];

    const handleStart = () => {
        if (method === 'project' && selectedProject) {
            toast.success(`Loading ${productName} into workspace...`);
            navigate(`/workspace/${selectedProject}`);
            onClose();
        } else if (method === 'upload') {
            toast('Upload feature coming soon!', { icon: '📷' });
        }
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold text-white">Try in Your Room</h3>
                    <button onClick={onClose} className="text-neutral-400 hover:text-white"><X size={20} /></button>
                </div>
                <p className="text-neutral-400 text-sm mb-6">Choose how you want to visualize <span className="text-white font-medium">{productName}</span> in your space.</p>

                <div className="space-y-3 mb-8">
                    {/* Select Project */}
                    <label
                        className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${method === 'project' ? 'border-amber-600 bg-amber-500/10' : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
                            }`}
                        onClick={() => setMethod('project')}
                    >
                        <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${method === 'project' ? 'border-amber-600' : 'border-neutral-500'
                            }`}>
                            {method === 'project' && <div className="w-2.5 h-2.5 rounded-full bg-amber-600" />}
                        </div>
                        <div className="flex-1">
                            <span className="text-white font-medium block mb-1">Select Existing Project</span>
                            <span className="text-xs text-neutral-400 block mb-3">Use a room you've already set up</span>
                            <select
                                value={selectedProject}
                                onChange={(e) => setSelectedProject(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <option value="" className="bg-neutral-900">Choose a project...</option>
                                {mockProjects.map(p => (
                                    <option key={p.id} value={p.id} className="bg-neutral-900">{p.name}</option>
                                ))}
                            </select>
                        </div>
                    </label>

                    {/* Upload Photo */}
                    <label
                        className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${method === 'upload' ? 'border-amber-600 bg-amber-500/10' : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
                            }`}
                        onClick={() => setMethod('upload')}
                    >
                        <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${method === 'upload' ? 'border-amber-600' : 'border-neutral-500'
                            }`}>
                            {method === 'upload' && <div className="w-2.5 h-2.5 rounded-full bg-amber-600" />}
                        </div>
                        <div className="flex-1">
                            <span className="text-white font-medium block mb-1">Upload New Room Photo</span>
                            <span className="text-xs text-neutral-400 block mb-2">Take a photo or upload an image</span>
                            <div className="flex items-center gap-2 text-xs text-amber-500 font-medium bg-amber-500/10 w-fit px-2 py-1 rounded">
                                <Upload size={12} />
                                <span>Upload Image</span>
                            </div>
                        </div>
                    </label>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-transparent text-neutral-400 font-medium hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleStart}
                        disabled={method === 'project' && !selectedProject}
                        className="flex-[2] py-3 bg-amber-600 text-white font-medium rounded-xl hover:bg-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-amber-900/40"
                    >
                        Continue <ArrowRight size={18} />
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// --- Filter Pills ---
const FilterPills: React.FC<{
    category: string;
    priceRange: string;
    style: string;
    onRemove: (type: string) => void;
    onClearAll: () => void;
}> = ({ category, priceRange, style, onRemove, onClearAll }) => {
    const hasFilters = category !== 'All Categories' || priceRange !== 'Any Price' || style !== 'All Styles';
    if (!hasFilters) return null;

    return (
        <div className="flex items-center justify-between py-3 border-b border-white/5">
            <div className="flex items-center gap-2 flex-wrap">
                {category !== 'All Categories' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full text-sm text-neutral-300 border border-white/10">
                        {category}
                        <button onClick={() => onRemove('category')} className="text-neutral-500 hover:text-white"><X size={12} /></button>
                    </span>
                )}
                {priceRange !== 'Any Price' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full text-sm text-neutral-300 border border-white/10">
                        {priceRange}
                        <button onClick={() => onRemove('price')} className="text-neutral-500 hover:text-white"><X size={12} /></button>
                    </span>
                )}
                {style !== 'All Styles' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full text-sm text-neutral-300 border border-white/10">
                        {style}
                        <button onClick={() => onRemove('style')} className="text-neutral-500 hover:text-white"><X size={12} /></button>
                    </span>
                )}
            </div>
            <button onClick={onClearAll} className="text-sm text-neutral-500 hover:text-white transition-colors">
                Clear All
            </button>
        </div>
    );
};

// --- Main Marketplace Component ---
const Marketplace: React.FC = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const urlQuery = searchParams.get('q') || '';

    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState(urlQuery);
    const [selectedCategory, setSelectedCategory] = useState('All Categories');
    const [selectedPrice, setSelectedPrice] = useState('Any Price');
    const [selectedStyle, setSelectedStyle] = useState('All Styles');
    const [sortBy, setSortBy] = useState('Relevance');
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [showVisualizeModal, setShowVisualizeModal] = useState(false);
    const [visualizeProductName, setVisualizeProductName] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 600);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        setSearchQuery(urlQuery);
    }, [urlQuery]);

    const filteredProducts = useMemo(() => {
        let result = [...allProducts];

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
        }

        if (selectedCategory !== 'All Categories') {
            result = result.filter(p => p.category === selectedCategory);
        }

        if (selectedStyle !== 'All Styles') {
            result = result.filter(p => p.style === selectedStyle);
        }

        if (selectedPrice !== 'Any Price') {
            const range = priceRanges.find(r => r.label === selectedPrice);
            if (range) {
                result = result.filter(p => p.price >= range.min && p.price <= range.max);
            }
        }

        switch (sortBy) {
            case 'Price ↑':
                result.sort((a, b) => a.price - b.price);
                break;
            case 'Price ↓':
                result.sort((a, b) => b.price - a.price);
                break;
            case 'Newest':
                result.sort((a, b) => parseInt(b.id.split('-')[1]) - parseInt(a.id.split('-')[1]));
                break;
        }

        return result;
    }, [searchQuery, selectedCategory, selectedStyle, selectedPrice, sortBy]);

    const handleVisualize = (productName: string) => {
        setVisualizeProductName(productName);
        setShowVisualizeModal(true);
    };

    const filterOptions = [
        { label: 'Category', value: selectedCategory, options: categories, onChange: setSelectedCategory },
        { label: 'Price', value: selectedPrice, options: priceRanges.map(r => r.label), onChange: setSelectedPrice },
        { label: 'Style', value: selectedStyle, options: styles, onChange: setSelectedStyle },
    ];

    return (
        <>
            <Toaster position="bottom-right" toastOptions={{
                style: { background: 'rgba(38, 38, 38, 0.95)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }
            }} />

            <PageContainer>
                {/* Page Header */}
                <div className="mb-10">
                    <h1 className="text-5xl font-serif font-bold text-white tracking-tight mb-2">Our Magical Finds</h1>
                    <p className="text-base text-gray-400 leading-relaxed max-w-2xl">
                        Curated furniture, lighting, and decor selected by top architects for your dream space.
                    </p>
                </div>

                {/* Universal Filter Bar */}
                <UniversalFilterBar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    searchPlaceholder="Search magical finds..."
                    filters={filterOptions}
                    count={filteredProducts.length}
                    countLabel="products"
                    sortOptions={['Relevance', 'Price ↑', 'Price ↓', 'Newest']}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                />

                {/* Product Grid - Bento / Masonry Style */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="animate-pulse bg-white/5 rounded-2xl aspect-[3/4]" />
                        ))}
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-24 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                        <Package size={48} className="mx-auto text-gray-600 mb-4" />
                        <h3 className="text-xl font-medium text-white mb-2">No magical finds here</h3>
                        <p className="text-gray-500">Try adjusting your filters to discover something else.</p>
                        <button
                            onClick={() => {
                                setSelectedCategory('All Categories');
                                setSelectedPrice('Any Price');
                                setSelectedStyle('All Styles');
                                setSearchQuery('');
                            }}
                            className="mt-6 text-orange-500 hover:text-orange-400 text-sm font-medium"
                        >
                            Clear all filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[320px]">
                        {filteredProducts.map((product, index) => {
                            // Featured items span 2 columns and 2 rows (or just cols)
                            // Pattern: 1st item is big (2x2), others are 1x1. or some random variation.
                            // Let's make index 0 and 6 span 2x2 for variety if screen is large enough.
                            const isFeatured = index === 0 || index === 6;
                            const colSpan = isFeatured ? 'sm:col-span-2 lg:col-span-2' : 'col-span-1';
                            const rowSpan = isFeatured ? 'row-span-2' : 'row-span-1';

                            return (
                                <motion.div
                                    key={product.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                    onClick={() => setSelectedProduct(product)}
                                    className={`group relative rounded-2xl overflow-hidden cursor-pointer ${colSpan} ${rowSpan}`}
                                >
                                    {/* Full Bleed Image */}
                                    <div className="absolute inset-0 bg-gray-900">
                                        <img
                                            src={product.images[0]}
                                            alt={product.name}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                                    </div>

                                    {/* Badges */}
                                    <div className="absolute top-4 left-4 flex gap-2">
                                        {product.isSponsored && (
                                            <span className="px-2 py-1 bg-white/90 backdrop-blur text-black text-[10px] font-bold uppercase tracking-wider rounded-sm">
                                                Sponsored
                                            </span>
                                        )}
                                        {isFeatured && (
                                            <span className="px-2 py-1 bg-orange-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-sm shadow-lg">
                                                Featured
                                            </span>
                                        )}
                                    </div>

                                    {/* Glassmorphism Details Overlay */}
                                    <div className="absolute bottom-4 left-4 right-4 p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex flex-col gap-1 transition-all duration-300 group-hover:translate-y-[-40px] md:group-hover:translate-y-[-48px]">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-[10px] text-gray-300 uppercase tracking-widest mb-1">{product.brand}</p>
                                                <h3 className="text-white font-serif text-lg leading-tight line-clamp-1">{product.name}</h3>
                                            </div>
                                            <p className="text-orange-400 font-bold text-sm bg-black/40 px-2 py-1 rounded-lg backdrop-blur-sm">
                                                {formatPrice(product.price)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Hover Actions (Visualize) */}
                                    <div className="absolute bottom-4 left-4 right-4 flex gap-2 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleVisualize(product.name);
                                            }}
                                            className="flex-1 bg-white text-black py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-orange-500 hover:text-white transition-colors shadow-lg flex items-center justify-center gap-2"
                                        >
                                            <Eye size={14} /> Visualize
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toast.success('Added to wishlist');
                                            }}
                                            className="w-10 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-lg flex items-center justify-center hover:bg-white hover:text-black transition-colors"
                                        >
                                            <Heart size={16} />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </PageContainer>

            {/* Product Detail Modal */}
            <AnimatePresence>
                {selectedProduct && (
                    <ProductDetailModal
                        product={selectedProduct}
                        currentProductId={selectedProduct.id}
                        allProducts={allProducts}
                        onClose={() => setSelectedProduct(null)}
                        onVisualize={() => { handleVisualize(selectedProduct.name); setSelectedProduct(null); }}
                        onProductSelect={(product) => setSelectedProduct(product)}
                    />
                )}
            </AnimatePresence>

            {/* Visualize Method Modal */}
            <AnimatePresence>
                <VisualizeModal
                    isOpen={showVisualizeModal}
                    onClose={() => setShowVisualizeModal(false)}
                    productName={visualizeProductName}
                />
            </AnimatePresence>

        </>
    );
};

export default Marketplace;
