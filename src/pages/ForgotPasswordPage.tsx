import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ArrowLeft, CheckCircle2, Mail, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1500);
  };

  if (isSubmitted) {
    return (
      <AuthLayout 
        title="Check your email" 
        subtitle="We've sent a password reset link to your inbox"
      >
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          {/* Animated Success Icon */}
          <div className="flex justify-center">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
              className="relative"
            >
              <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
                >
                  <Mail size={32} className="text-brand-emerald" />
                </motion.div>
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
                className="absolute -top-1 -right-1 w-7 h-7 bg-brand-emerald rounded-full flex items-center justify-center shadow-lg"
              >
                <CheckCircle2 size={14} className="text-white" />
              </motion.div>
            </motion.div>
          </div>

          {/* Email Sent To */}
          {email && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl">
              <span className="text-[12px] text-brand-gray">Sent to</span>
              <span className="text-[12px] font-bold text-brand-navy">{email}</span>
            </div>
          )}

          <p className="text-[13px] text-brand-gray leading-relaxed max-w-xs mx-auto">
            Didn't receive the email? Check your spam folder or{' '}
            <button 
              onClick={() => setIsSubmitted(false)}
              className="font-semibold text-brand-emerald hover:underline"
            >
              try another email address
            </button>
          </p>

          {/* Open Email CTA */}
          <button className="w-full py-3 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl font-bold text-[13px] transition-colors">
            Open Email App
          </button>

          <Link 
            to="/login" 
            className="inline-flex items-center gap-2 text-[13px] font-semibold text-brand-navy hover:text-brand-emerald transition-colors"
          >
            <ArrowLeft size={16} />
            Back to login
          </Link>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="Forgot password?" 
      subtitle="No worries — we'll send you reset instructions"
    >
      {/* Icon */}
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
          </svg>
        </div>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <Input
          label="Email Address"
          type="email"
          placeholder="Enter your registered email"
          required
          onChange={(e) => setEmail(e.target.value)}
          value={email}
        />

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Sending instructions...
            </span>
          ) : 'Send reset link'}
        </Button>

        <div className="text-center">
          <Link 
            to="/login" 
            className="inline-flex items-center gap-2 text-[13px] font-semibold text-brand-navy hover:text-brand-emerald transition-colors"
          >
            <ArrowLeft size={16} />
            Back to login
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
