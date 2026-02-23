import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick: () => void;
  rightElement?: React.ReactNode;
}

export function MobileHeader({ title, subtitle, onMenuClick, rightElement }: MobileHeaderProps) {
  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-40 px-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="-ml-2"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-lg font-bold">{title}</h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {rightElement}
    </div>
  );
}

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function MobileSidebar({ isOpen, onClose, children }: MobileSidebarProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={`lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40 transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div
        className={`lg:hidden fixed top-0 left-0 bottom-0 w-64 bg-card border-r border-border z-50 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-background font-bold">L</span>
            </div>
            <span className="text-xl font-bold">LiquidAI</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        <nav className="p-4 space-y-1">
          {children}
        </nav>
      </div>
    </>
  );
}
