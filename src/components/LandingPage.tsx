import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Leaf, ShieldCheck, ClipboardList, Clock } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="space-y-24 py-12">
      {/* Hero Section */}
      <section className="text-center space-y-10 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block px-4 py-1 border-y border-sage-200 text-sage-600 text-[11px] font-bold tracking-[0.2em] uppercase"
        >
          Nature's Wisdom, Modern Care
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-6xl md:text-8xl font-light text-sage-900 leading-none font-serif"
        >
          Your Specialized <br/> <span className="text-sage-800 italic">Herbal Guide</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-sage-600 leading-relaxed max-w-xl mx-auto font-medium"
        >
          Access precise herbal prescriptions designed for your symptoms. 
          A systematic approach to natural wellness.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4"
        >
          <Link to="/auth?role=patient" className="w-full sm:w-auto px-10 py-4 bg-sage-800 text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-sage-900 transition-all shadow-md hover:-translate-y-1">
            Get Started
          </Link>
          <Link to="/auth?role=admin" className="w-full sm:w-auto px-10 py-4 bg-white text-sage-800 border border-sage-200 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-sage-50 transition-all">
            Admin Portal
          </Link>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="grid md:grid-cols-3 gap-0 border-y border-sage-200 divide-y md:divide-y-0 md:divide-x divide-sage-200">
        {[
          {
            icon: ShieldCheck,
            title: "Expert Formulations",
            desc: "Carefully curated guidance with precise preparation and dosage instructions for safe use."
          },
          {
            icon: ClipboardList,
            title: "Detailed Prescriptions",
            desc: "Clear guides on preparation methods, duration, and critical safety precautions for every remedy."
          },
          {
            icon: Clock,
            title: "Patient History",
            desc: "Secure digital records of all your treatments for future reference and wellness continuity."
          }
        ].map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            className="p-10 bg-white hover:bg-sage-100 transition-colors group"
          >
            <div className="w-12 h-12 bg-sage-50 rounded-lg flex items-center justify-center mb-8 border border-sage-200 group-hover:bg-sage-800 transition-colors">
              <feature.icon className="w-5 h-5 text-sage-800 group-hover:text-white" />
            </div>
            <h3 className="text-xs font-bold text-sage-800 uppercase tracking-widest mb-4 font-sans">{feature.title}</h3>
            <p className="text-sage-600 text-sm leading-relaxed font-serif italic text-lg">{feature.desc}</p>
          </motion.div>
        ))}
      </section>

      {/* Philosophy Section */}
      <section className="grid md:grid-cols-12 gap-0 border border-sage-200 rounded-[3rem] overflow-hidden bg-white">
        <div className="md:col-span-1 border-b md:border-b-0 md:border-r border-sage-200 flex items-center justify-center py-8 md:py-12">
           <div className="md:rotate-[-90deg] whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.4em] text-sage-300">
             Tradition Meets Precision
           </div>
        </div>
        <div className="md:col-span-8 p-12 md:p-20 space-y-8">
          <h2 className="text-4xl font-light text-sage-900 font-serif leading-tight">Built on centuries of botanical knowledge and systematic remedial care.</h2>
          <p className="text-sage-600 text-lg leading-relaxed max-w-2xl">
            HerbRx combines traditional wisdom with a structured digital interface to provide 
            accessible wellness support. We believe in the balance of nature and methodology.
          </p>
          <div className="flex gap-12 pt-4">
            <div>
              <p className="text-2xl font-bold text-sage-800">100%</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-sage-400">Natural</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-sage-800">Verified</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-sage-400">Database</p>
            </div>
          </div>
        </div>
        <div className="md:col-span-3 bg-sage-800 flex items-center justify-center p-12">
          <Leaf className="w-32 h-32 text-white/10" />
        </div>
      </section>
    </div>
  );
}
