import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Container } from '../components/ui/Container';
import { 
  Users, 
  Search, 
  ChevronRight, 
  TrendingUp, 
  Calendar,
  Filter
} from 'lucide-react';
import { motion } from 'motion/react';

export default function GroupsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('active');

  const joinedGroups = [
    {
      id: 1,
      name: 'Lagos Techies Ajo',
      userContribution: '₦200,000',
      totalPot: '₦1,200,000',
      nextPayout: 'Oct 15, 2023',
      members: 12,
      status: 'active',
      progress: 33,
    },
    {
      id: 2,
      name: 'Family Savings',
      userContribution: '₦450,000',
      totalPot: '₦5,000,000',
      nextPayout: 'Dec 20, 2023',
      members: 10,
      status: 'active',
      progress: 60,
    },
    {
      id: 3,
      name: 'Investment Circle',
      userContribution: '₦1,000,000',
      totalPot: '₦10,000,000',
      nextPayout: 'Completed',
      members: 5,
      status: 'completed',
      progress: 100,
    }
  ];

  const filteredGroups = joinedGroups.filter(g => g.status === activeTab);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Quick Stats Summary (Moved to Very Top) */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-brand-emerald/5 p-6 rounded-2xl border border-brand-emerald/10 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="text-brand-emerald" size={20} />
              <h4 className="font-bold text-brand-navy text-sm">Total Active Savings</h4>
            </div>
            <p className="text-2xl font-bold text-brand-emerald">₦650,000</p>
            <p className="text-xs text-brand-gray mt-1">Across 2 active groups</p>
          </div>
          <div className="bg-brand-light p-6 rounded-2xl border border-brand-border shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="text-brand-navy" size={20} />
              <h4 className="font-bold text-brand-navy text-sm">Next Payout</h4>
            </div>
            <p className="text-2xl font-bold text-brand-navy">Oct 15</p>
            <p className="text-xs text-brand-gray mt-1">Lagos Techies Ajo</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-navy">My Groups</h1>
            <p className="text-sm text-brand-gray">Manage your active and past savings circles</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-grow md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray w-4 h-4" />
              <input
                type="text"
                placeholder="Search groups..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              />
            </div>
            <button className="p-2 bg-white border border-brand-border rounded-xl text-brand-gray hover:text-brand-navy transition-colors">
              <Filter size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-brand-light rounded-xl w-fit">
          {['active', 'completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                activeTab === tab
                  ? 'bg-white text-brand-primary shadow-sm'
                  : 'text-brand-gray hover:text-brand-navy'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Groups List */}
        <div className="bg-white rounded-3xl border border-brand-border shadow-sm overflow-hidden">
          <div className="divide-y divide-brand-light">
            {filteredGroups.length > 0 ? (
              filteredGroups.map((group) => (
                <motion.button
                  key={group.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => navigate(`/groups/${group.id}`)}
                  className="w-full flex items-center justify-between p-5 hover:bg-brand-light transition-all group text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-emerald/10 text-brand-emerald rounded-2xl flex items-center justify-center group-hover:bg-brand-emerald/20 transition-colors">
                      <Users size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-brand-navy group-hover:text-brand-primary transition-colors">
                        {group.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-bold text-brand-gray uppercase tracking-wider flex items-center gap-1">
                          {group.members} members
                        </span>
                        <span className="w-1 h-1 bg-brand-border rounded-full"></span>
                        <span className="text-[10px] font-bold text-brand-emerald uppercase tracking-wider">
                          Next: {group.nextPayout}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] text-brand-gray uppercase font-bold mb-0.5">Contribution</p>
                      <p className="text-sm font-bold text-brand-navy">{group.userContribution}</p>
                    </div>
                    <ChevronRight size={20} className="text-brand-border group-hover:text-brand-navy group-hover:translate-x-1 transition-all" />
                  </div>
                </motion.button>
              ))
            ) : (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-brand-light rounded-full flex items-center justify-center mx-auto mb-4 text-brand-border">
                  <Users size={32} />
                </div>
                <h3 className="text-lg font-bold text-brand-navy">No {activeTab} groups found</h3>
                <p className="text-brand-gray text-sm mt-1">You haven't joined any {activeTab} groups yet.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
