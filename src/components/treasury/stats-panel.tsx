"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  Star,
  Hash,
} from "lucide-react";
import { groupByMonth, formatCurrency, calculateSummary } from "@/lib/treasury-utils";
import type { TreasuryTransaction } from "@/types";

interface StatsPanelProps {
  transactions: TreasuryTransaction[];
}

interface Stat {
  label: string;
  value: string;
  sub?: string;
  accent: string;
  icon: React.ReactNode;
}

function computeStats(transactions: TreasuryTransaction[]) {
  if (transactions.length === 0) return null;

  const byMonth = groupByMonth(transactions);
  const months = Object.keys(byMonth).sort();
  const monthCount = months.length;

  let totalMonthlyContributions = 0;
  let totalMonthlyExpenses = 0;
  let bestNet = -Infinity;
  let bestMonth = "";

  for (const [month, txns] of Object.entries(byMonth)) {
    const contribs = txns
      .filter((t) => t.type === "contribution")
      .reduce((s, t) => s + Number(t.amount), 0);
    const expenses = txns
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + Number(t.amount), 0);
    totalMonthlyContributions += contribs;
    totalMonthlyExpenses += expenses;
    const net = contribs - expenses;
    if (net > bestNet) {
      bestNet = net;
      bestMonth = month;
    }
  }

  const avgMonthlyIncome = totalMonthlyContributions / monthCount;
  const avgMonthlyExpenses = totalMonthlyExpenses / monthCount;
  const avgMonthlyNet = avgMonthlyIncome - avgMonthlyExpenses;

  let bestMonthLabel = "—";
  if (bestMonth) {
    const [year, month] = bestMonth.split("-");
    const date = new Date(Number(year), Number(month) - 1);
    bestMonthLabel = date
      .toLocaleDateString("en-US", { month: "short", year: "numeric" })
      .toUpperCase();
  }

  const summary = calculateSummary(transactions);

  return {
    avgMonthlyIncome,
    avgMonthlyExpenses,
    avgMonthlyNet,
    monthCount,
    bestMonthLabel,
    bestMonthNet: bestNet === -Infinity ? 0 : bestNet,
    transactionCount: summary.transactionCount,
  };
}

export const StatsPanel = ({ transactions }: StatsPanelProps) => {
  const stats = useMemo(() => computeStats(transactions), [transactions]);

  if (!stats) return null;

  const netIsPositive = stats.avgMonthlyNet >= 0;

  const statTiles: Stat[] = [
    {
      label: "AVG MONTHLY INCOME",
      value: formatCurrency(stats.avgMonthlyIncome),
      accent: "var(--mint)",
      icon: <TrendingUp size={18} strokeWidth={3} />,
    },
    {
      label: "AVG MONTHLY SPEND",
      value: formatCurrency(stats.avgMonthlyExpenses),
      accent: "var(--coral)",
      icon: <TrendingDown size={18} strokeWidth={3} />,
    },
    {
      label: "AVG MONTHLY NET",
      value: formatCurrency(stats.avgMonthlyNet),
      accent: netIsPositive ? "var(--mint)" : "var(--coral)",
      icon: <Activity size={18} strokeWidth={3} />,
    },
    {
      label: "MONTHS TRACKED",
      value: String(stats.monthCount),
      accent: "var(--butter)",
      icon: <Calendar size={18} strokeWidth={3} />,
    },
    {
      label: "BEST MONTH",
      value: formatCurrency(stats.bestMonthNet),
      sub: stats.bestMonthLabel,
      accent: "var(--sky)",
      icon: <Star size={18} strokeWidth={3} />,
    },
    {
      label: "TOTAL TRANSACTIONS",
      value: String(stats.transactionCount),
      accent: "var(--lavender)",
      icon: <Hash size={18} strokeWidth={3} />,
    },
  ];

  return (
    <div className="neo-card p-6">
      <div className="flex items-center gap-2 mb-5 pb-3 border-b-4 border-black">
        <span className="neo-title text-sm" style={{ color: "var(--butter)" }}>►</span>
        <span className="neo-title text-sm">GROUP STATISTICS</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {statTiles.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="border-3 border-black p-3 flex flex-col gap-1"
            style={{
              backgroundColor: `color-mix(in srgb, ${stat.accent} 12%, white)`,
              boxShadow: "4px 4px 0px 0px black",
            }}
          >
            <div className="flex items-center gap-1.5 mb-1" style={{ color: stat.accent }}>
              {stat.icon}
              <span className="neo-label text-[9px] leading-tight" style={{ color: "var(--black)" }}>
                {stat.label}
              </span>
            </div>
            <span className="neo-title text-lg leading-none" style={{ color: stat.accent }}>
              {stat.value}
            </span>
            {stat.sub && (
              <span className="neo-mono text-[9px]" style={{ color: "var(--black)", opacity: 0.6 }}>
                {stat.sub}
              </span>
            )}
          </motion.div>
        ))}
      </div>

      <p className="neo-mono text-[9px] text-center mt-4" style={{ opacity: 0.45 }}>
        AVERAGES BASED ON {stats.monthCount} MONTH{stats.monthCount !== 1 ? "S" : ""} OF DATA
      </p>
    </div>
  );
};
