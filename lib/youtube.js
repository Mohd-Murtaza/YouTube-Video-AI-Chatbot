/**
 * Extract YouTube video ID from various URL formats
 */
export function extractVideoId(url) {
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
}

/**
 * Validate if a URL is a YouTube video URL
 */
export function isValidYouTubeUrl(url) {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/i;
  return youtubeRegex.test(url);
}

/**
 * Fetch video details from YouTube Data API (Client-side)
 */
export async function fetchVideoDetails(videoId) {
  try {
    // Fetch API key from server-side config endpoint (works on Render)
    let API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    
    if (!API_KEY) {
      try {
        const configRes = await fetch('/api/config');
        const config = await configRes.json();
        API_KEY = config.youtubeApiKey;
      } catch (e) {
        console.warn('Failed to fetch config:', e);
      }
    }
    
    if (!API_KEY) {
      console.warn('YouTube API key not configured');
      return null;
    }

    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${API_KEY}`;
    
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('YouTube API Error:', errorData);
      return null;
    }

    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      const video = data.items[0];
      return {
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        channelTitle: video.snippet.channelTitle,
        publishedAt: video.snippet.publishedAt,
        thumbnails: video.snippet.thumbnails,
        duration: video.contentDetails.duration,
        viewCount: video.statistics.viewCount,
        likeCount: video.statistics.likeCount,
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching video details:', error);
    return null;
  }
}
