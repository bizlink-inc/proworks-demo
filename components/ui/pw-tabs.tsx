/**
 * PRO WORKS タブコンポーネント
 * UI仕様書: 各要素 > タブ
 */

"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

const PWTabs = TabsPrimitive.Root

const PWTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center rounded-[var(--pw-radius-sm)] p-1",
      "bg-[var(--pw-bg-light-blue)]",
      className
    )}
    {...props}
  />
))
PWTabsList.displayName = TabsPrimitive.List.displayName

const PWTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-[var(--pw-radius-sm)] px-4 py-2 transition-all",
      "text-[var(--pw-text-gray)] hover:text-[var(--pw-text-primary)]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pw-button-primary)] focus-visible:ring-offset-1",
      "disabled:pointer-events-none disabled:opacity-50",
      "data-[state=active]:bg-white data-[state=active]:text-[var(--pw-button-primary)] data-[state=active]:font-medium data-[state=active]:shadow-sm",
      className
    )}
    style={{ fontSize: "var(--pw-text-sm)" }}
    {...props}
  />
))
PWTabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const PWTabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
PWTabsContent.displayName = TabsPrimitive.Content.displayName

export { PWTabs, PWTabsList, PWTabsTrigger, PWTabsContent }

