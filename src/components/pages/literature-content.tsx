"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { literatureData, categories, type LiteratureItem } from "@/lib/literature-data";
import { Navigation } from "@/components/navigation";
import { DailyReflection } from "@/components/daily-reflection";

function LiteratureCard({ item }: { item: LiteratureItem }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const category = categories.find(c => c.id === item.category);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="neo-card overflow-hidden"
      style={{ 
        borderLeft: `6px solid ${category?.color || "var(--butter)"}` 
      }}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-center justify-between text-left hover:bg-[var(--cream)]/30 transition-colors"
      >
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span 
              className="neo-badge text-xs"
              style={{ backgroundColor: category?.color || "var(--butter)" }}
            >
              {category?.label.toUpperCase()}
            </span>
            {item.source && (
              <span className="neo-mono text-xs text-[var(--black)]/50">
                {item.source}
              </span>
            )}
          </div>
          <h3 className="neo-title text-xl text-[var(--black)]">{item.title}</h3>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 ml-4"
        >
          {isExpanded ? (
            <ChevronUp size={24} strokeWidth={3} className="text-[var(--black)]" />
          ) : (
            <ChevronDown size={24} strokeWidth={3} className="text-[var(--black)]" />
          )}
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-2 border-t-3 border-black/10">
              <div className="prose prose-lg max-w-none">
                {item.content.map((paragraph, index) => (
                  <p 
                    key={index} 
                    className={`text-[var(--black)] leading-relaxed ${
                      paragraph === "" 
                        ? "h-4" 
                        : paragraph.startsWith("STEP") || paragraph.startsWith("FROM PAGE")
                        ? "neo-title text-lg mt-6 mb-2 text-[var(--black)]/80"
                        : "mb-4"
                    }`}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CategoryFilter({ 
  activeCategory, 
  onCategoryChange 
}: { 
  activeCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-8">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onCategoryChange(null)}
        className={`neo-button text-sm ${
          activeCategory === null 
            ? "bg-[var(--butter)]" 
            : "bg-[var(--white)]"
        }`}
      >
        ALL
      </motion.button>
      {categories.map((category) => (
        <motion.button
          key={category.id}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onCategoryChange(category.id)}
          className={`neo-button text-sm transition-colors`}
          style={{
            backgroundColor: activeCategory === category.id 
              ? category.color 
              : "white"
          }}
        >
          {category.label.toUpperCase()}
        </motion.button>
      ))}
    </div>
  );
}

export function LiteratureContent() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredLiterature = activeCategory 
    ? literatureData.filter(item => item.category === activeCategory)
    : literatureData;

  // Group by category when showing all
  const groupedByCategory = activeCategory 
    ? null 
    : categories.map(cat => ({
        ...cat,
        items: literatureData.filter(item => item.category === cat.id)
      })).filter(group => group.items.length > 0);

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div 
              className="p-3 border-4 border-black"
              style={{ backgroundColor: "var(--periwinkle)" }}
            >
              <BookOpen size={32} strokeWidth={3} className="text-[var(--black)]" />
            </div>
            <div>
              <h1 className="neo-title text-3xl md:text-4xl text-[var(--black)]">
                LITERATURE
              </h1>
              <p className="neo-mono text-sm text-[var(--black)]/60">
                AA READINGS, PRAYERS & PROMISES
              </p>
            </div>
          </div>
        </motion.div>

        {/* Daily Reflection - Featured at top */}
        <DailyReflection />

        {/* Category Filter */}
        <CategoryFilter 
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        {/* Literature List */}
        <div className="space-y-4">
          {activeCategory ? (
            // Filtered view - flat list
            filteredLiterature.map((item) => (
              <LiteratureCard key={item.id} item={item} />
            ))
          ) : (
            // All view - grouped by category
            groupedByCategory?.map((group) => (
              <div key={group.id} className="mb-8">
                <div 
                  className="flex items-center gap-2 mb-4 pb-2 border-b-4 border-black"
                  style={{ borderColor: group.color }}
                >
                  <div 
                    className="w-4 h-4 border-3 border-black"
                    style={{ backgroundColor: group.color }}
                  />
                  <h2 className="neo-title text-xl text-[var(--black)]">
                    {group.label.toUpperCase()}
                  </h2>
                </div>
                <div className="space-y-4">
                  {group.items.map((item) => (
                    <LiteratureCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Empty State */}
        {filteredLiterature.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <p className="neo-mono text-[var(--black)]/50">
              No literature found in this category.
            </p>
          </motion.div>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 pt-8 border-t-4 border-black/10 text-center"
        >
          <p className="neo-mono text-xs text-[var(--black)]/40">
            &ldquo;Rarely have we seen a person fail who has thoroughly followed our path.&rdquo;
          </p>
          <p className="neo-mono text-xs text-[var(--black)]/30 mt-2">
            — Alcoholics Anonymous, Page 58
          </p>
        </motion.div>
      </main>
    </div>
  );
}
