"use client";
import React, { useState } from "react";
import { Plus, HelpCircle, BookOpen, Briefcase, Clock, ClipboardCheck, GraduationCap } from "lucide-react";
import MultiModalPopup, { ModalKey } from "@/components/props/MultiModalPopup";

// --- FAQ DATA ---
const faqs = [
  
  {
    category: "General",
    icon: HelpCircle,
    question: "Is ACCA or CA better?",
    answer: "Both are good options. If you are interested in global opportunities along with flexibility in learning, then you can opt for the ACCA Course. But if you consider working in India and are ready for tough exams, then you can choose CA."
  },
  {
    category: "Placement",
    icon: Briefcase,
    question: "What is an ACCA salary?",
    answer:(
      <div>
        <p className="mb-2">Salaries of an ACCA depend on various factors such as location, companies, and whether you are a certified ACCA or pursuing it. On average, a fresher in ACCA can roughly earn between Rs. 30K to Rs. 70K per annum, and qualified, experienced professionals can get salaries above Rs. 1 Lakh per month.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Freshers with a strong skill set - Rs. 3 Lakhs to Rs. 9 Lakhs per annum. </li>
          <li>Mid-level candidate with approx 7 to 8 years: Rs. 10 Lakhs to Rs. 18 Lakhs annually</li>
          <li>Senior level with approx 8 Years and above: Rs. 20 Lakhs to Rs. 50 Lakhs annually</li>
          <li>Top-level executives like CFO & Directors: Rs. 40 Lakhs to Rs. 80 Lakhs annually</li>
             
        </ul>
      </div>
    ),
  },
  
  {
    category: "General",
    icon: GraduationCap,
    question: "Can all students who have qualified 10+2 join ACCA Coaching?",
    answer: "Yes, 10+2 students can enrol for ACCA Coaching. If you are from a commerce background, you are eligible to directly register, whereas a non-commerce student must complete their ACCA foundation FA/ FIA before applying for ACCA."
  },
  {
    category: "General",
    icon: HelpCircle,
    question: "What is the purpose of the ACCA Course?",
    answer: "The ACCA course will teach you accounts, audits, taxes, and business finances. Basically, the course prepares you to work for companies, audit firms, or banks in 180+ countries, including India. In short, the ACCA students are ready for all types of finance roles across the globe. "
  },
  {
    category: "Curriculum",
    icon: BookOpen,
    question: "What are the ACCA Course subjects?",
    answer: (
  <div>
    <p className="mb-3">
      If you are looking forward to pursuing ACCA Online Courses, you will learn the subjects listed below:
    </p>

    <div className="space-y-4">
      <div>
        <p className="font-semibold mb-1">Applied Knowledge (Basics)</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Business & Technology</li>
          <li>Management Accounting</li>
          <li>Financial Accounting</li>
        </ul>
      </div>

      <div>
        <p className="font-semibold mb-1">Applied Skills (Intermediate)</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Corporate & Business Law</li>
          <li>Performance Management</li>
          <li>Taxation</li>
          <li>Financial Reporting</li>
          <li>Audit & Assurance</li>
          <li>Financial Management</li>
        </ul>
      </div>

      <div>
        <p className="font-semibold mb-1">Strategic Professional (Advanced)</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Strategic Business Leader</li>
          <li>Advanced Accounting</li>
          <li>
            Optional Papers (Any Two):
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Advanced Financial Management</li>
              <li>Advanced Audit & Assurance</li>
              <li>Advanced Taxation</li>
              <li>Advanced Performance Management</li>
            </ul>
          </li>
        </ul>
      </div>
    </div>

    <p className="mt-4">
      The course starts with the basics and transitions to the advanced level
    </p>
  </div>
)
 },
  {
    category: "Exams",
    icon: ClipboardCheck,
    question: "How are ACCA Exams conducted?",
    answer: "Mostly, the ACCA examinations are computer-based and are given at the ACCA-approved centres. Exams for the advanced subjects are conducted in exam windows two times annually."
  },
  {
    category: "General",
    icon: Clock,
    question: "What is the Duration of the ACCA Course?",
    answer: "ACCA Certification Programs offer flexible learning options that allow students to work acca course duration while they pursue their course. ACCA Course Duration depends on the individual and exemptions, and can be completed between 2 and 5 years."
  },
  {
    category: "Placement",
    icon: Briefcase,
    question: "What are the 13 subjects in ACCA?",
    answer:(
      <div>
        <p className="mb-2">The ACCA Course usually begins with 3 basic subjects, 6 intermediate, and moves to 4 advanced topics. Students have privileges to choose optional papers, which allows them to specialise in the areas of their choice.</p>
        <p><strong>The Subjects Are:</strong></p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Applied Knowledge:</strong> Business and Technology (BT), Management Accounting (MA) and Financial Accounting (FA) </li>
          <li><strong>Applied Skills:</strong> Corporate and Business Law (LW), Performance Management (PM), Taxation (TX), Financial Reporting (FR), Audit and Assurance (AA) and Financial Management (FM)</li>
          <li><strong>Strategic Professional:</strong> Strategic Business Leader (SBL), Strategic Business Reporting (SBR), Two optional subjects (choose 2), Advanced Financial Management (AFM), Advanced Performance Management (APM), Advanced Taxation (ATX) and Advanced Audit and Assurance (AAA)
</li>
          
             
        </ul>
      </div>
    ),
  },
  {
    category: "Placement",
    icon: Briefcase,
    question: "How many levels are there in the ACCA Certificate Course?",
    answer:(
      <div>
        <p className="mb-2">The ACCA Certificate Program has 3 levels:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>The Applied Knowledge:</strong> This level will cover all the basics of accounting, business, and management. </li>
          <li><strong>Applied Skills:</strong> At this level, students will learn intermediate subjects such as taxation, financial auditing, financial reporting, and management.</li>
          <li><strong>Strategic Professional:</strong> This is the last level of the course. At this phase, you will cover the advanced topics that teach you leadership, strategies, and the optional expert subjects of your choice. </li>
             
        </ul>
      </div>
    ),
  },
  {
    category: "General",
    icon: HelpCircle,
    question: "Is the ACCA Course Worth Pursuing in India?",
    answer: "The ACCA Program is a good option if you are aiming for global career opportunities with good salaries, such as corporate roles in MNCs and abroad. But, if you are looking for jobs in India, then prefer CA."
  },
  {
    category: "Placement",
    icon: Briefcase,
    question: "Will I get a job after the ACCA Course from IIM SKILLS?",
    answer: "Yes, to help learners secure the best opportunities, IIM SKILLS provides job assistance like mock interviews, corporate behaviour skills, and resume building. Our course will teach you all the ACCA skills and reward you with recognised certification upon completion of the course. However, getting a job also depends on an individual's effort"
  },
  {
    category: "General",
    icon: BookOpen,
    question: "Are Study Materials provided by IIM SKILLS?",
    answer: "YYes, IIM SKILLS provides learners with all the essential study material after a student completes the registration process and confirms the seat with IIM SKILLS. Along with the course study material, IIM SKILLS provides a lifetime free access to the LMS. LMS includes recordings of the live sessions along with course topics and assignments. "
  },
  {
    category: "Exams",
    icon: ClipboardCheck,
    question: "Is it allowed to retake the ACCA exams if I don’t clear on the first attempt?",
    answer: "Yes, of course, students can retake the ACCA exams if they fail to clear them in the first attempt. The course has no limitations on the number of attempts for most of the subjects. You can reapply for the next exam windows in March, June, September, and December."
  },
  {
    category: "Exams",
    icon: HelpCircle,
    question: "What is the ACCA Exams pattern?",
    answer: (
      <div>
      <p>ACCA exams are computer-based and are conducted only in the ACCA-approved centres. A few strategic professional exams require candidates to appear online or through exam windows. The exam duration for applied knowledge and applied skills is 2 to 3 hours, and for strategic professional papers lasts between 3 and 4 hours.</p>
     <p>The paper formats for the basics are mostly multiple choice questions (MCQs) and calculations, whereas the format for advanced strategic professionals' papers has case studies, scenario analysis, and written answers.</p>
    </div>
    )
  },
  {
    category: "Placement",
    icon: Briefcase,
    question: "What kind of companies are hiring ACCA Students and what is the average salary for freshers?",
    answer: "Big 4 audit firms like Deloitte, E&Y, PWC & KPMG highly prefer the ACCA certified candidates. Also, MNCs, top corporate firms, banks, financial institutes, consulting and advisory firms need qualified ACCA. Freshers are expected to earn between Rs. 3-9 LPA depending on their skills, location, and company. "
  },
  {
    category: "Curriculum",
    icon: GraduationCap,
    question: "What are the exemptions for ACCA Courses?",
    answer: (
      <div>
        <p className="mb-2">If a student has already studied similar subjects in college, university, or in any professional courses, then they are awarded exemptions based on their degrees.</p>
        <p className="mb-2">Only students who have cleared their graduation in B.com, M.com, or any other financial degrees are allowed for exemptions. Also, those who are pursuing professional courses like CA, CPA, and CIMA are eligible to skip papers. </p>
        <p className="mb-2">The exemptions allowed for different degrees/exams are as follows: </p>
        <ul className="list-disc pl-5 space-y-1">
           <li>BBA - 1 exemption</li>   
           <li>B.com, M.com - up to 4 exemptions</li>   
           <li>MBA -  up to 9 exemptions</li>   
           <li>CA Intermediate passouts - up to 5 exemptions</li>   
           <li>Cleared CA Final - up to 9 exemptions</li>   
        </ul>
      </div>
    ), },
  {
    category: "General",
    icon: HelpCircle,
    question: "Why is IIM SKILLS the Best Coaching Institute for ACCA?",
    answer: (
      <div>
        <p className="mb-2">The ACCA Online Course objectives are: </p>
        <ul className="list-disc pl-5 space-y-1">
           <li>Focus on preparing students to become qualified professionals in global finance and accounting</li>   
           <li>Make them competitive in working in different roles of accounting, auditing, taxation, and business management</li>   
           <li>Teaches how to accurately handle accounts, taxes, and audits.</li>   
           <li>Provide training in business laws, ethics, and corporate governance, which will improve your understanding of company operations and legalities</li>   
            
        </ul>
      </div>
    ), 
  },
  {
    category: "Placement",
    icon: Briefcase,
    question: "Why does IIM SKILLS stand as the Best Coaching Institute for ACCA Certification Courses?",
    answer: "The IIM SKILLS ACCA Program is a structured online training program designed by experienced industry professionals. The course is led by expert trainers who teach real industry skills. Along with this, students receive career support, doubt-solving sessions, mock tests, and valuable industry insights that prepare them for real-world work challenges."
  },
 
];

const FaqItem = ({ item, isOpen, onClick }: { item: typeof faqs[0], isOpen: boolean, onClick: () => void }) => {
  const Icon = item.icon;
  return (
    <div
      className={`
        border border-gray-100 rounded-2xl bg-white overflow-hidden transition-all duration-300 hover:shadow-md
        ${isOpen ? "shadow-lg ring-1 ring-blue-100" : ""}
      `}
    >
      <button
        onClick={onClick}
        className="w-full flex items-center gap-4 p-5 text-left focus:outline-none" // CHANGED: items-start to items-center
      >
        {/* CHANGED: Removed mt-1 to ensure perfect vertical centering */}
        <div className={`p-2 rounded-lg flex-shrink-0 transition-colors ${isOpen ? "bg-blue-100 text-blue-600" : "bg-gray-50 text-gray-400"}`}>
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex-grow">
          <span className={`text-base font-bold transition-colors ${isOpen ? "text-blue-800" : "text-gray-800"}`}>
            {item.question}
          </span>
        </div>

        <div className={`flex-shrink-0 transition-transform duration-300 ${isOpen ? "rotate-45 text-blue-600" : "text-gray-400"}`}>
          <Plus className="w-5 h-5" />
        </div>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="p-5 pt-0 pl-[4.5rem] text-sm text-gray-600 leading-relaxed">
          {item.answer}
        </div>
      </div>
    </div>
  );
};

const FaqSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [activeModal, setActiveModal] = useState<ModalKey | null>(null);
  const [customTitle, setCustomTitle] = useState<string>("");
  const [customDescription, setCustomDescription] = useState<string>("");

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-10 bg-gray-50 font-sans relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 mb-16 text-center relative z-10">
        <span className="text-orange-600 font-bold tracking-widest text-sm uppercase mb-2">Have Questions?</span>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
          Frequently Asked <span className="text-blue-700">Questions</span>
        </h2>
        <p className="text-[14px] md:text-base text-gray-800 max-w-3xl mx-auto">
          Clear your doubts about the curriculum, placements, and certifications.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="flex flex-col gap-4">
            {faqs.slice(0, Math.floor(faqs.length / 2)).map((faq, index) => (
              <FaqItem
                key={index}
                item={faq}
                isOpen={openIndex === index}
                onClick={() => toggleFaq(index)}
              />
            ))}
          </div>
          <div className="flex flex-col gap-4">
            {faqs.slice(Math.floor(faqs.length / 2)).map((faq, index) => {
              const actualIndex = index + Math.floor(faqs.length / 2);
              return (
                <FaqItem
                  key={actualIndex}
                  item={faq}
                  isOpen={openIndex === actualIndex}
                  onClick={() => toggleFaq(actualIndex)}
                />
              );
            })}
          </div>
        </div>

        <div className="text-center mt-16">
          <p className="text-gray-600 mb-6 font-medium">Didn't find what you were looking for?</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => {
                setActiveModal("ACCA");
                setCustomTitle("Chat with a Mentor");
                setCustomDescription("Connect with an industry mentor for a quick 15-minute session about the course and career options.");
              }}
              className="px-8 py-3.5 rounded-xl bg-orange-500 text-white font-bold shadow-lg hover:bg-orange-600 transition-all hover:-translate-y-1"
            >
              Chat with a Mentor
            </button>
            <button
              onClick={() => {
                setActiveModal("ACCA");
                setCustomTitle("Request a Call Back");
                setCustomDescription("Leave your number and preferred time — our admissions team will call you back.");
              }}
              className="px-8 py-3.5 rounded-xl bg-white border border-gray-200 text-blue-700 font-bold hover:border-blue-200 hover:bg-blue-50 transition-colors"
            >
              Request a Call Back
            </button>
          </div>
        </div>
      </div>

      <MultiModalPopup
        activeModal={activeModal}
        setActiveModal={setActiveModal}
        customTitle={customTitle}
        customDescription={customDescription}
      />
    </section>
  );
};

export default FaqSection;