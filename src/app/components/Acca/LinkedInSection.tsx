"use client";
import React, { useState } from 'react';
import MultiModalPopup, { ModalKey } from "@/components/props/MultiModalPopup";
import {
  MapPin,
  Eye,
  ThumbsUp,
  Globe,
  Twitter,
  Linkedin,
  Mail,
  Briefcase,
  ChevronRight,
  Star,
  Download,
  Plus,
  TrendingUp,
  Award,
  Zap,
  ClipboardList,
  FileText,
  BarChart3,
  ShieldCheck,
  PieChart,
  Calculator,
  ArrowRight,
  CheckCircle,
  Search,
  Target
} from 'lucide-react';
import { GiSkills } from 'react-icons/gi';

const ACCAPortfolio: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Finance Portfolio');
  const [activeModal, setActiveModalState] = useState<ModalKey | null>(null);
  const [customTitle, setCustomTitle] = useState<string | undefined>();
  const [customDescription, setCustomDescription] = useState<string | undefined>();

  const profileData = {
    name: "Alex Thompson",
    tagline: "ACCA Affiliate | Strategic Finance Leader | IIM SKILLS Alumni",
    location: "London, United Kingdom",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&h=200&auto=format&fit=crop",
    available: true,
    stats: {
      views: "12,405",
      appreciations: "1,131",
      endorsements: "832",
    }
  };

  const financeProjects = [
    {
      title: "IFRS 16 Lease Accounting Transition",
      likes: "420",
      views: "3.2k",
      icon: <Calculator size={20} />,
      details: "Led the impact assessment and implementation of IFRS 16 for a retail client with 150+ lease contracts. Optimized Right-of-Use (ROU) asset calculations and ensured precise recognition of lease liabilities on the balance sheet.",
      impact: "Reduced reporting errors by 15% during transition."
    },
    {
      title: "Global Group Consolidation (IAS 21)",
      likes: "850",
      views: "5.4k",
      icon: <Globe size={20} />,
      details: "Managed the consolidation of financial statements for a group with 12 subsidiaries across 5 jurisdictions. Executed complex foreign currency translations and eliminated inter-company transactions totaling £45M.",
      impact: "Streamlined month-end closing from 10 days to 6 days."
    },
    {
      title: "M&A Financial Due Diligence",
      likes: "310",
      views: "2.1k",
      icon: <Search size={20} />,
      details: "Conducted buy-side financial due diligence for a mid-market manufacturing acquisition. Analyzed historical EBITDA, working capital trends, and identified potential tax contingencies and undisclosed liabilities.",
      impact: "Identified £1.2M in overvalued assets prior to deal closure."
    },
    {
      title: "Corporate Tax Strategy & Compliance",
      likes: "590",
      views: "4.8k",
      icon: <FileText size={20} />,
      details: "Developed a comprehensive tax compliance framework for a tech startup. Optimized R&D tax credit claims and ensured 100% accuracy in quarterly VAT filings and annual corporate tax returns.",
      impact: "Secured £250k in tax rebates through R&D incentives."
    }
  ];

  const auditProjects = [
    {
      title: "Internal Control Framework Audit (SOX)",
      likes: "340",
      views: "2.8k",
      icon: <ShieldCheck size={20} />,
      details: "Evaluated the design and operating effectiveness of internal controls over financial reporting (ICFR). Identified critical gaps in the 'Purchase-to-Pay' cycle and proposed automated reconciliation controls.",
      impact: "Mitigated high-risk control deficiencies in 4 key business units."
    },
    {
      title: "Statutory Audit: Revenue Recognition",
      likes: "410",
      views: "3.1k",
      icon: <ClipboardList size={20} />,
      details: "Performed substantive testing on complex multi-element revenue arrangements under IFRS 15. Verified performance obligations and transaction price allocations for a SaaS provider.",
      impact: "Ensured 100% compliance with new revenue recognition standards."
    },
    {
      title: "Forensic Investigation: Inventory Variance",
      likes: "215",
      views: "1.9k",
      icon: <Search size={20} />,
      details: "Investigated a £500k discrepancy in perpetual inventory records. Utilized data analytics to identify systematic bypasses in the warehouse management system and potential internal fraud.",
      impact: "Recovered 60% of lost value and implemented biometrics."
    },
    {
      title: "Advanced Audit & Assurance Simulation",
      likes: "612",
      views: "4.2k",
      icon: <ShieldCheck size={20} />,
      details: "Comprehensive professional simulation involving risk assessment, materiality thresholds, and drafting of modified audit opinions for complex group scenarios.",
      impact: "Scored Top 5% in ACCA AAA Professional Mock."
    }
  ];

  const strategyProjects = [
    {
      title: "ESG Financial Reporting Strategy",
      likes: "520",
      views: "5.1k",
      icon: <Target size={20} />,
      details: "Designed a roadmap for integrating Environmental, Social, and Governance (ESG) metrics into annual financial reports. Aligned disclosures with TCFD and SASB frameworks for institutional investors.",
      impact: "Enhanced investor transparency score by 22%."
    },
    {
      title: "Working Capital Optimization Roadmap",
      likes: "390",
      views: "3.4k",
      icon: <TrendingUp size={20} />,
      details: "Developed a 12-month strategy to improve liquidity by optimizing the Cash Conversion Cycle (CCC). Negotiated revised credit terms and implemented dynamic discounting for payables.",
      impact: "Released £2.5M in trapped liquidity for expansion."
    },
    {
      title: "Digital Finance Transformation ROI",
      likes: "445",
      views: "3.9k",
      icon: <Zap size={20} />,
      details: "Conducted a cost-benefit analysis for migrating legacy ERP to a cloud-based SAP S/4HANA environment. Defined KPIs for process automation in the 'Order-to-Cash' cycle.",
      impact: "Projected 3-year ROI of 140% through operational efficiency."
    },
    {
      title: "Post-Merger Integration (PMI) Strategy",
      likes: "280",
      views: "2.3k",
      icon: <PieChart size={20} />,
      details: "Formulated a financial integration strategy for a newly acquired subsidiary. Focused on chart of account harmonization, reporting line alignment, and synergy realization tracking.",
      impact: "Achieved full financial integration 3 months ahead of schedule."
    }
  ];

  const getActiveContent = () => {
    switch (activeTab) {
      case 'Audit Case Studies': return auditProjects;
      case 'Strategy Reports': return strategyProjects;
      default: return financeProjects;
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#191919] font-sans">
      {/* Header Badge Section */}
      <div className="col-span-full text-center mb-8 pt-10">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-600 text-white px-4 py-1.5 rounded-full flex items-center gap-2 text-sm font-bold shadow-lg uppercase tracking-wider">
            <ShieldCheck size={16} />
            ACCA Verified Portfolio
          </div>
        </div>

        <h2 className="text-2xl md:text-4xl font-bold text-[#1F2328] mb-3 tracking-tight">
          Strategic <span className="text-[#2563EB]">Financial Leadership</span>
        </h2>

        <p className="max-w-5xl mx-auto text-base md:text-lg text-slate-600 leading-relaxed px-4">
          Showcasing a comprehensive track record of IFRS compliance, strategic business reporting,
          and data-driven auditing for the modern global economy.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-4 relative z-30 pb-20">
        <div className="flex flex-col gap-8">

          {/* Top Section */}
          <div className="flex flex-col lg:flex-row gap-8 items-stretch">
            {/* Sidebar Profile Card */}
            <div className="xl:w-[380px] flex-shrink-0">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 h-full flex flex-col">
                <div className="flex flex-col items-center text-center flex-1">
                  <div className="relative mb-6">
                    <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white flex items-center justify-center p-1.5">
                      <img src={profileData.avatar} alt={`${profileData.name} avatar`} className="w-full h-full rounded-full object-cover" />
                    </div>
                    <div className="absolute bottom-1 right-1 bg-blue-600 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter border-2 border-white">ACCA</div>
                  </div>

                  <h2 className="text-2xl font-black">{profileData.name}</h2>
                  <p className="text-[13px] font-medium text-gray-500 mt-1 max-w-[280px]">
                    ACCA Affiliate | Financial Analyst | Strategic Advisor
                  </p>

                  {profileData.available && (
                    <div className="mt-3 bg-[#e6f4ea] text-[#1e7e34] px-4 py-1 rounded-md flex items-center gap-2 text-xs font-bold">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#1e7e34] animate-pulse"></div>
                      Open for Consultation
                    </div>
                  )}

                  <div className="w-full mt-6 space-y-3 text-left">
                    <div className="flex items-start gap-3 text-[14px] text-gray-600">
                      <Briefcase size={17} className="mt-0.5 flex-shrink-0 text-gray-400" />
                      <span>IFRS, SBR & Audit Expert</span>
                    </div>
                    <div className="flex items-start gap-3 text-[14px] text-gray-600">
                      <MapPin size={17} className="mt-0.5 flex-shrink-0 text-gray-400" />
                      <span>{profileData.location}</span>
                    </div>
                  </div>

                  <div className="flex flex-col w-full gap-2 mt-6">
                    <button className="w-full bg-[#0057ff] hover:bg-blue-700 text-white font-bold py-2.5 rounded-full flex items-center justify-center gap-2 transition-colors text-sm">
                      <Plus size={16} strokeWidth={3} /> Follow Alex
                    </button>
                    <button className="w-full bg-white border border-gray-200 hover:bg-gray-50 font-bold py-2.5 rounded-full flex items-center justify-center gap-2 text-gray-700 transition-colors text-sm">
                      <Mail size={16} /> Request CV
                    </button>
                  </div>

                  <div className="w-full mt-6 border border-gray-100 rounded-xl p-3.5 text-left space-y-3 shadow-sm bg-gray-50/30">
                    <h3 className="font-bold text-base text-gray-900">Professional Inquiry</h3>
                    <div className="h-px bg-gray-100 -mx-3.5"></div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 cursor-pointer group">
                        <div className="bg-blue-50 p-2 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">
                          <ClipboardList size={20} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-[13px] text-gray-900">Project Engagement</p>
                            <ChevronRight size={14} className="text-blue-500" />
                          </div>
                          <p className="text-[11px] text-gray-500">Advisory & Reporting</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 cursor-pointer group">
                        <div className="bg-blue-50 p-2 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">
                          <BarChart3 size={20} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-[13px] text-gray-900">Full Time Role</p>
                            <ChevronRight size={14} className="text-blue-500" />
                          </div>
                          <p className="text-[11px] text-gray-500">Strategic Leadership</p>
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-gray-100 -mx-3.5"></div>

                    <div className="flex items-center gap-2 text-blue-600">
                      <Star size={14} className="fill-blue-600" />
                      <span className="text-[12px] font-bold">13/13 Exams Cleared <span className="text-gray-400 font-normal">(Ethics Module Complete)</span></span>
                    </div>
                  </div>
                </div>

                <div className="w-full mt-auto">
                  <div className="grid grid-cols-2 gap-y-3 pt-5 border-t border-gray-100 text-[12px]">
                    <div><p className="text-gray-500">Profile Views</p><p className="font-bold">{profileData.stats.views}</p></div>
                    <div><p className="text-gray-500">Endorsements</p><p className="font-bold">{profileData.stats.endorsements}</p></div>
                  </div>

                  <div className="flex gap-5 mt-6 pt-5 border-t border-gray-50 w-full justify-center">
                    <Twitter size={18} className="text-gray-400 hover:text-black cursor-pointer transition-colors" />
                    <Linkedin size={18} className="text-gray-400 hover:text-[#0077b5] cursor-pointer transition-colors" />
                    <Mail size={18} className="text-gray-400 hover:text-black cursor-pointer transition-colors" />
                    <Globe size={18} className="text-gray-400 hover:text-black cursor-pointer transition-colors" />
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 h-full flex flex-col">
                <span className="text-[12px] font-bold bg-blue-50 px-3 py-1.5 rounded text-blue-600 tracking-wide w-fit uppercase">IIM SKILLS Strategic Finance</span>

                <h2 className="text-xl md:text-3xl font-black leading-tight mt-4">
                  Master the Art of  
                  <span className="text-blue-600"> Global Finance</span>
                </h2>
                    <p className="text-gray-600 text-[16px] mt-4 leading-relaxed">
                  Certified Training for Global ACCA Certification Courses
                </p>

                <p className="text-gray-600 text-[16px] leading-relaxed">
                  Develop expertise in Global Accounting Standards and Corporate Strategy required for building a high-growth finance career globally. 
                </p>

                <div className="mt-10 space-y-8 flex-1">
                  <div className="flex gap-5 items-start group cursor-pointer">
                    <div className="mt-1 p-2 bg-blue-50 rounded-lg"><TrendingUp size={20} /></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-[18px]">IFRS & SBR Mastery</h4>
                        <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <p className="text-base text-gray-500 mt-1 leading-relaxed">Master the practical application of international reporting standards required in complex group scenarios. </p>
                    </div>
                  </div>

                  <div className="flex gap-5 items-start group cursor-pointer">
                    <div className="mt-1 p-2 bg-blue-50 rounded-lg"><PieChart size={20} /></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-[18px]">Audit & Taxation</h4>
                        <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <p className="text-base text-gray-500 mt-1 leading-relaxed">Showcase your expertise in audit planning, risk assessment, and income tax computations - skills that companies look for.</p>
                    </div>
                  </div>

                  <div className="flex gap-5 items-start group cursor-pointer">
                    <div className="mt-1 p-2 bg-blue-50 rounded-lg"><Award size={20} /></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-[18px]">Showcase Your Skills</h4>
                        <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <p className="text-base text-gray-500 mt-1 leading-relaxed">Show what you bring to the table with highly valued skills in financial modelling, investment banking, Excel, etc.</p>
                    </div>

                  </div>
                   <div className="flex gap-5 items-start group cursor-pointer">
                    <div className="mt-1 p-2 bg-blue-50 rounded-lg"><GiSkills size={20} /></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-[18px]">Ethical Compliance</h4>
                        <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <p className="text-base text-gray-500 mt-1 leading-relaxed">Attain the ethics and professional skills required to be followed in all finance scenarios.</p>
                    </div>

                  </div>
                </div>

                <div className="mt-10">
                   
                  <button
              onClick={() => {
                // kept modal key as "FM" to preserve existing modal wiring in the app
                setActiveModalState("ACCA");
                setCustomTitle("Download Full Portfolio Details");
                setCustomDescription("Start your ACCA journey with expert coaching and global placement support.");
              }}
              className="w-full md:w-auto text-white bg-blue-600 px-6 py-2.5 md:px-8 md:py-3 rounded-lg md:rounded-xl font-black text-sm md:text-base shadow-lg hover:bg-blue-50 transition-all uppercase tracking-wider flex items-center justify-center gap-2"
            >
              Download Full Portfolio
              <Download className="w-4 h-4" />
            </button>
                </div>

                <div className="mt-10 pt-8 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-[14px] font-black text-blue-600 uppercase tracking-widest">
                    <Zap size={14} /> Professional Impact
                  </div>
                  <p className="mt-3 text-[16px] text-gray-700 leading-relaxed">
                    ACCA Professionals are <span className="text-blue-600 font-bold">recognized in 180 countries</span>, serving as the <span className="font-bold italic">strategic backbone</span> of global enterprise.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section: Tabs and Projects */}
          {/* <div className="w-full">
            <div className="bg-white rounded-t-xl border-x border-t border-gray-100">
              <div className="flex px-8 items-center overflow-x-auto whitespace-nowrap scrollbar-hide">
                {['Finance Portfolio', 'Audit Case Studies', 'Strategy Reports'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-8 py-5 text-sm font-bold border-b-2 transition-all ${activeTab === tab
                      ? 'border-blue-600 text-black'
                      : 'border-transparent text-gray-500 hover:text-black'
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-b-xl border border-gray-100 p-8 min-h-[400px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {getActiveContent().map((project, idx) => (
                  <div key={idx} className="group p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-300 transition-all flex flex-col shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        {project.icon}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                        <span className="flex items-center gap-1"><ThumbsUp size={10} /> {project.likes}</span>
                        <span className="flex items-center gap-1"><Eye size={10} /> {project.views}</span>
                      </div>
                    </div>

                    <h3 className="text-lg font-black text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                      {project.title}
                    </h3>

                    <p className="text-sm text-slate-600 leading-relaxed mb-6 flex-1">
                      {project.details}
                    </p>

                    <div className="bg-white p-3 rounded-xl border border-blue-50 mb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-600">
                        <CheckCircle size={14} />
                        <span>Key Impact: {project.impact}</span>
                      </div>
                    </div>

                    
                  </div>
                ))}
              </div>
            </div>
          </div> */}
        </div>
      </div>
      <MultiModalPopup
        activeModal={activeModal}
        setActiveModal={(k) => setActiveModalState(k)}
        customTitle={customTitle}
         
      />
    </div>
  );
};

export default ACCAPortfolio;
