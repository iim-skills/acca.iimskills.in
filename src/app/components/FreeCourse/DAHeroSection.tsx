// "use client";

// import React, { useState, useEffect } from "react";
// import { 
//   CheckCircle2, 
//   ArrowRight, 
//   ShieldCheck, 
//   Download, 
//   Award, 
//   X, 
//   MessageCircle 
// } from "lucide-react";

// /* -------------------------------------------------------------------------- */
// /* STYLES                                                                     */
// /* -------------------------------------------------------------------------- */
// const styles = `
//   @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-12px); } 100% { transform: translateY(0px); } }
//   @keyframes float-delay { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
//   @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
//   .animate-float { animation: float 6s ease-in-out infinite; }
//   .animate-float-delay { animation: float-delay 7s ease-in-out infinite; animation-delay: 1s; }
//   .animate-shimmer {
//     background: linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent);
//     background-size: 200% 100%;
//     animation: shimmer 2s infinite linear;
//   }
  
//   section[class*="min-h-screen"] {
//     display: flex;
//     align-items: center;
//     min-height: 100vh;
//     padding-top: 2.5rem;
//     padding-bottom: 2.5rem;
//   }

//   @media (min-height: 900px) {
//     section[class*="min-h-screen"] {
//       min-height: calc(100vh - 96px);
//     }
//   }

//   @media (max-height: 600px) {
//     section[class*="min-h-screen"] {
//       min-height: auto;
//       padding-top: 2rem;
//       padding-bottom: 2rem;
//     }
//   }
// `;

// /* -------------------------------------------------------------------------- */
// /* TYPES                                                                      */
// /* -------------------------------------------------------------------------- */
// export type ModalKey = "FreeDA" | "Video" | null;
// export type CourseKey = "da";

// type CourseConfigType = {
//   imageUrl: string;
//   productId: string;
//   contactOwner: string;
//   redirectUrl: string;
//   courseKey?: CourseKey;
// };

// const courseConfigs: Record<string, CourseConfigType> = {
//   DACB: {
//     imageUrl: "/DemoImage/DA.png",
//     productId: "FDAMC",
//     contactOwner: "IIM SKILLS",
//     redirectUrl: "/free-courses/free-data-analytics-course",
//     courseKey: "da",
//   },
// };

// /* -------------------------------------------------------------------------- */
// /* COMPONENT: ContactForm (Inlined)                                           */
// /* -------------------------------------------------------------------------- */
// const ContactForm = ({ productId, contactOwner, redirectUrl }: { productId: string, contactOwner: string, redirectUrl: string }) => {
//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     phone: "",
//     productId: productId,
//     contactOwner: contactOwner,
//     registrationType: "Hero Section Form",
//     utmSource: "",
//     utmMedium: "",
//     utmCampaign: "",
//     pageUrl: "",
//     referrer: "",
//     hutk: "",
//     timestamp: "",
//   });

//   const [error, setError] = useState<string | null>(null);
//   const [submitting, setSubmitting] = useState(false);
//   const [acceptedTerms, setAcceptedTerms] = useState(true);

//   useEffect(() => {
//     if (typeof window !== "undefined") {
//       const urlParams = new URLSearchParams(window.location.search);
//       setFormData((prev) => ({
//         ...prev,
//         utmSource: urlParams.get("utm_source") || "",
//         utmMedium: urlParams.get("utm_medium") || "",
//         utmCampaign: urlParams.get("utm_campaign") || "",
//         pageUrl: window.location.href,
//         referrer: document.referrer,
//         timestamp: new Date().toISOString(),
//       }));
//     }
//   }, []);

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError(null);

//     if (!acceptedTerms) {
//       setError("Please accept the Terms & Conditions.");
//       return;
//     }

//     if (!formData.name || !formData.email || !formData.phone) {
//       setError("Please fill in all required fields.");
//       return;
//     }

//     setSubmitting(true);
    
//     // Simulate API call
//     setTimeout(() => {
//       // In a real app, this would be your fetch call
//       // console.log("Submitting form:", formData);
//       setSubmitting(false);
      
//       // Use standard window location for redirect instead of Next.js router
//       window.location.href = redirectUrl || "/Thank-You/"; 
//     }, 1500);
//   };

//   const waHref = `https://api.whatsapp.com/send?phone=919654128205&text=${encodeURIComponent("Hello IIMSKILLS Please let me know more about your courses.")}`;

//   return (
//     <form onSubmit={handleSubmit} className="space-y-5" noValidate>
//       <div className="relative group">
//         <input
//           name="name"
//           id="name"
//           type="text"
//           required
//           value={formData.name}
//           onChange={handleChange}
//           className="peer w-full border-b-2 border-gray-200 py-3 placeholder-transparent focus:border-blue-600 focus:outline-none bg-transparent transition-colors text-base"
//           placeholder="Name"
//         />
//         <label htmlFor="name" className="absolute left-0 -top-4 text-gray-500 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-focus:-top-4 peer-focus:text-gray-600 peer-focus:text-sm">
//           Full Name
//         </label>
//       </div>

//       <div className="relative group">
//         <input
//           name="email"
//           type="email"
//           id="email"
//           required
//           value={formData.email}
//           onChange={handleChange}
//           className="peer w-full border-b-2 border-gray-200 py-3 placeholder-transparent focus:border-blue-600 focus:outline-none bg-transparent transition-colors text-base"
//           placeholder="Email"
//         />
//         <label htmlFor="email" className="absolute left-0 -top-4 text-gray-500 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-focus:-top-4 peer-focus:text-gray-600 peer-focus:text-sm">
//           Email Address
//         </label>
//       </div>

//       <div className="relative group">
//         <div className="flex items-center border-b-2 border-gray-200 focus-within:border-blue-600 transition-colors">
//             <span className="text-gray-500 mr-2 text-base pt-1">+91</span>
//             <input
//             name="phone"
//             type="tel"
//             id="phone"
//             required
//             value={formData.phone}
//             onChange={handleChange}
//             className="peer w-full py-3 placeholder-transparent focus:outline-none bg-transparent text-base"
//             placeholder="Phone"
//             />
//         </div>
//         <label htmlFor="phone" className="absolute left-0 -top-4 text-gray-500 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-focus:-top-4 peer-focus:text-gray-600 peer-focus:text-sm pointer-events-none">
//           Phone Number
//         </label>
//       </div>

//       {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}

//       <div className="flex items-start gap-3">
//         <input
//           id="termsCheckboxHero"
//           type="checkbox"
//           checked={acceptedTerms}
//           onChange={(e) => setAcceptedTerms(e.target.checked)}
//           className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
//         />
//         <label htmlFor="termsCheckboxHero" className="text-xs text-gray-500 leading-5">
//           I agree to the <a href="#" className="text-blue-600 underline">Terms & Conditions</a> and <a href="#" className="text-blue-600 underline">Privacy Policy</a>.
//         </label>
//       </div>

//       <button
//         type="submit"
//         disabled={submitting || !acceptedTerms}
//         className="relative w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold py-4 px-5 rounded-xl shadow-lg hover:shadow-blue-300/40 transform hover:-translate-y-0.5 transition-all overflow-hidden group text-base disabled:opacity-60 disabled:cursor-not-allowed"
//       >
//         <div className="absolute top-0 left-0 w-full h-full animate-shimmer opacity-20"></div>
//         <div className="relative flex items-center justify-center gap-3">
//           {submitting ? "Submitting..." : "Download Brochure"}
//           <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform" />
//         </div>
//       </button>

//       <div className="mt-3 text-center">
//         <a href={waHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-green-600 hover:underline">
//           <MessageCircle className="w-4 h-4 text-green-600" />
//           Get updates on WhatsApp
//         </a>
//       </div>
//     </form>
//   );
// };

// /* -------------------------------------------------------------------------- */
// /* COMPONENT: MultiModalPopup (Inlined & Simplified)                          */
// /* -------------------------------------------------------------------------- */
// const MultiModalPopup = ({ 
//   activeModal, 
//   setActiveModal, 
//   customTitle, 
//   customDescription, 
//   productId 
// }: { 
//   activeModal: ModalKey, 
//   setActiveModal: (key: ModalKey) => void,
//   customTitle?: string,
//   customDescription?: string,
//   customImage?: string,
//   productId?: string,
//   courseKey?: string
// }) => {
//   if (!activeModal) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
//       <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300 relative">
//         <button 
//           onClick={() => setActiveModal(null)}
//           className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10 p-1 hover:bg-gray-100 rounded-full transition-colors"
//         >
//           <X className="w-6 h-6" />
//         </button>

//         <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white text-center">
//           <h3 className="text-2xl font-bold mb-2">{customTitle || "Start Learning"}</h3>
//           <p className="text-blue-100 opacity-90 text-sm">{customDescription || "Fill the details below to proceed"}</p>
//         </div>

//         <div className="p-6">
//            {/* Reusing the contact form inside the modal for simplicity */}
//            <ContactForm productId={productId || "POPUP"} contactOwner="IIM SKILLS" redirectUrl="/dashboard" />
//         </div>
//       </div>
//     </div>
//   );
// };

// /* -------------------------------------------------------------------------- */
// /* MAIN COMPONENT: HeroSec                                                    */
// /* -------------------------------------------------------------------------- */
// export default function HeroSec() {
//   const [activeModal, setActiveModalState] = useState<ModalKey | null>(null);
//   const [customTitle, setCustomTitle] = useState<string | undefined>();
//   const [customDescription, setCustomDescription] = useState<string | undefined>();

//   // ✅ Access the configuration
//   const config = courseConfigs["DACB"];

//   const features = [
//     "100% free course with zero enrollment charges",
//     "Free access to the pre-recorded sessions",
//     "Excel Certification | Learn job-ready skills",
//     "Self-paced free learning program",
//   ];

//   const setActiveModal = (key: ModalKey | null) => {
//     setActiveModalState(key);
//   };

//   return (
//     <section className="relative bg-gradient-to-b from-blue-50 via-white to-blue-50 min-h-screen font-sans overflow-hidden">
//       <style>{styles}</style>

//       {/* ----------------- Background Elements ----------------- */}
//       <div className="absolute inset-0 overflow-hidden pointer-events-none">
//         <div className="absolute -top-16 -left-16 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
//         <div className="absolute -bottom-36 -right-16 w-[30rem] h-[30rem] bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float-delay"></div>
//         <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-30"></div>
//       </div>

//       <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 pt-0 pb-12 lg:pb-16 grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
        
//         {/* ----------------- Left Content ----------------- */}
//         <div className="lg:col-span-3 space-y-8 text-center lg:text-left">
//           <div className="space-y-4">
//             {/* Badge */}
//             <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 border border-blue-200 text-blue-800 text-sm font-semibold tracking-wide shadow-sm mx-auto lg:mx-0">
//               <ShieldCheck className="w-4 h-4 text-blue-600" />
//               GOVT. RECOGNIZED CERTIFICATION
//             </div>

//             {/* Heading */}
//             <h1 className="font-light text-slate-900 leading-[1.1]">
//               <div className="text-3xl md:text-5xl lg:text-6xl font-semibold text-slate-700">
//                 Certified Free <br className="hidden lg:block" />
//                 <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
//                   Data Analytics Course
//                 </span>
//               </div>
//             </h1>

//             {/* Subheading */}
//             <p className="text-lg text-gray-600 max-w-2xl leading-relaxed mx-auto lg:mx-0">
//               Number 1 institute for Data Analytics Course - <span className="font-semibold text-blue-700">Advanced Excel</span>
//             </p>
//           </div>

//           {/* Features List */}
//           <div className="space-y-3 max-w-xl mx-auto lg:mx-0">
//             {features.map((point, idx) => (
//               <div key={idx} className="flex items-start gap-3 text-left">
//                 <div className="mt-1 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
//                   <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
//                 </div>
//                 <span className="text-base text-gray-700">{point}</span>
//               </div>
//             ))}
//           </div>

//           {/* Rankings / Social Proof */}
//           <div className="pt-4">
//             {/* <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-widest">
//               Ranked #1 Program by
//             </p>
//             <div className="flex items-center justify-center lg:justify-start gap-6 grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
              
//               <img src="/BAT/financial-express.png" alt="Financial Express" className="h-6 w-auto object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
//               <img src="/BAT/india-today.png" alt="India Today" className="h-6 w-auto object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
//             </div> */}
//           </div>

//           {/* CTA Button */}
//           <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 mt-6">
//             {/* <button
//               onClick={() => {
//                 setActiveModalState("FreeDA");
//                 setCustomTitle("Start Learning for Free");
//                 setCustomDescription("Access Beginner-friendly Learning Modules");
//               }}
//               className="relative w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-blue-300/40 transform hover:-translate-y-0.5 transition-all overflow-hidden group text-base"
//             >
//               <div className="absolute top-0 left-0 w-full h-full animate-shimmer opacity-20"></div>
//               <div className="relative flex items-center justify-center gap-3">
//                 <Download className="w-4 h-4" />
//                 Start Learning for Free
//                 <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform" />
//               </div>
//             </button> */}
//             <a href="" target="">
//               <button className="relative w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-blue-300/40 transform hover:-translate-y-0.5 transition-all overflow-hidden group text-base"
//             >
//               <div className="absolute top-0 left-0 w-full h-full animate-shimmer opacity-20"></div>
//               <div className="relative flex items-center justify-center gap-3">
//                 <Download className="w-4 h-4" />
//                 Start Now
//                 <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform" />
//               </div>
//             </button>
//             </a>
//           </div>
//         </div>

//         {/* ----------------- Right Content (Form) ----------------- */}
//         <div className="lg:col-span-2 relative w-full max-w-md mx-auto lg:max-w-full">
//           {/* Floating Icon Decoration (Replacing LiaAwardSolid with Lucide Award) */}
//           <div className="absolute -top-6 -right-6 bg-white p-3 rounded-2xl shadow-xl animate-float-delay z-20 hidden md:block">
//             <Award className="w-8 h-8 text-orange-400" />
//           </div>

//           {/* Form Card Container */}
//           <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_18px_44px_-10px_rgba(0,0,0,0.09)] border border-white/50 relative z-10 overflow-hidden transform transition-all hover:shadow-[0_26px_56px_-12px_rgba(59,130,246,0.15)]">
            
//             {/* Header Section */}
//             <div className="bg-gradient-to-r from-blue-900 to-blue-800 p-5 relative overflow-hidden">
//               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
//               <h3 className="text-white text-lg font-bold relative z-10">
//                 Get Complete Details
//               </h3>
//               <p className="text-blue-200 text-[12px] mt-1 relative z-10 flex items-center gap-2">
//                 <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
//                 Enrollment Closing Soon
//               </p>
//             </div>

//             {/* Inner Content - ContactForm */}
//             <div className="p-6 md:p-8">
//               <ContactForm
//                 productId="FDAMC"
//                 contactOwner={config.contactOwner}
//                 redirectUrl="/free-courses/free-data-analytics-course/curriculum"
//               />
//             </div>
//           </div>
//         </div>

//       </div>

//       {/* Modal Popup */}
//       <MultiModalPopup
//         activeModal={activeModal}
//         setActiveModal={setActiveModal}
//         customTitle={customTitle}
//         customImage={config.imageUrl}
//         customDescription={customDescription}
//         productId={config.productId}
//         courseKey={config.courseKey}
//       />
//     </section>
//   );
// }

"use client";

import React, { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Download, 
  Award, 
  X, 
  MessageCircle,
  BarChart3,
  TrendingUp,
  Database,
  PieChart
} from "lucide-react";
import Link from "next/link";

/* -------------------------------------------------------------------------- */
/* STYLES                                                                     */
/* -------------------------------------------------------------------------- */
const styles = `
  @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-12px); } 100% { transform: translateY(0px); } }
  @keyframes float-delay { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
  @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
  .animate-float { animation: float 6s ease-in-out infinite; }
  .animate-float-delay { animation: float-delay 7s ease-in-out infinite; animation-delay: 1s; }
  .animate-shimmer {
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent);
    background-size: 200% 100%;
    animation: shimmer 2s infinite linear;
  }
  
  section[class*="min-h-screen"] {
    display: flex;
    align-items: center;
    min-height: 100vh;
    padding-top: 2.5rem;
    padding-bottom: 2.5rem;
  }

  @media (min-height: 900px) {
    section[class*="min-h-screen"] {
      min-height: calc(100vh - 96px);
    }
  }

  @media (max-height: 600px) {
    section[class*="min-h-screen"] {
      min-height: auto;
      padding-top: 2rem;
      padding-bottom: 2rem;
    }
  }
`;

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */
export type ModalKey = "FreeDA" | "Video" | null;
export type CourseKey = "da";

type CourseConfigType = {
  imageUrl: string;
  productId: string;
  contactOwner: string;
  redirectUrl: string;
  courseKey?: CourseKey;
};

const courseConfigs: Record<string, CourseConfigType> = {
  DACB: {
    imageUrl: "/DemoImage/DA.png",
    productId: "FDAMC",
    contactOwner: "IIM SKILLS",
    redirectUrl: "/free-courses/free-data-analytics-course",
    courseKey: "da",
  },
};

/* -------------------------------------------------------------------------- */
/* COMPONENT: ContactForm (Inlined)                                           */
/* -------------------------------------------------------------------------- */
const ContactForm = ({ productId, contactOwner, redirectUrl }: { productId: string, contactOwner: string, redirectUrl: string }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    productId: productId,
    contactOwner: contactOwner,
    registrationType: "Hero Section Form",
    utmSource: "",
    utmMedium: "",
    utmCampaign: "",
    pageUrl: "",
    referrer: "",
    hutk: "",
    timestamp: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      setFormData((prev) => ({
        ...prev,
        utmSource: urlParams.get("utm_source") || "",
        utmMedium: urlParams.get("utm_medium") || "",
        utmCampaign: urlParams.get("utm_campaign") || "",
        pageUrl: window.location.href,
        referrer: document.referrer,
        timestamp: new Date().toISOString(),
      }));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!acceptedTerms) {
      setError("Please accept the Terms & Conditions.");
      return;
    }

    if (!formData.name || !formData.email || !formData.phone) {
      setError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setSubmitting(false);
      window.location.href = redirectUrl || "/Thank-You/"; 
    }, 1500);
  };

  const waHref = `https://api.whatsapp.com/send?phone=919654128205&text=${encodeURIComponent("Hello IIMSKILLS Please let me know more about your courses.")}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="relative group">
        <input
          name="name"
          id="name"
          type="text"
          required
          value={formData.name}
          onChange={handleChange}
          className="peer w-full border-b-2 border-gray-200 py-3 placeholder-transparent focus:border-blue-600 focus:outline-none bg-transparent transition-colors text-base"
          placeholder="Name"
        />
        <label htmlFor="name" className="absolute left-0 -top-4 text-gray-500 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-focus:-top-4 peer-focus:text-gray-600 peer-focus:text-sm">
          Full Name
        </label>
      </div>

      <div className="relative group">
        <input
          name="email"
          type="email"
          id="email"
          required
          value={formData.email}
          onChange={handleChange}
          className="peer w-full border-b-2 border-gray-200 py-3 placeholder-transparent focus:border-blue-600 focus:outline-none bg-transparent transition-colors text-base"
          placeholder="Email"
        />
        <label htmlFor="email" className="absolute left-0 -top-4 text-gray-500 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-focus:-top-4 peer-focus:text-gray-600 peer-focus:text-sm">
          Email Address
        </label>
      </div>

      <div className="relative group">
        <div className="flex items-center border-b-2 border-gray-200 focus-within:border-blue-600 transition-colors">
            <span className="text-gray-500 mr-2 text-base pt-1">+91</span>
            <input
            name="phone"
            type="tel"
            id="phone"
            required
            value={formData.phone}
            onChange={handleChange}
            className="peer w-full py-3 placeholder-transparent focus:outline-none bg-transparent text-base"
            placeholder="Phone"
            />
        </div>
        <label htmlFor="phone" className="absolute left-0 -top-4 text-gray-500 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-focus:-top-4 peer-focus:text-gray-600 peer-focus:text-sm pointer-events-none">
          Phone Number
        </label>
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}

      <div className="flex items-start gap-3">
        <input
          id="termsCheckboxHero"
          type="checkbox"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="termsCheckboxHero" className="text-xs text-gray-500 leading-5">
          I agree to the <a href="#" className="text-blue-600 underline">Terms & Conditions</a> and <a href="#" className="text-blue-600 underline">Privacy Policy</a>.
        </label>
      </div>

      <button
        type="submit"
        disabled={submitting || !acceptedTerms}
        className="relative w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold py-4 px-5 rounded-xl shadow-lg hover:shadow-blue-300/40 transform hover:-translate-y-0.5 transition-all overflow-hidden group text-base disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <div className="absolute top-0 left-0 w-full h-full animate-shimmer opacity-20"></div>
        <div className="relative flex items-center justify-center gap-3">
          {submitting ? "Submitting..." : "Download Brochure"}
          <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </button>

      <div className="mt-3 text-center">
        <a href={waHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-green-600 hover:underline">
          <MessageCircle className="w-4 h-4 text-green-600" />
          Get updates on WhatsApp
        </a>
      </div>
    </form>
  );
};

/* -------------------------------------------------------------------------- */
/* COMPONENT: MultiModalPopup (Inlined & Simplified)                          */
/* -------------------------------------------------------------------------- */
const MultiModalPopup = ({ 
  activeModal, 
  setActiveModal, 
  customTitle, 
  customDescription, 
  productId 
}: { 
  activeModal: ModalKey, 
  setActiveModal: (key: ModalKey) => void,
  customTitle?: string,
  customDescription?: string,
  customImage?: string,
  productId?: string,
  courseKey?: string
}) => {
  if (!activeModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300 relative">
        <button 
          onClick={() => setActiveModal(null)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10 p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white text-center">
          <h3 className="text-2xl font-bold mb-2">{customTitle || "Start Learning"}</h3>
          <p className="text-blue-100 opacity-90 text-sm">{customDescription || "Fill the details below to proceed"}</p>
        </div>

        <div className="p-6">
           <ContactForm productId={productId || "POPUP"} contactOwner="IIM SKILLS" redirectUrl="/dashboard" />
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* MAIN COMPONENT: HeroSec                                                    */
/* -------------------------------------------------------------------------- */
export default function HeroSec() {
  const [activeModal, setActiveModalState] = useState<ModalKey | null>(null);
  const [customTitle, setCustomTitle] = useState<string | undefined>();
  const [customDescription, setCustomDescription] = useState<string | undefined>();

  const config = courseConfigs["DACB"];

  const features = [
    { text: "100% free course with zero enrollment charges", icon: <ShieldCheck size={20} /> },
    { text: "Free access to the pre-recorded sessions", icon: <Award size={20} /> },
    { text: "Excel Certification | Learn job-ready skills", icon: <CheckCircle2 size={20} /> },
    { text: "Self-paced free learning program", icon: <Download size={20} /> },
  ];

  const setActiveModal = (key: ModalKey | null) => {
    setActiveModalState(key);
  };

  return (
    <section className="relative bg-gradient-to-b from-blue-50 via-white to-blue-50 pt-10 font-sans overflow-hidden">
      <style>{styles}</style>

      {/* ----------------- Background Elements ----------------- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-16 -left-16 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
        <div className="absolute -bottom-36 -right-16 w-[30rem] h-[30rem] bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float-delay"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-30"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 pt-0 pb-10 lg:pb-10 flex gap-10 flex-wrap items-center">
        
        {/* ----------------- Left Content ----------------- */}
        <div className="space-y-8 w-full md:w-[55%] text-center lg:text-left">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 border border-blue-200 text-blue-800 text-sm font-semibold tracking-wide shadow-sm mx-auto lg:mx-0">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              GOVT. RECOGNIZED CERTIFICATION
            </div>

            <h1 className="font-light text-slate-900 leading-[1.1]">
              <div className="text-2xl md:text-4xl lg:text-5xl font-semibold text-slate-700">
                Certified Free <br className="hidden lg:block" />
                <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  Data Analytics Course
                </span>
              </div>
            </h1>

            <p className="text-lg text-gray-600 max-w-2xl leading-relaxed mx-auto lg:mx-0">
              Number 1 institute for Data Analytics Course - <span className="font-semibold text-blue-700">Advanced Excel</span>
            </p>
          </div>

          {/* New Grid Design for Points */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((item, idx) => (
              <div key={idx} className="flex items-center p-3.5 bg-white/70 backdrop-blur-sm border border-blue-100 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-300 group">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg mr-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  {item.icon}
                </div>
                <span className="text-sm font-medium text-slate-700 leading-tight text-left">{item.text}</span>
              </div>
            ))}
          </div>

          {/* <div className="pt-4">
            <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-widest">
              Ranked #1 Program by
            </p>
            <div className="flex items-center justify-center lg:justify-start gap-6 grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
              <img src="/BAT/financial-express.png" alt="Financial Express" className="h-6 w-auto object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
              <img src="/BAT/india-today.png" alt="India Today" className="h-6 w-auto object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
            </div>
          </div> */}

          <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 mt-6">
            {/* <button
              onClick={() => {
                setActiveModalState("FreeDA");
                setCustomTitle("Start Learning for Free");
                setCustomDescription("Access Beginner-friendly Learning Modules");
              }}
              className="relative w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-blue-300/40 transform hover:-translate-y-0.5 transition-all overflow-hidden group text-base"
            >
              <div className="absolute top-0 left-0 w-full h-full animate-shimmer opacity-20"></div>
              <div className="relative flex items-center justify-center gap-3">
                <Download className="w-4 h-4" />
                Start Learning for Free
                <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button> */}

             <Link href="/free-courses/free-data-analytics-course/curriculum/" className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-blue-500/30 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 ${className}">
                      Start Your Journey   
                </Link>
          </div>
        </div>

        {/* ----------------- Right Content (Replaced Form with Image) ----------------- */}
        <div className="relative w-full md:w-[40%] mx-auto lg:max-w-none lg:ml-auto perspective-1000">
           {/* Background Glow */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] bg-blue-200/40 rounded-full blur-3xl -z-10 animate-pulse"></div>
           
           {/* Main Image Container */}
           <div className="relative rounded-3xl overflow-hidden shadow-2xl border-[6px] border-white/40 backdrop-blur-sm group transform transition-transform hover:scale-[1.02] duration-500">
              <img 
                src="/DA-free.png" 
                alt="Data Analytics Course Dashboard" 
                className="w-full h-auto object-cover"
                onError={(e) => {
                  // Fallback if unsplash fails, though it's reliable
                  e.currentTarget.style.display = "none";
                }}
              />
              
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 to-transparent opacity-60"></div>

              {/* Floating Element 1 (Top Right) */}
              <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-lg animate-float">
                 <div className="flex items-center gap-2">
                    <div className="bg-orange-100 p-1.5 rounded-full">
                       <Award className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                       <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">1 Globally</p>
                       <p className="text-sm font-bold text-gray-800">Accredited Certificate</p>
                    </div>
                 </div>
              </div>

              {/* Floating Element 2 (Bottom Left) */}
              <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-blue-50 animate-float-delay max-w-[200px] sm:max-w-xs">
                <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-full shrink-0">
                        <BarChart3 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-800 leading-tight">Master Tools</p>
                        <p className="text-xs text-gray-500 mt-1">Excel, PowerBI, Python & SQL included in curriculum.</p>
                    </div>
                </div>
              </div>
           </div>
        </div>

      </div>

      {/* Modal Popup */}
      <MultiModalPopup
        activeModal={activeModal}
        setActiveModal={setActiveModal}
        customTitle={customTitle}
        customImage={config.imageUrl}
        customDescription={customDescription}
        productId={config.productId}
        courseKey={config.courseKey}
      />
    </section>
  );
}