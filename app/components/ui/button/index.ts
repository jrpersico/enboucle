import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Button } from "./Button.vue"

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-sm font-semibold -tracking-[0.01em] transition-[filter,background-color,transform,color] active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-[17px] shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-ring/50 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:brightness-110",
        destructive:
          "bg-danger/15 text-danger border border-danger/30 hover:bg-danger/20",
        outline:
          "border border-border-strong bg-transparent hover:bg-muted/50",
        secondary:
          "bg-muted text-foreground hover:brightness-110",
        ghost:
          "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        "default": "h-10 px-4",
        "sm": "h-8 gap-1.5 rounded-lg px-3 text-[13px] [&_svg:not([class*='size-'])]:size-[15px]",
        "lg": "h-12 gap-2 rounded-xl px-[22px] text-[15px]",
        "icon": "size-10",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)
export type ButtonVariants = VariantProps<typeof buttonVariants>
