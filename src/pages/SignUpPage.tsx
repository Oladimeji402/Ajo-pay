import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { motion } from 'motion/react';
import { Loader2, Check, X } from 'lucide-react';

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate('/onboarding');
    }, 1500);
  };

  // Password strength
  const passwordChecks = useMemo(() => [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'One uppercase letter', valid: /[A-Z]/.test(password) },
    { label: 'One number', valid: /[0-9]/.test(password) },
    { label: 'One special character', valid: /[^A-Za-z0-9]/.test(password) },
  ], [password]);

  const strengthPercent = (passwordChecks.filter(c => c.valid).length / passwordChecks.length) * 100;
  const strengthColor = strengthPercent <= 25 ? 'bg-red-500' : strengthPercent <= 50 ? 'bg-amber-500' : strengthPercent <= 75 ? 'bg-blue-500' : 'bg-emerald-500';
  const strengthLabel = strengthPercent <= 25 ? 'Weak' : strengthPercent <= 50 ? 'Fair' : strengthPercent <= 75 ? 'Good' : 'Strong';

  return (
    <AuthLayout 
      title="Create your account" 
      subtitle="Join 10,000+ Nigerians saving smarter with Ajopay"
    >
      {/* Social Login */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button className="flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white border border-slate-200 rounded-xl text-[13px] font-semibold text-brand-navy hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google
        </button>
        <button className="flex items-center justify-center gap-2.5 py-2.5 px-4 bg-brand-navy border border-brand-navy rounded-xl text-[13px] font-semibold text-white hover:bg-[#0a1120] transition-all shadow-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          Apple
        </button>
      </div>

      {/* Divider */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-3 bg-[#F8FAFC] text-slate-400 font-medium">or sign up with email</span>
        </div>
      </div>

      {/* Form */}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-3">
          <Input label="First Name" type="text" placeholder="John" required />
          <Input label="Last Name" type="text" placeholder="Doe" required />
        </div>
        
        <Input label="Email Address" type="email" placeholder="name@example.com" required />
        <Input label="Phone Number" type="tel" placeholder="+234 800 000 0000" required />

        <div>
          <div className="space-y-1 w-full">
            <label className="block text-sm font-semibold text-brand-navy">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
              required
              className="block w-full px-4 py-3 rounded-lg border border-brand-border text-brand-navy placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all duration-200"
            />
          </div>

          {/* Password Strength */}
          {password.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 space-y-2.5"
            >
              {/* Strength Bar */}
              <div className="flex items-center gap-2.5">
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${strengthPercent}%` }}
                    className={`h-full rounded-full transition-colors ${strengthColor}`}
                  />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                  strengthPercent <= 25 ? 'text-red-500' : strengthPercent <= 50 ? 'text-amber-500' : strengthPercent <= 75 ? 'text-blue-500' : 'text-emerald-500'
                }`}>
                  {strengthLabel}
                </span>
              </div>

              {/* Checks */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                {passwordChecks.map((check, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    {check.valid ? (
                      <Check size={12} className="text-emerald-500 flex-shrink-0" />
                    ) : (
                      <X size={12} className="text-slate-300 flex-shrink-0" />
                    )}
                    <span className={`text-[11px] ${check.valid ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {check.label}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Terms */}
        <div className="flex items-start gap-3 pt-1">
          <label className="relative mt-0.5 cursor-pointer">
            <input 
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="sr-only peer" 
              required 
            />
            <div className="w-[18px] h-[18px] rounded border-2 border-slate-300 peer-checked:border-brand-emerald peer-checked:bg-brand-emerald transition-all flex items-center justify-center flex-shrink-0">
              {agreedToTerms && (
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          </label>
          <span className="text-[12px] text-brand-gray leading-relaxed">
            I agree to Ajopay's{' '}
            <a href="#" className="font-semibold text-brand-navy hover:text-brand-primary underline decoration-dotted transition-colors">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="font-semibold text-brand-navy hover:text-brand-primary underline decoration-dotted transition-colors">Privacy Policy</a>
          </span>
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Creating account...
            </span>
          ) : 'Create account'}
        </Button>

        <p className="text-center text-[13px] text-brand-gray">
          Already have an account?{' '}
          <Link 
            to="/login" 
            className="font-semibold text-brand-emerald hover:text-brand-emerald-hover transition-colors"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
