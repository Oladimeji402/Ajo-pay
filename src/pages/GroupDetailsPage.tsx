import React, { useState } from 'react';
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
  ChevronRight,
  Share2,
  FileText,
  LogOut,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  Shield
} from 'lucide-react';
import { motion } from 'motion/react';

// Circular progress ring
const ProgressRing = ({ progress, size = 80, strokeWidth = 6, color = '#0F766E' }: { progress: number; size?: number; strokeWidth?: number; color?: string }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="none" className="text-white/10" />
      <circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
    </svg>
  );
};

export default function GroupDetailsPage() {
  const { id } = useParams();
  const [copiedLink, setCopiedLink] = useState(false);

  const group = {
    id: 1,
    name: 'Lagos Techies Ajo',
    totalPot: '₦1,200,000',
    contributionAmount: '₦50,000',
    frequency: 'Monthly',
    membersCount: 12,
    currentCycle: 4,
    totalCycles: 12,
    userContribution: '₦200,000',
    nextPayoutDate: 'Oct 15, 2023',
    startDate: 'Jul 1, 2023',
    status: 'Active',
    inviteCode: 'AJO-LT2023X',
    members: [
      { name: 'Tunde A.', avatar: 'T', status: 'Paid', turn: 1, amount: '₦50,000' },
      { name: 'Chioma O.', avatar: 'C', status: 'Paid', turn: 2, amount: '₦50,000' },
      { name: 'Ibrahim K.', avatar: 'I', status: 'Paid', turn: 3, amount: '₦50,000' },
      { name: 'Franklyn (You)', avatar: 'F', status: 'Pending', turn: 4, amount: '₦50,000', isUser: true },
      { name: 'Sarah J.', avatar: 'S', status: 'Upcoming', turn: 5, amount: '₦50,000' },
      { name: 'Adebayo M.', avatar: 'A', status: 'Upcoming', turn: 6, amount: '₦50,000' },
    ],
    recentActivity: [
      { id: 1, type: 'contribution', member: 'Ibrahim K.', amount: '₦50,000', date: 'Oct 10', status: 'success' },
      { id: 2, type: 'payout', member: 'Chioma O.', amount: '₦600,000', date: 'Oct 1', status: 'success' },
      { id: 3, type: 'contribution', member: 'Franklyn (You)', amount: '₦50,000', date: 'Sep 12', status: 'success' },
    ]
  };

  const progressPercent = Math.round((group.currentCycle / group.totalCycles) * 100);

  const handleCopy = () => {
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back Navigation */}
        <Link 
          to="/groups" 
          className="inline-flex items-center gap-2 text-[13px] font-bold text-brand-gray hover:text-brand-navy transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Groups
        </Link>

        {/* ─── Hero Card ─── */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-[1.75rem] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-brand-navy via-[#1e3a7d] to-brand-primary"></div>
          <div className="absolute inset-0 opacity-[0.06]">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full border-[35px] border-white -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-1/3 w-40 h-40 rounded-full border-[20px] border-white -mb-14"></div>
          </div>

          <div className="relative z-10 p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Left: Group Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                    <Users size={22} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold text-white">{group.name}</h1>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-full uppercase tracking-wider">
                        {group.status}
                      </span>
                      <span className="text-[11px] text-white/50">Cycle {group.currentCycle} of {group.totalCycles}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Total Pot', value: group.totalPot, icon: <Wallet size={12} /> },
                    { label: 'Per Cycle', value: group.contributionAmount, icon: <CreditCard size={12} /> },
                    { label: 'Frequency', value: group.frequency, icon: <Calendar size={12} /> },
                    { label: 'Members', value: `${group.membersCount}`, icon: <Users size={12} /> },
                  ].map((stat, i) => (
                    <div key={i} className="px-3 py-2.5 bg-white/8 backdrop-blur-sm rounded-xl">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-white/40">{stat.icon}</span>
                        <p className="text-[9px] text-white/50 font-bold uppercase tracking-wider">{stat.label}</p>
                      </div>
                      <p className="text-[14px] font-bold text-white">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Progress Ring */}
              <div className="flex flex-col items-center">
                <div className="relative flex items-center justify-center">
                  <ProgressRing progress={progressPercent} size={90} strokeWidth={6} color="#10B981" />
                  <div className="absolute text-center">
                    <span className="text-xl font-bold text-white">{progressPercent}%</span>
                    <p className="text-[9px] text-white/50 font-medium">complete</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ─── Main Content (Left 2 cols) ─── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Rotation Timeline */}
            <motion.div 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-[15px] font-bold text-brand-navy">Rotation Schedule</h3>
                  <p className="text-[11px] text-brand-gray">Payout order for all members</p>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1 text-emerald-500"><span className="w-2 h-2 bg-emerald-500 rounded-full"></span> Paid</span>
                  <span className="flex items-center gap-1 text-amber-500"><span className="w-2 h-2 bg-amber-500 rounded-full"></span> Current</span>
                  <span className="flex items-center gap-1 text-slate-300"><span className="w-2 h-2 bg-slate-200 rounded-full"></span> Upcoming</span>
                </div>
              </div>

              {/* Visual rotation bar */}
              <div className="flex gap-1 mb-6">
                {group.members.map((member, i) => {
                  const isPaid = member.status === 'Paid';
                  const isCurrent = member.status === 'Pending';
                  return (
                    <div key={i} className="flex-1 relative group/bar">
                      <div className={`h-2 rounded-full transition-all ${
                        isPaid ? 'bg-emerald-500' : isCurrent ? 'bg-gradient-to-r from-amber-400 to-amber-500 animate-pulse' : 'bg-slate-100'
                      }`}></div>
                      {isCurrent && (
                        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2">
                          <span className="text-[8px] font-bold text-amber-500">YOU</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Members list */}
              <div className="space-y-2 mt-8">
                {group.members.map((member, i) => {
                  const isPaid = member.status === 'Paid';
                  const isCurrent = member.status === 'Pending';
                  return (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.04 }}
                      className={`flex items-center justify-between p-3.5 rounded-xl transition-all ${
                        member.isUser 
                          ? 'bg-gradient-to-r from-emerald-50 to-transparent border border-emerald-200/50' 
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[12px] font-bold ${
                            member.isUser 
                              ? 'bg-gradient-to-br from-brand-emerald to-emerald-500 text-white' 
                              : 'bg-slate-100 text-brand-navy'
                          }`}>
                            {member.avatar}
                          </div>
                          <div className={`absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center ${
                            isPaid ? 'bg-emerald-500' : isCurrent ? 'bg-amber-500' : 'bg-slate-200'
                          }`}>
                            {isPaid && <CheckCircle2 size={8} className="text-white" />}
                            {isCurrent && <Clock size={8} className="text-white" />}
                          </div>
                        </div>
                        <div>
                          <p className={`text-[13px] font-bold ${member.isUser ? 'text-brand-emerald' : 'text-brand-navy'}`}>
                            {member.name}
                          </p>
                          <p className="text-[10px] text-brand-gray">Turn {member.turn} · {member.amount}/cycle</p>
                        </div>
                      </div>
                      <div>
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                            <CheckCircle2 size={10} />
                            Received
                          </span>
                        ) : isCurrent ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                            <Clock size={10} />
                            Your Turn
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Waiting</span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Group Activity Feed */}
            <motion.div 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
            >
              <div className="p-5 pb-0">
                <h3 className="text-[15px] font-bold text-brand-navy">Group Activity</h3>
                <p className="text-[11px] text-brand-gray">Recent transactions in this group</p>
              </div>
              <div className="p-3 pt-4">
                {group.recentActivity.map((tx, i) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        tx.type === 'contribution' ? 'bg-brand-primary/8 text-brand-primary' : 'bg-emerald-50 text-brand-emerald'
                      }`}>
                        {tx.type === 'contribution' ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-brand-navy">{tx.member}</p>
                        <p className="text-[11px] text-brand-gray">{tx.date} · {tx.type === 'contribution' ? 'Contribution' : 'Payout'}</p>
                      </div>
                    </div>
                    <p className={`text-[13px] font-bold ${
                      tx.type === 'contribution' ? 'text-brand-navy' : 'text-brand-emerald'
                    }`}>
                      {tx.type === 'contribution' ? '' : '+'}{tx.amount}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ─── Sidebar (Right col) ─── */}
          <div className="space-y-5">
            {/* Your Progress */}
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-brand-navy rounded-2xl p-5 text-white shadow-lg relative overflow-hidden"
            >
              <div className="absolute inset-0 opacity-5">
                <div className="absolute -bottom-6 -right-6 w-32 h-32 border-[14px] border-white rounded-full"></div>
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                    <TrendingUp size={16} className="text-emerald-400" />
                  </div>
                  <h3 className="text-[14px] font-bold">Your Progress</h3>
                </div>
                
                <div className="space-y-5">
                  <div>
                    <p className="text-[10px] text-white/50 font-medium mb-1">Total Contributed</p>
                    <p className="text-2xl font-bold">{group.userContribution}</p>
                  </div>

                  <div>
                    <p className="text-[10px] text-white/50 font-medium mb-1">Your Position</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold">#{group.currentCycle}</span>
                      <span className="text-[12px] text-white/40">of {group.membersCount}</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-[11px] mb-2">
                      <span className="text-white/50">Next Payout</span>
                      <span className="font-bold text-emerald-400">{group.nextPayoutDate}</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
                      ></motion.div>
                    </div>
                  </div>

                  <button className="w-full py-3 bg-gradient-to-r from-brand-emerald to-emerald-500 hover:from-emerald-600 hover:to-emerald-600 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-emerald/20">
                    Make Contribution
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Invite Card */}
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
            >
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Share2 size={16} className="text-blue-500" />
                </div>
                <h4 className="text-[14px] font-bold text-brand-navy">Invite Members</h4>
              </div>
              <p className="text-[12px] text-brand-gray mb-3">Share the code below to invite people to this group</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2.5 bg-slate-50 rounded-xl text-[13px] font-mono font-bold text-brand-navy truncate">
                  {group.inviteCode}
                </div>
                <button
                  onClick={handleCopy}
                  className={`p-2.5 rounded-xl transition-all text-sm font-bold ${
                    copiedLink 
                      ? 'bg-emerald-50 text-emerald-600' 
                      : 'bg-brand-primary text-white hover:bg-brand-primary-hover'
                  }`}
                >
                  {copiedLink ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </motion.div>

            {/* Group Actions */}
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
            >
              <div className="p-4 pb-2">
                <h4 className="text-[13px] font-bold text-brand-navy">Group Actions</h4>
              </div>
              <div className="px-2 pb-2">
                {[
                  { icon: <FileText size={16} />, label: 'View Group Rules', color: 'text-brand-gray hover:text-brand-navy hover:bg-slate-50' },
                  { icon: <Shield size={16} />, label: 'Dispute Resolution', color: 'text-brand-gray hover:text-brand-navy hover:bg-slate-50' },
                  { icon: <LogOut size={16} />, label: 'Leave Group', color: 'text-red-500 hover:text-red-600 hover:bg-red-50' },
                ].map((action, i) => (
                  <button key={i} className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all text-[13px] font-medium ${action.color}`}>
                    <span className="flex items-center gap-2.5">{action.icon}{action.label}</span>
                    <ChevronRight size={14} />
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
