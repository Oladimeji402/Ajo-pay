import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { 
  Users, 
  Search, 
  ChevronRight, 
  TrendingUp, 
  Calendar,
  Filter,
  Plus,
  Wallet,
  Clock,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Reusable progress ring
const ProgressRing = ({ progress, size = 44, strokeWidth = 3.5, color = '#0F766E' }: { progress: number; size?: number; strokeWidth?: number; color?: string }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="none" className="text-slate-100" />
      <circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
    </svg>
  );
};

export default function GroupsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');

  const joinedGroups = [
    {
      id: 1,
      name: 'Lagos Techies Ajo',
      userContribution: '₦200,000',
      monthlyAmount: '₦50,000',
      totalPot: '₦1,200,000',
      nextPayout: 'Oct 15, 2023',
      members: 12,
      myPosition: 4,
      status: 'active',
      progress: 33,
      frequency: 'Monthly',
      color: '#3B82F6',
    },
    {
      id: 2,
      name: 'Family Savings',
      userContribution: '₦450,000',
      monthlyAmount: '₦45,000',
      totalPot: '₦5,000,000',
      nextPayout: 'Dec 20, 2023',
      members: 10,
      myPosition: 7,
      status: 'active',
      progress: 60,
      frequency: 'Monthly',
      color: '#0F766E',
    },
    {
      id: 3,
      name: 'Investment Circle',
      userContribution: '₦1,000,000',
      monthlyAmount: '₦200,000',
      totalPot: '₦10,000,000',
      nextPayout: 'Completed',
      members: 5,
      myPosition: 3,
      status: 'completed',
      progress: 100,
      frequency: 'Bi-weekly',
      color: '#8B5CF6',
    }
  ];

  const filteredGroups = joinedGroups.filter(g => {
    const matchesTab = g.status === activeTab;
    const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && (searchQuery === '' || matchesSearch);
  });

  const activeCount = joinedGroups.filter(g => g.status === 'active').length;
  const completedCount = joinedGroups.filter(g => g.status === 'completed').length;
  const totalSavings = '₦650,000';

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ─── Hero Stats Banner ─── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-[1.75rem] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-brand-navy via-[#1e3a7d] to-brand-primary"></div>
          <div className="absolute inset-0 opacity-[0.06]">
            <div className="absolute top-0 right-0 w-56 h-56 rounded-full border-[30px] border-white -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-1/4 w-32 h-32 rounded-full border-[16px] border-white -mb-10"></div>
          </div>
          <div className="relative z-10 p-6 md:p-8">
            <div className="grid sm:grid-cols-3 gap-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center">
                    <TrendingUp size={14} className="text-emerald-300" />
                  </div>
                  <span className="text-[11px] font-medium text-white/60">Total Active Savings</span>
                </div>
                <p className="text-2xl font-bold text-white">{totalSavings}</p>
                <p className="text-[11px] text-white/40 mt-0.5">Across {activeCount} active groups</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center">
                    <Calendar size={14} className="text-blue-300" />
                  </div>
                  <span className="text-[11px] font-medium text-white/60">Next Payout</span>
                </div>
                <p className="text-2xl font-bold text-white">Oct 15</p>
                <p className="text-[11px] text-white/40 mt-0.5">Lagos Techies Ajo</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center">
                    <Users size={14} className="text-purple-300" />
                  </div>
                  <span className="text-[11px] font-medium text-white/60">Groups Joined</span>
                </div>
                <p className="text-2xl font-bold text-white">{joinedGroups.length}</p>
                <p className="text-[11px] text-white/40 mt-0.5">{activeCount} active · {completedCount} completed</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ─── Controls Row ─── */}
        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-xl font-bold text-brand-navy">My Groups</h1>
            <p className="text-[12px] text-brand-gray">Manage your savings circles</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-grow sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
              <input
                type="text"
                placeholder="Search groups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-100 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary/30 transition-all"
              />
            </div>
            <button className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-brand-navy hover:border-slate-200 transition-all">
              <Filter size={18} />
            </button>
            <button className="p-2.5 bg-gradient-to-r from-brand-emerald to-emerald-500 text-white rounded-xl shadow-lg shadow-brand-emerald/20 hover:shadow-brand-emerald/30 transition-all">
              <Plus size={18} />
            </button>
          </div>
        </motion.div>

        {/* ─── Tabs ─── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex gap-1 p-1 bg-white border border-slate-100 rounded-2xl w-fit shadow-sm"
        >
          {[
            { key: 'active', label: 'Active', count: activeCount },
            { key: 'completed', label: 'Completed', count: completedCount }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative px-5 py-2 rounded-xl text-sm font-bold capitalize transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-brand-navy text-white shadow-sm'
                  : 'text-brand-gray hover:text-brand-navy'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 text-[10px] ${activeTab === tab.key ? 'text-white/60' : 'text-slate-400'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </motion.div>

        {/* ─── Group Cards ─── */}
        <div className="grid md:grid-cols-2 gap-4">
          <AnimatePresence mode="wait">
            {filteredGroups.length > 0 ? (
              filteredGroups.map((group, index) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  whileHover={{ y: -3 }}
                  onClick={() => navigate(`/groups/${group.id}`)}
                  className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 group"
                >
                  {/* Group header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-11 h-11 rounded-2xl flex items-center justify-center"
                        style={{ backgroundColor: `${group.color}15`, color: group.color }}
                      >
                        <Users size={20} />
                      </div>
                      <div>
                        <h4 className="text-[14px] font-bold text-brand-navy group-hover:text-brand-primary transition-colors">{group.name}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-brand-gray">{group.members} members</span>
                          <span className="w-0.5 h-0.5 bg-slate-300 rounded-full"></span>
                          <span className="text-[10px] text-brand-gray">{group.frequency}</span>
                        </div>
                      </div>
                    </div>
                    <div className="relative flex items-center justify-center">
                      <ProgressRing progress={group.progress} size={44} strokeWidth={3.5} color={group.color} />
                      <span className="absolute text-[10px] font-bold text-brand-navy">{group.progress}%</span>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-slate-50 rounded-xl px-3 py-2">
                      <p className="text-[9px] text-brand-gray font-bold uppercase tracking-wider">Per cycle</p>
                      <p className="text-[12px] font-bold text-brand-navy mt-0.5">{group.monthlyAmount}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl px-3 py-2">
                      <p className="text-[9px] text-brand-gray font-bold uppercase tracking-wider">Position</p>
                      <p className="text-[12px] font-bold text-brand-navy mt-0.5">{group.myPosition} of {group.members}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl px-3 py-2">
                      <p className="text-[9px] text-brand-gray font-bold uppercase tracking-wider">Total Pot</p>
                      <p className="text-[12px] font-bold text-brand-navy mt-0.5">{group.totalPot}</p>
                    </div>
                  </div>

                  {/* Bottom row */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <Wallet size={12} className="text-brand-gray" />
                        <span className="text-[11px] font-bold text-brand-navy">{group.userContribution}</span>
                        <span className="text-[10px] text-brand-gray">contributed</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {group.status === 'active' ? (
                        <>
                          <Clock size={12} className="text-brand-emerald" />
                          <span className="text-[11px] font-bold text-brand-emerald">{group.nextPayout}</span>
                        </>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed</span>
                      )}
                      <ChevronRight size={14} className="text-slate-300 group-hover:text-brand-navy group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center"
              >
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                  <Users size={32} />
                </div>
                <h3 className="text-lg font-bold text-brand-navy mb-1">No {activeTab} groups</h3>
                <p className="text-[13px] text-brand-gray mb-6">You haven't joined any {activeTab} groups yet.</p>
                {activeTab === 'active' && (
                  <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white rounded-xl font-bold text-sm hover:bg-brand-primary-hover transition-colors">
                    <Plus size={16} />
                    Create or Join a Group
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── Join Group CTA ─── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-gradient-to-br from-brand-emerald to-emerald-600 rounded-2xl p-6 text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-[0.07]">
            <div className="absolute -top-8 -right-8 w-40 h-40 border-[20px] border-white rounded-full"></div>
            <div className="absolute -bottom-6 -left-6 w-24 h-24 border-[10px] border-white rounded-full"></div>
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-[15px] font-bold mb-1">Have an invite link?</h3>
              <p className="text-[12px] text-white/70">Paste it here to join a new Ajo savings circle</p>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                placeholder="Paste invite link..."
                className="px-4 py-2.5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:bg-white/20 transition-all w-full sm:w-56"
              />
              <button className="flex-shrink-0 px-5 py-2.5 bg-white text-brand-emerald rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors shadow-lg flex items-center gap-1.5">
                Join <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
