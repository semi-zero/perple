import React, { FC } from "react";

interface InputProps {
  type?: "text" | "number" | "email" | "password" | "date" | "time" | string;
  id?: string;
  name?: string;
  placeholder?: string;
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  min?: string;
  max?: string;
  step?: number;
  disabled?: boolean;
  success?: boolean;
  error?: boolean;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
}

const Input: FC<InputProps> = ({
  type = "text",
  id,
  name,
  placeholder,
  value,
  defaultValue,
  onChange,
  className = "",
  min,
  max,
  step,
  disabled = false,
  success = false,
  error = false,
  hint,
  leftIcon,
  rightIcon,
  onKeyDown,
  onBlur,
  autoFocus,
}) => {
  let inputClasses = `h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm 
    shadow-theme-xs placeholder:text-gray-400 
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-brand-500/20 
    dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 
    ${leftIcon ? 'pl-12' : 'pl-4'} 
    ${rightIcon ? 'pr-12' : 'pr-4'} 
    ${className}`;

  // Add styles for the different states
  if (disabled) {
    inputClasses += ` text-gray-500 border-gray-300 cursor-not-allowed 
      dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700`;
  } else if (error) {
    inputClasses += ` text-error-800 border-error-500 
      focus:border-error-500 focus:ring-error-500/20  
      dark:text-error-400 dark:border-error-500`;
  } else if (success) {
    inputClasses += ` text-success-500 border-success-400 
      focus:border-success-500 focus:ring-success-500/20 
      dark:text-success-400 dark:border-success-500`;
  } else {
    inputClasses += ` bg-transparent text-gray-800 border-gray-200 
      focus:border-brand-500 
      dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 
      dark:focus:border-brand-500 dark:focus:ring-brand-500/20
      dark:bg-white/[0.03]`;
  }

  return (
    <div className="relative">
      {leftIcon && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none">
          {leftIcon}
        </span>
      )}
      
      <input
        type={type}
        id={id}
        name={name}
        placeholder={placeholder}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        autoFocus={autoFocus}
        className={inputClasses}
      />

      {rightIcon && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
          {rightIcon}
        </span>
      )}

      {/* Optional Hint Text */}
      {hint && (
        <p
          className={`mt-1.5 text-xs ${
            error
              ? "text-error-500"
              : success
              ? "text-success-500"
              : "text-gray-500"
          }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
};

export default Input;