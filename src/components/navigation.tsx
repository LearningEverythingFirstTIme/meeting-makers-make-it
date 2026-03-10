"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, DollarSign, BookOpen, LogOut, Search } from "lucide-react";
import { useAuth } from "@/components/auth-provider";

export const Navigation = () => {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  const navItems = [
    { href: "/", label: "Meetings", icon: Home },
    { href: "/find-meetings", label: "Find", icon: Search },
    { href: "/treasury", label: "Treasury", icon: DollarSign },
    { href: "/literature", label: "Literature", icon: BookOpen },
  ];

  return (
    <div className="bg-white border-b-4 border-black">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center gap-2 px-4 py-2 border-3 border-black font-['Archivo_Black'] uppercase text-sm transition-colors ${
                      isActive 
                        ? "bg-[var(--butter)] text-black" 
                        : "bg-white text-black hover:bg-[var(--cream)]"
                    }`}
                    style={{ boxShadow: isActive ? 'none' : '3px 3px 0px 0px black' }}
                  >
                    <item.icon size={14} strokeWidth={3} />
                    {item.label}
                  </motion.div>
                </Link>
              );
            })}
          </div>
          
          <div className="flex items-center gap-4">
            <span className="neo-mono text-xs text-black hidden md:block">
              {user?.email}
            </span>
            <motion.button
              whileHover={{ scale: 1.05, rotate: -2 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => void logout()}
              className="neo-button neo-button-danger flex items-center gap-2 text-xs"
            >
              <LogOut size={14} strokeWidth={3} /> LOGOUT
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};
