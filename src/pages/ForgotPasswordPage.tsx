import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1500);
  };

  if (isSubmitted) {
    return (
      <AuthLayout 
        title="Check your email" 
        subtitle="We've sent a password reset link to your email address"
      >
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-emerald-50 text-brand-emerald rounded-full flex items-center justify-center">
              <CheckCircle2 size={32} />
            </div>
          </div>
          <p className="text-sm text-brand-gray">
            Didn't receive the email? Check your spam folder or{' '}
            <button 
              onClick={() => setIsSubmitted(false)}
              className="font-semibold text-brand-emerald hover:underline"
            >
              try another email address
            </button>
          </p>
          <Link 
            to="/login" 
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-navy hover:text-brand-emerald transition-colors"
          >
            <ArrowLeft size={16} />
            Back to login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="Forgot password?" 
      subtitle="No worries, we'll send you reset instructions"
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <Input
          label="Email Address"
          type="email"
          placeholder="name@example.com"
          required
        />

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading}
        >
          {isLoading ? 'Sending instructions...' : 'Reset password'}
        </Button>

        <div className="text-center">
          <Link 
            to="/login" 
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-navy hover:text-brand-emerald transition-colors"
          >
            <ArrowLeft size={16} />
            Back to login
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
