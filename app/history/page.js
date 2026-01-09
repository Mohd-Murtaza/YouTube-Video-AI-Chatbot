'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, MessageSquare, Play, Trash2, History as HistoryIcon } from 'lucide-react';
import Image from 'next/image';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await fetch('/api/history');
      const data = await response.json();

      if (data.success) {
        setHistory(data.history);
      } else {
        setError(data.error || 'Failed to load history');
      }
    } catch (err) {
      console.error('Error loading history:', err);
      setError('Failed to load history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoClick = (videoId) => {
    router.push(`/video/${videoId}`);
  };

  const handleDeleteChat = async (videoId, e) => {
    e.stopPropagation();
    
    if (!confirm('Delete this chat history?')) return;

    try {
      const response = await fetch(`/api/history/${videoId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setHistory(history.filter(item => item.videoId !== videoId));
      } else {
        alert('Failed to delete chat');
      }
    } catch (err) {
      console.error('Error deleting chat:', err);
      alert('Failed to delete chat');
    }
  };

  const formatDate = (date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffMs = now - messageDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return messageDate.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your chat history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <HistoryIcon className="w-8 h-8 text-blue-500" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Chat History
            </h1>
          </div>
          <p className="text-gray-400 text-sm">
            {history.length} video{history.length !== 1 ? 's' : ''} with chat conversations
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {history.length === 0 && !error && (
          <div className="text-center py-16">
            <HistoryIcon className="w-24 h-24 text-gray-700 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-400 mb-2">No chat history yet</h2>
            <p className="text-gray-500 mb-6">Start chatting with videos to see them here</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Browse Videos
            </button>
          </div>
        )}

        {/* History Grid */}
        {history.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.map((item) => (
              <div
                key={item.videoId}
                onClick={() => handleVideoClick(item.videoId)}
                className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden hover:border-blue-500 transition-all cursor-pointer group"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gray-800">
                  {item.videoThumbnail ? (
                    <Image
                      src={item.videoThumbnail}
                      alt={item.videoTitle}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-12 h-12 text-gray-600" />
                    </div>
                  )}
                  
                  {/* Message count badge */}
                  <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {item.messageCount}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
                    {item.videoTitle}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <Clock className="w-3 h-3" />
                    {formatDate(item.lastMessageAt)}
                  </div>

                  {/* Last message preview */}
                  <div className="bg-gray-800/50 rounded p-2 mb-3">
                    <p className="text-xs text-gray-400 line-clamp-2">
                      {item.lastMessageRole === 'user' ? '💬 ' : '🤖 '}
                      {item.lastMessage}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVideoClick(item.videoId);
                      }}
                      className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                    >
                      Continue Chat
                    </button>
                    <button
                      onClick={(e) => handleDeleteChat(item.videoId, e)}
                      className="px-3 py-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
