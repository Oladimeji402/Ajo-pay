import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      navigate('/onboarding');
    }, 1500);
  };

  return (
    <AuthLayout 
      title="Create an account" 
      subtitle="Join Ajopay and start saving with your community"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            type="text"
            placeholder="John"
            required
          />
          <Input
            label="Last Name"
            type="text"
            placeholder="Doe"
            required
          />
        </div>
        
        <Input
          label="Email Address"
          type="email"
          placeholder="name@example.com"
          required
        />
        
        <Input
          label="Phone Number"
          type="tel"
          placeholder="+234 800 000 0000"
          required
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          required
        />

        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-brand-border rounded"
              required
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="terms" className="text-brand-gray">
              I agree to the{' '}
              <a href="#" className="font-semibold text-brand-navy hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="font-semibold text-brand-navy hover:underline">Privacy Policy</a>
            </label>
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading}
        >
          {isLoading ? 'Creating account...' : 'Create account'}
        </Button>

        <p className="text-center text-sm text-brand-gray">
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
