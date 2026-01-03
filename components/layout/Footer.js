import { Play, Github, Linkedin } from 'lucide-react';
import { CardSpotlight } from '@/components/ui/card-spotlight';

export default function Footer() {
  return (
    <footer className="relative bg-black overflow-hidden">
      {/* Animated border top */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-[shimmer_3s_ease-in-out_infinite]" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {/* Brand */}
          <div className="col-span-1 sm:col-span-2 md:col-span-2">
            <div className="flex items-center space-x-2 mb-3 sm:mb-4">
              <div className="w-8 sm:w-9 h-8 sm:h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                <Play className="w-4 sm:w-5 h-4 sm:h-5 text-white fill-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold text-white">
                VideoChat<span className="text-blue-500">AI</span>
              </span>
            </div>
            <p className="text-gray-400 max-w-md mb-4 text-sm sm:text-base">
              Transform how you learn from YouTube videos. Chat with any video using AI-powered conversations.
            </p>
            <div className="flex space-x-3 sm:space-x-4">
              <CardSpotlight>
                <a href="https://github.com/Mohd-Murtaza" target="_blank" rel="noopener noreferrer" className="block p-2 bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition">
                  <Github className="w-4 sm:w-5 h-4 sm:h-5 text-gray-400 hover:text-blue-500" />
                </a>
              </CardSpotlight>
              <CardSpotlight>
                <a href="https://www.linkedin.com/in/mohd-murtaza-20a86027a/" target="_blank" rel="noopener noreferrer" className="block p-2 bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition">
                  <Linkedin className="w-4 sm:w-5 h-4 sm:h-5 text-gray-400 hover:text-cyan-500" />
                </a>
              </CardSpotlight>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Quick Links</h3>
            <ul className="space-y-2 text-sm sm:text-base">
              <li>
                <a href="#features" className="text-gray-400 hover:text-blue-500 transition">
                  Features
                </a>
              </li>
              <li>
                <a href="#testimonials" className="text-gray-400 hover:text-blue-500 transition">
                  Testimonials
                </a>
              </li>
              <li>
                <a href="#faq" className="text-gray-400 hover:text-blue-500 transition">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Resources</h3>
            <ul className="space-y-2 text-sm sm:text-base">
              <li>
                <a href="#" className="text-gray-400 hover:text-blue-500 transition">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-blue-500 transition">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-blue-500 transition">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-gray-400">
          <p className="text-xs sm:text-sm">&copy; {new Date().getFullYear()} VideoChatAI. Built with ❤️ by Mohd Murtaza</p>
        </div>
      </div>
    </footer>
  );
}
