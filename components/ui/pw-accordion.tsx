/**
 * PRO WORKS アコーディオンコンポーネント
 * UI仕様書: 各要素 > アコーディオン
 */

"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const PWAccordion = AccordionPrimitive.Root

const PWAccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn(
      "border-b border-[var(--pw-border-lighter)]",
      className
    )}
    {...props}
  />
))
PWAccordionItem.displayName = "PWAccordionItem"

const PWAccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 font-medium transition-all",
        "hover:underline text-left",
        "text-[var(--pw-text-primary)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pw-button-primary)] focus-visible:ring-offset-1 rounded-sm",
        "[&[data-state=open]>svg]:rotate-180",
        className
      )}
      style={{ fontSize: "var(--pw-text-md)" }}
      {...props}
    >
      {children}
      <ChevronDown
        className="h-4 w-4 shrink-0 transition-transform duration-200"
        style={{ color: "var(--pw-text-gray)" }}
      />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
PWAccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const PWAccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div
      className={cn(
        "pb-4 pt-0",
        "text-[var(--pw-text-gray)]",
        className
      )}
      style={{ fontSize: "var(--pw-text-sm)" }}
    >
      {children}
    </div>
  </AccordionPrimitive.Content>
))
PWAccordionContent.displayName = AccordionPrimitive.Content.displayName

export { PWAccordion, PWAccordionItem, PWAccordionTrigger, PWAccordionContent }

