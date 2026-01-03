'use client';

import { Target, MessageCircle, Search, BookOpen, Zap, Lock } from 'lucide-react';
import { HoverEffect } from '@/components/ui/card-hover-effect';

export default function Features() {
  const features = [
    {
      icon: Target,
      title: 'Instant Understanding',
      description: 'Get key insights from hours of video content in seconds. No need to watch entire videos.',
    },
    {
      icon: MessageCircle,
      title: 'Natural Conversations',
      description: 'Ask questions in plain English. Get accurate answers based on actual video content.',
    },
    {
      icon: Search,
      title: 'Smart Search',
      description: 'Advanced AI retrieves relevant information from video transcripts with precision.',
    },
    {
      icon: BookOpen,
      title: 'Learn Faster',
      description: 'Perfect for students, researchers, and lifelong learners. Study smarter, not harder.',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Process videos and get responses in seconds. Real-time chat experience.',
    },
    {
      icon: Lock,
      title: 'Privacy First',
      description: 'Your chats are private. We never share your data or conversations.',
    },
  ];

  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-white">
            Why Choose VideoChatAI?
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
            Powerful features designed to transform how you learn from video content
          </p>
        </div>

        {/* Features Grid */}
        <HoverEffect items={features} />
      </div>
    </section>
  );
}
