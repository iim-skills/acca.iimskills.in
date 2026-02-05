"use client"
import React, { useState } from 'react';
import { 
  Briefcase, 
  Calculator, 
  FileText, 
  Scale, 
  TrendingUp, 
  Percent, 
  BookOpen, 
  ShieldCheck, 
  DollarSign, 
  Award, 
  Globe, 
  Layers, 
  CheckCircle2
} from 'lucide-react';

// --- Data Structure ---

const categories = [
  "Applied Knowledge",
  "Applied Skills",
  "Strategic Professional"
];

const projects = [
  // Applied Knowledge
  {
    id: 1,
    code: "BT",
    title: "Business & Technology",
    category: "Applied Knowledge",
    description: "Analysis of business models, governance, and ethical frameworks within a corporate environment.",
    icon: Briefcase,
    color: "text-blue-500",
    bg: "bg-blue-50",
    features: [
      "Stakeholder & Governance Analysis",
      "Ethical Risk Evaluation",
      "Strategic Objective Mapping"
    ]
  },
  {
    id: 2,
    code: "MA",
    title: "Management Accounting",
    category: "Applied Knowledge",
    description: "Costing techniques and variance analysis to support management decision-making.",
    icon: Calculator,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    features: [
      "Job, Batch & Process Costing",
      "Budget vs Actual Variance",
      "Marginal Costing Decisions"
    ]
  },
  {
    id: 3,
    code: "FA",
    title: "Financial Accounting",
    category: "Applied Knowledge",
    description: "Preparation of core financial statements compliant with basic IFRS standards.",
    icon: FileText,
    color: "text-indigo-500",
    bg: "bg-indigo-50",
    features: [
      "Income Statement & Balance Sheet",
      "Accruals & Depreciation",
      "Cash Flow Preparation"
    ]
  },
  // Applied Skills
  {
    id: 4,
    code: "LW",
    title: "Corporate & Business Law",
    category: "Applied Skills",
    description: "Comprehensive legal analysis focusing on contract and company law compliance.",
    icon: Scale,
    color: "text-slate-600",
    bg: "bg-slate-100",
    features: [
      "Contract Law Case Analysis",
      "Corporate Compliance Checklist",
      "Legal Risk Documentation"
    ]
  },
  {
    id: 5,
    code: "PM",
    title: "Performance Management",
    category: "Applied Skills",
    description: "Advanced performance measurement utilizing KPIs and quantitative decision models.",
    icon: TrendingUp,
    color: "text-orange-500",
    bg: "bg-orange-50",
    features: [
      "KPI Dashboard Design",
      "Break-even & CVP Analysis",
      "Management Recommendations"
    ]
  },
  {
    id: 6,
    code: "TX",
    title: "Taxation",
    category: "Applied Skills",
    description: "Computation of tax liabilities for individuals and corporations including planning scenarios.",
    icon: Percent,
    color: "text-red-500",
    bg: "bg-red-50",
    features: [
      "Corporate & Income Tax Calc",
      "Capital Gains Computations",
      "Tax Planning Scenarios"
    ]
  },
  {
    id: 7,
    code: "FR",
    title: "Financial Reporting",
    category: "Applied Skills",
    description: "Application of accounting standards to prepare and interpret group financial statements.",
    icon: BookOpen,
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    features: [
      "IFRS Financial Statements",
      "Consolidated Group Accounts",
      "Financial Ratio Analysis"
    ]
  },
  {
    id: 8,
    code: "AA",
    title: "Audit & Assurance",
    category: "Applied Skills",
    description: "Planning and execution of audit procedures including risk assessment and control evaluation.",
    icon: ShieldCheck,
    color: "text-purple-600",
    bg: "bg-purple-50",
    features: [
      "Audit Risk Assessment",
      "Internal Control Evaluation",
      "Draft Audit Reports"
    ]
  },
  {
    id: 9,
    code: "FM",
    title: "Financial Management",
    category: "Applied Skills",
    description: "Strategic financial management focusing on investment appraisal and working capital.",
    icon: DollarSign,
    color: "text-green-600",
    bg: "bg-green-50",
    features: [
      "NPV, IRR & Payback Analysis",
      "Working Capital Management",
      "Financing Decisions"
    ]
  },
  // Strategic Professional
  {
    id: 10,
    code: "SBL",
    title: "Strategic Business Leader",
    category: "Strategic Professional",
    description: "Holistic organizational leadership project integrating strategy, risk, and ethics.",
    icon: Award,
    color: "text-amber-500",
    bg: "bg-amber-50",
    features: [
      "Integrated Strategy Analysis",
      "Risk & Governance Audit",
      "Board-Level Reporting"
    ]
  },
  {
    id: 11,
    code: "SBR",
    title: "Strategic Business Reporting",
    category: "Strategic Professional",
    description: "Complex corporate reporting scenarios requiring professional judgment and ethical application.",
    icon: Globe,
    color: "text-blue-700",
    bg: "bg-blue-50",
    features: [
      "Complex IFRS Application",
      "Group Restructuring",
      "Professional Judgement Analysis"
    ]
  },
  {
    id: 12,
    code: "OPT",
    title: "Advanced Options (AFM/APM...)",
    category: "Strategic Professional",
    description: "Specialized advanced projects in financial management, performance, audit, or tax.",
    icon: Layers,
    color: "text-pink-600",
    bg: "bg-pink-50",
    features: [
      "Adv. Valuation (AFM)",
      "Strategic Frameworks (APM)",
      "Ethical Audit Cases (AAA)"
    ]
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState("Applied Knowledge");

  const filteredProjects = projects.filter(project => project.category === activeTab);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-sm font-bold tracking-widest text-blue-600 uppercase">
            Professional Portfolio
          </h2>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            ACCA Project Showcase
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-gray-500">
            A comprehensive collection of financial, strategic, and management projects demonstrating core competencies across applied knowledge and strategic leadership.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveTab(category)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ease-in-out
                ${activeTab === category 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 transform scale-105' 
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 shadow-sm'
                }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Project Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="group relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              {/* Top accent bar */}
              <div className={`h-1.5 w-full ${project.bg.replace('bg-', 'bg-opacity-100 bg-')}`}></div>

              <div className="p-6 md:p-8">
                {/* Header: Icon & Code */}
                <div className="flex items-start justify-between mb-6">
                  <div className={`p-3 rounded-xl ${project.bg} ${project.color}`}>
                    <project.icon size={28} strokeWidth={1.5} />
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-md bg-gray-100 text-gray-500`}>
                    {project.code}
                  </span>
                </div>

                {/* Title & Description */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {project.description}
                  </p>
                </div>

                {/* Features List */}
                <div className="space-y-3 mb-6">
                  {project.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center text-sm text-gray-600">
                      <CheckCircle2 size={16} className="text-gray-300 mr-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Footer / CTA */}
                <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {project.category.replace(' Professional', '')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State (Safety) */}
        {filteredProjects.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No projects found in this category.</p>
          </div>
        )}

      </div>
    </div>
  );
}