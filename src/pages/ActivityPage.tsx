import React, { useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Download,
  ChevronRight,
  History,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  FileText,
  Share2,
  CheckCircle2,
  X,
  Filter,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ActivityPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);

  const activities = [
    { 
      id: 1, type: 'contribution', group: 'Lagos Techies Ajo', amount: '₦50,000', 
      date: 'Oct 12, 2023', time: '10:30 AM', status: 'success',
      reference: 'AJ-829301', method: 'Bank Transfer', fee: '₦0.00'
    },
    { 
      id: 2, type: 'payout', group: 'Family Savings', amount: '₦450,000', 
      date: 'Sep 28, 2023', time: '02:15 PM', status: 'success',
      reference: 'AJ-772104', method: 'Wallet Payout', fee: '₦0.00'
    },
    { 
      id: 3, type: 'contribution', group: 'Lagos Techies Ajo', amount: '₦50,000', 
      date: 'Sep 12, 2023', time: '09:45 AM', status: 'success',
      reference: 'AJ-661209', method: 'Debit Card', fee: '₦0.00'
    },
    { 
      id: 4, type: 'contribution', group: 'Family Savings', amount: '₦45,000', 
      date: 'Aug 28, 2023', time: '11:20 AM', status: 'success',
      reference: 'AJ-550112', method: 'Bank Transfer', fee: '₦0.00'
    },
    { 
      id: 5, type: 'payout', group: 'Lagos Techies Ajo', amount: '₦600,000', 
      date: 'Aug 15, 2023', time: '04:00 PM', status: 'success',
      reference: 'AJ-449021', method: 'Wallet Payout', fee: '₦0.00'
    }
  ];

  const filteredActivities = activities.filter(activity => {
    const matchesFilter = activeFilter === 'all' || activity.type === activeFilter;
    const matchesSearch = activity.group.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         activity.reference.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && (searchQuery === '' || matchesSearch);
  });

  // Stats
  const totalContributions = activities.filter(a => a.type === 'contribution').length;
  const totalPayouts = activities.filter(a => a.type === 'payout').length;

  // ─── Transaction Detail View ───
  if (selectedActivity) {
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto">
          <button 
            onClick={() => setSelectedActivity(null)}
            className="inline-flex items-center gap-2 text-[13px] font-bold text-brand-gray hover:text-brand-navy mb-6 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Activity
          </button>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
          >
            {/* Header */}
            <div className={`p-8 text-center ${
              selectedActivity.type === 'contribution' 
                ? 'bg-gradient-to-br from-brand-navy to-brand-primary' 
                : 'bg-gradient-to-br from-brand-emerald to-emerald-600'
            } relative overflow-hidden`}>
              <div className="absolute inset-0 opacity-[0.06]">
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full border-[25px] border-white -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-28 h-28 rounded-full border-[12px] border-white -ml-8 -mb-8"></div>
              </div>
              <div className="relative z-10">
                <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4 bg-white/15 backdrop-blur-sm`}>
                  {selectedActivity.type === 'contribution' ? <ArrowUpRight size={28} className="text-white" /> : <ArrowDownLeft size={28} className="text-white" />}
                </div>
                <h2 className="text-3xl font-bold text-white mb-1">
                  {selectedActivity.type === 'contribution' ? '-' : '+'}{selectedActivity.amount}
                </h2>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 rounded-full">
                  <CheckCircle2 size={12} className="text-emerald-300" />
                  <span className="text-[11px] font-bold text-white/90">Transaction Successful</span>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="p-6 space-y-0">
              {[
                { label: 'Group', value: selectedActivity.group },
                { label: 'Type', value: selectedActivity.type, capitalize: true },
                { label: 'Date & Time', value: `${selectedActivity.date}, ${selectedActivity.time}` },
                { label: 'Payment Method', value: selectedActivity.method },
                { label: 'Reference', value: selectedActivity.reference, mono: true },
                { label: 'Fee', value: selectedActivity.fee },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center py-3.5 border-b border-slate-50 last:border-0">
                  <span className="text-[13px] text-brand-gray">{item.label}</span>
                  <span className={`text-[13px] font-bold text-brand-navy ${item.capitalize ? 'capitalize' : ''} ${item.mono ? 'font-mono' : ''}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 grid grid-cols-2 gap-3">
              <button className="py-3 bg-slate-50 hover:bg-slate-100 text-brand-navy rounded-xl font-bold text-[13px] transition-colors flex items-center justify-center gap-2">
                <Download size={16} />
                Receipt
              </button>
              <button className="py-3 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl font-bold text-[13px] transition-colors flex items-center justify-center gap-2">
                <Share2 size={16} />
                Share
              </button>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  // ─── Main Activity View ───
  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">

        {/* ─── Summary Stats ─── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-[1.75rem] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-brand-navy via-[#1e3a7d] to-brand-primary"></div>
          <div className="absolute inset-0 opacity-[0.06]">
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full border-[25px] border-white -mr-14 -mt-14"></div>
          </div>
          <div className="relative z-10 p-6 md:p-8">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h1 className="text-lg font-bold text-white">Activity</h1>
                <p className="text-[12px] text-white/50">Track your contributions and payouts</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 backdrop-blur-sm border border-white/10 rounded-xl text-[12px] font-bold text-white transition-all">
                <Download size={14} />
                Statement
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="px-4 py-3 bg-white/8 backdrop-blur-sm rounded-xl">
                <div className="flex items-center gap-1.5 mb-1">
                  <BarChart3 size={12} className="text-white/40" />
                  <p className="text-[9px] text-white/50 font-bold uppercase tracking-wider">This Month</p>
                </div>
                <p className="text-lg font-bold text-white">₦100,000</p>
                <p className="text-[10px] text-white/40">contributed</p>
              </div>
              <div className="px-4 py-3 bg-white/8 backdrop-blur-sm rounded-xl">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp size={12} className="text-emerald-300" />
                  <p className="text-[9px] text-white/50 font-bold uppercase tracking-wider">Received</p>
                </div>
                <p className="text-lg font-bold text-emerald-300">₦450,000</p>
                <p className="text-[10px] text-white/40">in payouts</p>
              </div>
              <div className="px-4 py-3 bg-white/8 backdrop-blur-sm rounded-xl">
                <div className="flex items-center gap-1.5 mb-1">
                  <FileText size={12} className="text-blue-300" />
                  <p className="text-[9px] text-white/50 font-bold uppercase tracking-wider">Total Txns</p>
                </div>
                <p className="text-lg font-bold text-white">{activities.length}</p>
                <p className="text-[10px] text-white/40">transactions</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ─── Filters ─── */}
        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          {/* Tab filters */}
          <div className="flex gap-1 p-1 bg-white border border-slate-100 rounded-2xl shadow-sm">
            {[
              { key: 'all', label: 'All', count: activities.length },
              { key: 'contribution', label: 'Sent', count: totalContributions },
              { key: 'payout', label: 'Received', count: totalPayouts },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`px-4 py-2 rounded-xl text-[12px] font-bold transition-all ${
                  activeFilter === filter.key
                    ? 'bg-brand-navy text-white shadow-sm'
                    : 'text-brand-gray hover:text-brand-navy'
                }`}
              >
                {filter.label}
                <span className={`ml-1 text-[10px] ${activeFilter === filter.key ? 'text-white/50' : 'text-slate-400'}`}>
                  {filter.count}
                </span>
              </button>
            ))}
          </div>
          
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by group or reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-100 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary/30 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-navy">
                <X size={14} />
              </button>
            )}
          </div>
        </motion.div>

        {/* ─── Activity List ─── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {filteredActivities.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {filteredActivities.map((activity, index) => (
                  <motion.button
                    key={activity.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.04 }}
                    onClick={() => setSelectedActivity(activity)}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-all group text-left"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        activity.type === 'contribution' 
                          ? 'bg-brand-primary/8 text-brand-primary group-hover:bg-brand-primary/15' 
                          : 'bg-emerald-50 text-brand-emerald group-hover:bg-emerald-100'
                      }`}>
                        {activity.type === 'contribution' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                      </div>
                      <div>
                        <h3 className="text-[13px] font-bold text-brand-navy group-hover:text-brand-primary transition-colors">
                          {activity.group}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-brand-gray">{activity.date}</span>
                          <span className="w-0.5 h-0.5 bg-slate-300 rounded-full"></span>
                          <span className="text-[11px] text-brand-gray">{activity.time}</span>
                          <span className="w-0.5 h-0.5 bg-slate-300 rounded-full"></span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${
                            activity.type === 'contribution' ? 'text-brand-primary' : 'text-brand-emerald'
                          }`}>
                            {activity.type === 'contribution' ? 'Sent' : 'Received'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={`text-[13px] font-bold ${
                          activity.type === 'contribution' ? 'text-brand-navy' : 'text-brand-emerald'
                        }`}>
                          {activity.type === 'contribution' ? '-' : '+'}{activity.amount}
                        </p>
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-500 uppercase tracking-widest">
                          <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
                          {activity.status}
                        </span>
                      </div>
                      <ChevronRight size={14} className="text-slate-200 group-hover:text-brand-navy group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-20 text-center"
              >
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                  <History size={28} />
                </div>
                <h3 className="text-[15px] font-bold text-brand-navy mb-1">No activities found</h3>
                <p className="text-[12px] text-brand-gray">Try adjusting your filters or search query.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ─── Monthly Breakdown ─── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[15px] font-bold text-brand-navy">Monthly Breakdown</h3>
              <p className="text-[11px] text-brand-gray">Last 6 months of activity</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-brand-primary"><span className="w-2 h-6 bg-brand-primary/20 rounded-full"></span> Sent</span>
              <span className="flex items-center gap-1.5 text-brand-emerald"><span className="w-2 h-6 bg-brand-emerald/20 rounded-full"></span> Received</span>
            </div>
          </div>

          {/* Bar chart visualization */}
          <div className="flex items-end gap-3 h-32">
            {[
              { month: 'May', sent: 50, received: 0 },
              { month: 'Jun', sent: 95, received: 0 },
              { month: 'Jul', sent: 95, received: 100 },
              { month: 'Aug', sent: 75, received: 60 },
              { month: 'Sep', sent: 95, received: 0 },
              { month: 'Oct', sent: 50, received: 45 },
            ].map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex gap-0.5 items-end h-24">
                  <div 
                    className="flex-1 bg-gradient-to-t from-brand-primary/30 to-brand-primary/10 rounded-t-md transition-all duration-700"
                    style={{ height: `${bar.sent}%` }}
                  ></div>
                  <div 
                    className="flex-1 bg-gradient-to-t from-brand-emerald/30 to-brand-emerald/10 rounded-t-md transition-all duration-700"
                    style={{ height: `${bar.received}%` }}
                  ></div>
                </div>
                <span className="text-[10px] font-bold text-brand-gray">{bar.month}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
