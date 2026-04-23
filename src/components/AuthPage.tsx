import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, checkConnectivity } from '../lib/firebase';
import { motion } from 'motion/react';
import { User, Mail, Lock, UserPlus, LogIn, ArrowRight, Shield, Activity } from 'lucide-react';

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'patient';
  const isPatient = role === 'patient';

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);

  const runDiagnostics = async () => {
    setDiagnosing(true);
    const d = await checkConnectivity();
    setDiagnosing(false);
    
    if (d.firestore && d.auth) {
      alert("✅ Network check passed! Your connection to Firebase is healthy. If you still see errors, try refreshing the page.");
    } else {
      const issues = [];
      if (!d.auth) issues.push("- Auth Endpoint (identitytoolkit.googleapis.com)");
      if (!d.firestore) issues.push("- Firestore Backend (firestore.googleapis.com)");
      
      alert(`❌ Diagnostic failure! The system cannot reach:\n${issues.join('\n')}\n\nCause: Most likely an ad-blocker or corporate firewall. Please disable extensions or open the app in a new tab.`);
    }
  };

  const validateForm = () => {
    if (!email || !email.trim()) {
      setError('Email address is strictly required.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please provide a valid clinical email address (e.g., user@example.com).');
      return false;
    }
    if (!password || password.length < 6) {
      setError('Security credentials must be at least 6 characters long.');
      return false;
    }
    if (!isLogin && isPatient) {
      if (!name || name.trim().length < 3) {
        setError('Please provide your full legal name (minimum 3 characters).');
        return false;
      }
      const ageNum = parseInt(age);
      if (isNaN(ageNum) || ageNum <= 0 || ageNum > 120) {
        setError('Please provide a valid medical age (1-120).');
        return false;
      }
      if (!gender) {
        setError('Please select a gender identity for medical accuracy.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        // Role check happens in App.tsx
      } else {
        if (!isPatient) {
          throw new Error('Admins can only log in.');
        }
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: name });

        // Create patient profile in Firestore
        await setDoc(doc(db, 'patients', user.uid), {
          name,
          email,
          age: parseInt(age),
          gender,
          createdAt: new Date()
        });
      }
    } catch (err: any) {
      console.error(err);
      const code = err.code || '';
      const message = err.message || '';
      
      if (code === 'auth/operation-not-allowed') {
        setError('The Email/Password provider is disabled in Firebase. Please enable it in the Firebase Console (Authentication > Sign-in method).');
      } else if (code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in instead.');
        setIsLogin(true); // Automatically switch to login tab
      } else if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password' || message.includes('auth/invalid-credential')) {
        setError('Invalid email address or password. Please verify your credentials and try again.');
      } else if (code === 'auth/too-many-requests') {
        setError('Account temporarily locked due to too many failed attempts. Please try again in a few minutes.');
      } else if (code === 'auth/user-disabled') {
        setError('This account has been disabled. Please contact support.');
      } else if (code === 'auth/network-request-failed' || message.includes('network-request-failed')) {
        setError('A network error occurred while connecting to Google Identity Services. This is commonly caused by ad-blockers (uBlock Origin, AdBlock Plus) or corporate firewall rules blocking googleapis.com. If you are using a VPN, try toggling it off.');
      } else {
        setError(message.replace('Firebase:', '').trim() || 'An authentication error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const seedAdmin = async () => {
    setError('');
    setLoading(true);
    try {
      const email = 'admin@example.com';
      const password = 'admin123';
      
      let user;
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        user = cred.user;
      } catch (e: any) {
        if (e.code === 'auth/email-already-in-use') {
          const cred = await signInWithEmailAndPassword(auth, email, password);
          user = cred.user;
        } else if (e.code === 'auth/operation-not-allowed') {
          throw new Error('The Email/Password provider is disabled in Firebase. Please enable it in the Console.');
        } else {
          throw e;
        }
      }

      await setDoc(doc(db, 'admins', user.uid), {
        email: user.email,
        seededAt: new Date()
      });
      
      alert('Admin account seeded successfully! Refreshing to apply permissions...');
      window.location.reload();
    } catch (err: any) {
      if (err.code === 'auth/network-request-failed') {
        setError('Seeding failed due to a network error. This is often caused by ad-blockers or iframe restrictions. Please try opening the app in a new tab.');
      } else {
        setError('Seeding failed: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-[2rem] p-10 shadow-sm border border-sage-200"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-sage-50 rounded-2xl mb-6 border border-sage-200">
            {isLogin ? <LogIn className="w-8 h-8 text-sage-800" /> : <UserPlus className="w-8 h-8 text-sage-800" />}
          </div>
          <h2 className="text-3xl font-light text-sage-900 font-serif lowercase">
            {isLogin ? `${isPatient ? 'patient' : 'admin'} login` : 'patient registration'}
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-sage-600 mt-3 border-y border-sage-100 py-1 inline-block px-4">
            {isLogin ? `HerbRx ${role} portal` : 'Begin herbal journey'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-bold leading-relaxed italic flex flex-col gap-2">
            <div>Error: {error}</div>
            {error.includes('network') && (
              <div className="flex flex-col gap-2 mt-2">
                <button 
                  onClick={() => window.open(window.location.origin, '_blank')}
                  className="text-sage-800 underline uppercase tracking-tighter text-[9px] text-left hover:text-sage-900 flex items-center gap-2"
                >
                  ➔ Try opening in a new tab (recommended)
                </button>
                <button 
                  onClick={runDiagnostics}
                  disabled={diagnosing}
                  className="text-sage-600 underline uppercase tracking-tighter text-[9px] text-left hover:text-sage-800 flex items-center gap-2 disabled:opacity-50"
                >
                  <Activity className="w-3 h-3" />
                  {diagnosing ? 'Verifying signals...' : 'Run Connectivity Tool'}
                </button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">

          {!isLogin && isPatient && (
            <>
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-sage-800 ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-sage-50 border border-sage-200 rounded-xl py-4 pl-12 pr-4 text-sage-900 focus:outline-none focus:ring-1 focus:ring-sage-800 font-medium text-sm"
                    placeholder="Enter full name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-sage-800 ml-1">Age</label>
                  <input
                    type="number"
                    required
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full bg-sage-50 border border-sage-200 rounded-xl py-4 px-4 text-sage-900 focus:outline-none focus:ring-1 focus:ring-sage-800 font-medium text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-sage-800 ml-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-sage-50 border border-sage-200 rounded-xl py-4 px-4 text-sage-900 focus:outline-none focus:ring-1 focus:ring-sage-800 font-medium text-sm appearance-none"
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-widest text-sage-800 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-sage-50 border border-sage-200 rounded-xl py-4 pl-12 pr-4 text-sage-900 focus:outline-none focus:ring-1 focus:ring-sage-800 font-medium text-sm"
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-widest text-sage-800 ml-1">Secure Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-sage-50 border border-sage-200 rounded-xl py-4 pl-12 pr-4 text-sage-900 focus:outline-none focus:ring-1 focus:ring-sage-800 font-medium text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sage-800 text-white rounded-xl py-4 font-bold text-xs uppercase tracking-[0.2em] hover:bg-sage-900 transition-all shadow-md group disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        {isPatient && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-[10px] font-extrabold uppercase tracking-widest text-sage-800 hover:underline"
            >
              {isLogin ? "Need a patient account? Sign Up" : "Back to login"}
            </button>
          </div>
        )}

        {!isPatient && (
          <div className="mt-10 pt-8 border-t border-sage-100 italic font-serif text-sm text-center text-sage-500">
            <button
              onClick={seedAdmin}
              className="hover:text-sage-800 transition-colors"
            >
              * System seed requested for demo admin?
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-[9px] text-sage-400 uppercase tracking-widest leading-relaxed">
            Persistent network errors? <br/>
            <a 
              href={window.location.href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sage-600 font-bold hover:underline"
            >
              Open in a new tab
            </a> to bypass browser blocks.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
