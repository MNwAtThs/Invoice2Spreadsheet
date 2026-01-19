import { InputHTMLAttributes, forwardRef, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon, error, className = "", ...props }, ref) => {
    if (icon) {
      return (
        <div className="input-wrapper">
          {label && <label className="input-label">{label}</label>}
          <div className={`search-input ${className}`}>
            {icon}
            <input ref={ref} {...props} />
          </div>
          {error && <span className="input-error">{error}</span>}
        </div>
      );
    }

    return (
      <label className="input-wrapper">
        {label && <span className="input-label">{label}</span>}
        <input ref={ref} className={className} {...props} />
        {error && <span className="input-error">{error}</span>}
      </label>
    );
  }
);

Input.displayName = "Input";
