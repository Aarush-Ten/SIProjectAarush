import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva("button", {
  variants: {
    variant: { default: "button-primary", secondary: "button-secondary", ghost: "button-ghost" },
    size: { default: "", small: "button-small" },
  },
  defaultVariants: { variant: "default", size: "default" },
});

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return <button data-slot="button" type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
