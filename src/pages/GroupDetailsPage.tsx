import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { 
  ArrowLeft, 
  Users, 
  Calendar, 
  CreditCard, 
  CheckCircle2, 
  Clock,
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';

export default function GroupDetailsPage() {
  const { id } = useParams();

  // Mock data for the group
  const group = {
    id: 1,
    name: 'Lagos Techies Ajo',
    totalPot: '₦1,200,000',
    contributionAmount: '₦50,000',
    frequency: 'Monthly',
    membersCount: 12,
    currentCycle: 4,
    userContribution: '₦200,000', // Total user has contributed
    nextPayoutDate: 'Oct 15, 2023',
    status: 'Active',
    members: [
      { name: 'Tunde A.', status: 'Paid', turn: 1 },
      { name: 'Chioma O.', status: 'Paid', turn: 2 },
      { name: 'Ibrahim K.', status: 'Paid', turn: 3 },
      { name: 'Franklyn (You)', status: 'Pending', turn: 4, isUser: true },
      { name: 'Sarah J.', status: 'Upcoming', turn: 5 },
    ]
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <Link 
          to="/dashboard" 
          className="inline-flex items-center gap-2 text-sm font-bold text-brand-gray hover:text-brand-navy mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Group Info */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-brand-navy mb-1">{group.name}</h1>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-100 text-brand-emerald text-[10px] font-bold rounded-full uppercase tracking-wider">
                      {group.status}
                    </span>
                    <span className="text-xs text-brand-gray font-medium">Cycle {group.currentCycle} of {group.membersCount}</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-brand-navy">
                  <Users size={24} />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                <div>
                  <p className="text-[10px] text-brand-gray uppercase font-bold mb-1">Total Pot</p>
                  <p className="text-lg font-bold text-brand-navy">{group.totalPot}</p>
                </div>
                <div>
                  <p className="text-[10px] text-brand-gray uppercase font-bold mb-1">Contribution</p>
                  <p className="text-lg font-bold text-brand-navy">{group.contributionAmount}</p>
                </div>
                <div>
                  <p className="text-[10px] text-brand-gray uppercase font-bold mb-1">Frequency</p>
                  <p className="text-lg font-bold text-brand-navy">{group.frequency}</p>
                </div>
              </div>
            </motion.div>

            {/* Rotation Schedule */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-bold text-brand-navy mb-6">Rotation Schedule</h3>
              <div className="space-y-4">
                {group.members.map((member, i) => (
                  <div 
                    key={i} 
                    className={`flex items-center justify-between p-4 rounded-xl border ${
                      member.isUser ? 'border-brand-emerald bg-emerald-50/30' : 'border-slate-50 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-brand-navy">
                        {member.turn}
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${member.isUser ? 'text-brand-emerald' : 'text-brand-navy'}`}>
                          {member.name}
                        </p>
                        <p className="text-[10px] text-brand-gray font-medium">Turn {member.turn}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {member.status === 'Paid' ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                          <CheckCircle2 size={12} />
                          Paid
                        </span>
                      ) : member.status === 'Pending' ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 uppercase tracking-widest">
                          <Clock size={12} />
                          Current
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Upcoming
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* User Stats & Actions */}
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-brand-navy rounded-2xl p-6 text-white shadow-lg"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                  <TrendingUp size={20} className="text-brand-emerald" />
                </div>
                <h3 className="font-bold">Your Progress</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Total Contributed</p>
                  <p className="text-2xl font-bold">{group.userContribution}</p>
                </div>
                
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-400">Next Payout</span>
                    <span className="font-bold text-brand-emerald">{group.nextPayoutDate}</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-emerald w-[33%]"></div>
                  </div>
                </div>

                <button className="w-full py-3 bg-brand-emerald hover:bg-emerald-600 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
                  Make Contribution
                  <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h4 className="font-bold text-brand-navy mb-4 text-sm">Group Settings</h4>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors text-sm font-medium text-brand-gray">
                  <span>View Group Rules</span>
                  <ChevronRight size={16} />
                </button>
                <button className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors text-sm font-medium text-brand-gray">
                  <span>Invite Members</span>
                  <ChevronRight size={16} />
                </button>
                <button className="w-full flex items-center justify-between p-3 hover:bg-red-50 rounded-xl transition-colors text-sm font-medium text-red-600">
                  <span>Leave Group</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
