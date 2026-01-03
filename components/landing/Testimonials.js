import { Star, Quote } from "lucide-react";

export default function Testimonials() {
  // Row 1 testimonials (scroll left, fast)
  const row1 = [
    {
      name: "Sarah Johnson",
      role: "Computer Science Student",
      avatar: "SJ",
      image: "https://i.pravatar.cc/150?img=1",
      text: "This tool saved me hours! I can quickly extract key concepts from lecture videos without rewatching everything.",
      rating: 5,
    },
    {
      name: "Mike Chen",
      role: "Content Creator",
      avatar: "MC",
      image: "https://i.pravatar.cc/150?img=12",
      text: "Perfect for researching video content. I can analyze competitor videos and get insights in minutes.",
      rating: 5,
    },
    {
      name: "Emily Davis",
      role: "Product Manager",
      avatar: "ED",
      image: "https://i.pravatar.cc/150?img=5",
      text: "Game changer for learning! I use it daily to digest product demos and tech talks efficiently.",
      rating: 5,
    },
    {
      name: "Alex Kumar",
      role: "Software Engineer",
      avatar: "AK",
      image: "https://i.pravatar.cc/150?img=13",
      text: "As a developer, this helps me learn new technologies faster by chatting with tutorial videos.",
      rating: 5,
    },
  ];

  // Row 2 testimonials (scroll right, slow)
  const row2 = [
    {
      name: "Jessica Lee",
      role: "Medical Student",
      avatar: "JL",
      image: "https://i.pravatar.cc/150?img=9",
      text: "Essential for my studies! I can quickly find specific topics in long medical lectures.",
      rating: 5,
    },
    {
      name: "David Park",
      role: "Marketing Manager",
      avatar: "DP",
      image: "https://i.pravatar.cc/150?img=14",
      text: "Brilliant for market research. I analyze webinars and conferences without watching hours of content.",
      rating: 5,
    },
    {
      name: "Rachel Green",
      role: "Data Analyst",
      avatar: "RG",
      image: "https://i.pravatar.cc/150?img=10",
      text: "The AI understands context perfectly. It's like having a personal tutor for every video.",
      rating: 5,
    },
    {
      name: "Tom Wilson",
      role: "Entrepreneur",
      avatar: "TW",
      image: "https://i.pravatar.cc/150?img=15",
      text: "I use it to extract key insights from business talks and investor presentations. Absolute time-saver!",
      rating: 5,
    },
  ];

  // Row 3 testimonials (scroll left, fast)
  const row3 = [
    {
      name: "Linda Martinez",
      role: "Teacher",
      avatar: "LM",
      image: "https://i.pravatar.cc/150?img=20",
      text: "My students love it! They can interact with educational videos and learn at their own pace.",
      rating: 5,
    },
    {
      name: "James Brown",
      role: "Researcher",
      avatar: "JB",
      image: "https://i.pravatar.cc/150?img=33",
      text: "Revolutionary for academic research. I can quickly find relevant sections in hours of recorded lectures.",
      rating: 5,
    },
    {
      name: "Sophie Taylor",
      role: "UX Designer",
      avatar: "ST",
      image: "https://i.pravatar.cc/150?img=25",
      text: "Perfect for learning new design tools. I chat with tutorial videos and get instant answers.",
      rating: 5,
    },
    {
      name: "Chris Anderson",
      role: "Finance Analyst",
      avatar: "CA",
      image: "https://i.pravatar.cc/150?img=32",
      text: "I analyze financial news videos in seconds. This tool is a must-have for staying updated.",
      rating: 5,
    },
  ];

  const TestimonialCard = ({ testimonial }) => (
    <div className="flex-shrink-0 w-[280px] sm:w-[320px] md:w-[350px] h-[200px] sm:h-[240px] md:h-[250px] p-4 sm:p-5 md:p-6 bg-black/40 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all mx-2 sm:mx-3 flex flex-col">
      {/* Quote Icon */}
      <Quote className="w-6 sm:w-7 md:w-8 h-6 sm:h-7 md:h-8 text-blue-500 mb-2 sm:mb-3" />

      {/* Rating */}
      <div className="flex mb-2 sm:mb-3">
        {[...Array(testimonial.rating)].map((_, i) => (
          <Star
            key={i}
            className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-yellow-300 fill-yellow-300"
          />
        ))}
      </div>

      {/* Testimonial Text */}
      <p className="text-gray-300 mb-3 sm:mb-4 leading-relaxed text-xs sm:text-sm flex-1">
        {testimonial.text}
      </p>

      {/* User Info */}
      <div className="flex items-center mt-auto">
        <img
          src={testimonial.image}
          alt={testimonial.name}
          className="w-9 sm:w-10 h-9 sm:h-10 rounded-full object-cover mr-2.5 sm:mr-3 ring-2 ring-blue-500/30"
        />
        <div>
          <div className="font-bold text-white text-xs sm:text-sm">
            {testimonial.name}
          </div>
          <div className="text-[10px] sm:text-xs text-gray-400">
            {testimonial.role}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <section id="testimonials" className="py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-white">
            Loved by Thousands
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
            See what our users are saying about their experience
          </p>
        </div>
      </div>

      {/* Testimonials Infinite Scroll Rows */}
      <div className="space-y-6">
        {/* Row 1 - Scroll Left */}
        <div className="marquee-container">
          <div className="marquee marquee-left">
            {[...row1, ...row1, ...row1].map((testimonial, index) => (
              <TestimonialCard
                key={`row1-${index}`}
                testimonial={testimonial}
              />
            ))}
          </div>
        </div>

        {/* Row 2 - Scroll Right */}
        <div className="marquee-container">
          <div className="marquee marquee-right">
            {[...row2, ...row2, ...row2].map((testimonial, index) => (
              <TestimonialCard
                key={`row2-${index}`}
                testimonial={testimonial}
              />
            ))}
          </div>
        </div>

        {/* Row 3 - Scroll Left */}
        <div className="marquee-container">
          <div className="marquee marquee-left">
            {[...row3, ...row3, ...row3].map((testimonial, index) => (
              <TestimonialCard
                key={`row3-${index}`}
                testimonial={testimonial}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
