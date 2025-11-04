import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
    {
        variants: {
            variant: {
                default:
                    "bg-gradient-to-br from-blue-500/90 to-blue-600/90 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 backdrop-blur-xl border border-blue-400/20 hover:border-blue-300/30 hover:scale-[1.02]",
                destructive:
                    "bg-gradient-to-br from-red-500/90 to-red-600/90 text-white shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 backdrop-blur-xl border border-red-400/20 hover:border-red-300/30 hover:scale-[1.02]",
                outline:
                    "border-2 border-gray-300/40 bg-white/60 backdrop-blur-xl shadow-lg hover:bg-white/80 text-gray-900 hover:shadow-xl hover:border-gray-400/60 hover:scale-[1.02]",
                secondary:
                    "bg-gradient-to-br from-gray-200/80 to-gray-300/80 text-gray-900 shadow-lg backdrop-blur-xl border border-gray-400/30 hover:from-gray-300/90 hover:to-gray-400/90 hover:shadow-xl hover:scale-[1.02]",
                ghost: "hover:bg-white/60 hover:backdrop-blur-xl text-gray-900 hover:shadow-lg hover:scale-[1.02]",
                link: "text-blue-600 underline-offset-4 hover:underline hover:text-blue-700",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-8 rounded-lg px-3 text-xs",
                lg: "h-12 rounded-xl px-8 text-base",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button";
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button, buttonVariants };

