"use client"

import * as React from "react"
import { Button } from "./button"

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

interface DialogContentProps {
  children: React.ReactNode
  className?: string
}

interface DialogHeaderProps {
  children: React.ReactNode
}

interface DialogTitleProps {
  children: React.ReactNode
}

interface DialogDescriptionProps {
  children: React.ReactNode
}

interface DialogFooterProps {
  children: React.ReactNode
}

const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false)
      }
    }

    if (open) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-50">
        {children}
      </div>
    </div>
  )
}

const DialogContent = ({ children, className = "" }: DialogContentProps) => {
  return (
    <div className={`bg-background border border-border rounded-lg shadow-lg w-full max-w-md p-6 ${className}`}>
      {children}
    </div>
  )
}

const DialogHeader = ({ children }: DialogHeaderProps) => {
  return (
    <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-4">
      {children}
    </div>
  )
}

const DialogTitle = ({ children }: DialogTitleProps) => {
  return (
    <h2 className="text-lg font-semibold leading-none tracking-tight">
      {children}
    </h2>
  )
}

const DialogDescription = ({ children }: DialogDescriptionProps) => {
  return (
    <p className="text-sm text-muted-foreground">
      {children}
    </p>
  )
}

const DialogFooter = ({ children }: DialogFooterProps) => {
  return (
    <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4">
      {children}
    </div>
  )
}

const DialogClose = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => {
  return (
    <Button variant="outline" onClick={onClick}>
      {children}
    </Button>
  )
}

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
}