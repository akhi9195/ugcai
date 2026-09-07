import React from "react";

export const PrimaryButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement>
> = ({ children, className, ...props }) => (
  <button
    className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm 
    font-medium bg-btn-primary hover:opacity-90 text-btn-primary-foreground active:scale-95
     transition-all ${className}`}
    {...props}
  >
    {children}
  </button>
);

export const GhostButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement>
> = ({ children, className, ...props }) => (
  <button
    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border border-btn-secondary-line 
      bg-btn-secondary hover:bg-btn-secondary-hover text-btn-secondary-foreground backdrop-blur-sm active:scale-95 transition ${className}`}
    {...props}
  >
    {children}
  </button>
);
