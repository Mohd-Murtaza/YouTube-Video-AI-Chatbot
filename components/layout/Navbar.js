'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X, Play } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleNavClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[80%] md:w-[85%] z-50">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.2)]">
          <div className="px-6">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <Link href="/" className="flex items-center space-x-2 group relative z-50">
                <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)] group-hover:shadow-[0_0_25px_rgba(59,130,246,0.7)] transition">
                  <Play className="w-5 h-5 text-white fill-white" />
                </div>
                <span className="text-xl font-bold text-white">
                  VideoChat<span className="text-blue-500">AI</span>
                </span>
              </Link>

              {/* Desktop Menu */}
              <div className="hidden md:flex items-center space-x-8">
                <a href="#features" className="text-gray-300 hover:text-blue-500 transition font-medium">
                  Features
                </a>
                <a href="#testimonials" className="text-gray-300 hover:text-blue-500 transition font-medium">
                  Testimonials
                </a>
                <a href="#faq" className="text-gray-300 hover:text-blue-500 transition font-medium">
                  FAQ
                </a>
                <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition font-medium">
                  Get Started
                </button>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-white/10 transition relative z-50"
              >
                {isOpen ? (
                  <X className="w-6 h-6 text-white" />
                ) : (
                  <Menu className="w-6 h-6 text-white" />
                )}
              </button>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
              <div className="md:hidden py-4 space-y-4 border-t border-white/10 relative z-50">
                <a href="#features" onClick={handleNavClick} className="block text-gray-300 hover:text-blue-500 transition font-medium">
                  Features
                </a>
                <a href="#testimonials" onClick={handleNavClick} className="block text-gray-300 hover:text-blue-500 transition font-medium">
                  Testimonials
                </a>
                <a href="#faq" onClick={handleNavClick} className="block text-gray-300 hover:text-blue-500 transition font-medium">
                  FAQ
                </a>
                <button className="w-full px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition font-medium">
                  Get Started
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Full Screen Backdrop Overlay - Outside navbar */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
