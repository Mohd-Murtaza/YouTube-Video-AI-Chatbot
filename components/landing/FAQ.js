'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { CardSpotlight } from '@/components/ui/card-spotlight';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: 'How does VideoChatAI work?',
      answer:
        'Simply paste a YouTube video URL, and our AI extracts the transcript, processes it, and allows you to ask questions. The AI retrieves relevant information from the video to answer your queries accurately.',
    },
    {
      question: 'Is it really free?',
      answer:
        'Yes! VideoChatAI is completely free to use. We use free-tier APIs from HuggingFace, Groq, and Pinecone to keep costs at zero while providing excellent service.',
    },
    {
      question: 'What types of videos work best?',
      answer:
        'Any YouTube video with English subtitles or captions works great. Educational content, tutorials, lectures, interviews, and documentaries yield the best results.',
    },
    {
      question: 'How long does video processing take?',
      answer:
        'Most videos are processed in 5-15 seconds, depending on length. A 2-hour video typically takes 10-12 seconds. You can start chatting immediately after processing.',
    },
    {
      question: 'Is my data private and secure?',
      answer:
        'Absolutely! Your conversations are stored securely and never shared. We only process publicly available YouTube content and your questions stay private.',
    },
    {
      question: 'Can I use this for educational purposes?',
      answer:
        'Yes! VideoChatAI is perfect for students, researchers, and educators. Use it to study lecture videos, extract key points, and understand complex topics faster.',
    },
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-300">
            Everything you need to know about VideoChatAI
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <CardSpotlight key={index}>
              <div
                className={`border rounded-2xl overflow-hidden transition-all ${
                  openIndex === index 
                    ? 'border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.3)]' 
                    : 'border-white/10 hover:border-blue-500/30'
                }`}
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between bg-black/40 backdrop-blur-sm hover:bg-white/5 transition"
                >
                  <span className="font-semibold text-left text-white pr-4 text-sm sm:text-base">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 transition-transform flex-shrink-0 ${
                      openIndex === index ? 'rotate-180 text-blue-500' : 'text-gray-400'
                    }`}
                  />
                </button>
                {openIndex === index && (
                  <div className="px-5 sm:px-6 py-4 bg-black/60 border-t border-white/10">
                    <p className="text-gray-300 leading-relaxed text-sm sm:text-base">{faq.answer}</p>
                  </div>
                )}
              </div>
            </CardSpotlight>
          ))}
        </div>
      </div>
    </section>
  );
}
