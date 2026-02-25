import React, { useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Download,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';

export default function ActivityPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);

  const activities = [
    { 
      id: 1, 
      type: 'contribution', 
      group: 'Lagos Techies Ajo', 
      amount: '₦50,000', 
      date: 'Oct 12, 2023', 
      time: '10:30 AM',
      status: 'success',
      reference: 'AJ-829301',
      method: 'Bank Transfer',
      fee: '₦0.00'
    },
    { 
      id: 2, 
      type: 'payout', 
      group: 'Family Savings', 
      amount: '₦450,000', 
      date: 'Sep 28, 2023', 
      time: '02:15 PM',
      status: 'success',
      reference: 'AJ-772104',
      method: 'Wallet Payout',
      fee: '₦0.00'
    },
    { 
      id: 3, 
      type: 'contribution', 
      group: 'Lagos Techies Ajo', 
      amount: '₦50,000', 
      date: 'Sep 12, 2023', 
      time: '09:45 AM',
      status: 'success',
      reference: 'AJ-661209',
      method: 'Debit Card',
      fee: '₦0.00'
    },
    { 
      id: 4, 
      type: 'contribution', 
      group: 'Family Savings', 
      amount: '₦45,000', 
      date: 'Aug 28, 2023', 
      time: '11:20 AM',
      status: 'success',
      reference: 'AJ-550112',
      method: 'Bank Transfer',
      fee: '₦0.00'
    },
    { 
      id: 5, 
      type: 'payout', 
      group: 'Lagos Techies Ajo', 
      amount: '₦600,000', 
      date: 'Aug 15, 2023', 
      time: '04:00 PM',
      status: 'success',
      reference: 'AJ-449021',
      method: 'Wallet Payout',
      fee: '₦0.00'
    }
  ];

  const filteredActivities = activities.filter(activity => {
    const matchesFilter = activeFilter === 'all' || activity.type === activeFilter;
    const matchesSearch = activity.group.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         activity.reference.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (selectedActivity) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <button 
            onClick={() => setSelectedActivity(null)}
            className="flex items-center gap-2 text-sm font-bold text-brand-gray hover:text-brand-navy mb-6 transition-colors"
          >
            <ArrowLeft size={18} />
            Back to Activity
          </button>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 border border-brand-border shadow-sm text-center"
          >
            <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-6 ${
              selectedActivity.type === 'contribution' ? 'bg-brand-primary/10 text-brand-primary' : 'bg-brand-emerald/10 text-brand-emerald'
            }`}>
              {selectedActivity.type === 'contribution' ? <ArrowUpRight size={40} /> : <ArrowDownLeft size={40} />}
            </div>
            
            <h2 className="text-3xl font-bold text-brand-navy mb-1">
              {selectedActivity.type === 'contribution' ? '-' : '+'}{selectedActivity.amount}
            </h2>
            <p className="text-brand-emerald font-bold text-xs uppercase tracking-widest mb-8">Transaction Successful</p>

            <div className="space-y-4 text-left border-t border-brand-light pt-8">
              <div className="flex justify-between items-center">
                <span className="text-sm text-brand-gray">Group</span>
                <span className="text-sm font-bold text-brand-navy">{selectedActivity.group}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-brand-gray">Type</span>
                <span className="text-sm font-bold text-brand-navy capitalize">{selectedActivity.type}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-brand-gray">Date & Time</span>
                <span className="text-sm font-bold text-brand-navy">{selectedActivity.date}, {selectedActivity.time}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-brand-gray">Payment Method</span>
                <span className="text-sm font-bold text-brand-navy">{selectedActivity.method}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-brand-gray">Reference</span>
                <span className="text-sm font-bold text-brand-navy font-mono">{selectedActivity.reference}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-brand-gray">Fee</span>
                <span className="text-sm font-bold text-brand-navy">{selectedActivity.fee}</span>
              </div>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-4">
              <button className="py-3 bg-brand-light hover:bg-brand-soft-blue text-brand-navy rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
                <Download size={16} />
                Receipt
              </button>
              <button className="py-3 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl font-bold text-sm transition-colors">
                Share
              </button>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-navy">Activity</h1>
            <p className="text-sm text-brand-gray">Track your contributions and payouts</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-brand-border rounded-xl text-sm font-bold text-brand-navy hover:bg-brand-light transition-colors">
            <Download size={18} />
            Statement
          </button>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-3 rounded-3xl border border-brand-border shadow-sm space-y-3">
          <div className="flex gap-1 p-1 bg-brand-light rounded-xl">
            {['all', 'contribution', 'payout'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all ${
                  activeFilter === filter
                    ? 'bg-white text-brand-primary shadow-sm'
                    : 'text-brand-gray hover:text-brand-navy'
                }`}
              >
                {filter}s
              </button>
            ))}
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray w-4 h-4" />
            <input
              type="text"
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-brand-border bg-brand-light focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
            />
          </div>
        </div>

        {/* Activity List */}
        <div className="bg-white rounded-3xl border border-brand-border shadow-sm overflow-hidden">
          <div className="divide-y divide-brand-light">
            {filteredActivities.length > 0 ? (
              filteredActivities.map((activity) => (
                <motion.button
                  key={activity.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setSelectedActivity(activity)}
                  className="w-full flex items-center justify-between p-5 hover:bg-brand-light transition-all group text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                      activity.type === 'contribution' 
                        ? 'bg-brand-primary/10 text-brand-primary group-hover:bg-brand-primary/20' 
                        : 'bg-brand-emerald/10 text-brand-emerald group-hover:bg-brand-emerald/20'
                    }`}>
                      {activity.type === 'contribution' ? <ArrowUpRight size={24} /> : <ArrowDownLeft size={24} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-brand-navy group-hover:text-brand-primary transition-colors">
                        {activity.group}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-brand-gray uppercase tracking-wider">
                          {activity.date}
                        </span>
                        <span className="w-1 h-1 bg-brand-border rounded-full"></span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                          activity.type === 'contribution' ? 'text-brand-primary' : 'text-brand-emerald'
                        }`}>
                          {activity.type}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-sm font-bold ${
                        activity.type === 'contribution' ? 'text-brand-navy' : 'text-brand-emerald'
                      }`}>
                        {activity.type === 'contribution' ? '-' : '+'}{activity.amount}
                      </p>
                      <p className="text-[10px] text-brand-emerald font-bold uppercase tracking-widest">Success</p>
                    </div>
                    <ChevronRight size={20} className="text-brand-border group-hover:text-brand-navy group-hover:translate-x-1 transition-all" />
                  </div>
                </motion.button>
              ))
            ) : (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-brand-light rounded-full flex items-center justify-center mx-auto mb-4 text-brand-border">
                  <History size={32} />
                </div>
                <h3 className="text-lg font-bold text-brand-navy">No activities found</h3>
                <p className="text-brand-gray text-sm mt-1">Try adjusting your filters.</p>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Summary Card */}
        <div className="bg-brand-navy rounded-3xl p-6 text-white shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold">Monthly Summary</h3>
            <span className="text-[10px] font-bold text-brand-footer-text uppercase tracking-widest">October 2023</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 rounded-2xl">
              <p className="text-[10px] text-brand-footer-text uppercase font-bold mb-1">Total Contributions</p>
              <p className="text-xl font-bold text-brand-soft-blue">₦100,000</p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl">
              <p className="text-[10px] text-brand-footer-text uppercase font-bold mb-1">Total Payouts</p>
              <p className="text-xl font-bold text-brand-emerald">₦450,000</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Missing icon import fix
import { History, Clock, ArrowLeft } from 'lucide-react';

