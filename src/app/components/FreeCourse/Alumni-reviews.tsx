"use client"

import { memo } from "react"
import { Quote } from "lucide-react"

// Mock data to make the component self-contained for preview if needed.
// In a real usage, this might be imported or passed as props.
export type ReviewType = {
  name: string
  role: string
  review: string
  image?: string
}

interface AlumniReviewsProps {
  title?: string
  reviews?: ReviewType[] // Made optional to prevent crashes
}

const defaultReviews: ReviewType[] = [
  {
    name: "Kanchan Arora",
    role: "Data Analyst",
    review: "Thoroughly enjoyed the data analytics courses at IIM SKILLS. The instructors are experts, and the content is highly relevant. Great investment in my career!",
    image: "https://iimskills.in/wp-content/uploads/2025/04/Kanchan-Arora.png" 
  },
  {
    name: "Abhishek S Variar",
    role: "Research Analyst",
    review: "IIM SKILLS' data analytics courses exceeded my expectations. The hands on approach and real-world examples made learning enjoyable. ",
    image: "https://iimskills.in/wp-content/uploads/2025/04/Abhishek-S-Variar.png"
  },
  {
    name: "Tripti Gupta",
    role: "Associate at TCS",
    review: "IIM SKILLS offers brilliant data analytics courses. The curriculum is thorough, and the instructors are very knowledgeable. A great boost to my professional skills.",
    image: "https://iimskills.in/wp-content/uploads/2025/04/Tripti-Gupta.png"
  }
   
];

const AlumniReviews = memo(function AlumniReviews({ title = "Alumnis Reviews", reviews = defaultReviews }: AlumniReviewsProps) {
  // Safe check to ensure reviews is an array before mapping
  const safeReviews = Array.isArray(reviews) ? reviews : defaultReviews;

  return (
    <section id="alumni-stats" className="py-10 md:py-15 relative overflow-hidden font-sans">
       {/* Decorative Background Blob */}
       <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-3xl opacity-60"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-indigo-100/40 rounded-full blur-3xl opacity-60"></div>
       </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Heading */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-4">
             Success Stories
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
            Alumni's <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Reviews</span>
          </h2>
          <p className="mt-4 text-slate-600 text-lg">
            Hear from our graduates who have transformed their careers and achieved their goals.
          </p>
        </div>

        {/* Review Cards - responsive grid */}
        <div role="list" className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 gap-6 items-stretch">
          {safeReviews.map((review, index) => (
            <article
              key={index}
              role="listitem"
              className="group relative bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-blue-100 transition-all duration-300 flex flex-col h-full"
            >
              {/* Quote Icon */}
              <div className="mb-4">
                 <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                    <Quote size={18} className="fill-current" />
                 </div>
              </div>

              {/* Review Text */}
              <div className="flex-1 mb-6">
                <p className="text-slate-600 text-sm leading-relaxed italic relative z-10">
                  "{review.review}"
                </p>
              </div>

              {/* Reviewer Info */}
              <div className="flex items-center gap-4 pt-4 border-t border-slate-50 mt-auto">
                {review.image ? (
                  <div className="relative shrink-0">
                    <div className="absolute inset-0 bg-blue-600 rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <img
                      src={review.image}
                      alt={review.name}
                      loading="lazy"
                      width={48}
                      height={48}
                      className="relative w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                  </div>
                ) : (
                   <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 font-bold text-lg border-2 border-white shadow-sm shrink-0">
                      {review.name.charAt(0)}
                   </div>
                )}
                
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-sm truncate group-hover:text-blue-700 transition-colors">
                    {review.name}
                  </h3>
                  <p className="text-xs text-slate-500 truncate font-medium">
                    {review.role}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
})

export default AlumniReviews