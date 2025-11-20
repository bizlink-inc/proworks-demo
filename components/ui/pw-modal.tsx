/**
 * PRO WORKS モーダル（ポップアップ）コンポーネント
 * UI仕様書: 各要素 > ポップアップ
 */

"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const PWModal = DialogPrimitive.Root

const PWModalTrigger = DialogPrimitive.Trigger

const PWModalPortal = DialogPrimitive.Portal

const PWModalClose = DialogPrimitive.Close

const PWModalOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    style={{ backgroundColor: "var(--pw-overlay)" }}
    {...props}
  />
))
PWModalOverlay.displayName = DialogPrimitive.Overlay.displayName

const PWModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <PWModalPortal>
    <PWModalOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
        "bg-white rounded-[var(--pw-radius-sm)] border border-[var(--pw-border-lighter)] shadow-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        style={{ color: "var(--pw-text-primary)" }}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">閉じる</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </PWModalPortal>
))
PWModalContent.displayName = DialogPrimitive.Content.displayName

const PWModalHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 p-6 border-b border-[var(--pw-border-light)]",
      className
    )}
    {...props}
  />
)
PWModalHeader.displayName = "PWModalHeader"

const PWModalFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 border-t border-[var(--pw-border-light)]",
      className
    )}
    {...props}
  />
)
PWModalFooter.displayName = "PWModalFooter"

const PWModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "font-semibold leading-none tracking-tight text-[var(--pw-text-primary)]",
      className
    )}
    style={{ fontSize: "var(--pw-text-xl)" }}
    {...props}
  />
))
PWModalTitle.displayName = DialogPrimitive.Title.displayName

const PWModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-[var(--pw-text-gray)]", className)}
    style={{ fontSize: "var(--pw-text-sm)" }}
    {...props}
  />
))
PWModalDescription.displayName = DialogPrimitive.Description.displayName

const PWModalBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("p-6", className)}
    {...props}
  />
)
PWModalBody.displayName = "PWModalBody"

export {
  PWModal,
  PWModalPortal,
  PWModalOverlay,
  PWModalClose,
  PWModalTrigger,
  PWModalContent,
  PWModalHeader,
  PWModalFooter,
  PWModalTitle,
  PWModalDescription,
  PWModalBody,
}

