import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      navigate('/login');
    }, 1500);
  };

  return (
    <AuthLayout 
      title="Set new password" 
      subtitle="Your new password must be different from previously used passwords"
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <Input
          label="New Password"
          type="password"
          placeholder="••••••••"
          required
        />
        
        <Input
          label="Confirm New Password"
          type="password"
          placeholder="••••••••"
          required
        />

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading}
        >
          {isLoading ? 'Updating password...' : 'Reset password'}
        </Button>
      </form>
    </AuthLayout>
  );
}
