import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      navigate('/dashboard');
    }, 1500);
  };

  return (
    <AuthLayout 
      title="Welcome back" 
      subtitle="Enter your credentials to access your account"
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <Input
          label="Email Address"
          type="email"
          placeholder="name@example.com"
          required
        />
        
        <div className="space-y-1">
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            required
          />
          <div className="flex justify-end">
            <Link 
              to="/forgot-password" 
              className="text-sm font-semibold text-brand-emerald hover:text-brand-emerald-hover transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>

        <p className="text-center text-sm text-brand-gray">
          Don't have an account?{' '}
          <Link 
            to="/signup" 
            className="font-semibold text-brand-emerald hover:text-brand-emerald-hover transition-colors"
          >
            Create an account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
