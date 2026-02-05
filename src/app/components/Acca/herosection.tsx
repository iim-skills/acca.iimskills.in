"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { SiWhatsapp } from "react-icons/si";
import { CheckCircle2, ArrowRight, ShieldCheck, Star, Sparkles, Award } from "lucide-react";

const logoList = [
  { src: "/HiringPartners/barclays.png", alt: "Barclays", sizeClass: "h-5" },
  { src: "/HiringPartners/moodys.png", alt: "Moody's", sizeClass: "h-5" },
  { src: "/HiringPartners/blackstone.png", alt: "Blackstone", sizeClass: "h-5" },
  { src: "/HiringPartners/sg-analytics.png", alt: "SG Analytics", sizeClass: "h-5" },
  { src: "/HiringPartners/JPMorgan.png", alt: "JPMorgan", sizeClass: "h-5" },
  { src: "/HiringPartners/MorganStanley.png", alt: "Morgan Stanley", sizeClass: "h-5" },
];

const styles = `
  @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-12px); } 100% { transform: translateY(0px); } }
  @keyframes float-delay { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
  @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
  @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
  .animate-float { animation: float 6s ease-in-out infinite; }
  .animate-float-delay { animation: float-delay 7s ease-in-out infinite; animation-delay: 1s; }
  .animate-shimmer {
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent);
    background-size: 200% 100%;
    animation: shimmer 2s infinite linear;
  }
  .animate-marquee { animation: marquee 26s linear infinite; }

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

/* -------------------------
   Helper functions (from BrochureForm)
   ------------------------- */
function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : "";
}

function getQueryParam(param: string): string {
  if (typeof window === "undefined") return "";
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param) || "";
}

const HeroSection = () => {
  // Duplicate logos to create a seamless marquee loop
  const marqueeLogos = [...logoList, ...logoList];

  // router for redirect on success
  const router = useRouter();

  // --- Form state (adopted from BrochureForm) ---
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    productId: "ACCA",
    contactOwner: "IIM SKILLS",
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
    setFormData((prev) => ({
      ...prev,
      utmSource: getQueryParam("utm_source"),
      utmMedium: getQueryParam("utm_medium"),
      utmCampaign: getQueryParam("utm_campaign"),
      pageUrl: typeof window !== "undefined" ? window.location.href : prev.pageUrl,
      referrer: typeof document !== "undefined" ? document.referrer : prev.referrer,
      hutk: getCookie("hubspotutk"),
      timestamp: new Date().toISOString(),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePhoneChange = (value: string) => {
    setFormData((prev) => ({ ...prev, phone: value }));
  };

  const pushLeadToGTM = () => {
    const ref = typeof document !== "undefined" ? document.referrer : "";
    let leadType: "direct" | "organic" = "direct";
    if (ref && ref.indexOf("google.com") !== -1) leadType = "organic";

    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push({
      event: "lead_submission",
      lead_type: leadType,
      page_path: typeof window !== "undefined" ? window.location.pathname : "",
      productId: formData.productId,
      contactOwner: formData.contactOwner,
      utmSource: formData.utmSource,
      utmMedium: formData.utmMedium,
      utmCampaign: formData.utmCampaign,
      hutk: formData.hutk,
      timestamp: new Date().toISOString(),
    });
  };

  const validateRequiredFields = () => {
    const missing: string[] = [];
    if (!formData.name.trim()) missing.push("Name");
    if (!formData.email.trim()) missing.push("Email");
    if (!formData.phone || formData.phone.replace(/\D/g, "").length < 6) missing.push("Phone");
    return missing;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!acceptedTerms) {
      setError("Please accept the Terms & Conditions and Privacy Policy.");
      return;
    }

    const missing = validateRequiredFields();
    if (missing.length > 0) {
      setError(`Please provide the following required fields: ${missing.join(", ")}`);
      return;
    }

    pushLeadToGTM();
    setSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        // <-- NEW: redirect to thank-you page on success
        router.push("/Thank-You/Acca-Course/");
      } else {
        setError(result.message || "Submission failed. Please try again.");
        setSubmitting(false);
      }
    } catch (err) {
      setError("An error occurred while submitting. Please try again later.");
      setSubmitting(false);
    }
  };

  const phoneDigits = formData.phone.replace(/\D/g, "");
  const hasValidUserPhone = phoneDigits.length >= 6;
  const defaultNumber = "919654128205";
  const useNumber = hasValidUserPhone ? phoneDigits : defaultNumber;
  const waMessage = encodeURIComponent(`Hello IIMSKILLS, Please let me know more about ACCA Course`);
  const waHref = `https://api.whatsapp.com/send?phone=${useNumber}&text=${waMessage}`;

  return (
    <section className="relative bg-gradient-to-b from-blue-50 via-white to-blue-50 font-sans overflow-hidden">
      <style>{styles}</style>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-16 -left-16 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
        <div className="absolute -bottom-36 -right-16 w-[30rem] h-[30rem] bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float-delay"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-30"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-8 pt-10 lg:pt-16 pb-10 lg:pb-16 grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
        <div className="lg:col-span-3 space-y-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 border border-blue-200 text-blue-800 text-sm font-semibold tracking-wide shadow-sm">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Globally Certified Accounting Professional
            </div>
              <h1 className="text-3xl text-center md:text-left lg:text-5xl font-light text-slate-900 leading-[1.1]">
              <span className="whitespace-wrap font-semibold">
                Master Globally {" "}
                <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                   Recognized ACCA Coaching 
                </span>
              </span>
              
              <span className="text-3xl md:text-5xl lg:text-6xl font-semibold text-slate-600">
                
              </span>
            </h1>

             <p className="text-base md:text-lg text-center md:text-left text-gray-600 max-w-2xl leading-relaxed">
              Get fully prepared for Global Career Opportunities with IIM SKILLS Certified ACCA Coaching through  
{" "}
              <span className="font-semibold text-blue-700">expert guidance, practice sessions & mock tests.</span>
            </p>
          </div>

        <div className="grid grid-cols-2 gap-4 max-w-md">
                    <div className="bg-white/60 border border-blue-50 p-4 rounded-2xl backdrop-blur-md shadow-sm">
                      <div className="flex items-center gap-3 mb-1">
                        <Star className="w-5 h-5 text-orange-400 fill-current" />
                        <span className="font-bold text-xl md:text-2xl text-gray-900">4.9/5</span>
                      </div>
                      <p className="text-[12px] text-sm text-gray-500 font-medium">Rated by 3000+ Alumni</p>
                    </div>
                    <div className="bg-white/60 border border-blue-50 p-4 rounded-2xl backdrop-blur-md shadow-sm">
                      <div className="flex items-center gap-3 mb-1">
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">✓</div>
                        <span className="font-bold text-xl md:text-2xl text-gray-900">550+</span>
                      </div>
                      <p className="text-[12px] text-sm text-gray-500 font-medium">Hiring Partners Globally</p>
                    </div>
                  </div>

          <div className="space-y-3">
            {[
              "Global accounting career in 180+ countries",
              "100% Placement Assistance",
              "Qualified ACCA Trainers with Industry Experience",
              "All around exam preparation, mock tests, & exam tips"
            ].map((point, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="mt-1 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <span className="text-sm md:text-base text-gray-700">{point}</span>
              </div>
            ))}
          </div>

          {/* Logos marquee using images */}
          <div className="pt-6 border-t border-blue-100/50">
            <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-widest">
              Top Graduates Hired By
            </p>
            <div className="w-full overflow-hidden relative">
              <div className="flex items-center gap-10 w-max animate-marquee opacity-80 grayscale hover:grayscale-0 transition-all duration-500">
                {marqueeLogos.map((logo, idx) => (
                  <div key={idx} className="flex items-center">
                    <img
                      src={logo.src}
                      alt={logo.alt}
                      loading="lazy"
                      className={`${logo.sizeClass} w-auto object-contain select-none`}
                    />
                  </div>
                ))}
              </div>

              <div className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-blue-50 to-transparent pointer-events-none"></div>
              <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-blue-50 to-transparent pointer-events-none"></div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 relative">
          <div className="absolute -top-5 -right-5 bg-white p-3 rounded-2xl shadow-xl animate-float-delay z-20">
            <Award className="w-7 h-7 text-orange-400" />
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_18px_44px_-10px_rgba(0,0,0,0.09)] border border-white/50 relative z-10 overflow-hidden transform transition-all hover:shadow-[0_26px_56px_-12px_rgba(59,130,246,0.15)]"
            noValidate
          >
            <div className="bg-gradient-to-r from-blue-900 to-blue-800 p-5 relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-8"></div>
              <h3 className="text-white text-lg font-bold relative z-10">Get Complete Details</h3>
              <p className="text-blue-200 text-[12px] mt-1 relative z-10 flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
                About The Course
              </p>
            </div>

            <div className="p-8 space-y-5">
              <div className="relative">
                <input
                  name="name"
                  type="text"
                  id="name"
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

              <div className="relative">
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

              <div className="relative">
                <PhoneInput
                  country={"in"}
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  inputProps={{ name: "phone", required: true }}
                  containerClass="!w-full"
                  buttonClass="!bg-transparent !border-none !px-0"
                  dropdownClass="text-sm"
                  inputClass="
      !w-full 
      !py-3 
      !pl-12   /* space for flag */
      !text-base
      !border-0 
      !border-b-2 
      !border-gray-200
      focus:!border-blue-600
      !rounded-none
      !bg-transparent
      focus:!outline-none
      focus:!shadow-none
      peer
    "
                />

                {/* Floating label, same styling as name/email */}
                {/* <label
    className="
      absolute left-0 
      -top-4 
      text-gray-500 
      text-sm 
      transition-all 
      peer-placeholder-shown:text-base 
      peer-placeholder-shown:text-gray-400 
      peer-placeholder-shown:top-3 
      peer-focus:-top-4 
      peer-focus:text-gray-600 
      peer-focus:text-sm
      pointer-events-none
    "
  >
    Phone Number
  </label> */}
              </div>


              {error && <div className="text-sm text-red-600">{error}</div>}

              {/* TERMS CHECKBOX (functional) - styled minimally so layout stays same */}
              <div className="flex items-start gap-3">
                <input
                  id="termsCheckboxHero"
                  type="checkbox"

                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300"
                />
                <label htmlFor="termsCheckboxHero" className="text-xs text-gray-500 leading-5">
                  I agree to the{" "}
                  <a href="/terms-and-conditions/" target="_blank" className="text-blue-600 underline">Terms & Conditions</a>{" "}
                  and{" "}
                  <a href="/privacy-policy/" target="_blank" className="text-blue-600 underline">Privacy Policy</a>.
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting || !acceptedTerms}
                className="relative w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold py-4 px-5 rounded-xl shadow-lg hover:shadow-blue-300/40 transform hover:-translate-y-0.5 transition-all overflow-hidden group text-base disabled:opacity-60"
              >
                <div className="absolute top-0 left-0 w-full h-full animate-shimmer opacity-28"></div>
                <div className="relative flex items-center justify-center gap-3">
                  {submitting ? "Submitting..." : "Download Brochure"}
                  <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              <div className="mt-3 text-center">
                <a href={waHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-green-600 hover:underline">
                  <SiWhatsapp className="w-4 h-4 text-green-600" />
                  Get updates on WhatsApp
                </a>
              </div>

              {/* Hidden fields sent to backend */}
              <input type="hidden" name="productId" value={formData.productId} />
              <input type="hidden" name="contactOwner" value={formData.contactOwner} />
              <input type="hidden" name="registrationType" value={formData.registrationType} />
              <input type="hidden" name="utmSource" value={formData.utmSource} />
              <input type="hidden" name="utmMedium" value={formData.utmMedium} />
              <input type="hidden" name="utmCampaign" value={formData.utmCampaign} />
              <input type="hidden" name="pageUrl" value={formData.pageUrl} />
              <input type="hidden" name="referrer" value={formData.referrer} />
              <input type="hidden" name="hutk" value={formData.hutk} />
              <input type="hidden" name="timestamp" value={formData.timestamp} />
            </div>
          </form>


        </div>
      </div>
    </section>
  );
};

export default HeroSection;
