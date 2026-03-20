"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, DollarSign, BookOpen, LogOut, Search, Heart, ClipboardList, Sun, Moon } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useTheme } from "@/components/theme-provider";
import { useHaptics } from "@/components/haptics-provider";

export const Navigation = () => {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { trigger, isSupported } = useHaptics();

  const navItems = [
    { href: "/", label: "Meetings", icon: Home },
    { href: "/find-meetings", label: "Find", icon: Search },
    { href: "/inventory", label: "Inventory", icon: ClipboardList },
    { href: "/treasury", label: "Treasury", icon: DollarSign },
    { href: "/literature", label: "Literature", icon: BookOpen },
  ];

  return (
    <div className="bg-[var(--surface-container-lowest)] border-b-4 border-[var(--on-background)] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        {/* Desktop & Tablet Navigation */}
        <div className="hidden md:flex items-center justify-between py-4 gap-4">
          {/* Left: Main Nav Items */}
          <div className="flex items-center gap-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { if (isSupported) trigger('light'); }}
                    className={`flex items-center gap-2.5 px-4 py-2.5 border-3 border-[var(--on-background)] neo-title text-sm transition-all ${
                      isActive 
                        ? "bg-[var(--tertiary)] text-[var(--on-tertiary)]" 
                        : "bg-[var(--surface-container-lowest)] text-[var(--on-background)] hover:bg-[var(--surface-container)]"
                    }`}
                    style={{ 
                      boxShadow: isActive ? 'none' : '4px 4px 0px 0px var(--on-background)',
                      transform: isActive ? 'translate(-2px, -2px)' : undefined
                    }}
                  >
                    <item.icon size={18} strokeWidth={3} />
                    <span className="hidden lg:inline">{item.label}</span>
                    <span className="lg:hidden">{item.label.slice(0, 3)}</span>
                  </motion.div>
                </Link>
              );
            })}
          </div>
          
          {/* Right: Theme, Help, Email, Logout */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.05, rotate: resolvedTheme === "dark" ? 15 : -15 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => { if (isSupported) trigger('light'); toggleTheme(); }}
              className="flex items-center justify-center w-10 h-10 border-3 border-[var(--on-background)] bg-[var(--primary)]"
              style={{ boxShadow: '4px 4px 0px 0px var(--on-background)' }}
              title={`Theme: ${resolvedTheme}`}
            >
              {resolvedTheme === "dark" ? (
                <Moon size={18} strokeWidth={3} className="text-[var(--on-primary)]" />
              ) : (
                <Sun size={18} strokeWidth={3} className="text-[var(--on-primary)]" />
              )}
            </motion.button>

            {/* Help Button */}
            <Link href="/help">
              <motion.div
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { if (isSupported) trigger('light'); }}
                className="flex items-center gap-2.5 px-5 py-2.5 border-3 border-[var(--on-background)] neo-title text-sm bg-[var(--tertiary)] text-[var(--on-tertiary)] hover:opacity-90"
                style={{ boxShadow: '4px 4px 0px 0px var(--on-background)' }}
              >
                <Heart size={18} strokeWidth={3} fill="currentColor" />
                <span className="hidden lg:inline">24/7 HELP</span>
                <span className="lg:hidden">HELP</span>
              </motion.div>
            </Link>
            
            {/* User Email - Desktop Only */}
            <span className="neo-mono text-xs text-[var(--on-surface-variant)] hidden xl:block max-w-[160px] truncate">
              {user?.email}
            </span>
            
            {/* Logout Button */}
            <motion.button
              whileHover={{ scale: 1.05, rotate: -2 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => { if (isSupported) trigger('warning'); void logout(); }}
              className="neo-button neo-button-danger flex items-center gap-2.5 text-sm py-2.5 px-5"
            >
              <LogOut size={18} strokeWidth={3} />
              <span className="hidden lg:inline">LOGOUT</span>
            </motion.button>
          </div>
        </div>

        {/* Mobile Navigation - All 5 icons + Help + Logout */}
        <div className="flex md:hidden items-center justify-between py-3 gap-2">
          {/* Left: All 5 nav items as icons */}
          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { if (isSupported) trigger('light'); }}
                    className={`flex items-center justify-center w-11 h-11 border-3 border-[var(--on-background)] ${
                      isActive 
                        ? "bg-[var(--tertiary)] text-[var(--on-tertiary)]" 
                        : "bg-[var(--surface-container-lowest)] text-[var(--on-background)]"
                    }`}
                    style={{ 
                      boxShadow: isActive ? 'none' : '3px 3px 0px 0px var(--on-background)',
                      transform: isActive ? 'translate(-1px, -1px)' : undefined
                    }}
                    title={item.label}
                  >
                    <item.icon size={22} strokeWidth={3} />
                  </motion.div>
                </Link>
              );
            })}
          </div>

          {/* Right: Theme, Help & Logout */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Theme Toggle */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => { if (isSupported) trigger('light'); toggleTheme(); }}
              className="flex items-center justify-center w-11 h-11 border-3 border-[var(--on-background)] bg-[var(--primary)]"
              style={{ boxShadow: '3px 3px 0px 0px var(--on-background)' }}
              title={`Theme: ${resolvedTheme}`}
            >
              {resolvedTheme === "dark" ? (
                <Moon size={22} strokeWidth={3} className="text-[var(--on-primary)]" />
              ) : (
                <Sun size={22} strokeWidth={3} className="text-[var(--on-primary)]" />
              )}
            </motion.button>

            {/* Help Button */}
            <Link href="/help">
              <motion.div
                whileTap={{ scale: 0.95 }}
                onClick={() => { if (isSupported) trigger('light'); }}
                className="flex items-center justify-center w-11 h-11 border-3 border-[var(--on-background)] bg-[var(--tertiary)]"
                style={{ boxShadow: '3px 3px 0px 0px var(--on-background)' }}
                title="24/7 Help"
              >
                <Heart size={22} strokeWidth={3} fill="white" />
              </motion.div>
            </Link>

            {/* Logout Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => { if (isSupported) trigger('warning'); void logout(); }}
              className="flex items-center justify-center w-11 h-11 border-3 border-[var(--on-background)] bg-[var(--tertiary)]"
              style={{ boxShadow: '3px 3px 0px 0px var(--on-background)' }}
              title="Logout"
            >
              <LogOut size={22} strokeWidth={3} className="text-white" />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};
