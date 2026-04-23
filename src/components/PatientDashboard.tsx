import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  onSnapshot,
  orderBy,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Remedy, Prescription, Patient } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  History, 
  Stethoscope, 
  ClipboardCheck, 
  AlertTriangle, 
  Clock, 
  ChevronRight,
  Printer,
  Download,
  Info,
  Leaf,
  Activity,
  Thermometer,
  Moon,
  Brain,
  Coffee,
  BatteryLow,
  Sparkles,
  Waves,
  ShieldAlert,
  ShieldCheck,
  Bone,
  Flower2,
  Droplets,
  Flame,
  Wind,
  Plus,
  Edit2,
  Check,
  X,
  Trash2
} from 'lucide-react';

export default function PatientDashboard({ user }: { user: User }) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [remedies, setRemedies] = useState<Remedy[]>([]);
  const [history, setHistory] = useState<Prescription[]>([]);
  const [search, setSearch] = useState('');
  const [selectedRemedy, setSelectedRemedy] = useState<Remedy | null>(null);

  const getSicknessIcon = (sickness: string) => {
    const s = sickness.toLowerCase();
    if (s.includes('cold')) return Thermometer;
    if (s.includes('insomnia') || s.includes('sleep')) return Moon;
    if (s.includes('headache')) return Brain;
    if (s.includes('indigestion') || s.includes('bloating')) return Coffee;
    if (s.includes('anxiety') || s.includes('stress')) return Brain;
    if (s.includes('fatigue')) return BatteryLow;
    if (s.includes('skin') || s.includes('eczema')) return Sparkles;
    if (s.includes('burn')) return Flame;
    if (s.includes('cramp') || s.includes('menstrual')) return Waves;
    if (s.includes('throat')) return ShieldAlert;
    if (s.includes('joint') || s.includes('pain')) return Bone;
    if (s.includes('allergy')) return Flower2;
    if (s.includes('urinary')) return Droplets;
    if (s.includes('cough')) return Wind;
    return Leaf;
  };

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const docRef = doc(db, 'patients', user.uid);
    const unsubscribeProfile = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setPatient({ id: snap.id, ...snap.data() } as Patient);
        setProfileLoading(false);
      } else {
        console.warn(`No patient profile found for UID: ${user.uid}`);
        setPatient(null);
        setProfileLoading(false);
      }
    }, (err) => {
      console.error("Firestore listener error (profile):", err);
      setProfileLoading(false);
    });

    const q = query(
      collection(db, 'prescriptions'), 
      where('patientId', '==', user.uid),
      orderBy('generatedAt', 'desc')
    );
    const unsubscribeHistory = onSnapshot(q, (snap) => {
      setHistory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prescription)));
    }, (err) => {
      console.error("Firestore listener error (history):", err);
    });

    const fetchRemedies = async () => {
      try {
        const snap = await getDocs(collection(db, 'remedies'));
        setRemedies(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Remedy)));
      } catch (err) {
        console.error("Error fetching remedies:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRemedies();
    return () => {
      unsubscribeProfile();
      unsubscribeHistory();
    };
  }, [user.uid]);

  const term = search.trim().toLowerCase();
  const filteredRemedies = term ? remedies.filter(r => 
    r.sicknessName.toLowerCase().includes(term) ||
    term.includes(r.sicknessName.toLowerCase())
  ) : [];

  const [profileData, setProfileData] = useState({ age: '', gender: 'Male' });

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const ageNum = parseInt(profileData.age);
    if (isNaN(ageNum) || ageNum <= 0 || ageNum > 120) {
      alert('Please provide a valid medical age (1-120).');
      return;
    }

    try {
      const docData = {
        name: user.displayName || 'Unnamed Patient',
        email: user.email,
        age: ageNum,
        gender: profileData.gender,
        updatedAt: serverTimestamp()
      };

      // Only add createdAt if it doesn't exist
      if (!patient) {
        (docData as any).createdAt = serverTimestamp();
      }

      await setDoc(doc(db, 'patients', user.uid), docData, { merge: true });
      setIsEditingProfile(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save profile.');
    }
  };

  const startEditing = () => {
    if (patient) {
      setProfileData({
        age: patient.age.toString(),
        gender: patient.gender
      });
      setIsEditingProfile(true);
    }
  };

  const [deleting, setDeleting] = useState(false);
  const [deleteStep, setDeleteStep] = useState(0); // 0: initial, 1: confirming

  const handleDeleteProfile = async () => {
    if (deleteStep === 0) {
      setDeleteStep(1);
      setTimeout(() => setDeleteStep(0), 5000); // Reset after 5 seconds of inactivity
      return;
    }

    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'patients', user.uid));
      setPatient(null);
      setIsEditingProfile(false);
      alert('Your clinical profile has been successfully terminated.');
    } catch (err: any) {
      console.error("Profile deletion error:", err);
      alert(`Failed to delete profile: ${err.message || 'Check your connection.'}`);
    } finally {
      setDeleting(false);
      setDeleteStep(0);
    }
  };

  const generatePrescription = async (remedy: Remedy) => {
    setGenerating(true);
    try {
      const prescriptionData = {
        patientId: user.uid,
        sickness: remedy.sicknessName,
        remedyId: remedy.id,
        generatedAt: serverTimestamp(),
        details: remedy
      };

      await addDoc(collection(db, 'prescriptions'), prescriptionData);
      setSelectedRemedy(remedy);
    } catch (err) {
      console.error(err);
      alert('Failed to generate prescription.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-800"></div>
    </div>
  );

  return (
    <div className="grid lg:grid-cols-12 gap-0 border border-sage-200 rounded-[2.5rem] bg-white overflow-hidden shadow-sm">
      
      {/* Left Column: Patient Profile */}
      <section className="lg:col-span-3 border-r border-sage-200 p-8 bg-sage-100 flex flex-col gap-8">
        <div className="card-geometric p-8 bg-white border-2 border-sage-800/10 shadow-xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:rotate-12 transition-transform duration-700">
              <Stethoscope className="w-24 h-24" />
           </div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="label-micro text-sage-400">Patient Health Profile</h3>
              {patient && !isEditingProfile && (
                <button 
                  onClick={startEditing}
                  className="p-1.5 rounded-lg bg-sage-50 text-sage-400 hover:text-sage-800 hover:bg-sage-100 transition-all"
                  title="Edit Profile"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              )}
            </div>
            {patient && !isEditingProfile ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6 relative z-10"
              >
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-sage-400 mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                    <span className="text-xs font-bold text-sage-900 uppercase">Verified Patient</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-sage-400 mb-1">Age</p>
                    <p className="text-lg font-serif font-bold text-sage-800">{patient.age}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-sage-400 mb-1">Gender</p>
                    <p className="text-lg font-serif font-bold text-sage-800">{patient.gender}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-sage-400 mb-1">Clinical ID</p>
                  <p className="text-[10px] font-mono text-sage-600">USR-{patient.id.substring(0,8).toUpperCase()}</p>
                </div>
                <div className="pt-4 border-t border-sage-100 flex justify-center">
                  <button 
                    onClick={handleDeleteProfile}
                    disabled={deleting}
                    className="text-[9px] font-bold uppercase tracking-[0.2em] text-red-300 hover:text-red-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-wait"
                  >
                    {deleting ? (
                      <div className="w-3 h-3 border-2 border-red-200 border-t-red-600 rounded-full animate-spin" />
                    ) : (
                      <Trash2 className={`w-3 h-3 ${deleteStep === 1 ? 'animate-pulse text-red-600' : ''}`} />
                    )}
                    {deleting ? 'Terminating...' : deleteStep === 1 ? 'Click again to confirm' : 'Delete Clinical Profile'}
                  </button>
                </div>
              </motion.div>
           ) : profileLoading && !isEditingProfile ? (
             <div className="py-12 flex flex-col items-center justify-center gap-4">
               <div className="w-6 h-6 border-2 border-sage-800/20 border-t-sage-800 rounded-full animate-spin" />
               <p className="text-[10px] font-bold uppercase tracking-widest text-sage-300">Synchronizing...</p>
             </div>
           ) : (
             <motion.form 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               onSubmit={handleSaveProfile} 
               className="space-y-4 relative z-10"
             >
               <p className="text-[11px] text-sage-500 font-serif italic leading-relaxed">
                 {patient ? "Update your health metrics to maintain diagnostic accuracy." : "Please complete your health profile to enable full diagnostic access."}
               </p>
               <div className="space-y-1">
                 <label className="text-[9px] font-bold uppercase text-sage-400 tracking-wider">Age</label>
                 <input 
                   type="number" 
                   required
                   value={profileData.age}
                   onChange={e => setProfileData({...profileData, age: e.target.value})}
                   className="w-full text-xs p-3 border border-sage-100 rounded-xl bg-sage-50 focus:outline-none focus:ring-1 focus:ring-sage-800 font-medium"
                 />
               </div>
               <div className="space-y-1">
                 <label className="text-[9px] font-bold uppercase text-sage-400 tracking-wider">Gender</label>
                 <select 
                   value={profileData.gender}
                   onChange={e => setProfileData({...profileData, gender: e.target.value})}
                   className="w-full text-xs p-3 border border-sage-100 rounded-xl bg-sage-50 focus:outline-none focus:ring-1 focus:ring-sage-800 font-medium appearance-none"
                 >
                   <option>Male</option>
                   <option>Female</option>
                   <option>Other</option>
                 </select>
               </div>
               <div className="flex gap-2">
                 <button type="submit" className="flex-1 bg-sage-800 text-white text-[10px] py-4 rounded-xl font-bold uppercase tracking-[0.2em] mt-2 hover:bg-sage-900 transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2">
                   <Check className="w-3 h-3" />
                   {patient ? "Apply" : "Initialize"}
                 </button>
                 {patient && (
                   <button 
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-4 bg-white border border-sage-200 text-sage-400 text-[10px] py-4 rounded-xl font-bold uppercase tracking-[0.2em] mt-2 hover:bg-sage-50 transition-all"
                   >
                     <X className="w-3 h-3" />
                   </button>
                 )}
               </div>
               {patient && (
                 <button 
                  type="button"
                  onClick={handleDeleteProfile}
                  disabled={deleting}
                  className="w-full text-red-300 hover:text-red-600 text-[9px] font-bold uppercase tracking-widest pt-2 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-wait"
                 >
                   {deleting ? (
                     <div className="w-3 h-3 border-2 border-red-200 border-t-red-600 rounded-full animate-spin" />
                   ) : (
                     <Trash2 className="w-3 h-3" />
                   )}
                   {deleting ? 'Processing...' : 'Terminate Profile'}
                 </button>
               )}
             </motion.form>
           )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#E9EDC9] p-6 rounded-[2rem] border border-[#CCD5AE] flex flex-col justify-between min-h-[120px] relative overflow-hidden group">
            <ClipboardCheck className="absolute -bottom-2 -right-2 w-12 h-12 text-sage-800/10 group-hover:scale-110 transition-transform" />
            <p className="text-[9px] uppercase font-bold text-sage-800 tracking-widest opacity-60">Total Logs</p>
            <p className="text-4xl font-serif font-bold text-sage-900">{history.length.toString().padStart(2, '0')}</p>
          </div>
          <div className="bg-[#FEFAE0] p-6 rounded-[2rem] border border-[#E9EDC9] flex flex-col justify-between min-h-[120px] relative overflow-hidden group">
            <Activity className="absolute -bottom-2 -right-2 w-12 h-12 text-tan-500/10 group-hover:scale-110 transition-transform" />
            <p className="text-[9px] uppercase font-bold text-tan-500 tracking-widest opacity-60">Course</p>
            <p className="text-4xl font-serif font-bold text-tan-500">{history.length > 0 ? '01' : '00'}</p>
          </div>
        </div>

        <div className="mt-8 p-6 bg-white rounded-2xl border border-sage-200 border-dashed text-center">
          <p className="text-[11px] text-sage-600 italic font-serif">"Nature itself is the best physician."</p>
          <p className="text-[10px] font-bold mt-2 text-sage-800 uppercase tracking-tighter">— Hippocrates</p>
        </div>
      </section>

      {/* Center Column: Diagnosis Engine */}
      <section className="lg:col-span-6 p-8 md:p-12 lg:p-16 flex flex-col gap-12 bg-white relative">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-[1px] bg-sage-200"></span>
            <p className="label-micro">Clinical Interface</p>
          </div>
          <h1 className="text-5xl font-light text-sage-900 font-serif tracking-tight">Diagnosis Engine</h1>
          <p className="text-sage-500 text-sm font-serif italic max-w-md">Input your observed symptoms below to synthesize a customized herbal mapping from our verified database.</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="label-micro">Primary Sickness/Symptom</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search sickness (e.g. Headache)"
                className="w-full bg-sage-50 border border-sage-200 rounded-xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-sage-800 font-medium"
              />
            </div>
            
            <AnimatePresence>
              {search && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-2 border border-sage-200 rounded-xl overflow-hidden shadow-md max-h-48 overflow-y-auto bg-white z-10"
                >
                  {filteredRemedies.length > 0 ? (
                    filteredRemedies.map(r => {
                      const Icon = getSicknessIcon(r.sicknessName);
                      return (
                        <button
                          key={r.id}
                          onClick={() => generatePrescription(r)}
                          className="w-full text-left p-4 hover:bg-sage-50 transition-colors border-b border-sage-100 last:border-0 flex items-center gap-4 group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-sage-50 flex items-center justify-center group-hover:bg-white transition-colors border border-transparent group-hover:border-sage-100">
                            <Icon className="w-4 h-4 text-sage-400 group-hover:text-sage-800" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-sage-800 uppercase">{r.sicknessName}</p>
                            <p className="text-[10px] text-sage-500 italic font-serif">{r.remedyName}</p>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center space-y-4">
                      <div className="mx-auto w-10 h-10 bg-sage-50 rounded-full flex items-center justify-center border border-sage-100">
                        <Search className="w-4 h-4 text-sage-300" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-sage-800 uppercase tracking-tighter">Sickness pattern not recognized</p>
                        <p className="text-[11px] text-sage-400 font-serif italic leading-relaxed">
                          Our clinical database does not currently have a mapping for this condition. 
                          Please <span className="text-sage-700 font-bold underline cursor-pointer">contact support</span> or wait for a research admin to review this query.
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Detailed Result Card */}
        {selectedRemedy && (() => {
          const SicknessIcon = getSicknessIcon(selectedRemedy.sicknessName);
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-geometric p-8 md:p-14 border-2 border-sage-800 bg-white relative shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                <SicknessIcon className="w-80 h-80 -rotate-12 translate-x-20 -translate-y-20" />
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start mb-16 relative z-10 gap-8">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-[2px] bg-sage-800" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-sage-400">Authentic Formulation</span>
                  </div>
                  <h2 className="text-4xl md:text-6xl font-serif text-sage-900 tracking-tight leading-[1.1]">
                    {selectedRemedy.remedyName}
                  </h2>
                  <div className="flex items-center gap-3 pt-2">
                    <div className="px-3 py-1 bg-sage-800 text-white rounded-full flex items-center gap-2">
                       <SicknessIcon className="w-3 h-3" />
                       <span className="text-[9px] font-bold uppercase tracking-widest text-white/90">Clinical Match</span>
                    </div>
                    <p className="text-xs font-bold text-sage-900 uppercase tracking-tighter">
                      Diagnosis: <span className="font-medium text-sage-500 italic lowercase font-serif">{selectedRemedy.sicknessName}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right bg-sage-50 p-8 rounded-[2rem] border border-sage-100 shadow-inner flex flex-col items-center justify-center min-w-[140px]">
                  <p className="text-[9px] uppercase font-bold text-sage-400 tracking-[0.3em] mb-2 leading-none">Treatment Cycle</p>
                  <p className="text-3xl font-serif italic text-sage-800 leading-none">{selectedRemedy.duration}</p>
                </div>
              </div>
              
              <div className="grid lg:grid-cols-12 gap-16 relative z-10">
                {/* Main Content Column */}
                <div className="lg:col-span-7 space-y-12">
                  <div className="relative">
                    <div className="flex items-center gap-4 mb-8">
                      <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-sage-400 whitespace-nowrap">Preparation Protocol</p>
                      <div className="h-px bg-sage-100 flex-1" />
                    </div>
                    <div className="bg-sage-50/30 p-8 rounded-[2.5rem] border border-sage-50">
                      <p className="text-sage-900 font-serif italic text-xl leading-[1.6] first-letter:text-6xl first-letter:font-bold first-letter:mr-4 first-letter:float-left first-letter:text-sage-800 first-letter:leading-[0.8] first-letter:mt-1">
                        {selectedRemedy.preparation}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-stretch gap-6">
                    <div className="flex-1 flex items-center gap-6 p-8 bg-sage-900 text-white rounded-[2rem] shadow-xl shadow-sage-900/10 transition-transform hover:scale-[1.02]">
                      <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-sm">
                        <Activity className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 mb-1">Prescribed Dosage</p>
                        <p className="text-xl font-serif italic text-white leading-tight">{selectedRemedy.dosage}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Safety & Side Effects Column */}
                <div className="lg:col-span-5 space-y-8">
                  <div className="h-full flex flex-col gap-6">
                    <div className="flex-1 p-10 bg-white rounded-[3rem] border border-sage-100 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
                         <ShieldCheck className="w-40 h-40" />
                      </div>
                      <div className="space-y-6 relative z-10">
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-sage-300">Integrity Check</p>
                        <div className="space-y-3">
                          <p className="text-[11px] font-bold uppercase text-sage-900 tracking-wider">Safety Invariants</p>
                          <p className="text-sm font-serif italic text-sage-600 leading-relaxed">
                            {selectedRemedy.precautions || "Standard natural health precautions apply. Consult with a qualified practitioner if symptoms persist."}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-10 bg-red-50/50 rounded-[3rem] border border-red-100/50 relative overflow-hidden group">
                      <div className="absolute -bottom-4 -right-4 opacity-[0.05] group-hover:rotate-12 transition-transform duration-700">
                         <AlertTriangle className="w-24 h-24 text-red-900" />
                      </div>
                      <div className="space-y-4 relative z-10">
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-red-800/30">Adverse Reaction Log</p>
                        <div className="space-y-1">
                          <p className="text-[11px] font-bold uppercase text-red-900/60 tracking-wider">Clinical Side Effects</p>
                          <p className="text-xs font-medium text-red-900/40 leading-relaxed font-sans">
                            {selectedRemedy.sideEffects || "No adverse reactions typically recorded for this specific preparation."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-20 flex flex-col sm:flex-row justify-between items-center pt-10 border-t border-sage-100 relative z-10 gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-sage-50 border border-sage-100 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-sage-400" />
                  </div>
                  <div>
                    <p className="text-[9px] font-mono text-sage-300 uppercase tracking-widest leading-none mb-1">
                      System Hash Verification
                    </p>
                    <p className="text-[10px] font-mono text-sage-800 font-bold leading-none">
                      0x{selectedRemedy.id.substring(0,12).toUpperCase()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 print:hidden">
                  <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-3 px-10 py-4 bg-sage-800 hover:bg-sage-900 text-white rounded-2xl transition-all text-xs font-bold uppercase tracking-[0.2em] shadow-lg shadow-sage-800/10 active:scale-95"
                  >
                    <Printer className="w-4 h-4" />
                    Archive Details
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })()}
      </section>

      {/* Right Column: History */}
      <section className="lg:col-span-3 bg-sage-100 border-l border-sage-200 p-8">
        <div className="flex justify-between items-center mb-8">
          <h3 className="label-micro text-sage-900">Recent History</h3>
          <History className="w-4 h-4 text-sage-300" />
        </div>
        
        <div className="space-y-3 overflow-y-auto pr-1 no-scrollbar" style={{ maxHeight: 'calc(100vh - 350px)' }}>
          {history.length > 0 ? history.map((item) => (
            <motion.button
              whileHover={{ x: 4 }}
              key={item.id}
              onClick={() => setSelectedRemedy(item.details)}
              className="w-full text-left p-6 bg-white rounded-[1.5rem] border border-sage-200 hover:border-sage-800 transition-all shadow-sm group flex items-center justify-between"
            >
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-sage-400 uppercase tracking-widest">{item.sickness}</p>
                <p className="text-lg font-serif font-bold text-sage-900 group-hover:text-sage-800 transition-colors">{item.details.remedyName}</p>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-sage-300" />
                  <span className="text-[9px] font-bold text-sage-400 uppercase tracking-tighter">
                    {new Date(item.generatedAt?.toDate()).toLocaleDateString([], {month:'short', day:'numeric', year: 'numeric'})}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-sage-200 group-hover:text-sage-800 transition-all group-hover:translate-x-1" />
            </motion.button>
          )) : (
            <div className="text-center py-10">
              <p className="text-[10px] font-bold uppercase text-sage-300 italic tracking-widest">No previous logs</p>
            </div>
          )}
        </div>

        <div className="mt-12 bg-sage-800 p-8 rounded-[2rem] text-white overflow-hidden relative group">
           <div className="relative z-10">
            <h4 className="font-bold text-xs uppercase tracking-[0.2em] mb-2">Verified Care</h4>
            <p className="text-[10px] text-sage-300 mb-6 font-medium font-serif italic">Every prescription is mapped against our botanical knowledge base for precision.</p>
            <div className="flex items-center gap-2 group-hover:translate-x-2 transition-transform">
              <span className="h-[1px] w-8 bg-sage-500"></span>
              <span className="text-[9px] font-bold uppercase">Natural Balance</span>
            </div>
           </div>
           <Leaf className="absolute -right-6 -bottom-6 w-24 h-24 text-sage-900/50 rotate-12 transition-transform group-hover:scale-110" />
        </div>
      </section>
    </div>
  );
}
