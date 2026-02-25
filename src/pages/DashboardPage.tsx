import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { 
  Eye, 
  EyeOff, 
  Plus, 
  Users, 
  LayoutGrid, 
  Bell, 
  ArrowUpRight, 
  ArrowDownLeft 
} from 'lucide-react';
import { motion } from 'motion/react';

export default function DashboardPage() {
  const [showBalance, setShowBalance] = useState(false);
  const navigate = useNavigate();

  const transactions = [
    { id: 1, type: 'contribution', group: 'Lagos Techies Ajo', amount: '₦50,000', date: 'Oct 12, 2023', status: 'success' },
    { id: 2, type: 'payout', group: 'Family Savings', amount: '₦450,000', date: 'Sep 28, 2023', status: 'success' },
    { id: 3, type: 'contribution', group: 'Lagos Techies Ajo', amount: '₦50,000', date: 'Sep 12, 2023', status: 'success' },
  ];

  return (
    <DashboardLayout>
      {/* Mobile App-like Header */}
      <div className="md:hidden flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-brand-emerald font-bold">
            F
          </div>
          <div>
            <p className="text-xs text-brand-gray">Welcome,</p>
            <p className="text-sm font-bold text-brand-navy">Franklyn</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 bg-white rounded-full shadow-sm border border-slate-100">
            <span className="text-lg">🐻</span>
          </button>
          <button className="p-2 bg-white rounded-full shadow-sm border border-slate-100 relative">
            <Bell size={20} className="text-brand-navy" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Total Contributions Card - Match Image Style */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-brand-primary rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl shadow-brand-primary/20"
        >
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-medium opacity-90">Total contributions</span>
              <button onClick={() => setShowBalance(!showBalance)} className="opacity-80 hover:opacity-100">
                {showBalance ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            <div className="text-4xl font-bold mb-8 tracking-tight">
              {showBalance ? '₦1,250,000' : '****'}
            </div>
          </div>
          
          {/* Decorative background patterns */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12 blur-xl"></div>
        </motion.div>

        {/* Action Cards - Match Image Style */}
        <div className="grid gap-4">
          {/* Savings Goals Card (Replaced Create Ajo Group) */}
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="bg-brand-navy rounded-2xl p-6 text-white flex items-center justify-between cursor-pointer shadow-lg shadow-brand-navy/10"
          >
            <div>
              <h3 className="text-xl font-bold mb-1">Savings Goals</h3>
              <p className="text-sm opacity-90">Track your progress towards your financial targets</p>
            </div>
            <div className="w-14 h-14 border-2 border-white/40 rounded-2xl flex items-center justify-center">
              <ArrowUpRight size={32} />
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-4">
            {/* Join Group Card */}
            <motion.div 
              whileHover={{ scale: 1.01 }}
              className="bg-brand-soft-blue rounded-2xl p-6 cursor-pointer"
            >
              <div className="w-10 h-10 bg-brand-primary/10 text-brand-primary rounded-lg flex items-center justify-center mb-4">
                <Users size={24} />
              </div>
              <h3 className="text-lg font-bold text-brand-navy mb-2">Join Group</h3>
              <p className="text-xs text-brand-gray leading-relaxed">Tap to paste an invite link</p>
            </motion.div>

            {/* View Groups Card - Now links to a group */}
            <motion.div 
              whileHover={{ scale: 1.01 }}
              onClick={() => navigate('/groups/1')}
              className="bg-brand-emerald/5 rounded-2xl p-6 cursor-pointer"
            >
              <div className="w-10 h-10 bg-brand-emerald/10 text-brand-emerald rounded-lg flex items-center justify-center mb-4">
                <LayoutGrid size={24} />
              </div>
              <h3 className="text-lg font-bold text-brand-navy mb-2">My Groups</h3>
              <p className="text-xs text-brand-gray leading-relaxed">View your active Ajo Groups</p>
            </motion.div>
          </div>
        </div>

        {/* Recent Transactions Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-border">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-brand-navy">Recent Transactions</h3>
            <button className="text-sm font-bold text-brand-emerald">See All</button>
          </div>
          
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 hover:bg-brand-light rounded-xl transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.type === 'contribution' ? 'bg-brand-primary/10 text-brand-primary' : 'bg-brand-emerald/10 text-brand-emerald'
                  }`}>
                    {tx.type === 'contribution' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-navy">{tx.group}</p>
                    <p className="text-xs text-brand-gray">{tx.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${
                    tx.type === 'contribution' ? 'text-brand-navy' : 'text-brand-emerald'
                  }`}>
                    {tx.type === 'contribution' ? '-' : '+'}{tx.amount}
                  </p>
                  <p className="text-[10px] text-brand-emerald font-bold uppercase tracking-widest">{tx.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
