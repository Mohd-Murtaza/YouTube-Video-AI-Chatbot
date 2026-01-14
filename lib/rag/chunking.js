/**
 * LangChain Text Chunking for RAG
 * Chunks transcript WITH video title and description for better semantic search
 */

import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

/**
 * Chunk transcript with video metadata for semantic search
 * 
 * Strategy:
 * - Chunk 0: Title + Description + Initial transcript (context-rich)
 * - Other chunks: Brief title reference + transcript segments
 * 
 * @param {Object} params
 * @param {string} params.videoId - YouTube video ID
 * @param {string} params.videoTitle - Video title
 * @param {string} params.channelTitle - Channel name
 * @param {string} params.description - Video description
 * @param {Array} params.segments - Transcript segments [{text, timestamp, offset}]
 * @returns {Promise<Array>} Chunks with metadata [{text, metadata}]
 */
export async function chunkTranscriptWithMetadata({
  videoId,
  videoTitle,
  channelTitle,
  description,
  segments
}) {
  try {
    console.log(`🔪 Starting chunking for video: ${videoId}`);
    console.log(`📊 Total segments: ${segments.length}`);

    // Step 1: Build context header (title + description)
    const contextHeader = buildContextHeader(videoTitle, channelTitle, description);
    
    // Step 2: Build full transcript with timestamps
    const transcriptText = segments
      .map(seg => `[${seg.timestamp}] ${seg.text}`)
      .join('\n');

    // Step 3: Combine context + transcript
    const fullText = `${contextHeader}\n\n${transcriptText}`;
    
    console.log(`📝 Full text length: ${fullText.length} characters`);

    // Step 3.5: Get optimal chunk parameters based on video length
    const params = getOptimalChunkParams(fullText.length);
    console.log(`⚙️  Using adaptive chunking: size=${params.chunkSize}, overlap=${params.chunkOverlap}`);

    // Step 4: Initialize text splitter with dynamic parameters
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: params.chunkSize,          // Dynamic based on video length
      chunkOverlap: params.chunkOverlap,    // Dynamic overlap for context continuity
      separators: [
        '\n\n',                 // Paragraph breaks (highest priority)
        '\n',                   // Line breaks
        '. ',                   // Sentences
        '! ',
        '? ',
        ', ',                   // Clauses
        ' ',                    // Words
        ''                      // Characters (last resort)
      ],
      lengthFunction: (text) => text.length,
    });

    // Step 5: Split into chunks
    const textChunks = await splitter.splitText(fullText);
    console.log(`✂️ Created ${textChunks.length} raw chunks`);

    // Step 6: Process chunks with metadata
    const chunksWithMetadata = textChunks.map((chunk, index) => {
      // Extract timestamp from chunk (format: [H:MM:SS] or [HH:MM:SS] or [HH:MM:SS])
      // Flexible pattern: 1-2 digits for hours, 2 digits for minutes/seconds
      const timestampMatch = chunk.match(/\[(\d{1,2}:\d{2}:\d{2})\]/);
      const timestamp = timestampMatch ? timestampMatch[1] : '00:00:00';

      // Check if this is the first chunk (contains context)
      const isContextChunk = index === 0 && chunk.includes(contextHeader);

      return {
        text: chunk,
        metadata: {
          videoId,
          videoTitle,
          channelTitle,
          chunkIndex: index,
          timestamp,
          isContextChunk,  // First chunk with full context
          chunkSize: chunk.length,
          totalChunks: textChunks.length,
          createdAt: new Date().toISOString(),
        }
      };
    });

    console.log(`✅ Chunking complete: ${chunksWithMetadata.length} chunks with metadata`);

    // Log statistics
    logChunkingStats(chunksWithMetadata);

    return chunksWithMetadata;

  } catch (error) {
    console.error('❌ Chunking error:', error);
    throw new Error(`Failed to chunk transcript: ${error.message}`);
  }
}

/**
 * Build context header with title and description
 * Creates a formatted header with video metadata for the first chunk
 * 
 * @param {string} title - Video title
 * @param {string} channel - Channel name
 * @param {string} description - Video description (full text)
 * @returns {string} Formatted context header with title, channel, and description
 */
function buildContextHeader(title, channel, description) {
  const cleanDescription = description 
    ? description
    : 'No description available';

  return [
    `VIDEO TITLE: ${title}`,
    `CHANNEL: ${channel}`,
    `DESCRIPTION: ${cleanDescription}`,
    `---`,
  ].join('\n');
}

/**
 * Log chunking statistics for debugging
 * Outputs chunk count, average size, size range, and first chunk preview
 * 
 * @param {Array} chunks - Array of chunks with metadata
 */
function logChunkingStats(chunks) {
  const avgSize = chunks.reduce((sum, c) => sum + c.text.length, 0) / chunks.length;
  const minSize = Math.min(...chunks.map(c => c.text.length));
  const maxSize = Math.max(...chunks.map(c => c.text.length));

  console.log('📊 Chunking Statistics:');
  console.log(`   Total chunks: ${chunks.length}`);
  console.log(`   Average size: ${Math.round(avgSize)} chars`);
  console.log(`   Size range: ${minSize} - ${maxSize} chars`);
  console.log(`   Context chunk: ${chunks.some(c => c.metadata.isContextChunk) ? 'Yes ✓' : 'No ✗'}`);
  
  // Sample first chunk
  if (chunks.length > 0) {
    console.log('📌 First chunk preview:');
    console.log(`   Timestamp: ${chunks[0].metadata.timestamp}`);
    console.log(`   Text: ${chunks[0].text.substring(0, 100)}...`);
  }
}

/**
 * Calculate optimal chunk parameters based on transcript length
 * STRATEGY: Smaller videos → smaller chunks, Larger videos → larger chunks
 * This creates balanced chunk counts and better context for long videos
 * 
 * @param {number} totalLength - Total character count
 * @returns {Object} {chunkSize, chunkOverlap}
 */
export function getOptimalChunkParams(totalLength) {
  // Short videos (< 5K chars) - Small chunks for precision
  // Example: 3K chars → ~5 chunks
  if (totalLength < 5000) {
    return { chunkSize: 600, chunkOverlap: 100 };
  }

  // Medium videos (5K-20K) - Moderate chunks
  // Example: 12K chars → ~12 chunks
  if (totalLength < 20000) {
    return { chunkSize: 1000, chunkOverlap: 150 };
  }

  // Long videos (20K-50K) - Larger chunks for better context
  // Example: 35K chars → ~28 chunks
  if (totalLength < 50000) {
    return { chunkSize: 1300, chunkOverlap: 150 };
  }

  // Very long videos (50K-100K) - Even larger chunks
  // Example: 70K chars → ~47 chunks
  if (totalLength < 100000) {
    return { chunkSize: 1500, chunkOverlap: 200 };
  }

  // Extremely long videos (100K+) - Maximum efficiency
  // Example: 200K chars → ~118 chunks
  return { chunkSize: 1700, chunkOverlap: 200 };
}
