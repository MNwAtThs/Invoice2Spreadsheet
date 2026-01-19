import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "default" | "primary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  default: "button",
  primary: "button button-primary",
  ghost: "button button-ghost",
  danger: "button button-danger",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", fullWidth, className = "", children, ...props }, ref) => {
    const classes = [
      variantClasses[variant],
      fullWidth ? "button-full" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
