import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Remedy, Prescription, Patient } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Database, 
  FileText, 
  BarChart3, 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  X,
  ChevronRight,
  TrendingUp,
  Activity,
  History,
  Leaf,
  Stethoscope,
  ShieldCheck,
  Clock,
  ExternalLink,
  Thermometer,
  Moon,
  Brain,
  Coffee,
  BatteryLow,
  Sparkles,
  Waves,
  ShieldAlert,
  Bone,
  Flower2,
  Droplets,
  Flame,
  Wind
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'database' | 'patients' | 'logs'>('database');
  const [remedies, setRemedies] = useState<Remedy[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [logs, setLogs] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [logSearch, setLogSearch] = useState('');
  const [formError, setFormError] = useState('');
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [isPatientFormOpen, setIsPatientFormOpen] = useState(false);
  const [patientFormData, setPatientFormData] = useState({ age: '', gender: 'Male' });

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
  
  // Form state
  const [editingRemedy, setEditingRemedy] = useState<Remedy | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<Omit<Remedy, 'id'>>({
    sicknessName: '',
    remedyName: '',
    preparation: '',
    dosage: '',
    duration: '',
    precautions: '',
    sideEffects: ''
  });

  useEffect(() => {
    setPermissionError(null);
    
    const unsubRemedies = onSnapshot(collection(db, 'remedies'), (snap) => {
      setRemedies(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Remedy)));
    }, (err) => {
      console.error("Firestore listener error (remedies):", err);
      if (err.message.includes('permission')) {
        setPermissionError("System access restricted. Please ensure your administrator account is properly initialized.");
      }
    });

    const unsubPatients = onSnapshot(collection(db, 'patients'), (snap) => {
      setPatients(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient)));
    }, (err) => {
      console.error("Firestore listener error (patients):", err);
      if (err.message.includes('permission')) {
        setPermissionError("System access restricted. Please ensure your administrator account is properly initialized.");
      }
    });

    const unsubLogs = onSnapshot(query(collection(db, 'prescriptions'), orderBy('generatedAt', 'desc')), (snap) => {
      setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prescription)));
      setLoading(false);
    }, (err) => {
      console.error("Firestore listener error (logs):", err);
      if (err.message.includes('permission')) {
        setPermissionError("System access restricted. Please ensure your administrator account is properly initialized.");
      }
      setLoading(false);
    });

    return () => {
      unsubRemedies();
      unsubPatients();
      unsubLogs();
    };
  }, []);

  const handleSaveRemedy = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validation
    const { sicknessName, remedyName, preparation, dosage, duration } = formData;
    if (sicknessName.trim().length < 3 || sicknessName.length > 50) return setFormError('Sickness name must be between 3 and 50 characters.');
    if (remedyName.trim().length < 3 || remedyName.length > 50) return setFormError('Remedy name must be between 3 and 50 characters.');
    if (preparation.trim().length < 20 || preparation.length > 1000) return setFormError('Preparation protocol must be descriptive (20-1000 characters).');
    if (dosage.trim().length < 5 || dosage.length > 200) return setFormError('Please specify a valid clinical dosage (5-200 characters).');
    if (duration.trim().length < 2 || duration.length > 100) return setFormError('Please specify a valid regimen duration (2-100 characters).');
    if (formData.precautions.length > 500) return setFormError('Precautions should not exceed 500 characters.');
    if (formData.sideEffects.length > 500) return setFormError('Side effects should not exceed 500 characters.');

    try {
      if (editingRemedy) {
        await updateDoc(doc(db, 'remedies', editingRemedy.id), formData);
      } else {
        await addDoc(collection(db, 'remedies'), formData);
      }
      setIsFormOpen(false);
      setEditingRemedy(null);
      setFormData({ sicknessName: '', remedyName: '', preparation: '', dosage: '', duration: '', precautions: '', sideEffects: '' });
    } catch (err) {
      console.error(err);
      setFormError('System error: Unable to authorize entry. Please verify cloud connectivity.');
    }
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [remedyStats, setRemedyStats] = useState({ total: 0, uniqueSickness: 0 });

  const handleDeleteRemedy = async (id: string) => {
    if (deleteConfirmId !== id) {
      setDeleteConfirmId(id);
      setTimeout(() => setDeleteConfirmId(null), 5000); // 5 second fuse
      return;
    }

    setDeletingId(id);
    try {
      await deleteDoc(doc(db, 'remedies', id));
      // No need for alert here as onSnapshot handles UI update
    } catch (err: any) {
      console.error("Deletion error:", err);
      alert(`Error removing formulation: ${err.message || 'Access denied'}`);
    } finally {
      setDeletingId(null);
      setDeleteConfirmId(null);
    }
  };

  const openEdit = (remedy: Remedy) => {
    setEditingRemedy(remedy);
    setFormData({ 
      sicknessName: remedy.sicknessName, 
      remedyName: remedy.remedyName, 
      preparation: remedy.preparation, 
      dosage: remedy.dosage, 
      duration: remedy.duration, 
      precautions: remedy.precautions, 
      sideEffects: remedy.sideEffects 
    });
    setIsFormOpen(true);
  };

  const openEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setPatientFormData({
      age: patient.age.toString(),
      gender: patient.gender
    });
    setIsPatientFormOpen(true);
  };

  const handleSavePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;
    
    // Validation
    const ageNum = parseInt(patientFormData.age);
    if (isNaN(ageNum) || ageNum <= 0 || ageNum > 120) {
      alert('Please provide a valid medical age (1-120).');
      return;
    }

    try {
      await updateDoc(doc(db, 'patients', editingPatient.id), {
        age: ageNum,
        gender: patientFormData.gender
      });
      setIsPatientFormOpen(false);
      setEditingPatient(null);
      alert('Patient clinical record synchronized.');
    } catch (err) {
      console.error(err);
      alert('Error updating patient details');
    }
  };

  const handleDeletePatient = async (id: string) => {
    if (deleteConfirmId !== id) {
      setDeleteConfirmId(id);
      setTimeout(() => setDeleteConfirmId(null), 5000); // 5 second fuse
      return;
    }

    setDeletingId(id);
    try {
      await deleteDoc(doc(db, 'patients', id));
      alert('Patient record purged successfully.');
    } catch (err: any) {
      console.error("Deletion error:", err);
      alert(`Error removing patient record: ${err.message || 'Check your connection.'}`);
    } finally {
      setDeletingId(null);
      setDeleteConfirmId(null);
    }
  };

  const seedDatabase = async () => {
    const samples = [
      { sicknessName: "Common Cold", remedyName: "Ginger & Honey Tea", preparation: "Grate 1 inch fresh ginger, steep in 1 cup hot water for 5 min, add 1 tsp honey", dosage: "Drink 2-3 times daily", duration: "4 days", precautions: "Avoid if on blood thinners", sideEffects: "Minimal side effects, may cause mild heartburn" },
      { sicknessName: "Insomnia", remedyName: "Chamomile & Lavender", preparation: "1 tbsp dried chamomile + ½ tbsp lavender in 1 cup boiling water, steep 7 min", dosage: "Drink 30 min before bedtime", duration: "2 weeks", precautions: "May cause drowsiness - do not drive after use", sideEffects: "Significant drowsiness is the intended effect" },
      { sicknessName: "Headache", remedyName: "Peppermint Infusion", preparation: "1 tbsp dried peppermint leaves in 1 cup hot water, steep 10 min", dosage: "1 cup at onset, repeat after 4h", duration: "2 days", precautions: "Not for chronic migraine without medical advice", sideEffects: "Potential stomach irritation if consumed on empty stomach" },
      { sicknessName: "Indigestion", remedyName: "Fennel Seed Tea", preparation: "1 tsp crushed fennel seeds in 1 cup hot water, steep 8 min", dosage: "Drink after meals", duration: "5 days", precautions: "Safe for most adults", sideEffects: "Excessive consumption may affect estrogen levels" },
      { sicknessName: "Mild Anxiety", remedyName: "Lemon Balm & Ashwagandha", preparation: "1 tsp lemon balm + ½ tsp ashwagandha powder in 1 cup warm water/milk", dosage: "Once daily in the morning", duration: "3 weeks", precautions: "Consult doctor if pregnant", sideEffects: "May interact with thyroid medication" },
      { sicknessName: "Fatigue", remedyName: "Nettle & Ginseng Tonic", preparation: "Steep 1 tbsp dried nettle and 1 tsp ginseng root in 2 cups hot water for 15 mins", dosage: "1 cup twice daily", duration: "10 days", precautions: "Avoid if you have high blood pressure", sideEffects: "May cause temporary jitteriness" },
      { sicknessName: "Skin Irritation", remedyName: "Calendula & Aloe Infusion", preparation: "Steep 2 tbsp dried calendula petals in 1 cup hot water for 20 mins. Mix with 1 tbsp fresh aloe vera when cool.", dosage: "Apply topically with a cotton pad 3 times daily", duration: "7 days", precautions: "For external use only", sideEffects: "Potential sensitivity for those allergic to ragweed" },
      { sicknessName: "Menstrual Cramps", remedyName: "Raspberry Leaf & Ginger", preparation: "1 tbsp red raspberry leaf + ½ tsp fresh ginger in 1 cup boiling water. Steep for 12 mins.", dosage: "Drink 2 cups daily", duration: "5 days", precautions: "Consult physician if pregnant", sideEffects: "Mild diuretic effect" },
      { sicknessName: "Sore Throat", remedyName: "Sage & Thyme Gargle", preparation: "1 tsp dried sage + 1 tsp dried thyme in 1 cup hot water. Steep 10 mins. Add sea salt.", dosage: "Gargle for 30 seconds, 3-4 times daily", duration: "3 days", precautions: "Do not swallow in large quantities", sideEffects: "Dry mouth" },
      { sicknessName: "High Stress", remedyName: "Holy Basil & Rose", preparation: "1 tbsp dried tulsi + 1 tsp dried rose petals in 1 cup hot water. Steep 8 mins.", dosage: "Drink in the afternoon or evening", duration: "Daily as needed", precautions: "May lower blood sugar", sideEffects: "General relaxation effect" },
      { sicknessName: "Joint Pain", remedyName: "Golden Turmeric Milk", preparation: "1 tsp turmeric powder + ¼ tsp black pepper in 1 cup warm plant milk. Add a dash of cinnamon.", dosage: "Once daily before sleep", duration: "4 weeks", precautions: "May interact with blood thinners", sideEffects: "Minor digestive changes" },
      { sicknessName: "Dry Cough", remedyName: "Marshmallow Root Cold-Brew", preparation: "Cold steep 1 tbsp marshmallow root in 1 cup water for 4 hours. Strain and warm slightly if desired.", dosage: "1 tbsp every 4 hours", duration: "5 days", precautions: "Safe for most; may delay absorption of other orally taken medications", sideEffects: "None recorded" },
      { sicknessName: "Eczema", remedyName: "Chickweed & Oat Bath", preparation: "Place 1 cup colloidal oats and ½ cup dried chickweed in a muslin bag. Hang under running bath water.", dosage: "Soak for 20 minutes", duration: "3 times per week", precautions: "External use only. Discontinue if rash worsens.", sideEffects: "Temporary skin redness" },
      { sicknessName: "Seasonal Allergies", remedyName: "Nettle & Quercetin", preparation: "Steep 1 tbsp dried nettle for 15 mins. Pair with a meal containing onions.", dosage: "1-2 cups daily", duration: "Full season", precautions: "Mild diuretic effect", sideEffects: "None recorded" },
      { sicknessName: "Bloating", remedyName: "Peppermint & Caraway", preparation: "1 tsp dried peppermint + ½ tsp crushed caraway seeds in 1 cup hot water. Steep 10 mins.", dosage: "Drink after heavy meals", duration: "3 days", precautions: "Avoid if you have gallstones", sideEffects: "Cooling sensation in chest" },
      { sicknessName: "Throat Irritation", remedyName: "Slippery Elm Paste", preparation: "Mix 1 tsp slippery elm powder with warm water to form a thin paste.", dosage: "Swallow 1 tsp slowly at bedtime", duration: "5 days", precautions: "May delay absorption of other meds", sideEffects: "Slight coating on tongue" },
      { sicknessName: "Urinary Comfort", remedyName: "Corn Silk Infusion", preparation: "Steep 2 tbsp dried corn silk in 1 cup boiling water for 15 mins.", dosage: "2 cups daily", duration: "7 days", precautions: "Avoid if allergic to corn products", sideEffects: "Increased urinary frequency" },
      { sicknessName: "Minor Burns", remedyName: "St. John's Wort Oil", preparation: "Topical application of infused oil. Not to be used on broken skin.", dosage: "Apply to affected area 2x daily", duration: "10 days", precautions: "For external use only. May cause photosensitivity.", sideEffects: "Skin sensitivity if exposed to sun" }
    ];

    const patientSamples = [
      { name: "Dr. Elena Vance", email: "elena@vance.com", age: "42", gender: "female", role: "patient" },
      { name: "Arthur Morgan", email: "arthur@outlaw.com", age: "36", gender: "male", role: "patient" },
      { name: "Sarah Connor", email: "sarah@resistance.com", age: "29", gender: "female", role: "patient" },
      { name: "John Hammond", email: "john@ingen.com", age: "75", gender: "male", role: "patient" }
    ];

    let count = 0;
    for (const sample of samples) {
      if (!remedies.some(r => r.sicknessName === sample.sicknessName)) {
        await addDoc(collection(db, 'remedies'), sample);
        count++;
      }
    }

    let pCount = 0;
    for (const p of patientSamples) {
      if (!patients.some(ep => ep.email === p.email)) {
        await addDoc(collection(db, 'users'), p);
        pCount++;
      }
    }
    alert(`${count} remedies and ${pCount} patients added to the system.`);
  };

  if (loading) return null;

  return (
    <div className="space-y-12">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-8 pb-8 border-b border-sage-200">
        <div className="space-y-2">
          <p className="label-micro text-sage-400">System Overview</p>
          <h1 className="text-5xl font-light text-sage-900 font-serif">Admin Console</h1>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => { setEditingRemedy(null); setFormData({ sicknessName: '', remedyName: '', preparation: '', dosage: '', duration: '', precautions: '', sideEffects: '' }); setIsFormOpen(true); }}
            className="flex items-center gap-3 px-8 py-3.5 bg-sage-800 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-sage-900 transition-all shadow-md group"
          >
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
            New Remedy Mapping
          </button>
        </div>
      </div>

      <AnimatePresence>
        {permissionError && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-red-50 border border-red-100 p-6 rounded-[2rem] flex items-start gap-4 mb-8"
          >
            <div className="bg-red-100 p-2.5 rounded-xl">
              <ShieldAlert className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-red-800 mb-1">Authorization Conflict Detected</h4>
              <p className="text-xs text-red-600 leading-relaxed italic mb-4">{permissionError}</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => window.location.reload()}
                  className="text-[9px] font-bold uppercase tracking-[0.2em] bg-red-100 text-red-800 px-5 py-2 rounded-lg hover:bg-red-200 transition-colors"
                >
                  Force Sync
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-0 border border-sage-200 rounded-[2.5rem] bg-white overflow-hidden divide-x divide-sage-200 shadow-xl">
        {[
          { label: 'Formulations', val: remedies.length, color: 'bg-[#E9EDC9]', icon: Leaf },
          { label: 'Patient Registry', val: patients.length, color: 'bg-[#FEFAE0]', icon: Users },
          { label: 'Total Logs', val: logs.length, color: 'bg-sage-50', icon: Activity }
        ].map((stat, i) => (
          <div key={i} className={`p-10 ${stat.color} flex flex-col justify-between min-h-[160px] relative overflow-hidden group`}>
            <stat.icon className="absolute -bottom-4 -right-4 w-24 h-24 text-sage-900/5 group-hover:scale-110 transition-transform duration-700" />
            <p className="label-micro text-sage-800 opacity-60 relative z-10">{stat.label}</p>
            <p className="text-5xl font-bold text-sage-900 font-serif lowercase tracking-tighter relative z-10">
              {stat.val.toString().padStart(2, '0')}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-10 border-b border-sage-100 px-2">
        {[
          { id: 'database', label: 'Knowledge Base' },
          { id: 'patients', label: 'Patient Registry' },
          { id: 'logs', label: 'Prescription Logs' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-4 text-[11px] font-bold uppercase tracking-[0.2em] transition-all relative ${
              activeTab === tab.id 
              ? 'text-sage-800' 
              : 'text-sage-300 hover:text-sage-500'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeTab" 
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-sage-800" 
              />
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="min-h-[500px]">
        {activeTab === 'database' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {remedies.map((remedy) => {
              const SicknessIcon = getSicknessIcon(remedy.sicknessName);
              return (
                <motion.div 
                  layout
                  key={remedy.id} 
                  className="card-geometric p-10 hover:border-sage-800/30 transition-all group flex flex-col h-full bg-white relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity group-hover:scale-110 duration-700">
                    <SicknessIcon className="w-40 h-40 -rotate-12" />
                  </div>
                  
                  <div className="flex-1 space-y-6 relative z-10">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                           <SicknessIcon className="w-3 h-3 text-sage-400 group-hover:text-sage-800 transition-colors" />
                           <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-sage-400">Diagnosis Mapping</span>
                        </div>
                        <p className="text-xs font-bold text-sage-900 uppercase">{remedy.sicknessName}</p>
                      </div>
                      <div className="flex gap-2 relative z-20">
                        <button 
                          onClick={() => openEdit(remedy)} 
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-sage-50 text-sage-400 hover:text-sage-800 hover:bg-sage-100 transition-all"
                          title="Edit Formulation"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteRemedy(remedy.id)} 
                          disabled={deletingId === remedy.id}
                          className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${
                            deletingId === remedy.id 
                              ? 'bg-sage-100 text-sage-300 cursor-wait' 
                              : deleteConfirmId === remedy.id
                              ? 'bg-red-600 text-white animate-pulse shadow-lg'
                              : 'bg-red-50 text-sage-300 hover:text-red-600 hover:bg-red-100'
                          }`}
                          title={deleteConfirmId === remedy.id ? "Click again to confirm deletion" : "Delete Formulation"}
                        >
                          {deletingId === remedy.id ? (
                            <div className="w-3 h-3 border-2 border-sage-400/20 border-t-sage-400 rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                  </div>
                  
                  <h3 className="text-2xl font-serif text-sage-900 leading-tight group-hover:text-sage-800 transition-colors">
                    {remedy.remedyName}
                  </h3>
                  
                  <div className="space-y-4">
                    <p className="text-[11px] text-sage-500 font-serif italic leading-relaxed line-clamp-3">
                      {remedy.preparation}
                    </p>
                    <div className="flex gap-4">
                      <div className="bg-sage-50 px-3 py-1.5 rounded-lg border border-sage-100">
                        <p className="text-[8px] font-bold uppercase text-sage-400 tracking-wider">Duration</p>
                        <p className="text-[10px] font-serif font-bold text-sage-800">{remedy.duration}</p>
                      </div>
                      <div className="bg-sage-50 px-3 py-1.5 rounded-lg border border-sage-100">
                        <p className="text-[8px] font-bold uppercase text-sage-400 tracking-wider">Dosage</p>
                        <p className="text-[10px] font-serif font-bold text-sage-800">{remedy.dosage}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-sage-50 flex justify-between items-center relative z-10">
                  <span className="text-[8px] font-mono text-sage-300 uppercase tracking-widest">SID: {remedy.id.substring(0,8).toUpperCase()}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-sage-200 group-hover:bg-sage-800 transition-colors" />
                    <span className="text-[9px] font-bold text-sage-300 uppercase group-hover:text-sage-800 transition-colors">Verified</span>
                  </div>
                </div>
              </motion.div>
              );
            })}
            <button 
              onClick={() => setIsFormOpen(true)}
              className="card-geometric border-dashed border-2 flex flex-col items-center justify-center p-12 text-sage-300 hover:text-sage-600 hover:bg-sage-50 hover:border-sage-400 transition-all gap-4 min-h-[350px]"
            >
              <div className="w-14 h-14 rounded-full border-2 border-dashed border-current flex items-center justify-center">
                <Plus className="w-8 h-8" />
              </div>
              <span className="font-bold uppercase tracking-[0.3em] text-[10px]">Add Formulation</span>
            </button>
          </div>
        )}

        {activeTab === 'patients' && (
          <div className="card-geometric overflow-hidden bg-white border-2 border-sage-800/5 shadow-xl">
            <div className="p-8 border-b border-sage-100 bg-sage-50/50 flex justify-between items-center">
               <div className="space-y-1">
                 <h4 className="text-xl font-serif text-sage-900">Clinical Registry</h4>
                 <p className="text-[10px] text-sage-400 font-bold uppercase tracking-widest">Authorized Patient Records</p>
               </div>
               <Users className="w-5 h-5 text-sage-200" />
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-sage-100 bg-white">
                  <th className="p-8 label-micro text-sage-400">Patient Detail</th>
                  <th className="p-8 label-micro text-sage-400">Physiological Metrics</th>
                  <th className="p-8 label-micro text-sage-400 text-right">System Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-50">
                {patients.map((p) => (
                  <tr key={p.id} className="hover:bg-sage-50/5 transition-colors group">
                    <td className="p-8">
                       <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-full bg-sage-100 flex items-center justify-center border border-sage-200 group-hover:scale-110 transition-transform">
                           <span className="text-sage-800 font-serif font-bold text-lg">{p.name.charAt(0)}</span>
                         </div>
                         <div>
                           <p className="font-serif font-bold text-xl text-sage-900 leading-none mb-1">{p.name}</p>
                           <p className="text-[11px] text-sage-400 font-medium">{p.email}</p>
                         </div>
                       </div>
                    </td>
                    <td className="p-8">
                      <div className="flex gap-3">
                        <div className="px-4 py-1.5 rounded-full bg-sage-50 border border-sage-100 shadow-sm">
                           <span className="text-[10px] font-bold text-sage-800 uppercase tracking-tighter">{p.gender}</span>
                        </div>
                        <div className="px-4 py-1.5 rounded-full bg-sage-50 border border-sage-100 shadow-sm">
                           <span className="text-[10px] font-bold text-sage-800 uppercase tracking-tighter">{p.age} YRS</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-8 text-right">
                      <div className="flex flex-col items-end gap-2">
                        <p className="text-[10px] font-mono text-sage-300 font-bold tracking-widest leading-none">#{p.id.substring(0,8).toUpperCase()}</p>
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => openEditPatient(p)}
                            className="bg-sage-50 p-2 rounded-lg text-sage-400 hover:text-sage-800 hover:bg-sage-100 transition-all"
                            title="Edit Patient"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeletePatient(p.id)}
                            disabled={deletingId === p.id}
                            className={`p-2 rounded-lg transition-all ${
                              deletingId === p.id 
                                ? 'bg-sage-100 text-sage-300 cursor-wait' 
                                : deleteConfirmId === p.id
                                ? 'bg-red-600 text-white animate-pulse shadow-lg scale-110'
                                : 'bg-red-50 text-red-300 hover:text-red-600 hover:bg-red-100'
                            }`}
                            title={deleteConfirmId === p.id ? "Click again to confirm deletion" : "Delete Patient Record"}
                          >
                            {deletingId === p.id ? (
                              <div className="w-3.5 h-3.5 border-2 border-sage-400/20 border-t-sage-400 rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <div className="flex items-center gap-1.5 opacity-60">
                            <ShieldCheck className="w-3 h-3 text-emerald-500" />
                            <span className="text-[9px] font-bold text-emerald-600 uppercase">Verified</span>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-10">
            <div className="relative group max-w-2xl mx-auto">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-sage-400 group-focus-within:text-sage-800 transition-colors" />
              <input
                type="text"
                placeholder="Query logs by Patient ID or Sickness..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="w-full bg-white border-2 border-sage-100 rounded-[2.5rem] py-6 pl-16 pr-6 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-sage-800/10 focus:border-sage-800 transition-all shadow-xl placeholder:text-sage-300"
              />
            </div>
            
            <div className="grid lg:grid-cols-2 gap-8">
              {logs
                .filter(log => 
                  log.patientId.toLowerCase().includes(logSearch.toLowerCase()) ||
                  log.sickness.toLowerCase().includes(logSearch.toLowerCase())
                )
                .map((log) => (
                <div key={log.id} className="card-geometric p-8 flex justify-between items-center group bg-white border-2 border-sage-800/5 hover:border-sage-800 transition-all shadow-md">
                   <div className="flex items-center gap-8">
                      <div className="w-16 h-16 bg-sage-50 rounded-[1.25rem] flex items-center justify-center border border-sage-100 group-hover:rotate-6 transition-transform">
                         <History className="w-7 h-7 text-sage-400 group-hover:text-sage-800" />
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-sage-400 uppercase tracking-widest leading-none">{log.sickness}</p>
                        <p className="text-xl font-serif text-sage-900 group-hover:text-sage-800 transition-colors">{log.details.remedyName}</p>
                        <div className="flex items-center gap-4 pt-1">
                           <div className="flex items-center gap-1.5">
                             <Users className="w-3.5 h-3.5 text-sage-300" />
                             <p className="text-[11px] font-bold text-sage-500 uppercase tracking-tighter">UID-{log.patientId.substring(0,8).toUpperCase()}</p>
                           </div>
                           <div className="w-1 h-1 rounded-full bg-sage-200" />
                           <div className="flex items-center gap-1.5">
                             <Clock className="w-3.5 h-3.5 text-sage-300" />
                             <span className="text-[10px] font-bold text-sage-400 uppercase tracking-tighter">
                               {new Date(log.generatedAt?.toDate()).toLocaleDateString([], {month:'short', day:'numeric'})}
                             </span>
                           </div>
                        </div>
                      </div>
                   </div>
                   <button className="w-12 h-12 rounded-full border-2 border-sage-50 flex items-center justify-center text-sage-200 hover:text-sage-900 hover:border-sage-800 transition-all hover:bg-sage-50">
                     <ExternalLink className="w-5 h-5" />
                   </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-sage-950/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="bg-white w-full max-w-3xl max-h-[90vh] rounded-[2rem] sm:rounded-[3.5rem] shadow-2xl border border-sage-800/10 flex flex-col overflow-hidden"
            >
              <div className="p-8 sm:p-12 border-b border-sage-100 flex justify-between items-center bg-sage-50/30 shrink-0">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-sage-400">Database Entry</span>
                  <h3 className="text-3xl sm:text-4xl font-light font-serif text-sage-900 leading-tight">
                    {editingRemedy ? 'Update Mapping' : 'Clinical Mapping'}
                  </h3>
                </div>
                <button 
                  onClick={() => setIsFormOpen(false)} 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white border border-sage-200 flex items-center justify-center text-sage-400 hover:text-sage-900 hover:rotate-90 transition-all shadow-sm"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 sm:p-12">
                {formError && (
                  <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-bold italic">
                    Critical Error: {formError}
                  </div>
                )}
                
                <form onSubmit={handleSaveRemedy} className="grid md:grid-cols-2 gap-x-12 gap-y-8">
                  <div className="space-y-6">
                    <div className="group">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-sage-400 mb-2 block group-focus-within:text-sage-800 transition-colors">Target Clinical Diagnosis</label>
                      <input
                        required
                        placeholder="e.g. Hypertension"
                        value={formData.sicknessName}
                        onChange={(e) => setFormData({...formData, sicknessName: e.target.value})}
                        className="w-full bg-sage-50 border-2 border-transparent rounded-[1.25rem] py-4 px-6 focus:outline-none focus:bg-white focus:border-sage-800 font-medium text-sm transition-all shadow-inner"
                      />
                    </div>
                    <div className="group">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-sage-400 mb-2 block group-focus-within:text-sage-800 transition-colors">Remedy Formulation Name</label>
                      <input
                        required
                        placeholder="e.g. Hawthorn Berry Extract"
                        value={formData.remedyName}
                        onChange={(e) => setFormData({...formData, remedyName: e.target.value})}
                        className="w-full bg-sage-50 border-2 border-transparent rounded-[1.25rem] py-4 px-6 focus:outline-none focus:bg-white focus:border-sage-800 font-medium text-sm transition-all shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                     <div className="group">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-sage-400 mb-2 block group-focus-within:text-sage-800 transition-colors">Regimen Duration</label>
                      <input
                        required
                        placeholder="e.g. 14 Days"
                        value={formData.duration}
                        onChange={(e) => setFormData({...formData, duration: e.target.value})}
                        className="w-full bg-sage-50 border-2 border-transparent rounded-[1.25rem] py-4 px-6 focus:outline-none focus:bg-white focus:border-sage-800 font-medium text-sm transition-all shadow-inner"
                      />
                    </div>
                     <div className="group">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-sage-400 mb-2 block group-focus-within:text-sage-800 transition-colors">Clinical Dosage</label>
                      <input
                        required
                        placeholder="e.g. 5ml Twice Daily"
                        value={formData.dosage}
                        onChange={(e) => setFormData({...formData, dosage: e.target.value})}
                        className="w-full bg-sage-50 border-2 border-transparent rounded-[1.25rem] py-4 px-6 focus:outline-none focus:bg-white focus:border-sage-800 font-medium text-sm transition-all shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 group">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-sage-400 mb-2 block group-focus-within:text-sage-800 transition-colors">Botanical Preparation Protocol</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Describe the precise extraction and administration method..."
                      value={formData.preparation}
                      onChange={(e) => setFormData({...formData, preparation: e.target.value})}
                      className="w-full bg-sage-50 border-2 border-transparent rounded-[1.5rem] py-5 px-7 focus:outline-none focus:bg-white focus:border-sage-800 font-serif italic text-base leading-relaxed transition-all shadow-inner"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-6 mt-4">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="group">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-sage-400 mb-2 block">Precautions (Optional)</label>
                        <textarea
                          placeholder="Allergies, contraindications..."
                          value={formData.precautions}
                          onChange={(e) => setFormData({...formData, precautions: e.target.value})}
                          className="w-full bg-sage-50 border-2 border-transparent rounded-xl py-3 px-5 focus:outline-none focus:bg-white focus:border-sage-800 text-sm transition-all"
                        />
                      </div>
                      <div className="group">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-sage-400 mb-2 block">Side Effects (Optional)</label>
                        <textarea
                          placeholder="Known adverse reactions..."
                          value={formData.sideEffects}
                          onChange={(e) => setFormData({...formData, sideEffects: e.target.value})}
                          className="w-full bg-sage-50 border-2 border-transparent rounded-xl py-3 px-5 focus:outline-none focus:bg-white focus:border-sage-800 text-sm transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 pb-8">
                      <button
                        type="submit"
                        className="w-full sm:flex-1 bg-sage-800 text-white rounded-[1.5rem] py-5 font-bold text-xs uppercase tracking-[0.3em] hover:bg-sage-950 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xl shadow-sage-800/10"
                      >
                        {editingRemedy ? 'Update Clinical Registry' : 'Authorize New Entry'}
                      </button>
                      <button
                        type="button"
                        onClick={seedDatabase}
                        className="w-full sm:w-auto px-8 py-5 border-2 border-sage-100 text-sage-300 rounded-[1.5rem] font-bold text-[10px] uppercase tracking-widest hover:border-sage-800 hover:text-sage-800 transition-all"
                      >
                        Auto-Seed
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPatientFormOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-sage-950/20 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md max-h-[90vh] rounded-[3rem] shadow-2xl border border-sage-800/10 overflow-y-auto"
            >
              <div className="p-10 border-b border-sage-100 flex justify-between items-center bg-sage-50/30">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-sage-400">Patient Registry</span>
                  <h3 className="text-3xl font-light font-serif text-sage-900">Edit Details</h3>
                </div>
                <button onClick={() => setIsPatientFormOpen(false)} className="w-10 h-10 rounded-full bg-white border border-sage-200 flex items-center justify-center text-sage-400 hover:text-sage-900 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSavePatient} className="p-10 space-y-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-sage-400 ml-1">Current Age</label>
                    <input
                      type="number"
                      required
                      value={patientFormData.age}
                      onChange={(e) => setPatientFormData({...patientFormData, age: e.target.value})}
                      className="w-full bg-sage-50 border-2 border-transparent rounded-xl py-4 px-6 focus:outline-none focus:bg-white focus:border-sage-800 font-medium text-sm transition-all shadow-inner"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-sage-400 ml-1">Gender Identity</label>
                    <select
                      value={patientFormData.gender}
                      onChange={(e) => setPatientFormData({...patientFormData, gender: e.target.value})}
                      className="w-full bg-sage-50 border-2 border-transparent rounded-xl py-4 px-6 focus:outline-none focus:bg-white focus:border-sage-800 font-medium text-sm transition-all shadow-inner appearance-none"
                    >
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full bg-sage-800 text-white rounded-xl py-5 font-bold text-xs uppercase tracking-[0.3em] hover:bg-sage-950 transition-all shadow-lg active:scale-[0.98]"
                  >
                    Commit Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
