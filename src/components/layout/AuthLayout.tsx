import { ReactNode } from 'react';
import { Container } from '../ui/Container';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen bg-brand-light flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Container className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">A</span>
            </div>
            <span className="text-2xl font-bold text-brand-navy tracking-tight">Ajopay</span>
          </Link>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white py-8 px-4 shadow-xl shadow-brand-primary/5 sm:rounded-2xl sm:px-10 border border-brand-border"
        >
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-brand-navy">{title}</h2>
            <p className="mt-2 text-sm text-brand-gray">{subtitle}</p>
          </div>
          
          {children}
        </motion.div>
      </Container>
    </div>
  );
};
