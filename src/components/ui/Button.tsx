import React, { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'white';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:bg-brand-disabled disabled:text-brand-gray disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-brand-primary text-white hover:bg-brand-primary-hover focus:ring-brand-primary',
    secondary: 'border-2 border-brand-primary text-brand-primary bg-transparent hover:bg-brand-soft-blue focus:ring-brand-primary',
    outline: 'border-2 border-brand-border text-brand-navy hover:bg-brand-light focus:ring-brand-navy',
    ghost: 'text-brand-gray hover:text-brand-navy hover:bg-brand-light focus:ring-brand-light',
    white: 'bg-white text-brand-primary hover:bg-brand-light focus:ring-white',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
