import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false, 
  className = '',
  ...props 
}) => {
  const baseStyles = "rounded-xl font-bold transition-all duration-200 active:scale-95 flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-primary text-white shadow-lg shadow-blue-200/50 hover:bg-opacity-90",
    secondary: "bg-secondary text-white shadow-lg shadow-purple-200/50 hover:bg-opacity-90",
    outline: "border-2 border-primary text-primary bg-transparent hover:bg-blue-50",
    danger: "bg-red-400 text-white hover:bg-red-500",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  const width = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${width} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
