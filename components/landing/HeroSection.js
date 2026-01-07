'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Zap, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import GridBackground from '@/components/ui/grid-background';
import { Cover } from '@/components/ui/cover';
import { useAuth } from '@/context/AuthContext';
import AuthModal from '@/components/auth/AuthModal';

export default function HeroSection() {
  const [videoUrl, setVideoUrl] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  // Function to extract YouTube video ID from URL
  const extractVideoId = (url) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([^&]+)/i,
      /(?:youtube\.com\/embed\/)([^?]+)/i,
      /(?:youtu\.be\/)([^?]+)/i,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  // Function to validate YouTube URL
  const isValidYouTubeUrl = (url) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/i;
    return youtubeRegex.test(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!videoUrl.trim()) {
      setError('Please enter a YouTube video URL');
      return;
    }

    if (!isValidYouTubeUrl(videoUrl)) {
      setError('Please enter a valid YouTube video URL');
      return;
    }
    
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    // Extract video ID
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      setError('Could not extract video ID from URL');
      return;
    }

    // Fetch transcript before navigating
    setLoading(true);
    try {
      const response = await fetch(`/api/transcript/${videoId}`);
      const data = await response.json();
      
      if (!data.transcript) {
        setError('Could not fetch transcript for this video. Please try another video.');
        setLoading(false);
        return;
      }

      // Store transcript in sessionStorage for quick access
      sessionStorage.setItem(`transcript_${videoId}`, JSON.stringify(data));
      
      // Navigate to video page
      router.push(`/video/${videoId}`);
    } catch (err) {
      console.error('Error fetching transcript:', err);
      setError('Failed to load video transcript. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-black">
      <GridBackground />
      <motion.section
        initial={{ opacity: 0.0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-32"
      >
        <div className="max-w-7xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full mb-8 animate-fade-in">
          <Sparkles className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium text-blue-500">AI-Powered Video Analysis</span>
        </div>

        {/* Heading */}
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 text-white leading-tight animate-fade-in-up">
            Chat with Any YouTube Video
            <span className="block">
              <Cover>Learn Faster</Cover>
            </span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Extract insights instantly. Ask questions naturally. Get accurate answers powered by advanced AI.
          </p>
        </div>

        {/* Video URL Input */}
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto mb-16">
          <div className="flex flex-col sm:flex-row gap-3 p-2 bg-black/50 backdrop-blur-sm rounded-2xl border border-white/20">
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="flex-1 px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg bg-transparent text-white placeholder-gray-500 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 sm:px-8 py-3 sm:py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white text-sm sm:text-base font-semibold rounded-xl hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Loading...
                </span>
              ) : (
                'Chat →'
              )}
            </button>
          </div>
          {error && (
            <p className="text-sm text-red-400 mt-3">
              ⚠️ {error}
            </p>
          )}
          <p className="text-xs sm:text-sm text-gray-400 mt-3">
            Good Accuracy • 100% free • Instant results
          </p>
        </form>

        {/* Stats */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2.5 sm:py-3 bg-black/40 backdrop-blur-sm rounded-full border border-blue-500/30 hover:border-blue-500/60 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            <Sparkles className="w-4 sm:w-5 h-4 sm:h-5 text-blue-500" />
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-lg sm:text-2xl font-bold text-white">100%</span>
              <span className="text-xs sm:text-sm text-gray-400">Free Forever</span>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2.5 sm:py-3 bg-black/40 backdrop-blur-sm rounded-full border border-blue-500/30 hover:border-blue-500/60 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition animate-fade-in-up" style={{animationDelay: '0.4s'}}>
            <Zap className="w-4 sm:w-5 h-4 sm:h-5 text-blue-500" />
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-lg sm:text-2xl font-bold text-white">Quick</span>
              <span className="text-xs sm:text-sm text-gray-400">Processing Time</span>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2.5 sm:py-3 bg-black/40 backdrop-blur-sm rounded-full border border-blue-500/30 hover:border-blue-500/60 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition animate-fade-in-up" style={{animationDelay: '0.6s'}}>
            <Shield className="w-4 sm:w-5 h-4 sm:h-5 text-blue-500" />
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-lg sm:text-2xl font-bold text-white">AI</span>
              <span className="text-xs sm:text-sm text-gray-400">Powered Accuracy</span>
            </div>
          </div>
        </div>
        </div>
      </motion.section>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)}
        initialMode="login"
      />
    </div>
  );
}
