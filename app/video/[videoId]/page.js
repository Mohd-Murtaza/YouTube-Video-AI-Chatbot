'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MessageCircle, FileText, Subtitles, ChevronUp, ChevronDown } from 'lucide-react';
import VideoPlayer from '@/components/video/VideoPlayer';
import ChatInterface from '@/components/video/ChatInterface';
import { fetchVideoDetails } from '@/lib/youtube';

export default function VideoPage() {
  const params = useParams();
  const videoId = params.videoId;
  const [videoData, setVideoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  const [showVideo, setShowVideo] = useState(true);

  useEffect(() => {
    const loadVideoData = async () => {
      try {
        const data = await fetchVideoDetails(videoId);
        
        if (data) {
          setVideoData(data);
        } else {
          setVideoData({
            id: videoId,
            title: 'YouTube Video',
            description: 'Watch and chat about this video.',
            channelTitle: 'YouTube Channel',
          });
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading video data:', error);
        setVideoData({
          id: videoId,
          title: 'YouTube Video',
          description: 'Watch and chat about this video.',
          channelTitle: 'YouTube Channel',
        });
        setLoading(false);
      }
    };

    if (videoId) {
      loadVideoData();
    }
  }, [videoId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading video...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Desktop Layout (>1024px) - Side by Side */}
      <div className="hidden lg:flex h-screen">
        {/* Left Section - Video Player */}
        <div className="w-[45%] flex flex-col overflow-y-auto">
          <VideoPlayer videoId={videoId} videoData={videoData} />
        </div>

        {/* Right Section - Chat Interface */}
        <div className="w-[55%] border-l border-gray-800">
          <ChatInterface videoId={videoId} videoData={videoData} />
        </div>
      </div>

      {/* Mobile/Tablet Layout (<=1024px) */}
      <div className="lg:hidden flex flex-col h-screen">
        {/* Video Section */}
        {showVideo && (
          <div className="flex-shrink-0">
            <div className="aspect-video w-full max-h-[35vh] bg-gray-900">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Hide/Show Video Button */}
        <div className="flex-shrink-0 px-4 py-2 bg-black border-b border-gray-800">
          <button
            onClick={() => setShowVideo(!showVideo)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-900/50 hover:bg-gray-800/50 text-gray-300 rounded-lg font-medium transition-all border border-gray-800"
          >
            {showVideo ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span className="text-sm">Hide Video</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                <span className="text-sm">Show Video</span>
              </>
            )}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 bg-black flex-shrink-0">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all ${
              activeTab === 'chat'
                ? 'bg-gray-800/50 text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/30'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat</span>
          </button>
          <button
            onClick={() => setActiveTab('description')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all ${
              activeTab === 'description'
                ? 'bg-gray-800/50 text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/30'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Description</span>
          </button>
          <button
            onClick={() => setActiveTab('transcript')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all ${
              activeTab === 'transcript'
                ? 'bg-gray-800/50 text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/30'
            }`}
          >
            <Subtitles className="w-4 h-4" />
            <span>Transcript</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'chat' && (
            <ChatInterface videoId={videoId} videoData={videoData} />
          )}
          {activeTab === 'description' && (
            <div className="h-full overflow-y-auto p-4 bg-gradient-to-b from-black to-gray-900">
              <h2 className="text-xl font-bold mb-4">{videoData?.title}</h2>
              <div className="flex flex-wrap items-center gap-3 text-gray-400 text-sm mb-4">
                <span className="text-white font-medium">{videoData?.channelTitle}</span>
                {videoData?.viewCount && <span>{parseInt(videoData.viewCount).toLocaleString()} views</span>}
              </div>
              <div className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">
                {videoData?.description || 'No description available'}
              </div>
            </div>
          )}
          {activeTab === 'transcript' && (
            <div className="h-full overflow-y-auto p-4 bg-gradient-to-b from-black to-gray-900">
              <h2 className="text-xl font-bold mb-4">Transcript</h2>
              <div className="text-gray-400 text-sm leading-relaxed">
                <p>Transcript will be available here once the backend API is connected...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
