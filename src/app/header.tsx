'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  FaBars,
  FaTimes,
  FaChartLine,
  FaUniversity,
  FaCalculator,
  FaMoneyCheckAlt,
  FaCode,
  FaBullhorn,
  FaSearch,
  FaPenNib,
  FaChevronDown,
  FaGraduationCap,
} from 'react-icons/fa';
import { GiBackpack } from 'react-icons/gi';
import { MdOutlineAnalytics, MdOutlineMedicalServices } from 'react-icons/md';
import { HiOutlineDocumentReport } from 'react-icons/hi';
import { RiBankLine } from 'react-icons/ri';
 
// import DiwaliOfferBanner from './components/DiwaliOfferBanner';

/* ---------------- Mega Menu Data ---------------- */
const megaMenu: Record<string, { href: string; label: string }[]> = {
  'Analytics Program': [
    { href: '/data-analytics-course', label: 'Data Analytics Master Course' },
    { href: '/data-science-course', label: 'Data Science Master Course' },
  ],
  'Design Program': [
    { href: '/ui-ux-course', label: 'UI/UX Design Course' },
  ],
  'Finance Program': [
    { href: '/financial-modeling-course', label: 'Certified Financial Modeling Course' },
    { href: '/bat-course', label: 'Business Accounting & Taxation Course' },
    { href: '/investment-banking-course', label: 'Certified Investment Banking Course' },
    { href: '/tally-course', label: 'Certified Tally Advanced Course' },
    { href: '/financial-analyst-course', label: 'Financial Analyst Master Course' },
    { href: '/gst-course', label: 'GST Practitioner Certification Course' },
  ],
  'Marketing Program': [
    { href: '/digital-marketing', label: 'Digital Marketing Master Course' },
    { href: '/digital-marketing-course-in-hindi', label: 'Digital Marketing Course in Hindi' },
    { href: '/seo-course', label: 'Search Engine Optimization' },
  ],
  'Medical Program': [
    { href: '/medical-coding-course', label: 'Medical Coding Course' },
  ],
  'Writing Program': [
    { href: '/content-writing-course', label: 'Content Writing Master Course' },
    { href: '/technical-writing-course', label: 'Technical Writing Master Course' },
  ],
};

/* ---------------- Nav Items ---------------- */
const navItems = [
  {
    title: 'For Corporates',
    links: [
      { href: '/corporate-training', label: 'Corporate Training' },
      { href: '/hire-from-us', label: 'Hire From Us' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { href: '/about-us', label: 'About Us' },
      { href: '/contact-us', label: 'Contact Us' },
      { href: '/brands-participated', label: 'Corporate Customer' },
      { href: '/certificate-verification', label: 'Certificate Verification' },
      { href: '/media-coverage', label: 'Media Coverage' },
      { href: '/refund-policy', label: 'Refund Policy' },
      { href: '/scholarship', label: 'Scholarship' },
    ],
  },
  {
    title: 'Reviews',
    links: [
      { href: '/new-testimonials', label: 'Participant Reviews' },
      { href: '/terms-and-conditions', label: 'Terms And Conditions' },
      { href: '/video-testimonials', label: 'Video Testimonials' },
    ],
  },
];

/* ---------------- Icons ---------------- */
function getCourseIcon(label: string) {
  const text = label.toLowerCase();

  if (text.includes('financial modeling'))
    return <FaChartLine className="bg-[#FDECEC] text-[#1F2937] p-2 rounded-full h-8 w-8" />;
  if (text.includes('investment banking'))
    return <RiBankLine className="bg-[#E3F2FD] text-[#1F2937] p-2 rounded-full h-8 w-8" />;
  if (text.includes('financial analyst'))
    return <HiOutlineDocumentReport className="bg-[#E8F5E9] text-[#1F2937] p-2 rounded-full h-8 w-8" />;
  if (text.includes('bat') || text.includes('accounting') || text.includes('taxation'))
    return <FaCalculator className="bg-[#FFF3E0] text-[#1F2937] p-2 rounded-full h-8 w-8" />;
  if (text.includes('gst'))
    return <FaMoneyCheckAlt className="bg-[#F3E5F5] text-[#1F2937] p-2 rounded-full h-8 w-8" />;
  if (text.includes('tally'))
    return <FaUniversity className="bg-[#E0F7FA] text-[#1F2937] p-2 rounded-full h-8 w-8" />;
  if (text.includes('analytics'))
    return <MdOutlineAnalytics className="bg-[#F1F8E9] text-[#1F2937] p-2 rounded-full h-8 w-8" />;
  if (text.includes('science'))
    return <FaCode className="bg-[#FCE4EC] text-[#1F2937] p-2 rounded-full h-8 w-8" />;
  if (text.includes('medical'))
    return <MdOutlineMedicalServices className="bg-[#E1F5FE] text-[#1F2937] p-2 rounded-full h-8 w-8" />;
  if (text.includes('digital marketing hindi'))
    return <HiOutlineDocumentReport className="bg-[#E0F2F1] text-[#1F2937] p-2 rounded-full h-8 w-8" />;
  if (text.includes('digital marketing'))
    return <FaBullhorn className="bg-[#FFF8E1] text-[#1F2937] p-2 rounded-full h-8 w-8" />;
  if (text.includes('optimization'))
    return <FaSearch className="bg-[#E8EAF6] text-[#1F2937] p-2 rounded-full h-8 w-8" />;
  if (text.includes('content writing'))
    return <FaPenNib className="bg-[#F1F8E9] text-[#1F2937] p-2 rounded-full h-8 w-8" />;
  if (text.includes('ui-ux'))
    return <FaPenNib className="bg-[#F1F8E9] text-[#1F2937] p-2 rounded-full h-8 w-8" />;
  if (text.includes('technical writing'))
    return <HiOutlineDocumentReport className="bg-[#E0F2F1] text-[#1F2937] p-2 rounded-full h-8 w-8" />;

  return <FaBars className="bg-[#F5F5F5] text-[#1F2937] p-2 rounded-full h-8 w-8" />;
}

/* ---------------- Category Icons (left menu) ---------------- */
function getCategoryIcon(category: string) {
  // small circular icons to match the style in your example image
  const baseClass = 'inline-flex items-center justify-center h-8 w-8 rounded-full mr-3 shrink-0';
  switch (category) {
    case 'Marketing Program':
      return <span className={`${baseClass} bg-[#FFF8E1] text-[#1F2937]`}><FaBullhorn /></span>;
    case 'Finance Program':
      return <span className={`${baseClass} bg-[#FDECEC] text-[#1F2937]`}><FaGraduationCap /></span>;
    case 'Analytics Program':
      return <span className={`${baseClass} bg-[#F1F8E9] text-[#1F2937]`}><MdOutlineAnalytics /></span>;
    case 'Writing Program':
      return <span className={`${baseClass} bg-[#E0F2F1] text-[#1F2937]`}><FaPenNib /></span>;
    case 'Medical Program':
      return <span className={`${baseClass} bg-[#E1F5FE] text-[#1F2937]`}><MdOutlineMedicalServices /></span>;
    default:
      // fallback icons representing the screenshot categories (grad cap, briefcase, backpack, bulb)
      return <span className={`${baseClass} bg-[#F5F5F5] text-[#1F2937]`}><FaBars /></span>;
  }
}

/* ---------------- Short Description ---------------- */
function getShortDescription(href: string): string {
    // Finance Programs

  if (href.includes('financial-modeling')) return 'Learn modeling techniques and DCF valuation.';
  if (href.includes('investment-banking')) return 'Master valuation, IPOs, mergers & LBOs.';
  if (href.includes('financial-analyst')) return 'Gain financial analysis & Excel modeling skills.';
  if (href.includes('bat-course')) return 'Cover accounting, Tally, GST & direct taxes.';
  if (href.includes('tally-course')) return 'Ideal for 10+2 passouts, graduates & management aspirants.';
  if (href.includes('gst-course')) return 'Ideal for commerce graduates, business owners & finance professionals.';

  // Marketing Programs
  if (href.includes('digital-marketing-course-in-hindi')) return 'Ideal for complete beginners and small business owners.';
  if (href.includes('digital-marketing')) return 'Intensive program to gain expertise in digital marketing aspects.';
  if (href.includes('seo-course')) return 'Advanced training for freshers & professionals.';


  // Analytics Programs
  if (href.includes('data-analytics-course')) return 'Ideal for freshers & professionals to gain job-ready skills.';
  if (href.includes('data-science-course')) return 'Comprehensive course for beginners & entry-level professionals.';

  // Writing Programs
  if (href.includes('content-writing-course')) return 'An intensive, short-duration program for building a writing career.';
  if (href.includes('technical-writing-course')) return 'Short-term, practical program to gain technical writing skills.';

  // Medical Program
  if (href.includes('medical-coding-course')) return 'Ideal for medical professionals & students preparing for the CPC exam.';
  
  // Designing Program
  if (href.includes('ui-ux-course')) return 'Intensive program to gain expertise in designing aspects.';

  // Default fallback
  return 'Explore our industry-relevant program.';
}

/* ---------------- Component ---------------- */
export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>('Marketing Program');
  const [allCoursesOpen, setAllCoursesOpen] = useState(false);
  const [openDropdownTitle, setOpenDropdownTitle] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const coursesCloseTimeout = useRef<NodeJS.Timeout | null>(null);
  const navCloseTimeout = useRef<NodeJS.Timeout | null>(null);

  const pathname = usePathname();

  // scroll lock helpers
  const scrollYRef = useRef<number>(0);

  /* --- Prevent background scroll when mobile overlay/menu is open --- */
  useEffect(() => {
    // lock when mobile menu OR the mobile "All Courses" panel is open
    const shouldLock = mobileMenuOpen || allCoursesOpen;

    if (typeof window === 'undefined') return;

    if (shouldLock) {
      // store current scroll
      scrollYRef.current = window.scrollY || window.pageYOffset || 0;
      // lock body: fixed position preserves layout and prevents background scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollYRef.current}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      // avoid overscroll on iOS
      document.documentElement.style.overscrollBehavior = 'none';
    } else {
      // restore
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.documentElement.style.overscrollBehavior = '';
      // restore scroll position
      window.scrollTo(0, scrollYRef.current || 0);
    }

    // cleanup in case component unmounts while locked
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.documentElement.style.overscrollBehavior = '';
    };
  }, [mobileMenuOpen, allCoursesOpen]);

  /* --- Close on outside click --- */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('a')
      ) {
        setAllCoursesOpen(false);
        setOpenDropdownTitle(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* --- Close menus on route change --- */
  useEffect(() => {
    setMobileMenuOpen(false);
    setAllCoursesOpen(false);
    setOpenDropdownTitle(null);
  }, [pathname]);

  /* --- Hover handlers for desktop --- */
  const handleCoursesEnter = () => {
    if (coursesCloseTimeout.current) clearTimeout(coursesCloseTimeout.current);
    setAllCoursesOpen(true);
  };
  const handleCoursesLeave = () => {
    coursesCloseTimeout.current = setTimeout(() => setAllCoursesOpen(false), 250);
  };
  const handleNavEnter = (title: string) => {
    if (navCloseTimeout.current) clearTimeout(navCloseTimeout.current);
    setOpenDropdownTitle(title);
  };
  const handleNavLeave = () => {
    navCloseTimeout.current = setTimeout(() => setOpenDropdownTitle(null), 250);
  };

  return (
    <div id="site-header-wrapper" className="w-full siteNavbar relative z-[9999]">

      <div className=''> 
         {/* <DiwaliOfferBanner /> */}
         </div>
      
      {/* -------- Top Bar (desktop only) -------- */}
      <div className="hidden md:flex bg-[#eaf6ff] text-sm text-black flex-col md:flex-row justify-between items-center px-4 md:px-6 py-2 border-b border-gray-300 gap-2">
        
        <div className="flex w-[90%] mx-auto justify-between">
          <div>
            Email: <a href="mailto:info@iimskills.com" className="text-blue-600">info@iimskills.com</a>
            &nbsp; Customer Care No: <span className="font-medium">+91 9580 740 740</span>
          </div>
          <div className="flex flex-wrap gap-2 md:gap-4">
            <Link href="/brands-participated">Hiring Partner</Link>
            <Link href="/media-coverage">Media Coverage</Link>
            <Link href="/new-testimonials">Participant Reviews</Link>
            <Link href="/video-testimonials">Video Testimonials</Link>
          </div>
        </div>
      </div>

      {/* -------- Main Header (fixed on mobile) -------- */}
      <header className="fixed top-0 left-0 right-0 z-50 md:static bg-white/95 backdrop-blur-sm flex flex-col items-center justify-between  py-0 shadow-sm">
          
        <div className="flex w-full md:w-[90%] mx-auto justify-between items-center relative px-4 md:px-6 py-3">
          {/* Logo + All Courses (desktop only) */}
          <div className="flex  items-center gap-5" ref={dropdownRef}>
            <Link href="/" className="flex flex-col items-center gap-0">
              <img src= "/iim-skills-official-logo.png" alt="IIM Skills Logo" className="h-5 md:h-8 w-auto" />
                  
            </Link>
            {/* "/IIM-SKILLS-LOGO-.png"  NORMAL LOGO AFTER CHRISTMAS */}


            {/* All Courses (desktop hover) */}
            <div
              className="hidden md:block"
              onMouseEnter={handleCoursesEnter}
              onMouseLeave={handleCoursesLeave}
            >
              <button
                className={`hover:text-white text-gray-700 font-normal whitespace-nowrap items-center gap-1 hidden md:flex px-3 py-2 rounded-full ${
                  allCoursesOpen ? 'bg-blue-600 text-white ring-2 ring-blue-200' : 'bg-blue-600 text-white'
                }`}
              >
                All Courses <span className="ml-2">▾</span>
              </button>
              <div
                className={`absolute top-full left-0 mt-4 bg-white border border-blue-100 shadow-sm shadow-blue-100 z-30 w-full max-h-[500px] overflow-y-auto ${allCoursesOpen ? 'flex' : 'hidden'}`}
              >
                <div className="w-1/4 border-r border-blue-100 p-4 bg-[#f8fbff]">
                  {Object.keys(megaMenu).map(category => (
                    <button
                      key={category}
                      className={`flex items-center w-full text-left py-2 px-3 rounded-md font-normal hover:bg-blue-100 ${activeDropdown === category ? 'bg-blue-100 text-blue-600' : ''}`}
                      onClick={() => setActiveDropdown(category)}
                    >
                      {getCategoryIcon(category)}
                      <span>{category}</span>
                    </button>
                  ))}
                </div>
                <div className="w-3/4 grid grid-cols-2 gap-x-12 mt-4 gap-y-5 px-10 py-4 overflow-y-auto">
                  {activeDropdown &&
                    megaMenu[activeDropdown]?.map(course => (
                      <Link
                        key={course.href}
                        href={course.href}
                        className="bg-white border border-blue-100 rounded-lg px-5 py-4 h-max shadow-sm hover:shadow-md transition-shadow duration-200"
                      >
                        <div className="flex gap-4 items-start">
                          <div className="text-gray-800 text-xl mt-1">{getCourseIcon(course.label)}</div>
                          <div>
                            <p className="font-medium text-gray-800 text-base mb-1">{course.label}</p>
                            <p className="text-sm text-gray-500">{getShortDescription(course.href)}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                </div>
              </div>
            </div>

            {/* All Courses (mobile toggle) */}
            <div className="md:hidden">
              <button
                onClick={() => setAllCoursesOpen(!allCoursesOpen)}
                className={`block w-full text-left text-gray-800 font-medium px-3 text-[13px] py-2 rounded-full ${
                  allCoursesOpen ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white text-[13px]'
                }`}
              >
                All Courses
              </button>
              {allCoursesOpen && (
                <div className="absolute top-15 w-full left-0 bg-white pl-4 space-y-2 z-10">
                  {Object.keys(megaMenu).map(category => (
                    <div key={category}>
                      <p className="font-bold text-gray-700 flex items-center text-[14px]">
                        {getCategoryIcon(category)}
                        <span className='font-normal text-gray-800'>{category}</span>
                      </p>
                      <div className="px-3 pb-3 space-y-1 border-b-1 border-gray-300">
                        {megaMenu[category].map(course => (
                          <Link
                            key={course.href}
                            href={course.href}
                            className="block text-[#1e4880] font-medium text-[14px] hover:text-blue-600 ml-[30px]"
                            onClick={() => {
                              // close mobile menus when navigating
                              setMobileMenuOpen(false);
                              setAllCoursesOpen(false);
                            }}
                          >
                            {course.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 text-gray-700 font-medium">
            <div>
              
            </div>
            {navItems.map(({ title, links }) => (
              <div
                key={title}
                className="relative"
                onMouseEnter={() => handleNavEnter(title)}
                onMouseLeave={handleNavLeave}
              >
                <button className="hover:text-blue-600 flex items-center gap-1 text-[15px]">
                  {title} <FaChevronDown className="text-xs mt-[1px]" />
                </button>
                {openDropdownTitle === title && (
                  <div className="absolute left-0 mt-3 bg-white border border-gray-200 rounded-sm shadow-lg py-2 w-56 z-30">
                    <ul className="text-sm text-slate-800">
                      {links.map(link => (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            className="block px-4 py-2 hover:bg-blue-50 hover:text-blue-600 text-[15px]"
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
            <Link href="/blog" className="hover:text-blue-600 text-[15px]">
              Blogs
            </Link>
            <Link href="/emi-structure" className="hover:text-blue-600 text-[15px]">
              EMI Structure
            </Link>
            <Link
              href="https://lms.iimskills.in/wp-login.php"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-4 px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-600 hover:text-white transition"
            >
              Login
            </Link>
          </nav>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-800"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>
      </header>

      {/* spacer so page content doesn't go under fixed header on mobile */}
      <div className="h-16 md:hidden" />

      {/* -------- Mobile Menu (fixed under header) -------- */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-md max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="px-4 py-3 space-y-3">
            {/* PlacementReport */}
            <div>
             
            </div>

            {/* Mobile Nav */}
            {navItems.map(({ title, links }) => (
              <div key={title}>
                <p className="font-bold text-gray-700 text-[14px]">{title}</p>
                <div className="pl-3 space-y-1">
                  {links.map(link => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block text-gray-600 text-[14px] hover:text-blue-600"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            <Link href="/blog" className="block font-bold text-gray-700" onClick={() => setMobileMenuOpen(false)}>Blogs</Link>
            <Link href="/emi-structure" className="block font-bold text-[14px] text-gray-700" onClick={() => setMobileMenuOpen(false)}>EMI Structure</Link>
            <Link
              href="https://lms.iimskills.in/wp-login.php"
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-600 hover:text-white transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Login
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
