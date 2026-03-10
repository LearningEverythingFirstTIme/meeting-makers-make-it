"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, DollarSign, BookOpen, LogOut, Search, Heart, ClipboardList, Menu, X } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useState } from "react";

export const Navigation = () => {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Meetings", icon: Home },
    { href: "/find-meetings", label: "Find", icon: Search },
    { href: "/inventory", label: "Inventory", icon: ClipboardList },
    { href: "/treasury", label: "Treasury", icon: DollarSign },
    { href: "/literature", label: "Literature", icon: BookOpen },
  ];

  return (
    <div className="bg-white border-b-4 border-black sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-3 md:px-6 lg:px-8">
        {/* Desktop & Tablet Navigation */}
        <div className="hidden md:flex items-center justify-between py-4">
          {/* Left: Main Nav Items */}
          <div className="flex items-center gap-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center gap-2 px-3 lg:px-4 py-2.5 border-3 border-black neo-title text-xs lg:text-sm transition-colors ${
                      isActive 
                        ? "bg-[var(--butter)] text-black" 
                        : "bg-white text-black hover:bg-[var(--cream)]"
                    }`}
                    style={{ boxShadow: isActive ? 'none' : '4px 4px 0px 0px black' }}
                  >
                    <item.icon size={16} strokeWidth={3} />
                    <span className="hidden lg:inline">{item.label}</span>
                    <span className="lg:hidden">{item.label.slice(0, 3)}</span>
                  </motion.div>
                </Link>
              );
            })}
          </div>
          
          {/* Right: Help, Email, Logout */}
          <div className="flex items-center gap-3">
            {/* Help Button */}
            <Link href="/help">
              <motion.div
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-4 py-2.5 border-3 border-black neo-title text-xs lg:text-sm bg-[var(--coral)] text-black hover:bg-[#FF6B6B]"
                style={{ boxShadow: '4px 4px 0px 0px black' }}
              >
                <Heart size={16} strokeWidth={3} fill="black" />
                <span>24/7 HELP</span>
              </motion.div>
            </Link>
            
            {/* User Email - Desktop Only */}
            <span className="neo-mono text-xs text-black hidden xl:block max-w-[150px] truncate">
              {user?.email}
            </span>
            
            {/* Logout Button */}
            <motion.button
              whileHover={{ scale: 1.05, rotate: -2 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => void logout()}
              className="neo-button neo-button-danger flex items-center gap-2 text-xs py-2.5 px-4"
            >
              <LogOut size={16} strokeWidth={3} />
              <span className="hidden lg:inline">LOGOUT</span>
            </motion.button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center justify-between py-3">
          {/* Mobile: Icon-only nav items (first 3) */}
          <div className="flex items-center gap-2">
            {navItems.slice(0, 3).map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center justify-center w-11 h-11 border-3 border-black ${
                      isActive 
                        ? "bg-[var(--butter)] text-black" 
                        : "bg-white text-black"
                    }`}
                    style={{ boxShadow: isActive ? 'none' : '3px 3px 0px 0px black' }}
                    title={item.label}
                  >
                    <item.icon size={20} strokeWidth={3} />
                  </motion.div>
                </Link>
              );
            })}

            {/* Mobile Menu Toggle */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`flex items-center justify-center w-11 h-11 border-3 border-black ${
                mobileMenuOpen ? "bg-[var(--butter)]" : "bg-white"
              }`}
              style={{ boxShadow: mobileMenuOpen ? 'none' : '3px 3px 0px 0px black' }}
            >
              {mobileMenuOpen ? <X size={20} strokeWidth={3} /> : <Menu size={20} strokeWidth={3} />}
            </motion.button>
          </div>

          {/* Mobile Right: Help & Logout */}
          <div className="flex items-center gap-2">
            {/* Help Button - Icon Only */}
            <Link href="/help">
              <motion.div
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center w-11 h-11 border-3 border-black bg-[var(--coral)]"
                style={{ boxShadow: '3px 3px 0px 0px black' }}
                title="24/7 Help"
              >
                <Heart size={20} strokeWidth={3} fill="black" />
              </motion.div>
            </Link>

            {/* Logout Button - Icon Only */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => void logout()}
              className="flex items-center justify-center w-11 h-11 border-3 border-black bg-[var(--coral)]"
              style={{ boxShadow: '3px 3px 0px 0px black' }}
              title="Logout"
            >
              <LogOut size={20} strokeWidth={3} />
            </motion.button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t-4 border-black"
          >
            <div className="py-3 px-1 space-y-2">
              {/* Remaining nav items (Inventory, Treasury, Literature) */}
              {navItems.slice(3).map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <motion.div
                      whileTap={{ scale: 0.98 }}
                      className={`flex items-center gap-3 px-4 py-3 border-3 border-black neo-title text-sm ${
                        isActive 
                          ? "bg-[var(--butter)] text-black" 
                          : "bg-white text-black"
                      }`}
                      style={{ boxShadow: '3px 3px 0px 0px black' }}
                    >
                      <item.icon size={20} strokeWidth={3} />
                      {item.label}
                    </motion.div>
                  </Link>
                );
              })}

              {/* User Email in Mobile Menu */}
              <div className="px-4 py-2 neo-mono text-xs text-black/60 truncate">
                {user?.email}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
