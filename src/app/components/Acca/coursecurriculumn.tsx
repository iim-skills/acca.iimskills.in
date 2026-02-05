"use client";

import React, { useState } from "react";
import MultiModalPopup, { ModalKey } from "@/components/props/MultiModalPopup";
import { 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Star, 
  Award, 
  BookOpen, 
  Target, 
  Trophy, 
  ChevronRight,
  Mail,
  User,
  Phone,
  FileText,
  Users,
  Clock,
  Download
} from "lucide-react";

// --- Types ---
interface Module {
  title: string;
  code: string;
  desc: string;
  topics: string[];
}

interface Level {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  icon: React.ReactNode;
  modules: Module[];
}

type LevelKey = "knowledge" | "skills" | "strategic";

// --- Syllabus Data ---
const curriculumData: Record<LevelKey, Level> = {
  knowledge: {
    id: "knowledge",
    title: "Applied Knowledge",
    subtitle: "Foundational mastery of business and accounting.",
    color: "blue",
    icon: <BookOpen className="w-5 h-5" />,
    modules: [
      {
        title: "Business & Technology",
        code: "BT",
        desc: "Master stakeholder management, business and organisational structure, governance, risk & control, leadership, and ethics.",
        topics: [
          "Stakeholders",
          "External Environmental Factors",
          "Business Organizational Structures and Functions",
          "Corporate Governance and Business Practices",
          "Accounting and Finance functions & accounting regulations",
          "Financial information, systems, and internal controls.",
          "IT Sector, Fraud & Money Laundering",
          "Leadership & Management",
          "Ethics & Professionalism"
        ]
      },
      {
        title: "Financial Accounting",
        code: "FA",
        desc: "Learn about double-entry bookkeeping, financial statements preparation, interpretation & analysis, and IFRS basics.",
        topics: [
          "Financial Statements and Double-Entry Bookkeeping",
          "Business transactions, Sales Tax, Receivables & Payables",
          "IAS 37 Provisions, Contingent Liabilities and Contingent Assets",
          "IAS 2 Inventories, IAS 16 Property, Plant and Equipment",
          "Accruals, Prepayments, Accrued and Deferred Income",
          "IAS 10 Events After the Reporting Period",
          "Capital Structure and Finance Costs",
          "Trial Balance and Incomplete Records",
          "Financial Statements Preparation and Interpretation",
          "IAS 7 Statement of Cash Flows",
          "Consolidated Financial Statements",
          "Regulatory and Conceptual Framework"
        ]
      },
      {
        title: "Management Accounting",
        code: "MA",
        desc: "Understand management information, costing, time series analysis, budgeting, data analysis, variance analysis, performance management, and analysis.",
        topics: [
          "Management Information, Labour & Overheads",
          "Absorption and Marginal Costing",
          "Process Costing, Joint Products and Further Processing",
          "Cost Classification and Alternative Cost Accounting Methods",
          "Sampling Techniques and Expected Values",
          "Forecasting Costs and Revenues",
          "Time Series Analysis",
          "Compounding and Discounting, Investment Appraisal",
          "Budgeting and Reporting",
          "Summarising and Analysing Data",
          "Standard Costing and Variance Analysis",
          "Performance management and analysis",
          "Monitoring Performance, Cost Reductions, and Value Enhancement"
        ]
      }
    ]
  },

  skills: {
    id: "skills",
    title: "Applied Skills",
    subtitle: "Practical finance skills for the professional workplace.",
    color: "indigo",
    icon: <Target className="w-5 h-5" />,
    modules: [
      {
        title: "Corporate & Business Law (Global)",
        code: "LW",
        desc: "Learn about partnerships, legal systems, business law, contracts, employment, and professional law.",
        topics: [
          "Partnerships",
          "Corporations and Legal Personality",
          "Company Formation, Memorandum and Articles",
          "Capital Maintenance and Dividends",
          "Share Capital and Loan Capital",
          "Company Directors and other officers",
          "Company Meetings and Resolutions",
          "Insolvency and Administration",
          "Fraudulent and Criminal Behaviour",
          "Legal Systems, Dispute Resolution Mechanisms",
          "CISG",
          "Transportation Documents and Means of Payment"
        ]
      },
      {
        title: "Performance Management",
        code: "PM",
        desc: "Gain knowledge of cost & management accounting, budgeting, analytical techniques, planning, performance management, and analysis.",
        topics: [
          "Cost and Management Accounting",
          "Cost-Volume-Profit analysis",
          "Limiting Factor Decisions",
          "Pricing, Risk, and Uncertainty",
          "Budgetary Systems and Types of Budget",
          "Analytical Techniques",
          "Standard Costing",
          "Basic & Advanced Variance Analysis",
          "Planning and Operational Variances",
          "Performance management, analysis, and evaluation"
        ]
      },
      {
        title: "Taxation",
        code: "TX",
        desc: "Understand income tax computations, corporation, inheritance & value-added tax.",
        topics: [
          "Income Tax Computations",
          "Property and Investment Income & Employment Income",
          "Benefits and the PAYE System",
          "Unincorporated Traders",
          "Capital Allowances",
          "Partnerships & National Insurance",
          "Income Tax Administration",
          "Chargeable Gains",
          "Corporation Tax, Inheritance Tax, and Value Added Tax"
        ]
      },
      {
        title: "Financial Reporting",
        code: "FR",
        desc: "Learn about IFRS application, financial instruments, consolidated statement & adjustments, and financial reporting.",
        topics: [
          "Inventories and Agriculture",
          "IAS 16 Property, Plant and Equipment",
          "IAS 23 Borrowing Costs & IAS 20 Government Grants",
          "IAS 40 Investment Property",
          "IFRS 5 Non-current Assets Held for Sale and Discontinued Operations",
          "IAS 36 Impairment of Assets",
          "IAS 38 Intangible Assets",
          "IAS 37 Provisions, Contingent Liabilities and Contingent Assets",
          "IAS 12 Income Taxes",
          "IAS 10 Events after the Reporting Period & Foreign Currency Transactions",
          "IFRS 16 Leases",
          "Financial Instruments",
          "IAS 33 Earnings per Share & Conceptual Principles of Groups",
          "Consolidated Statement and Adjustments",
          "Analysis and Interpretation",
          "IAS 7 Statement of Cash Flows",
          "Financial reporting and Financial statement preparation"
        ]
      },
      {
        title: "Audit & Assurance",
        code: "AA",
        desc: "Understand Audit planning, risk assessment, documentation, law & regulations, and internal control.",
        topics: [
          "External Audit & Corporate Governance",
          "Auditor Appointment & Audit Documentation",
          "Audit Planning, Risk Assessment, and System of Internal Control",
          "Audit Materiality & Fraud, Law and Regulations",
          "Tests of Control",
          "Audit Evidence & Analytical Procedures",
          "Audit Sampling & Written Representations",
          "Automated Tools and Techniques & Non-current Assets",
          "Inventory & External Confirmations, Receivables and Sales",
          "Share Capital, Reserves and Directors' Remuneration & Bank and Cash",
          "Liabilities, Provisions and Contingencies & Small Business and Not-for-Profit Organisations",
          "Audit Finalisation & The Independent Auditor's Report"
        ]
      },
      {
        title: "Financial Management",
        code: "FM",
        desc: "Learn about DCF methods, investment & financial decisions, working capital, business valuation, and risk management.",
        topics: [
          "Discounted Cash Flow Methods",
          "Relevant Cash Flows",
          "Applications of Discounted Cash Flow Techniques",
          "Equity Finance, Debt Finance, and Cost of Capital",
          "Weighted Average Cost of Capital and Gearing",
          "Capital Asset Pricing Model",
          "Working Capital, Inventory, and Cash Management",
          "Risk Management and Business Valuation",
          "Ratio Analysis & The Financial Management Function"
        ]
      }
    ]
  },

  strategic: {
    id: "strategic",
    title: "Strategic Professional Level",
    subtitle: "Executive leadership and specialized technical expertise.",
    color: "indigo",
    icon: <Trophy className="w-5 h-5" />,
    modules: [
      {
        title: "Strategic Business Leadership",
        code: "SBL",
        desc: "Build understanding of Leadership management, strategy, technology, finance, reporting, and governance.",
        topics: [
          "Leadership and Management",
          "Agency and Stakeholders & Governance Scope and Approaches",
          "Corporate Reporting",
          "The Board of Directors, Committees, and Remuneration",
          "Public Sector Governance",
          "Strategy and Environmental Issues",
          "Competitive Forces & Internal Resources",
          "Capabilities and Competences",
          "Corporate and Risk Strategy",
          "Risk Measurement, Assessment, and Management",
          "Technology and Data Analytics",
          "E-business, E-marketing, and IT Controls",
          "Internal Control Systems & Audit and Internal Control",
          "Finance and Strategy & Financial Analysis and Decision-making",
          "Budgeting, Forecasting, and Control"
        ]
      },
      {
        title: "Strategic Business Reporting",
        code: "SBR",
        desc: "Understand advanced IFRS, group financial statements, reporting, changes in shareholdings, and non-current assets.",
        topics: [
          "IFRS Accounting Standards and the IFRS for SMEs Accounting Standard & Conceptual Framework",
          "Financial Performance Reporting",
          "Basis of Preparation of Financial Statements",
          "Non-current Assets",
          "IAS 36 Impairment of Assets",
          "Financial Instruments",
          "IFRS 16 Leases",
          "IAS 19 Employee Benefits",
          "IAS 12 Income Taxes",
          "Provisions, Contingencies, and Events after the Reporting Period",
          "IFRS 2 Share-based Payment",
          "Group Accounting Principles",
          "Changes in Shareholdings",
          "Associates and Joint Arrangements",
          "Foreign Currency Transactions",
          "IAS 7 Statement of Cash Flows",
          "Analysis, Interpretation, and Sustainability Reporting"
        ]
      },
      {
        title: "Advanced Financial Management",
        code: "AFM",
        desc: "Learn about investment appraisal, business valuation, M&A, corporate reconstruction, and risk management.",
        topics: [
          "Basic and Advanced Investment Appraisal",
          "Security Valuation and Capital Cost",
          "Weighted Average Cost of Capital and Gearing",
          "CAPM and Betas",
          "Business Valuation, Mergers and Acquisitions",
          "Corporate Reconstruction and Re-organisation",
          "Equity Issues & Debt Issues",
          "Dividend Policy",
          "Foreign Exchange and Interest Rate Risk Management",
          "International Operations",
          "Financial Statement Analysis"
        ]
      },
      {
        title: "Advanced Performance Management",
        code: "APM",
        desc: "Gain knowledge of risk & uncertainty, performance management and evaluation, strategic planning, and business structure.",
        topics: [
          "Risk and Uncertainty",
          "Performance Management and Control",
          "Business Structure",
          "Environmental, Social, and Governance Factors",
          "Performance Management Information Systems",
          "Recording and Processing Systems and Technologies",
          "Strategic Performance Measures in the Private Sector",
          "Divisional Performance Evaluation",
          "Transfer Pricing",
          "Non-financial Performance Indicators and Quality"
        ]
      },
      {
        title: "Advance Taxation",
        code: "ATX",
        desc: "Learn about income tax, capital gain tax, personal finance & tax planning, inheritance & value-added tax, ethics, and professional skills.",
        topics: [
          "Income Tax Computations",
          "Property Income & Pension and Investment Income",
          "Employment Income",
          "Unincorporated Businesses",
          "Capital Gains Tax",
          "Overseas Aspects for Individuals – Income Tax and Capital Gains Tax",
          "Personal Finance and Tax Planning",
          "Corporation Tax",
          "Family Companies and Owner-Managed Businesses",
          "Businesses Tax Planning and Business Finance",
          "Inheritance Tax and Value-added Tax",
          "Ethics and Professional Skills"
        ]
      },
      {
        title: "Advanced Audit & Assurance",
        code: "AAA",
        desc: "Understand money laundering, planning and conducting audits, group audits, completion, and review.",
        topics: [
          "Money Laundering",
          "Code of Ethics for Professional Accountants",
          "Quality Management",
          "Planning, Materiality, and Risk",
          "Evidence and Testing",
          "Group Audits",
          "Completion and Review",
          "Auditor's Reports",
          "Financial Information & Forensic Audits",
          "Sustainability Information & Audit in the Public Sector",
          "Current Issues and Developments"
        ]
      }
    ]
  }
};

const styles = `
  @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
  .no-scrollbar::-webkit-scrollbar { display: none; }
`;

/**
 * Changes made for responsive behaviour:
 * - Desktop (lg and up): unchanged; main modules area uses the center column.
 * - Mobile (< lg): each level button becomes an accordion; modules for that level render directly underneath the level button.
 * - Module expansion on mobile is local to that level (selectedModuleMobile state).
 */

export default function App() {
  const [activeLevel, setActiveLevel] = useState<LevelKey>("knowledge");
  // desktop-selected module (keeps previous behaviour)
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [activeModal, setActiveModalState] = useState<ModalKey | null>(null);
    const [customTitle, setCustomTitle] = useState<string | undefined>();
    const [customDescription, setCustomDescription] = useState<string | undefined>();

  // mobile: which level accordions are open (keys: knowledge|skills|strategic)
  const [expandedLevels, setExpandedLevels] = useState<Record<LevelKey, boolean>>({
    knowledge: false,
    skills: false,
    strategic: false,
  });

  // mobile: which module is opened under each level (per-level selection)
  const [selectedModuleMobile, setSelectedModuleMobile] = useState<Record<LevelKey, number | null>>({
    knowledge: null,
    skills: null,
    strategic: null,
  });

  const currentLevel = curriculumData[activeLevel];

  // helper to detect desktop at click time (safe because this is a client component)
  const isDesktop = () => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;

  // Handle level click - behaves differently on desktop vs mobile
  const handleLevelClick = (levelId: LevelKey) => {
    if (isDesktop()) {
      // Desktop: original behaviour — select level and reset the module expansion
      setActiveLevel(levelId);
      setSelectedModule(null);
    } else {
      // Mobile: toggle accordion for this level (do NOT affect other level's expanded state)
      setExpandedLevels((prev) => ({ ...prev, [levelId]: !prev[levelId] }));
      // Optional UX: when opening a different level, collapse module view of others
      // (comment/uncomment depending on desired UX)
      // setSelectedModuleMobile({ knowledge: null, skills: null, strategic: null });
    }
  };

  // Handle module click — different states for desktop vs mobile
  const handleModuleClick = (levelId: LevelKey, idx: number) => {
    if (isDesktop()) {
      setSelectedModule((prev) => (prev === idx ? null : idx));
    } else {
      setSelectedModuleMobile((prev) => ({ ...prev, [levelId]: prev[levelId] === idx ? null : idx }));
    }
  };

  return (
    <div id="course-curriculumn" className="font-sans text-slate-900 bg-slate-50 md-10 md:pb-20">
      <style>{styles}</style>

      {/* Hero Banner (Compact) */}
      <div className="max-w-6xl mx-auto px-4 pt-10 md:pt-16 pb-8 text-center">
        <h2 className="text-orange-600 font-bold tracking-widest text-sm uppercase mb-3">Gold Learning Partner</h2>

        <div className="relative inline-block">
          <h2 className="text-2xl md:text-5xl font-bold text-gray-900 mb-4 relative z-10">
            ACCA <span className="text-blue-700">Syllabus Guide</span>
          </h2>
        </div>

        <p className="max-w-6xl mx-auto text-gray-600 text-[15px] md:text-lg leading-relaxed md-6 md:mb-12">
          The ACCA Course Syllabus is designed by experts to ensure it covers every crucial detail of the qualification.
        </p>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Sidebar: Level Navigation */}
        <aside className="lg:col-span-5">
          <div className="space-y-4">
            <p className="text-[15px] font-bold text-gray-800 uppercase tracking-widest ml-4">Learning Path</p>

            <nav className="space-y-6">
              {(Object.values(curriculumData) as Level[]).map((level) => (
                <div key={level.id} className="w-full">
                  <button
                    onClick={() => handleLevelClick(level.id as LevelKey)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                      activeLevel === level.id && isDesktop()
                        ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200"
                        : "bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:text-blue-600"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${activeLevel === level.id && isDesktop() ? "bg-white/20" : "bg-slate-50 group-hover:bg-blue-50"}`}>
                      {level.icon}
                    </div>
                    <div className="text-left">
                      <p className="text-base md:text-2xl font-bold leading-tight">{level.title}</p>
                      <p className={`text-[14px] ${activeLevel === level.id && isDesktop() ? "text-blue-100" : "text-slate-400"}`}>
                        Stage {level.id === "knowledge" ? "1" : level.id === "skills" ? "2" : "3"}
                      </p>
                    </div>
                    {/* Mobile caret */}
                    <div className="ml-auto lg:hidden">
                      <ChevronRight
                        className={`w-4 h-4 text-slate-400 transform transition-transform ${
                          expandedLevels[level.id as LevelKey] ? "rotate-90 text-blue-600" : ""
                        }`}
                      />
                    </div>
                  </button>

                  {/* ===== MOBILE: modules inline under the tab (visible on < lg only) ===== */}
                  <div className={`mt-3 space-y-6 px-2 lg:hidden ${expandedLevels[level.id as LevelKey] ? "" : "hidden"}`}>
                    {level.modules.map((m, idx) => {
                      const mobileOpen = selectedModuleMobile[level.id as LevelKey] === idx;
                      return (
                        <div
                          key={idx}
                          onClick={() => handleModuleClick(level.id as LevelKey, idx)}
                          className={`group bg-white border rounded-2xl p-4 cursor-pointer transition-all ${
                            mobileOpen ? "ring-2 ring-blue-500 border-transparent shadow-md" : "border-slate-200 hover:border-blue-300"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center font-bold text-blue-600 text-xs">
                                {m.code}
                              </div>
                              <div>
                                <h4 className="font-bold text-sm md:text-xl text-slate-800 group-hover:text-blue-600 transition-colors">{m.title}</h4>
                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{m.desc}</p>
                              </div>
                            </div>
                            <ChevronRight className={`w-4 h-4 text-slate-300 transition-transform ${mobileOpen ? "rotate-90 text-blue-500" : ""}`} />
                          </div>

                          {mobileOpen && (
                            <div className="mt-4 border-t border-slate-100 pt-4 animate-fade-in">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Core Technical Topics</p>
                              <div className="grid grid-cols-1 gap-2">
                                {m.topics.map((topic, i) => (
                                  <div key={i} className="flex items-center gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                                    <span className="text-xs text-slate-600 font-medium">{topic}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Checkout card (kept but on mobile will appear under nav as usual) */}
            <div className="p-6 bg-indigo-600 rounded-3xl mt-8 text-white space-y-4 relative overflow-hidden hidden lg:block">
              <Trophy className="absolute -bottom-4 -right-4 w-24 h-24 opacity-10" />
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-200">Checkout</p>
              <h4 className="text-xl font-bold leading-tight">Download Full Syllabus Brochure</h4>
              <button
                            onClick={() => {
                              // kept modal key as "FM" to preserve existing modal wiring in the app
                              setActiveModalState("ACCA");
                              setCustomTitle("Download Full Syllabus Brochure");
                              setCustomDescription("Start your ACCA journey with expert coaching and global placement support.");
                            }}
                            className="w-full bg-white text-blue-600 px-6 py-2.5 md:px-8 md:py-3 rounded-lg md:rounded-xl font-black text-sm md:text-base shadow-lg hover:bg-blue-50 transition-all uppercase tracking-wider flex items-center justify-center gap-2"
                          >
                            Download Now
                            <Download className="w-4 h-4" />
                          </button>
            </div>
          </div>
        </aside>

        {/* Center: Module List Area (DESKTOP ONLY - unchanged) */}
        <div className="lg:col-span-7 space-y-6 hidden lg:block">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800">{currentLevel.title}</h2>
            <p className="text-sm text-slate-500 mt-1">{currentLevel.subtitle}</p>
          </div>

          <div className="space-y-4">
            {currentLevel.modules.map((m: Module, idx: number) => (
              <div
                key={idx}
                onClick={() => setSelectedModule(selectedModule === idx ? null : idx)}
                className={`group bg-white border rounded-2xl p-6 cursor-pointer transition-all ${
                  selectedModule === idx ? "ring-2 ring-blue-500 border-transparent shadow-xl" : "border-slate-200 hover:border-blue-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-blue-600 text-xs">
                      {m.code}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{m.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{m.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-slate-300 transition-transform ${selectedModule === idx ? "rotate-90 text-blue-500" : ""}`} />
                </div>

                {selectedModule === idx && (
                  <div className="mt-6 border-t border-slate-100 pt-6 animate-fade-in">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Core Technical Topics</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {m.topics.map((topic: string, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                          <span className="text-xs text-slate-600 font-medium">{topic}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right-side learning outcome card for desktop (keeps original but moved under center on desktop grid) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
            <h4 className="text-sm font-bold text-slate-800">Learning Outcome</h4>
            <div className="space-y-3">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-indigo-600" />
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Gain specialized knowledge in IFRS and global financial ethics.</p>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Fast-track your qualification with 6-month intensive batches.</p>
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE: keep learning outcome card visible under left nav (mobile only) */}
        <div className="lg:hidden px-2">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
            <h4 className="text-sm font-bold text-slate-800">Learning Outcome</h4>
            <div className="space-y-3">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-indigo-600" />
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Gain specialized knowledge in IFRS and global financial ethics.</p>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Fast-track your qualification with 6-month intensive batches.</p>
              </div>
            </div>
          </div>
        </div>
         <div className="p-6 bg-indigo-600 rounded-3xl text-white space-y-4 relative overflow-hidden block lg:hidden">
              <Trophy className="absolute -bottom-4 -right-4 w-24 h-24 opacity-10" />
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-200">Checkout</p>
              <h4 className="text-xl font-bold leading-tight">Download Full Syllabus Brochure</h4>
              <button
                            onClick={() => {
                              // kept modal key as "FM" to preserve existing modal wiring in the app
                              setActiveModalState("ACCA");
                              setCustomTitle("Apply for ACCA Coaching Program");
                              setCustomDescription("Start your ACCA journey with expert coaching and global placement support.");
                            }}
                            className="w-full md:w-auto bg-white text-blue-600 px-6 py-2.5 md:px-8 md:py-3 rounded-lg md:rounded-xl font-black text-sm md:text-base shadow-lg hover:bg-blue-50 transition-all uppercase tracking-wider flex items-center justify-center gap-2"
                          >
                            Apply Now
                            <ArrowRight className="w-4 h-4" />
                          </button>
            </div>
            <MultiModalPopup
                    activeModal={activeModal}
                    setActiveModal={(k) => setActiveModalState(k)}
                    customTitle={customTitle}
                  />
      </main>
    </div>
  );
}
