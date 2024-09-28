import { cn } from "@/lib/shadcn";
import { VariantProps, cva } from "class-variance-authority";
import { HTMLAttributes, forwardRef } from "react";

const typographyVariants = cva("", {
  variants: {
    variant: {
      h1: "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl",
      h2: "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
      h3: "scroll-m-20 text-2xl font-semibold tracking-tight",
      h4: "scroll-m-20 text-xl font-semibold tracking-tight",
      p: "leading-7 [&:not(:first-child)]:mt-6",
      blockquote: "mt-6 border-l-2 pl-6 italic",
      muted: "text-sm text-muted-foreground",
    },
  },
  defaultVariants: {
    variant: "p",
  },
});

export interface TypographyProps
  extends HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof typographyVariants> {}

const Typography = forwardRef<HTMLParagraphElement, TypographyProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn(typographyVariants({ variant, className }))}
        {...props}
      />
    );
  }
);
Typography.displayName = "Typography";

export { Typography, typographyVariants };
