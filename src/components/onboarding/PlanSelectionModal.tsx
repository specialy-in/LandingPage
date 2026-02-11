import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { doc, setDoc, serverTimestamp, getDoc, getDocFromCache, getDocFromServer } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface PlanSelectionModalProps {
  onClose: () => void;
}

interface PlanFeature {
  text: string;
  included: boolean;
  badge?: string;
}

interface Plan {
  id: string;
  title: string;
  subtitle: string;
  price: string;
  role: 'homeowner' | 'professional';
  features: PlanFeature[];
  buttonText: string;
  buttonVariant: 'outline' | 'solid';
  highlight?: boolean;
}

const plans: Plan[] = [
  {
    id: 'homeowner',
    title: 'Homeowners',
    subtitle: 'Perfect for planning your renovation',
    price: '₹0',
    role: 'homeowner',
    features: [
      { text: 'Upload photos', included: true },
      { text: 'Browse marketplace', included: true },
      { text: 'Visualize products', included: true },
      { text: 'Send proposals to architects', included: true },
      { text: 'No AI renders', included: false },
      { text: 'Max 3 active projects', included: false },
      { text: 'No commission earnings', included: false },
    ],
    buttonText: 'Start Free',
    buttonVariant: 'outline',
  },
  {
    id: 'student',
    title: 'Student/Enthusiast',
    subtitle: 'Build your portfolio while learning',
    price: '₹499/mo',
    role: 'professional',
    features: [
      { text: 'Portfolio website', included: true },
      { text: 'Manage 3 clients', included: true },
      { text: 'Basic BOQ generator', included: true },
      { text: 'Client portal', included: true },
      { text: 'No leads from platform', included: false },
      { text: 'No commission', included: false },
      { text: 'Watermarked exports', included: false },
    ],
    buttonText: 'Start Free Trial',
    buttonVariant: 'outline',
  },
  {
    id: 'freelancer',
    title: 'Freelancer',
    subtitle: 'For independent designers ready to scale',
    price: '₹999/mo',
    role: 'professional',
    features: [
      { text: 'Everything in Student', included: true },
      { text: 'Unlimited clients', included: true },
      { text: 'Get high-intent leads', included: true, badge: '⭐' },
      { text: 'Earn 5% commission', included: true, badge: '💰' },
      { text: 'Auto BOQ & proposals', included: true },
      { text: 'Advanced analytics', included: true },
    ],
    buttonText: 'Start Free Trial',
    buttonVariant: 'solid',
    highlight: true,
  },
  {
    id: 'studio',
    title: 'Studio',
    subtitle: 'For teams managing 10+ projects',
    price: '₹1,999/mo',
    role: 'professional',
    features: [
      { text: 'Everything in Freelancer', included: true },
      { text: 'Team workspace (3 seats)', included: true },
      { text: '5 FREE leads/month', included: true, badge: '🎁' },
      { text: 'White-label client portal', included: true },
      { text: 'Dedicated account manager', included: true },
      { text: 'Priority support', included: true },
    ],
    buttonText: 'Contact Sales',
    buttonVariant: 'outline',
  },
];

const PlanSelectionModal: React.FC<PlanSelectionModalProps> = ({ onClose }) => {
  const { signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const handleSelectPlan = async (plan: Plan) => {
    setSelectedPlanId(plan.id);
    localStorage.setItem('selectedPlan', plan.id);
    localStorage.setItem('selectedRole', plan.role);
    setLoading(true);

    try {
      let currentUser = user;

      if (!currentUser) {
        // Show popup for sign in
        const signedInUser = await signInWithGoogle();

        // User cancelled the popup
        if (!signedInUser) {
          setLoading(false);
          setSelectedPlanId(null);
          return; // Don't close modal, let user try again
        }

        currentUser = signedInUser;
      }

      if (currentUser) {
        // Auth succeeded! Navigate immediately - don't wait for Firestore
        toast.success('Welcome to dimensionloop!');
        onClose();
        navigate('/dashboard');

        // Try to save user profile in background (won't block navigation)
        try {
          const userRef = doc(db, 'users', currentUser.uid);

          // Use a timeout to prevent hanging
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Firestore timeout')), 5000)
          );

          const saveUserProfile = async () => {
            // Check if user exists first
            let userExists = false;
            try {
              const userSnap = await getDocFromServer(userRef);
              userExists = userSnap.exists();
            } catch (e) {
              // Offline or error - assume new user
              userExists = false;
            }

            if (!userExists) {
              await setDoc(userRef, {
                uid: currentUser!.uid,
                email: currentUser!.email,
                displayName: currentUser!.displayName,
                photoURL: currentUser!.photoURL,
                selectedPlan: plan.id,
                role: plan.role,
                createdAt: serverTimestamp(),
                hasCompletedOnboarding: true,
              });
            }

            localStorage.removeItem('selectedPlan');
            localStorage.removeItem('selectedRole');
          };

          // Race between save and timeout
          await Promise.race([saveUserProfile(), timeoutPromise]);

        } catch (firestoreError) {
          // Log but don't block - user is already in dashboard
          console.warn('Background user profile save failed (will retry later):', firestoreError);
        }

        return;
      }

    } catch (error: any) {
      console.error("Plan selection/Auth error:", error);

      // Handle popup-specific errors
      if (error?.code === 'auth/popup-closed-by-user') {
        // User closed popup, just reset state
        setLoading(false);
        setSelectedPlanId(null);
        return;
      }

      if (error?.code === 'auth/popup-blocked') {
        toast.error('Popup was blocked. Please allow popups for this site.');
      } else if (error?.code === 'unavailable' || error?.message?.includes('offline')) {
        toast.error('Connection issue. Please check your internet.');
      } else if (error?.code === 'permission-denied') {
        toast.error('Access denied. Please try signing in again.');
      } else {
        toast.error('Something went wrong. Please try again.');
      }

      setSelectedPlanId(null);
    } finally {
      setLoading(false);
    }
  };

  // Helper import for auth instance required inside the function since useAuth wrapper might likely just expose helpers
  // I'll import auth from firebase.ts directly for the user check above, but for consistency let's just assume useAuth updates 'user' state
  // actually, inside the async function, the 'user'from hook won't update immediately. 
  // reusing the 'auth' import from 'firebase' is safer for immediate post-login check.
  // const { auth } = require('../../lib/firebase');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-900 w-full max-w-[1200px] rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-10"
          >
            <X size={24} className="text-gray-500" />
          </button>

          {/* Header */}
          <div className="text-center pt-10 pb-6 px-6">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              Choose Your Plan
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto">
              Start designing your space or growing your practice. All plans include 14-day free trial.
            </p>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6 overflow-y-auto">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`flex flex-col p-6 rounded-xl border transition-all duration-300 relative cursor-pointer hover:scale-[1.02] hover:shadow-2xl ${plan.highlight
                  ? 'border-blue-500 shadow-xl bg-white dark:bg-gray-800 transform lg:-translate-y-2 z-10'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300'
                  }`}
              >
                {plan.highlight && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full tracking-wider">
                    MOST POPULAR
                  </div>
                )}

                <div className="mb-6 text-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{plan.title}</h3>
                  <div className="text-sm text-gray-500 mb-4">{plan.subtitle}</div>
                  <div className="text-3xl font-serif font-bold text-gray-900 dark:text-white">
                    {plan.price}
                  </div>
                </div>

                <ul className="space-y-3 mb-8 flex-grow">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex gap-2 text-sm items-start">
                      {feature.included ? (
                        <Check size={16} className="text-green-500 shrink-0 mt-0.5" />
                      ) : (
                        <X size={16} className="text-gray-400 shrink-0 mt-0.5" />
                      )}
                      <span className={feature.included ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}>
                        {feature.text}
                        {feature.badge && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                            {feature.badge}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={loading}
                  className={`w-full py-3 rounded-md font-medium transition-all duration-200 ${plan.buttonVariant === 'solid'
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                    : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-900 dark:hover:border-white hover:text-gray-900 dark:hover:text-white bg-transparent'
                    }`}
                >
                  {loading && selectedPlanId === plan.id ? 'Loading...' : plan.buttonText}
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PlanSelectionModal;