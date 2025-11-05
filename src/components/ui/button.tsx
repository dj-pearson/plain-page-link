import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { hapticFeedback } from "@/lib/haptics";

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 touch-target no-select",
    {
        variants: {
            variant: {
                default:
                    "bg-blue-600 text-white shadow hover:bg-blue-700 active:bg-blue-800",
                destructive:
                    "bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800",
                outline:
                    "border border-gray-300 bg-white shadow-sm hover:bg-gray-50 active:bg-gray-100 text-gray-900",
                secondary:
                    "bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200 active:bg-gray-300",
                ghost: "hover:bg-gray-100 active:bg-gray-200 text-gray-900",
                link: "text-blue-600 underline-offset-4 hover:underline active:text-blue-800",
            },
            size: {
                default: "h-11 sm:h-10 px-4 py-2 text-sm sm:text-base",
                sm: "h-9 sm:h-8 rounded-md px-3 text-xs",
                lg: "h-12 sm:h-11 rounded-md px-6 sm:px-8 text-base sm:text-lg",
                icon: "h-11 w-11 sm:h-10 sm:w-10",
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
    ({ className, variant, size, asChild = false, onClick, ...props }, ref) => {
        const Comp = asChild ? Slot : "button";

        const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
            // Trigger haptic feedback on mobile devices
            hapticFeedback.tap();

            // Call the original onClick handler
            onClick?.(e);
        };

        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                onClick={handleClick}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button, buttonVariants };

