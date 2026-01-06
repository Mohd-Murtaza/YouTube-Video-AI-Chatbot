'use client';

import { useState, useEffect, useCallback } from 'react';
import { Eye, ThumbsUp, Calendar, FileText, Subtitles } from 'lucide-react';

export default function VideoPlayer({ videoId, videoData }) {
  const [activeTab, setActiveTab] = useState('description');
  const [transcript, setTranscript] = useState(null);
  const [loadingTranscript, setLoadingTranscript] = useState(false);

  const formatCount = (count) => {
    if (!count) return '0';
    const num = parseInt(count);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const fetchTranscript = useCallback(async () => {
    if (transcript) return;
    
    setLoadingTranscript(true);
    try {
      const response = await fetch(`/api/transcript/${videoId}`);
      const data = await response.json();
      
      if (data.transcript) {
        setTranscript(data.transcript);
      } else {
        setTranscript(data.error || 'Transcript not available');
      }
    } catch (error) {
      console.error('Error fetching transcript:', error);
      setTranscript('Failed to load transcript');
    } finally {
      setLoadingTranscript(false);
    }
  }, [videoId, transcript]);

  useEffect(() => {
    if (activeTab === 'transcript') {
      fetchTranscript();
    }
  }, [activeTab, fetchTranscript]);

  return (
    <div className="w-full h-full min-h-[600px] flex flex-col overflow-y-auto p-3 sm:p-4 lg:p-6">
      {/* YouTube Video Embed */}
      <div className="aspect-video w-full xl:h-[35vh] bg-gray-900 rounded-lg sm:rounded-xl overflow-hidden mb-4 sm:mb-6 shadow-2xl flex-shrink-0 min-h-[200px]">
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>

      {/* Video Info */}
      <div className="flex-1 flex flex-col space-y-3 sm:space-y-4 min-h-0">
        <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-2xl font-bold text-white leading-tight px-1 flex-shrink-0">
          {videoData?.title || 'Video Title'}
        </h1>
        
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 text-gray-400 text-xs sm:text-sm px-1 flex-shrink-0">
          <span className="font-medium text-white text-sm sm:text-base">{videoData?.channelTitle || 'Channel Name'}</span>
          
          {videoData?.viewCount && (
            <div className="flex items-center gap-1 sm:gap-1.5">
              <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{formatCount(videoData.viewCount)} views</span>
            </div>
          )}
          
          {videoData?.likeCount && (
            <div className="flex items-center gap-1 sm:gap-1.5">
              <ThumbsUp className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{formatCount(videoData.likeCount)} likes</span>
            </div>
          )}
          
          {videoData?.publishedAt && (
            <div className="flex items-center gap-1 sm:gap-1.5">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{formatDate(videoData.publishedAt)}</span>
              <span className="sm:hidden">{formatDate(videoData.publishedAt).split(',')[0]}</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex-1 flex flex-col min-h-[250px] bg-gradient-to-br from-gray-900/80 to-gray-800/50 rounded-lg sm:rounded-xl border border-gray-800/50 backdrop-blur-sm overflow-hidden">
          {/* Tab Headers */}
          <div className="flex border-b border-gray-800 flex-shrink-0">
            <button
              onClick={() => setActiveTab('description')}
              className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'description'
                  ? 'bg-gray-800/50 text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/30'
              }`}
            >
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Description</span>
            </button>
            <button
              onClick={() => setActiveTab('transcript')}
              className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'transcript'
                  ? 'bg-gray-800/50 text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/30'
              }`}
            >
              <Subtitles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Transcript</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-3 sm:p-4 md:p-5 overflow-hidden min-h-0">
            {activeTab === 'description' ? (
              <div className="text-gray-400 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap h-full overflow-y-auto custom-scrollbar pr-2">
                {videoData?.description || 'Video description will appear here...'}
              </div>
            ) : (
              <div className="text-gray-400 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap h-full overflow-y-auto custom-scrollbar pr-2">
                {loadingTranscript ? (
                  <div className="flex items-center justify-center py-6 sm:py-8">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                    </div>
                  </div>
                ) : (
                  <p>{transcript || 'No transcript available'}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.5);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
          border-radius: 10px;
          transition: background 0.3s ease;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%);
        }

        /* Firefox scrollbar */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #3b82f6 rgba(31, 41, 55, 0.5);
        }
      `}</style>
    </div>
  );
}
