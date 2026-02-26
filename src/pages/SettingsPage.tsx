import React, { useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { 
  User, 
  Lock, 
  Bell, 
  Shield, 
  CreditCard, 
  LogOut, 
  ChevronRight,
  Camera,
  HelpCircle,
  ArrowLeft,
  PlusCircle
} from 'lucide-react';
import { motion } from 'motion/react';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const sections = [
    { id: 'profile', label: 'Profile Settings', sub: 'Name, email, and phone number', icon: <User size={22} />, color: 'bg-blue-50 text-blue-600' },
    { id: 'security', label: 'Security', sub: 'Password and 2FA', icon: <Lock size={22} />, color: 'bg-purple-50 text-purple-600' },
    { id: 'notifications', label: 'Notifications', sub: 'Email and push alerts', icon: <Bell size={22} />, color: 'bg-amber-50 text-amber-600' },
    { id: 'billing', label: 'Payment Methods', sub: 'Cards and bank accounts', icon: <CreditCard size={22} />, color: 'bg-emerald-50 text-emerald-600' },
    { id: 'privacy', label: 'Privacy & Policy', sub: 'Data and terms', icon: <Shield size={22} />, color: 'bg-slate-50 text-slate-600' },
    { id: 'help', label: 'Help & Support', sub: 'FAQs and contact', icon: <HelpCircle size={22} />, color: 'bg-rose-50 text-rose-600' },
  ];

  if (activeSection) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <button 
            onClick={() => setActiveSection(null)}
            className="flex items-center gap-2 text-sm font-bold text-brand-gray hover:text-brand-navy mb-6 transition-colors"
          >
            <ArrowLeft size={18} />
            Back to Settings
          </button>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm"
          >
            {activeSection === 'profile' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-brand-navy mb-6">Profile Settings</h3>
                  <div className="flex flex-col items-center mb-8">
                    <div className="relative">
                      <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-3xl font-bold text-brand-navy border-4 border-white shadow-sm">
                        F
                      </div>
                      <button className="absolute bottom-0 right-0 p-2 bg-brand-emerald text-white rounded-full shadow-lg hover:bg-emerald-600 transition-colors">
                        <Camera size={16} />
                      </button>
                    </div>
                    <div className="text-center mt-4">
                      <h4 className="font-bold text-brand-navy">Franklyn</h4>
                      <p className="text-sm text-brand-gray">franklyn@example.com</p>
                    </div>
                  </div>

                  <div className="grid gap-6">
                    <Input label="First Name" defaultValue="Franklyn" />
                    <Input label="Last Name" defaultValue="Okonkwo" />
                    <Input label="Email Address" type="email" defaultValue="franklyn@example.com" />
                    <Input label="Phone Number" type="tel" defaultValue="+234 801 234 5678" />
                  </div>
                </div>
                <div className="pt-6 border-t border-slate-100">
                  <Button className="w-full">Save Changes</Button>
                </div>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-brand-navy mb-6">Security</h3>
                  <div className="space-y-6">
                    <Input label="Current Password" type="password" placeholder="••••••••" />
                    <Input label="New Password" type="password" placeholder="••••••••" />
                    <Input label="Confirm New Password" type="password" placeholder="••••••••" />
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand-emerald shadow-sm">
                      <Shield size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-brand-navy">Two-Factor Auth</p>
                      <p className="text-[10px] text-brand-gray">Extra layer of security</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-brand-navy hover:bg-slate-50 transition-colors">
                    Enable
                  </button>
                </div>
                <div className="pt-6 border-t border-slate-100">
                  <Button className="w-full">Update Password</Button>
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-brand-navy mb-2">Notifications</h3>
                <div className="divide-y divide-slate-50">
                  {[
                    { title: 'Contribution Reminders', desc: 'Alerts before your contribution is due' },
                    { title: 'Payout Alerts', desc: 'When a payout is credited to you' },
                    { title: 'Group Activity', desc: 'New members and group messages' },
                    { title: 'Marketing Updates', desc: 'News and promotions' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-4">
                      <div className="pr-4">
                        <p className="text-sm font-bold text-brand-navy">{item.title}</p>
                        <p className="text-xs text-brand-gray">{item.desc}</p>
                      </div>
                      <div className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked={i < 3} />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-emerald"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'billing' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-brand-navy mb-6">Payment Methods</h3>
                  <div className="space-y-4">
                    <div className="p-4 border-2 border-brand-emerald bg-emerald-50 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-8 bg-brand-navy rounded flex items-center justify-center text-white text-[10px] font-bold">
                          VISA
                        </div>
                        <div>
                          <p className="text-sm font-bold text-brand-navy">•••• 4242</p>
                          <p className="text-[10px] text-brand-gray">Expires 12/25</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-brand-emerald uppercase tracking-widest">Primary</span>
                    </div>
                    <button className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-sm font-bold text-brand-gray hover:border-brand-emerald hover:text-brand-emerald transition-all flex items-center justify-center gap-2">
                      <PlusCircle size={20} />
                      Add New Card
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-brand-navy">Settings</h1>
          <p className="text-sm text-brand-gray">Manage your account and preferences</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-50">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${section.color}`}>
                    {section.icon}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-brand-navy group-hover:text-brand-emerald transition-colors">{section.label}</p>
                    <p className="text-xs text-brand-gray">{section.sub}</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-slate-300 group-hover:text-brand-navy group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <button className="w-full flex items-center justify-between p-5 bg-white rounded-3xl border border-slate-100 shadow-sm hover:bg-red-50 transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
                <LogOut size={22} />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-red-500">Sign Out</p>
                <p className="text-xs text-brand-gray">Logout from your account</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-slate-300 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
          </button>
        </div>

        <div className="mt-12 text-center">
          <p className="text-xs text-brand-gray">Ajopay Version 1.0.4 (2023)</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
