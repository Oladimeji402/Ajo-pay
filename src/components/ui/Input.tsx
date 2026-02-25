import React, { InputHTMLAttributes, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  className?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
}

export const Input = ({ label, error, className = '', type = 'text', ...props }: InputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="space-y-1 w-full">
      <label className="block text-sm font-semibold text-brand-navy">
        {label}
      </label>
      <div className="relative">
        <input
          type={inputType}
          className={`block w-full px-4 py-3 rounded-lg border border-brand-border text-brand-navy placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all duration-200 ${
            error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''
          } ${isPassword ? 'pr-12' : ''} ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-brand-navy transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
      {error && <p className="text-xs font-medium text-red-500 mt-1">{error}</p>}
    </div>
  );
};
