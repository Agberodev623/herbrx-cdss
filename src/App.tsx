/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { UserRole } from './types';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import PatientDashboard from './components/PatientDashboard';
import AdminDashboard from './components/AdminDashboard';
import { Activity, LogOut, Menu, X, Leaf } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [authState, setAuthState] = useState<{
    user: User | null;
    role: UserRole;
    loading: boolean;
  }>({
    user: null,
    role: null,
    loading: true
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      let role: UserRole = null;
      try {
        if (user) {
          const adminDoc = await getDoc(doc(db, 'admins', user.uid));
          role = adminDoc.exists() ? 'admin' : 'patient';
        }
        setAuthState({ user, role, loading: false });
      } catch (error: any) {
        console.error("Error fetching user role:", error);
        // Fallback: If we can't reach the backend, assume patient but set a warning
        // especially if the error is connectivity related
        const isOffline = error.code === 'unavailable' || error.message?.includes('unavailable');
        setAuthState({ 
          user, 
          role: user ? 'patient' : null, 
          loading: false 
        });
        
        if (isOffline) {
          console.warn("Operating in offline mode. Role defaults to 'patient' until connection is restored.");
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const { user, role, loading } = authState;

  const handleLogout = () => {
    auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <motion.div 
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="w-12 h-12 border-t-2 border-sage-800 rounded-full"
        />
      </div>
    );
  }

  const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
    if (!user || role !== 'admin') {
      return <Navigate to="/" replace />;
    }
    return <>{children}</>;
  };

  const ProtectedPatientRoute = ({ children }: { children: React.ReactNode }) => {
    if (!user || role !== 'patient') {
      return <Navigate to="/" replace />;
    }
    return <>{children}</>;
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-sage-50 text-sage-900 font-sans flex flex-col">
        {/* Navigation */}
        <nav className="h-16 border-b border-sage-200 bg-white sticky top-0 z-50 shrink-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="w-8 h-8 bg-sage-800 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
                  <Leaf className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-semibold tracking-tight text-sage-800 uppercase font-serif">HerbRx</span>
              </Link>
            </div>

            {/* Desktop menu */}
            <div className="hidden md:flex items-center gap-8">
              <div className="flex gap-6 text-sm font-medium text-sage-600">
                <Link to="/" className="hover:text-sage-800 transition-colors">Home</Link>
                {user && (
                  <Link to={role === 'admin' ? '/admin' : '/dashboard'} className="hover:text-sage-800 transition-colors">
                    Dashboard
                  </Link>
                )}
              </div>
              
              <div className="flex items-center gap-4 pl-8 border-l border-sage-200">
                {user ? (
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase text-sage-800">{user.displayName || 'User'}</p>
                      <p className="text-[10px] text-sage-600">{role === 'admin' ? 'Administrator' : 'Patient'}</p>
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="p-2 text-sage-600 hover:text-red-100 transition-colors"
                      title="Logout"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <Link to="/auth?role=patient" className="text-sm font-medium text-sage-800 hover:underline">Patient Login</Link>
                    <Link to="/auth?role=admin" className="px-5 py-2 bg-sage-800 text-white rounded-lg hover:bg-sage-900 font-bold text-xs uppercase tracking-wider transition-all">
                      Admin Portal
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-sage-800"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile menu content */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden bg-white border-t border-sage-100 shadow-xl"
              >
                <div className="px-4 py-6 space-y-4">
                  <Link to="/" onClick={() => setIsMenuOpen(false)} className="block text-sage-800 font-bold text-lg font-serif italic">Home</Link>
                  {user ? (
                    <>
                      <Link to={role === 'admin' ? '/admin' : '/dashboard'} onClick={() => setIsMenuOpen(false)} className="block text-sage-800 font-medium">Dashboard</Link>
                      <button 
                        onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                        className="w-full text-left flex items-center gap-3 text-red-600 font-bold pt-4 border-t border-sage-50"
                      >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/auth?role=patient" onClick={() => setIsMenuOpen(false)} className="block text-sage-600 font-medium">Patient Login</Link>
                      <Link to="/auth?role=admin" onClick={() => setIsMenuOpen(false)} className="block px-6 py-3 bg-sage-800 text-white rounded-xl text-center font-bold uppercase text-sm tracking-widest">Admin Portal</Link>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex-1 py-8 overflow-x-hidden">
          <Routes>
            <Route 
              path="/" 
              element={
                !user ? <LandingPage /> : 
                role === 'admin' ? <Navigate to="/admin" replace /> :
                role === 'patient' ? <Navigate to="/dashboard" replace /> :
                <LandingPage />
              } 
            />
            <Route 
              path="/auth" 
              element={
                !user ? <AuthPage /> : 
                role === 'admin' ? <Navigate to="/admin" replace /> : 
                <Navigate to="/dashboard" replace />
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedPatientRoute>
                  <PatientDashboard user={user!} />
                </ProtectedPatientRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedAdminRoute>
                  <AdminDashboard />
                </ProtectedAdminRoute>
              } 
            />
          </Routes>
        </main>

        <footer className="h-12 border-t border-sage-200 bg-white flex items-center shrink-0">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between text-[10px] font-medium text-sage-600">
            <p>© 2026 HerbRx — Secure Herbal Prescription System</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-sage-800 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-sage-800 transition-colors">Medical Disclaimer</a>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}
