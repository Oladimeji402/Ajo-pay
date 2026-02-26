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
  PlusCircle,
  CheckCircle2,
  Fingerprint,
  Globe,
  Moon,
  Smartphone,
  Mail,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const sections = [
    { id: 'profile', label: 'Profile Settings', sub: 'Name, email, and phone number', icon: <User size={20} />, color: 'bg-blue-50 text-blue-600', ring: 'ring-blue-100' },
    { id: 'security', label: 'Security', sub: 'Password and 2FA', icon: <Lock size={20} />, color: 'bg-purple-50 text-purple-600', ring: 'ring-purple-100' },
    { id: 'notifications', label: 'Notifications', sub: 'Email and push alerts', icon: <Bell size={20} />, color: 'bg-amber-50 text-amber-600', ring: 'ring-amber-100' },
    { id: 'billing', label: 'Payment Methods', sub: 'Cards and bank accounts', icon: <CreditCard size={20} />, color: 'bg-emerald-50 text-emerald-600', ring: 'ring-emerald-100' },
    { id: 'privacy', label: 'Privacy & Policy', sub: 'Data and terms', icon: <Shield size={20} />, color: 'bg-slate-100 text-slate-600', ring: 'ring-slate-200' },
    { id: 'help', label: 'Help & Support', sub: 'FAQs and contact', icon: <HelpCircle size={20} />, color: 'bg-rose-50 text-rose-600', ring: 'ring-rose-100' },
  ];

  // ─── Section Detail Views ───
  if (activeSection) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <button 
            onClick={() => setActiveSection(null)}
            className="inline-flex items-center gap-2 text-[13px] font-bold text-brand-gray hover:text-brand-navy mb-6 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Settings
          </button>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* ─── Profile ─── */}
            {activeSection === 'profile' && (
              <div className="space-y-5">
                {/* Profile Card */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-br from-brand-navy to-brand-primary p-8 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.06]">
                      <div className="absolute top-0 right-0 w-40 h-40 rounded-full border-[20px] border-white -mr-12 -mt-12"></div>
                    </div>
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="relative mb-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-brand-emerald to-emerald-400 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-xl">
                          F
                        </div>
                        <button className="absolute -bottom-1 -right-1 p-1.5 bg-white text-brand-navy rounded-lg shadow-lg hover:bg-slate-50 transition-colors">
                          <Camera size={14} />
                        </button>
                      </div>
                      <h3 className="text-lg font-bold text-white">Franklyn Okonkwo</h3>
                      <p className="text-[12px] text-white/50">franklyn@example.com</p>
                      <div className="flex items-center gap-1.5 mt-2 px-3 py-1 bg-white/10 rounded-full">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                        <span className="text-[10px] font-bold text-white/70">Premium Member</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Input label="First Name" defaultValue="Franklyn" />
                      <Input label="Last Name" defaultValue="Okonkwo" />
                    </div>
                    <Input label="Email Address" type="email" defaultValue="franklyn@example.com" />
                    <Input label="Phone Number" type="tel" defaultValue="+234 801 234 5678" />
                    
                    <div className="pt-4 border-t border-slate-100">
                      <Button className="w-full">Save Changes</Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── Security ─── */}
            {activeSection === 'security' && (
              <div className="space-y-5">
                {/* Password Card */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                      <Lock size={16} className="text-purple-600" />
                    </div>
                    <h3 className="text-[15px] font-bold text-brand-navy">Change Password</h3>
                  </div>
                  <div className="space-y-4">
                    <Input label="Current Password" type="password" placeholder="••••••••" />
                    <Input label="New Password" type="password" placeholder="••••••••" />
                    <Input label="Confirm New Password" type="password" placeholder="••••••••" />
                  </div>
                  <div className="pt-5">
                    <Button className="w-full">Update Password</Button>
                  </div>
                </div>

                {/* Security Options */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-5 pb-3">
                    <h4 className="text-[14px] font-bold text-brand-navy">Security Options</h4>
                    <p className="text-[11px] text-brand-gray">Extra layers of protection</p>
                  </div>
                  <div className="px-3 pb-3 space-y-1">
                    {[
                      { icon: <Shield size={18} />, label: 'Two-Factor Auth (2FA)', desc: 'SMS or authenticator app', color: 'bg-emerald-50 text-emerald-600', enabled: false },
                      { icon: <Fingerprint size={18} />, label: 'Biometric Login', desc: 'Face ID or Fingerprint', color: 'bg-blue-50 text-blue-600', enabled: true },
                      { icon: <Smartphone size={18} />, label: 'Login Notifications', desc: 'Alert on new device login', color: 'bg-amber-50 text-amber-600', enabled: true },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 transition-all">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.color}`}>
                            {item.icon}
                          </div>
                          <div>
                            <p className="text-[13px] font-bold text-brand-navy">{item.label}</p>
                            <p className="text-[11px] text-brand-gray">{item.desc}</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked={item.enabled} />
                          <div className="w-10 h-[22px] bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[18px] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-[18px] after:w-[18px] after:shadow-sm after:transition-all peer-checked:bg-brand-emerald"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ─── Notifications ─── */}
            {activeSection === 'notifications' && (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-5 pb-3">
                    <h3 className="text-[15px] font-bold text-brand-navy">Notification Preferences</h3>
                    <p className="text-[11px] text-brand-gray">Choose what you want to be notified about</p>
                  </div>
                  <div className="px-3 pb-3">
                    {[
                      { title: 'Contribution Reminders', desc: 'Alerts before your contribution is due', icon: <Bell size={16} />, color: 'bg-amber-50 text-amber-600', defaultOn: true },
                      { title: 'Payout Alerts', desc: 'When a payout is credited to you', icon: <CreditCard size={16} />, color: 'bg-emerald-50 text-emerald-600', defaultOn: true },
                      { title: 'Group Activity', desc: 'New members and group messages', icon: <User size={16} />, color: 'bg-blue-50 text-blue-600', defaultOn: true },
                      { title: 'Security Alerts', desc: 'Login attempts and password changes', icon: <Shield size={16} />, color: 'bg-red-50 text-red-600', defaultOn: true },
                      { title: 'Marketing Updates', desc: 'News, tips, and promotions', icon: <Mail size={16} />, color: 'bg-purple-50 text-purple-600', defaultOn: false },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 transition-all">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.color}`}>
                            {item.icon}
                          </div>
                          <div>
                            <p className="text-[13px] font-bold text-brand-navy">{item.title}</p>
                            <p className="text-[11px] text-brand-gray">{item.desc}</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked={item.defaultOn} />
                          <div className="w-10 h-[22px] bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[18px] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-[18px] after:w-[18px] after:shadow-sm after:transition-all peer-checked:bg-brand-emerald"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery channels */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <h4 className="text-[14px] font-bold text-brand-navy mb-4">Delivery Channels</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Push Notifications', icon: <Smartphone size={16} />, active: true },
                      { label: 'Email', icon: <Mail size={16} />, active: true },
                    ].map((ch, i) => (
                      <button key={i} className={`flex items-center gap-2.5 p-3.5 rounded-xl border-2 transition-all ${
                        ch.active ? 'border-brand-emerald bg-emerald-50/50' : 'border-slate-100 hover:border-slate-200'
                      }`}>
                        <span className={ch.active ? 'text-brand-emerald' : 'text-slate-400'}>{ch.icon}</span>
                        <span className={`text-[12px] font-bold ${ch.active ? 'text-brand-navy' : 'text-brand-gray'}`}>{ch.label}</span>
                        {ch.active && <CheckCircle2 size={14} className="text-brand-emerald ml-auto" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ─── Billing / Payment Methods ─── */}
            {activeSection === 'billing' && (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                      <CreditCard size={16} className="text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-brand-navy">Payment Methods</h3>
                      <p className="text-[11px] text-brand-gray">Manage your cards and bank accounts</p>
                    </div>
                  </div>

                  {/* Card */}
                  <div className="relative rounded-2xl overflow-hidden mb-4">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-navy via-[#1e3a7d] to-brand-primary"></div>
                    <div className="absolute inset-0 opacity-[0.06]">
                      <div className="absolute top-0 right-0 w-32 h-32 rounded-full border-[16px] border-white -mr-10 -mt-10"></div>
                    </div>
                    <div className="relative z-10 p-5">
                      <div className="flex items-center justify-between mb-8">
                        <div className="px-2 py-1 bg-white/15 rounded text-[10px] font-bold text-white uppercase tracking-wider">Visa</div>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                          <CheckCircle2 size={10} />
                          Primary
                        </span>
                      </div>
                      <p className="text-lg font-bold text-white tracking-[0.2em] mb-4">•••• •••• •••• 4242</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[9px] text-white/40 font-bold uppercase">Card Holder</p>
                          <p className="text-[12px] font-bold text-white/80">Franklyn Okonkwo</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-white/40 font-bold uppercase">Expires</p>
                          <p className="text-[12px] font-bold text-white/80">12/25</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button className="w-full py-3.5 border-2 border-dashed border-slate-200 rounded-2xl text-[13px] font-bold text-brand-gray hover:border-brand-emerald hover:text-brand-emerald transition-all flex items-center justify-center gap-2">
                    <PlusCircle size={18} />
                    Add New Card
                  </button>
                </div>

                {/* Bank Account */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <h4 className="text-[14px] font-bold text-brand-navy mb-4">Bank Account</h4>
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <Globe size={16} className="text-brand-navy" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-brand-navy">GTBank · •••• 5678</p>
                        <p className="text-[11px] text-brand-gray">For payout withdrawals</p>
                      </div>
                    </div>
                    <CheckCircle2 size={16} className="text-brand-emerald" />
                  </div>
                </div>
              </div>
            )}

            {/* ─── Privacy ─── */}
            {activeSection === 'privacy' && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Shield size={16} className="text-slate-600" />
                  </div>
                  <h3 className="text-[15px] font-bold text-brand-navy">Privacy & Policy</h3>
                </div>
                <div className="space-y-1">
                  {[
                    { label: 'Privacy Policy', desc: 'How we handle your data' },
                    { label: 'Terms of Service', desc: 'Our terms and conditions' },
                    { label: 'Data Export', desc: 'Download a copy of your data' },
                    { label: 'Delete Account', desc: 'Permanently remove your account', danger: true },
                  ].map((item, i) => (
                    <button key={i} className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all text-left ${
                      item.danger ? 'hover:bg-red-50' : 'hover:bg-slate-50'
                    }`}>
                      <div>
                        <p className={`text-[13px] font-bold ${item.danger ? 'text-red-500' : 'text-brand-navy'}`}>{item.label}</p>
                        <p className="text-[11px] text-brand-gray">{item.desc}</p>
                      </div>
                      {item.danger ? (
                        <ChevronRight size={14} className="text-red-300" />
                      ) : (
                        <ExternalLink size={14} className="text-slate-300" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ─── Help & Support ─── */}
            {activeSection === 'help' && (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center">
                      <HelpCircle size={16} className="text-rose-600" />
                    </div>
                    <h3 className="text-[15px] font-bold text-brand-navy">Help & Support</h3>
                  </div>
                  <div className="space-y-1">
                    {[
                      { label: 'FAQs', desc: 'Find answers to common questions' },
                      { label: 'Contact Support', desc: 'Chat with our team' },
                      { label: 'Report a Bug', desc: 'Help us improve Ajopay' },
                      { label: 'Feature Request', desc: 'Suggest a new feature' },
                    ].map((item, i) => (
                      <button key={i} className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 transition-all text-left">
                        <div>
                          <p className="text-[13px] font-bold text-brand-navy">{item.label}</p>
                          <p className="text-[11px] text-brand-gray">{item.desc}</p>
                        </div>
                        <ChevronRight size={14} className="text-slate-300" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick contact */}
                <div className="bg-gradient-to-br from-brand-emerald to-emerald-600 rounded-2xl p-5 text-white relative overflow-hidden">
                  <div className="absolute inset-0 opacity-[0.07]">
                    <div className="absolute -top-6 -right-6 w-32 h-32 border-[14px] border-white rounded-full"></div>
                  </div>
                  <div className="relative z-10">
                    <h4 className="text-[14px] font-bold mb-1">Need urgent help?</h4>
                    <p className="text-[12px] text-white/70 mb-4">Our team is available Mon–Fri, 9am–6pm WAT</p>
                    <div className="flex gap-3">
                      <button className="flex-1 py-2.5 bg-white text-brand-emerald rounded-xl font-bold text-[12px] hover:bg-slate-100 transition-colors">
                        Live Chat
                      </button>
                      <button className="flex-1 py-2.5 bg-white/15 text-white rounded-xl font-bold text-[12px] hover:bg-white/25 transition-colors">
                        Email Us
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  // ─── Main Settings View ───
  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-emerald to-emerald-400 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-brand-emerald/20">
                F
              </div>
              <button className="absolute -bottom-1 -right-1 p-1 bg-white text-brand-navy rounded-lg shadow border border-slate-100 hover:bg-slate-50 transition-colors">
                <Camera size={12} />
              </button>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-brand-navy">Franklyn Okonkwo</h2>
              <p className="text-[12px] text-brand-gray">franklyn@example.com</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 bg-brand-emerald rounded-full"></span>
                <span className="text-[10px] font-bold text-brand-emerald uppercase tracking-wider">Premium Member</span>
              </div>
            </div>
            <button 
              onClick={() => setActiveSection('profile')}
              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-[12px] font-bold text-brand-navy transition-colors"
            >
              Edit
            </button>
          </div>
        </motion.div>

        {/* Settings Sections */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
        >
          <div className="p-5 pb-2">
            <h3 className="text-[14px] font-bold text-brand-navy">Account Settings</h3>
          </div>
          <div className="px-2 pb-2">
            {sections.map((section, index) => (
              <motion.button
                key={section.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + index * 0.03 }}
                onClick={() => setActiveSection(section.id)}
                className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${section.color} ring-2 ${section.ring} transition-all group-hover:ring-4`}>
                    {section.icon}
                  </div>
                  <div className="text-left">
                    <p className="text-[13px] font-bold text-brand-navy group-hover:text-brand-primary transition-colors">{section.label}</p>
                    <p className="text-[11px] text-brand-gray">{section.sub}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-200 group-hover:text-brand-navy group-hover:translate-x-0.5 transition-all" />
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Sign Out */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <button className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:bg-red-50 hover:border-red-100 transition-all group">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center group-hover:bg-red-100 transition-colors">
                <LogOut size={20} />
              </div>
              <div className="text-left">
                <p className="text-[13px] font-bold text-red-500">Sign Out</p>
                <p className="text-[11px] text-brand-gray">Logout from your account</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-200 group-hover:text-red-500 group-hover:translate-x-0.5 transition-all" />
          </button>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center py-4"
        >
          <p className="text-[11px] text-slate-400">Ajopay v1.0.4</p>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
