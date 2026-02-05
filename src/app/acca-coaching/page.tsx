import { Metadata } from 'next';

import CourseStickyHeader from "@/components/Acca/CourseStickyHeader";
import RegionLinks from '@/components/cityPages/CityPagesHeader';
import PlacementSection from '@/components/Acca/placementsection';
import IntroVideo from '@/components/Acca/IntroVideo';
import ROITable from '@/components/Acca/ROItable';
import Salary from '@/components/Acca/CarrerSalary';
import SuperMentors from '@/components/Acca/supermentor';
import TestimonialSection from '@/components/Acca/testimonials';
import RecruiterTestimonials from '@/components/Acca/RecuirterTestimonials';
import FinancialModelingOverview from '@/components/Acca/contentoverview';
import FaqSection from '@/components/Acca/FaqSection';
import ACCACertificates from '@/components/Acca/Certifications';
import ACCAProgramFees from '@/components/Acca/programfee';
import AdmissionProcess from '@/components/Acca/admissionProcess';
import HeroSection from '@/components/Acca/herosection';
import CourseCurriculum from '@/components/Acca/coursecurriculumn';
import Schema from '@/components/fmmc/Schema';
import CombinedCourseInfoUnified from '@/components/Acca/batchandschedule';
import ReadMoreACCA from '@/components/Acca/ReadMore';
import GithubPortfolio from '@/components/Acca/LinkedInSection';


// ✅ Corrected Metadata block
export const metadata: Metadata = {
  title: "Top ACCA Coaching With Placement Assistance | Global ",
  description:
    "Best ACCA Coaching Program in India with expert trainers, live classes, practice sessions, and 100% placement support. Get global recognition with IIM SKILLS.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "https://iimskills.com/acca-coaching/",
  },
  keywords: [
    "ACCA Coaching Program",
  ],
};


export default function ACCAPage() {
  return (
    <div className="min-h-screen bg-white">
      <Schema />
      <CourseStickyHeader />
      <HeroSection />
      <PlacementSection />
      <IntroVideo />
      <ROITable />
      <CourseCurriculum />
      <Salary />
      <TestimonialSection />
      {/* <LiveProjectsStack /> */}
      <GithubPortfolio />
      <ACCACertificates />
      <SuperMentors />
      <RecruiterTestimonials />
      <CombinedCourseInfoUnified />
      <ACCAProgramFees />
      <AdmissionProcess />
      <ReadMoreACCA />
      <FinancialModelingOverview />
      <FaqSection />
      
    </div>
  );
}

 