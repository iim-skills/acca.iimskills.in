"use client";
import React, { useState } from 'react';
import MultiModalPopup, { ModalKey } from "@/components/props/MultiModalPopup";
import {
  BarChart3,
  GraduationCap,
  CheckCircle2,
  Target,
  Award,
  Briefcase,
  Wrench,
  Info,
  ChevronRight,
  TrendingUp,
  IndianRupee,
  Globe,
  Building2,
  Clock
} from 'lucide-react';

const ReadMoreACCA = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [activeModal, setActiveModalState] = useState<ModalKey | null>(null);
  const [customTitle, setCustomTitle] = useState<string | undefined>();
  const [customDescription, setCustomDescription] = useState<string | undefined>();

  const courseConfigs: Record<string, { imageUrl: string; productId: string; contactOwner: string; redirectUrl: string; courseKey?: string }> = {
    ACCA: {
      imageUrl: "/ACCAMC/financial-modeling-certification-course.png",
      productId: "ACCAMC",
      contactOwner: "IIM SKILLS",
      redirectUrl: "/Thank-You/Acca/",
      courseKey: "ACCA",
    },
  };
  const config = courseConfigs["ACCA"];

  const ACCA_CONTENT = {
  overview: {
    description: "ACCA offers global career opportunities, and the course structure compared to CA is flexible. Though the cost of an ACCA-certified course is very high, it gives international career exposure, which means a good salary and better growth. Also, ACCA professionals have higher demands in Big 4 firms, MNCs, consulting firms, and top banking companies.",
    eligibility: [
      "The basic requirement that learners need to fulfil is having completed 12th, with 65% in English, Mathematics, and Accounting, alongside having 50% in the remaining subjects.",
      "Learners having a degree in commerce or a related field are eligible and will have the benefit of exemptions, given based on their qualification."
    ],
    fiaRoute: "Even if learners do not fit the above mentioned categories, they can still pursue the ACCA course by a different route, i.e., FIA (Foundation in Accountancy Route). This is eligible for students who have passed 10th or are from a non-commerce background."
  },
  jobRoles: [
    {
      role: "Accountant",
      salary: "4 to 8 Lakhs",
      experience: "0-3 Years",
      icon: <Briefcase className="w-5 h-5 text-blue-600" />
    },
    {
      role: "Auditor",
      salary: "4 to 10 Lakhs",
      experience: "0-3 years",
      icon: <Building2 className="w-5 h-5 text-emerald-600" />
    },
    {
      role: "Tax Consultant",
      salary: "4 to 12 Lakhs",
      experience: "0 to 2 Years (junior role) 3 to 5 years (senior role)",
      icon: <Info className="w-5 h-5 text-purple-600" />
    },
    {
      role: "Financial Analyst",
      salary: "5 to 15 Lakhs",
      experience: "0- 3 Years (entry level) 3 to 7 years for senior analyst",
      icon: <Globe className="w-5 h-5 text-orange-600" />
    },
    {
      role: "Business Consultant",
      salary: "10 to 18 Lakhs",
      experience: "2 to 3 Years (consulting experience is needed)",
      icon: <GraduationCap className="w-5 h-5 text-indigo-600" />
    },
    {
      role: "Finance Manager",
      salary: "14 to 28 Lakhs",
      experience: "3 to 7 Years (in corporates and MNCs)",
      icon: <IndianRupee className="w-5 h-5 text-pink-600" />
    }
  ]
};

  const tabs = [
    {
      id: 0,
      label: "Definition",
      icon: <Info size={20} />, // Increased icon size
      title: "What is an ACCA Course?",
      content: (
        <div className="space-y-5 text-slate-700 leading-relaxed text-base md:text-[16px]"> {/* Increased text size */}
          <p>
            The Association of Chartered Certified Accountants (ACCA) is a globally recognised professional body that offers accounting and finance qualifications that are valued in over 180+ countries globally. 
          </p>
          <p>
            The ACCA Certificate Course is a globally accredited professional qualification that is taken by students who are passionate about building their careers in audit, taxation, business management, and accounting. The ACCA Certification is ideal for students who are looking for international job opportunities, as it is also accredited in more than 180 countries in the world. 
          </p>
          <p>
            The best part of ACCA is that the Certification gives international career exposure and is globally approved. Those seeking strong salary growth and flexible exams can take ACCA Coaching. Additionally, the course can be completed faster than CA.
          </p>
          <p className="font-bold text-blue-800 text-lg"> {/* Increased text size */}
            These models are essential in making data-driven decisions.
          </p>
        </div>
      )
    },
     
    {
      id: 1,
      label: "Eligibility",
      icon: <GraduationCap size={20} />,
      title: "Are you Eligible to Pursue the ACCA Course? ",
      content: (
        <div className="space-y-6 text-base"> {/* Increased base text size */}
          <div className="p-5 bg-slate-50 border-l-4 border-blue-600 rounded-r-xl">
            <p className="text-slate-700 leading-relaxed text-base md:text-[16px]">
              If you are considering pursuing the ACCA course and are confused regarding the eligibility criteria, then here is a guide on it
            </p>
          </div>
          <div>
             
            <ul className="grid gap-3">
              {[
                "The basic requirement that learners need to fulfil is having completed 12th, with 65% in English, Mathematics, and Accounting, alongside having 50% in the remaining subjects. ",
                "Learners having a degree in commerce or a related field are eligible and will have the benefit of exemptions, given based on their qualification."
              ].map((skill, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-600 text-base">
                  <div className="h-2 w-2 rounded-full bg-blue-400" />
                  {skill}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-5 bg-blue-900 text-white rounded-xl">
            <p className="leading-relaxed text-base md:text-lg">
              Even if learners do not fit the above mentioned categories, they can still pursue the ACCA course by a different route, i.e., FIA (Foundation in Accountancy Route). This is eligible for students who have passed 10th or are from a non-commerce background. 
            </p>
          </div>
        </div>
      )
    },
     {
      id: 2,
      label: "Career Opportunities",
      icon: <GraduationCap size={20} />,
      title: "Career Opportunities After Completing ACCA",
      content: (
        <div className="space-y-6 text-base"> {/* Increased base text size */}
          <div className="p-5 bg-slate-50 border-l-4 border-blue-600 rounded-r-xl">
            <p className="text-slate-700 leading-relaxed text-base md:text-[16px]">
             ACCA offers global career opportunities, and the course structure compared to CA is flexible. Though the cost of an ACCA-certified course is very high, it gives international career exposure, which means a good salary and better growth. Also, ACCA professionals have higher demands in Big 4 firms, MNCs, consulting firms, and top banking companies. 
            </p>
          </div>
                <div className="hidden md:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="px-8 py-4 font-bold uppercase tracking-wider text-xs">Job Roles</th>
                    <th className="px-8 py-4 font-bold uppercase tracking-wider text-xs text-center">Avg. Salary Per Annum</th>
                    <th className="px-8 py-4 font-bold uppercase tracking-wider text-xs">Experience Required</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ACCA_CONTENT.jobRoles.map((job, index) => (
                    <tr key={index} className="hover:bg-blue-50/50 transition-colors group">
                      <td className="px-8 py-0">
                        <div className="flex items-center gap-4">
                          <div className="px-3 bg-slate-100 rounded-xl group-hover:bg-white transition-colors">
                            {job.icon}
                          </div>
                          <span className="font-bold text-slate-800 text-sm">{job.role}</span>
                        </div>
                      </td>
                      <td className="px-8 py-0 text-center">
                        <div className="inline-flex items-center gap-2 text-sm bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full font-bold">
                          <IndianRupee className="w-4 h-4" />
                          {job.salary}
                        </div>
                      </td>
                      <td className="px-8 py-0">
                        <div className="flex items-start gap-3 max-w-xs">
                          <Clock className="w-5 h-5 text-slate-400 mt-1 shrink-0" />
                          <span className="text-slate-600 text-sm leading-relaxed font-medium">
                            {job.experience}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View: High-Density Cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {ACCA_CONTENT.jobRoles.map((job, index) => (
                <div key={index} className="p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-100 rounded-xl">
                      {job.icon}
                    </div>
                    <h3 className="text-xl font-black text-slate-900">{job.role}</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                      <p className="text-[10px] uppercase tracking-widest text-emerald-600 font-black mb-1">Avg Salary</p>
                      <p className="font-bold text-emerald-800 text-xs flex items-center gap-1">
                        <IndianRupee className="w-3 h-3" />
                        {job.salary}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black mb-1">Exp. Needed</p>
                      <p className="font-bold text-slate-700 text-xs">
                        {job.experience.split(' (')[0]}
                      </p>
                    </div>
                  </div>
                  
                  {job.experience.includes('(') && (
                    <div className="bg-blue-50 p-3 rounded-xl text-blue-700 text-xs font-medium leading-relaxed">
                      {job.experience}
                    </div>
                  )}
                </div>
              ))}
            </div>
          <div className="p-5 bg-blue-900 text-white rounded-xl">
            <p className="leading-relaxed text-base md:text-[16px]">
              Even if learners do not fit the above mentioned categories, they can still pursue the ACCA course by a different route, i.e., FIA (Foundation in Accountancy Route). This is eligible for students who have passed 10th or are from a non-commerce background. 
            </p>
          </div>
        </div>
      )
    },
    {
      id: 3,
      label: "Why Choose Us",
      icon: <Award size={20} />,
      title: "Why Choose IIM SKILLS ACCA Course?",
      content: (
        <div className="space-y-6 text-base"> {/* Increased base text size */}
          <div className="p-5 bg-slate-50 border-l-4 border-blue-600 rounded-r-xl">
            <p className="text-slate-700 leading-relaxed text-base md:text-[16px]">
              From industry-focused knowledge to in-demand skills, exam preparation, mock tests, and placement support, the IIM SKILLS ACCA Course covers every aspect that is crucial for the success of its students. 
            </p>
          </div>
        <div className="grid gap-5">
          {[
  {
    label: "Expert Trainers",
    text: "Learn from industry experts who have worked at top companies and gain advanced knowledge, industry insights, and guidance for clearing the exam."
  },
  {
    label: "Practice Sessions",
    text: "The ACCA course includes practice sessions to ensure students are well-acquainted with industry-relevant concepts and skills that top companies look for."
  },
  {
    label: "Placement Support",
    text: "Alongside training learners for ACCA, IIM SKILLS offers 100% placement support to ensure the smooth transition of learners from beginners to skilled finance professionals ready to face the global industry challenges."
  },
  {
    label: "Free Certifications",
    text: "Gain free certifications in Excel, Financial Modelling, Investment Banking, Tableau, etc., that are highly valued in the industry and provide you with an edge in the competitive job market."
  },
  {
    label: "Lifetime LMS Access",
    text: "Revisit the course recordings anytime and revise concerts with ease at anytime with lifetime access to the LMS."
  },
  {
    label: "Study Materials",
    text: "Get all the study materials required for mastering the essential concepts with the ACCA course."
  },
  {
  label: "Doubt Solving Sessions",
  text: "Clear all your doubts and gain proper knowledge with the IIM SKILLS ACCA course that comes with doubt-solving sessions led by experienced professionals."
},
{
  label: "Live Classes",
  text: "Attend informative sessions conducted live by industry experts to gain rich industry knowledge, exam insights, and skills."
}
].map((item, i) => (
            <div key={i} className="flex gap-4 group">
              <div className="shrink-0 mt-1">
                <div className="h-7 w-7 rounded bg-slate-100 text-blue-600 flex items-center justify-center font-bold text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  {i + 1}
                </div>
              </div>
              <div>
                <h5 className="text-base font-bold text-slate-800">{item.label}:</h5>
                <p className="text-sm text-slate-600 leading-relaxed">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 flex items-center justify-center font-sans">
      <div className="max-w-6xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">

        {/* Header */}
        <div className="bg-blue-900 p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={18} className="text-blue-400" />
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-blue-300">IIM SKILLS</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Association of Chartered Certified Accountants</h2>
          </div>

          <button
            onClick={() => {
              setActiveModalState("ACCA");
              setCustomTitle('Download Course Brochure');
              setCustomDescription('Get Complete Details about Course.');
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white px-7 py-3 rounded-lg font-bold text-sm transition-all flex items-center gap-2 w-fit"
          >
            Download Brochure <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row">
          {/* Navigation */}
          <div className="w-full md:w-64 bg-slate-50 border-r border-slate-100 p-4 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-4 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id
                    ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-700'
                  }`}
              >
                <span className={activeTab === tab.id ? 'text-blue-600' : 'text-slate-400'}>
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 p-8 md:p-10 min-h-[480px] bg-white">
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h3 className="text-xl font-bold text-slate-900 mb-3 pb-3 border-b border-slate-100">
                {tabs[activeTab].title}
              </h3>
              {tabs[activeTab].content}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-5 border-t border-slate-100 flex justify-between items-center px-8">
          <div className="flex gap-6">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase">
              <Briefcase size={14} /> Placement Support
            </div>
             
          </div>
        </div>
      </div>

      <MultiModalPopup
        activeModal={activeModal}
        setActiveModal={(k) => setActiveModalState(k)}
        customTitle={customTitle}
        customImage={config.imageUrl}
        customDescription={customDescription}
        productId={config.productId}
         
      />
    </div>
  );
};

export default ReadMoreACCA;