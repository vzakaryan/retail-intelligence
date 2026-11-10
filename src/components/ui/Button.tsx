import type { ButtonHTMLAttributes } from "react";

type Variant = "default" | "primary" | "soft";

const VARIANT: Record<Variant, string> = {
  default: "border-line bg-white text-ink hover:bg-canvas",
  primary: "border-primary bg-primary text-white hover:bg-primary-600",
  soft: "border-transparent bg-primary-50 text-primary hover:bg-primary-100",
};

export function Button({ variant = "default", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-ctl border px-3.5 py-2 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-4 ${VARIANT[variant]} ${className}`}
      {...props}
    />
  );
}
