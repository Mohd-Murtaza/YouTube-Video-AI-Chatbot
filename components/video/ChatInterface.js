'use client';

import { useState } from 'react';
import { MessageCircle, Lightbulb, History, Send } from 'lucide-react';

export default function ChatInterface({ videoId, videoData }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInputMessage('');
    setIsProcessing(true);

    // Simulating AI response - will be replaced with actual API integration
    setTimeout(() => {
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: 'This is a demo response. AI integration will be added later.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsProcessing(false);
    }, 1000);
  };

  const quickActions = [
    { icon: MessageCircle, label: 'Ask questions', action: () => {} },
    { icon: Lightbulb, label: 'Get insights', action: () => {} },
    { icon: History, label: 'Save history', action: () => {} },
  ];

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-black to-gray-900">
      {/* Header */}
      <div className={`border-b border-gray-800 flex-shrink-0 ${messages.length === 0 ? 'p-3 lg:p-6' : 'p-2 lg:p-4'}`}>
        <div className="flex items-center gap-2 mb-2 lg:mb-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs lg:text-sm text-gray-400 font-medium">Chat</span>
        </div>
        
        {messages.length === 0 && (
          <>
            <h2 className="text-lg lg:text-2xl font-bold mb-2 lg:mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Ask anything about this video
            </h2>
            
            <div className="mb-2 lg:mb-4 p-2 lg:p-3 bg-gray-900/50 rounded-lg border border-gray-800">
              <p className="text-xs lg:text-sm text-gray-300 font-medium mb-1 line-clamp-1 lg:line-clamp-2">
                {videoData?.title || 'Video Title'}
              </p>
              <p className="text-xs text-gray-500 hidden lg:block">
                By {videoData?.channelTitle || 'Channel Name'}
              </p>
            </div>

            <button 
              onClick={() => document.querySelector('input[type="text"]').focus()}
              className="w-full py-2 lg:py-3 px-3 lg:px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg text-sm lg:text-base font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
            >
              <MessageCircle className="w-4 h-4 lg:w-5 lg:h-5" />
              <span className="hidden sm:inline">Chat with this video now</span>
              <span className="sm:hidden">Start Chat</span>
            </button>

            {/* Quick Actions - Hidden on mobile, show on desktop */}
            <div className="hidden lg:grid grid-cols-3 gap-2 mt-4">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg bg-gray-900/30 hover:bg-gray-800/50 border border-gray-800/50 hover:border-gray-700 transition-all"
                >
                  <action.icon className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-500 text-center leading-tight">{action.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
        
        {messages.length > 0 && (
          <div className="py-0.5 lg:py-1">
            <p className="text-xs text-gray-400 line-clamp-1">
              {videoData?.title || 'Video Title'}
            </p>
          </div>
        )}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 min-h-0 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center mb-4 shadow-lg">
              <MessageCircle className="w-10 h-10 text-gray-600" />
            </div>
            <p className="text-gray-500 text-sm max-w-xs">
              Start a conversation by asking any question about this video
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.type === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-gray-900 text-gray-200 border border-gray-800'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))
        )}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-gray-600 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-gray-600 animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-600 animate-bounce" style={{ animationDelay: '0.3s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-2 lg:p-4 border-t border-gray-800 bg-black/50 backdrop-blur-sm flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask a question about the video..."
            className="flex-1 px-3 lg:px-4 py-2 lg:py-3 text-sm lg:text-base bg-gray-900 text-white rounded-xl border border-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-gray-600 transition-all"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isProcessing}
            className="px-4 lg:px-5 py-2 lg:py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-800 disabled:to-gray-800 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:shadow-none"
          >
            <Send className="w-4 h-4 lg:w-5 lg:h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
