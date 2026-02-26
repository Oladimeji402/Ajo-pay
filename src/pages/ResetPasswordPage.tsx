import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { motion } from 'motion/react';
import { Loader2, Check, X, Lock, CheckCircle2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
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

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  // Success state
  if (isSuccess) {
    return (
      <AuthLayout
        title="Password updated!"
        subtitle="Your password has been changed successfully"
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <div className="flex justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
              className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
              >
                <CheckCircle2 size={40} className="text-brand-emerald" />
              </motion.div>
            </motion.div>
          </div>

          <p className="text-[13px] text-brand-gray leading-relaxed max-w-xs mx-auto">
            Your password has been reset. You can now sign in with your new password.
          </p>

          <Button
            onClick={() => navigate('/login')}
            className="w-full"
          >
            Continue to Sign In
          </Button>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="Set new password" 
      subtitle="Create a strong password that you haven't used before"
    >
      {/* Icon */}
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
          <Lock size={28} className="text-blue-500" />
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* New Password */}
        <div>
          <div className="space-y-1 w-full">
            <label className="block text-sm font-semibold text-brand-navy">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
              required
              className="block w-full px-4 py-3 rounded-lg border border-brand-border text-brand-navy placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all duration-200"
            />
          </div>

          {/* Strength Meter */}
          {password.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 space-y-2.5"
            >
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

        {/* Confirm Password */}
        <div>
          <div className="space-y-1 w-full">
            <label className="block text-sm font-semibold text-brand-navy">Confirm New Password</label>
            <div className="relative">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
                className={`block w-full px-4 py-3 rounded-lg border text-brand-navy placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
                  passwordsMismatch 
                    ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400' 
                    : passwordsMatch 
                      ? 'border-emerald-300 focus:ring-emerald-500/20 focus:border-emerald-400' 
                      : 'border-brand-border focus:ring-brand-primary/20 focus:border-brand-primary'
                }`}
              />
              {passwordsMatch && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Check size={16} className="text-emerald-500" />
                </div>
              )}
            </div>
          </div>
          {passwordsMismatch && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[11px] text-red-500 font-medium mt-1.5"
            >
              Passwords don't match
            </motion.p>
          )}
        </div>

        <div className="pt-1">
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !passwordsMatch || strengthPercent < 75}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Updating password...
              </span>
            ) : 'Reset password'}
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
