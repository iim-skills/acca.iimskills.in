import React from 'react';
import { 
  TrendingUp, 
  Building2, 
  PieChart, 
  ShieldAlert, 
  FileSearch, 
  BarChart3, 
  Calculator, 
  ClipboardList, 
  Banknote, 
  LineChart,
  ArrowRight,
  Briefcase,
  Globe,
  Award,
  Users,
  ChevronRight,
  Download,
  Filter,
  Search,
  CheckCircle2,
  Landmark,
  Briefcase as BriefcaseIcon,
  Crown,
  Activity,
  Wallet,
  Scale,
  ShieldCheck
} from 'lucide-react';

const SalarySection = () => {
  // Data for the "Top Industries/Roles" section
  const industries = [
    "Big 4 Audit Firms", "MNCs", "Banking & Finance", "Consulting", "FMCG", "FinTech", "Investment Banking", "Insurance", "Government & Public Sector", "Retail", "Manufacturing", "Real Estate"
  ];

  // Updated Roles with Salary Data
  const roles = [
    {
  title: "Chief Financial Officer (CFO)",
  range: "40 – 1 Cr+",
  min: 40,
  max: 100,
  icon: <Landmark className="w-5 h-5" />,
  highlight: true
},
    {
  title: "FP&A Manager",
  range: "12 – 30 LPA",
  min: 12,
  max: 30,
  icon: <TrendingUp className="w-5 h-5" />,
  highlight: true
},
{
  title: "Finance Director",
  range: "25 – 60 LPA",
  min: 25,
  max: 60,
  icon: <Crown className="w-5 h-5" />,
  highlight: true
},

    { title: "Financial Controller", range: "14 – 35 LPA", min: 14, max: 35, icon: <TrendingUp className="w-5 h-5" />, highlight: true },
    { title: "Corporate Treasurer", range: "10 – 35 LPA", min: 10, max: 35, icon: <Building2 className="w-5 h-5" />, highlight: true },
    { title: "Risk Manager", range: "9 – 23 LPA", min: 9, max: 23, icon: <ShieldAlert className="w-5 h-5" /> },
    { title: "Budget Manager", range: "10 – 20 LPA", min: 10, max: 20, icon: <PieChart className="w-5 h-5" /> },
    { title: "Auditor", range: "5 – 20 LPA", min: 5, max: 20, icon: <FileSearch className="w-5 h-5" /> },
    { title: "Financial Analyst", range: "5 – 12 LPA", min: 5, max: 12, icon: <BarChart3 className="w-5 h-5" /> },
    { title: "Tax Consultant", range: "5 – 10 LPA", min: 5, max: 10, icon: <Calculator className="w-5 h-5" /> },
    { title: "Financial Planner", range: "3 – 10 LPA", min: 3, max: 10, icon: <ClipboardList className="w-5 h-5" /> },
    { title: "Investment Advisor", range: "3 – 8 LPA", min: 3, max: 8, icon: <LineChart className="w-5 h-5" /> },
    { title: "Accountant", range: "3 – 8 LPA", min: 3, max: 8, icon: <Banknote className="w-5 h-5" /> },
    {
  title: "Management Accountant",
  range: "6 – 18 LPA",
  min: 6,
  max: 18,
  icon: <Briefcase className="w-5 h-5" />
},
{
  title: "Internal Auditor",
  range: "6 – 15 LPA",
  min: 6,
  max: 15,
  icon: <ShieldCheck className="w-5 h-5" />
},
{
  title: "Compliance Manager",
  range: "8 – 22 LPA",
  min: 8,
  max: 22,
  icon: <Scale className="w-5 h-5" />
},
{
  title: "Forensic Accountant",
  range: "7 – 20 LPA",
  min: 7,
  max: 20,
  icon: <Search className="w-5 h-5" />
},
{
  title: "Treasury Analyst",
  range: "6 – 16 LPA",
  min: 6,
  max: 16,
  icon: <Wallet className="w-5 h-5" />
},
{
  title: "Business Analyst (Finance)",
  range: "7 – 18 LPA",
  min: 7,
  max: 18,
  icon: <Activity className="w-5 h-5" />
},


  ];

  // Helper for progress bars
  const calculateWidth = (maxSalary: number) => Math.min((maxSalary / 35) * 100, 100);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 py-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      
      {/* Header Section */}
      <div className="max-w-3xl text-center mb-8 space-y-4">
        <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-slate-900">
          Future Scope & <span className="text-blue-600">Salary Prospects</span>
        </h2>
        <p className="text-[15px] md:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Mastering ACCA offers a structured path to build up your Career Prospects and Grab International Opportunities in 180+ countries.
        </p>
      </div>

      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: Scope & Industries */}
        <div className="space-y-6">
          
          {/* Scope Card */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                <BriefcaseIcon className="w-6 h-6" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900">Scope of ACCA Course</h3>
            </div>
            
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
              Attract global companies by showcasing your expertise in the accounting and finance field with a professional portfolio that gives an overview of your skills and industry-relevant knowledge.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FeatureCard 
                icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
                bg="bg-emerald-50"
                title="High Demand"
                desc="Growing need for strategic finance leaders globally."
              />
              <FeatureCard 
                icon={<Globe className="w-5 h-5 text-amber-600" />}
                bg="bg-amber-50"
                title="Global Mobility"
                desc="Recognized in 180+ countries for international careers."
              />
              <FeatureCard 
                icon={<Briefcase className="w-5 h-5 text-blue-600" />}
                bg="bg-blue-50"
                title="Diverse Roles"
                desc="Audit, Tax, Advisory, Risk, and Management."
              />
              <FeatureCard 
                icon={<Award className="w-5 h-5 text-purple-600" />}
                bg="bg-purple-50"
                title="Fast Growth"
                desc="Accelerated path to CFO & leadership positions."
              />
            </div>
          </div>

          {/* Top Industries Hiring Card (Dark Blue) */}
          <div className="bg-slate-900 p-8 rounded-[2rem] shadow-xl relative overflow-hidden text-white">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 relative z-10">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              Top Industries Hiring
            </h3>
            
            <div className="flex flex-wrap gap-3 relative z-10">
              {industries.map((item, idx) => (
                <span key={idx} className="px-4 py-2 bg-white/10 border border-white/10 rounded-full text-xs md:text-sm hover:bg-white/20 transition-colors cursor-default">
                  {item}
                </span>
              ))}
            </div>
 
          </div>
        </div>

        {/* RIGHT COLUMN: Salary Trends List */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col h-full max-h-[800px] overflow-hidden">
          
          <div className="mb-6 shrink-0">
            <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">Role-wise Salary Breakdown</h3>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>Annual Packages (LPA)</span>
              <ArrowRight className="w-3 h-3 -rotate-45" />
            </div>
          </div>

          {/* Scrollable List Area */}
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
             {roles.map((role, idx) => (
               <div 
                 key={idx} 
                 className={`p-4 rounded-xl border transition-all duration-200 ${role.highlight ? 'bg-blue-50 border-blue-100 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200'}`}
               >
                 <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${role.highlight ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {role.icon}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{role.title}</h4>
                        <span className="text-xs text-slate-500">{role.range}</span>
                      </div>
                    </div>
                    {role.highlight && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-200 text-blue-800 px-2 py-0.5 rounded-md">Top Tier</span>
                    )}
                 </div>
                 
                 {/* Mini Bar Chart */}
                 <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${role.highlight ? 'bg-blue-600' : 'bg-slate-400'}`} 
                      style={{ width: `${calculateWidth(role.max)}%` }}
                    ></div>
                 </div>
               </div>
             ))}
          </div>

          {/* Insight Box */}
          <div className="mt-6 shrink-0 bg-slate-50 rounded-2xl p-5 border border-slate-100 flex gap-4">
             <div className="shrink-0 mt-0.5">
               <CheckCircle2 className="w-5 h-5 text-blue-600" />
             </div>
             <div>
               <h4 className="font-bold text-slate-900 text-sm mb-1">Career Growth Tip</h4>
               <p className="text-xs text-slate-500 leading-relaxed">
                 Top-tier roles like <strong className="text-slate-700">Financial Controller</strong> require strategic decision-making skills, which are heavily focused on in the ACCA Strategic Professional level.
               </p>
             </div>
          </div>

        </div>

      </div>
    </div>
  );
};

// Helper Component for the Feature Grid
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  bg: string;
}

const FeatureCard = ({ icon, title, desc, bg }: FeatureCardProps) => (
  <div className="border border-slate-100 p-4 rounded-2xl hover:shadow-md transition-shadow bg-white">
    <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
      {icon}
    </div>
    <h4 className="font-bold text-slate-900 text-sm mb-1">{title}</h4>
    <p className="text-xs text-slate-500 leading-snug">{desc}</p>
  </div>
);

export default SalarySection;