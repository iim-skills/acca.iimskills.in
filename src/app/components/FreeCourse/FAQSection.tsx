"use client";

import React, { useState } from "react";
import { Plus, Minus, HelpCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

/* ------------------------------ */
/* MOCK DATA (Replica of external data) */
/* ------------------------------ */
type FAQ = {
  question: string;
  answer: string;
};

// We define the data once
const defaultFaqs: FAQ[] = [
  {
    question: "Is this data analytics course really free?",
    answer: "Yes, this course is completely free of charge. Our mission is to make quality education accessible to everyone. You get full access to the pre-recorded modules and materials without any hidden fees."
  },
  {
    question: "Do I get a certificate after completion?",
    answer: "Absolutely! Upon successful completion of all modules and the final assessment, you will receive a globally recognized certificate from IIM SKILLS that you can share on your LinkedIn profile."
  },
  {
    question: "What tools will I learn in this course?",
    answer: "You will master essential tools like <strong class='text-blue-600'>Microsoft Excel</strong> (Basic to Advanced), learn the fundamentals of SQL, and get an introduction to Python for data analysis."
  },
  {
    question: "Is this course suitable for beginners?",
    answer: "Yes, this course is designed specifically for beginners. No prior coding or analytics knowledge is required. We start from the very basics and gradually move to advanced concepts."
  },
  {
    question: "How long does it take to complete?",
    answer: "The course is self-paced. Most learners complete it within 2-4 weeks by dedicating 3-5 hours per week. However, you have lifetime access to the content."
  },
  {
    question: "Will I get placement support?",
    answer: "While this is a free foundation course, we provide guidance on resume building and interview preparation. For dedicated placement assurance, you can check our comprehensive master programs."
  }
];

// Map multiple keys to the same data to prevent empty states
const courseFaqs: Record<string, FAQ[]> = {
  "free-data-analytics": defaultFaqs,
  "FDAMC": defaultFaqs,
  "DACB": defaultFaqs,
  "default": defaultFaqs
};

/* ------------------------------ */
/* COMPONENT PROPS                */
/* ------------------------------ */
type FAQSectionProps = {
  courseId?: string; 
};

export default function FAQSection({ courseId = "free-data-analytics" }: FAQSectionProps) {
  // Robust fallback: try specific ID -> try default key -> use default array
  const faqs: FAQ[] = courseFaqs[courseId] || courseFaqs["free-data-analytics"] || defaultFaqs;

  const mid = Math.ceil(faqs.length / 2);
  const firstHalf = faqs.slice(0, mid);
  const secondHalf = faqs.slice(mid);

  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const toggleAccordion = (index: string) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-16 md:py-24 bg-slate-50 relative overflow-hidden font-sans">
      {/* Decorative Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-full opacity-30 pointer-events-none">
          <div className="absolute top-20 left-0 w-72 h-72 bg-blue-100 rounded-full blur-3xl mix-blend-multiply"></div>
          <div className="absolute bottom-20 right-0 w-72 h-72 bg-indigo-100 rounded-full blur-3xl mix-blend-multiply"></div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-4">
            <HelpCircle size={14} /> Support
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
            Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Questions</span>
          </h2>
          <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
            Have questions? We've got answers. If you don't see what you're looking for, feel free to reach out to our support team.
          </p>
        </div>

        {/* FAQ Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {[firstHalf, secondHalf].map((group, colIndex) => (
            <div key={colIndex} className="space-y-4">
              {group.map((faq, i) => {
                const uniqueId = `col-${colIndex}-item-${i}`;
                const isOpen = openIndex === uniqueId;

                return (
                  <div 
                    key={i}
                    className={`
                      bg-white rounded-2xl border transition-all duration-300
                      ${isOpen 
                        ? 'border-blue-200 shadow-lg shadow-blue-500/5' 
                        : 'border-slate-100 shadow-sm hover:border-blue-100 hover:shadow-md'
                      }
                    `}
                  >
                    <button
                      onClick={() => toggleAccordion(uniqueId)}
                      className="w-full flex items-start justify-between p-5 text-left"
                    >
                      <span className={`font-bold text-base md:text-lg pr-4 transition-colors ${isOpen ? 'text-blue-700' : 'text-slate-800'}`}>
                        {faq.question}
                      </span>
                      <span className={`
                        shrink-0 w-6 h-6 rounded-full flex items-center justify-center border transition-all duration-300
                        ${isOpen 
                          ? 'bg-blue-600 border-blue-600 text-white rotate-180' 
                          : 'bg-slate-50 border-slate-200 text-slate-400 group-hover:border-blue-200'
                        }
                      `}>
                        {isOpen ? <Minus size={14} /> : <Plus size={14} />}
                      </span>
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 text-slate-600 text-sm leading-relaxed border-t border-dashed border-slate-100 pt-3">
                            <div dangerouslySetInnerHTML={{ __html: faq.answer }} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}