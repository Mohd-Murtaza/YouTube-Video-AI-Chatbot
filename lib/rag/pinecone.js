/**
 * Pinecone Vector Store for RAG - Phase 3
 * Stores and searches embeddings for semantic video search
 */

import { Pinecone } from '@pinecone-database/pinecone';

// Constants
const EMBEDDING_DIMENSIONS = 384;  // HuggingFace all-MiniLM-L6-v2
const MAX_METADATA_TEXT_LENGTH = 8000;  // Pinecone metadata size limit
const DEFAULT_SCORE_THRESHOLD = 0.35;  // Minimum similarity score

// Singleton Pinecone client
let pineconeClient = null;
let pineconeIndex = null;

/**
 * Initialize Pinecone client and connect to index
 * Uses serverless index from environment variables
 * 
 * @returns {Promise<Object>} Pinecone index instance
 */
export async function initializePinecone() {
  if (pineconeIndex) {
    return pineconeIndex;
  }

  try {
    const apiKey = process.env.PINECONE_API_KEY;
    const indexName = process.env.PINECONE_INDEX_NAME;

    if (!apiKey) {
      throw new Error('PINECONE_API_KEY not found in environment variables');
    }

    if (!indexName) {
      throw new Error('PINECONE_INDEX_NAME not found in environment variables');
    }

    console.log(`🔌 Connecting to Pinecone index: ${indexName}...`);

    // Initialize client
    pineconeClient = new Pinecone({
      apiKey,
    });

    // Get index
    pineconeIndex = pineconeClient.index(indexName);

    console.log('✅ Pinecone client initialized successfully');
    return pineconeIndex;

  } catch (error) {
    console.error('❌ Pinecone initialization error:', error);
    throw new Error(`Failed to initialize Pinecone: ${error.message}`);
  }
}

/**
 * Save chunks with embeddings to Pinecone
 * Processes in batches to avoid rate limits and timeouts
 * 
 * @param {Array} chunks - Array of chunks with text and metadata
 * @param {Array} embeddings - Array of 384-dimensional vectors
 * @param {number} batchSize - Number of vectors to upsert at once (default: 100)
 * @returns {Promise<Object>} Statistics about upserted vectors
 */
export async function saveChunksToPinecone(chunks, embeddings, batchSize = 100) {
  try {
    if (chunks.length !== embeddings.length) {
      throw new Error(`Chunk count (${chunks.length}) doesn't match embedding count (${embeddings.length})`);
    }

    console.log(`💾 Starting Pinecone upsert for ${chunks.length} vectors...`);
    const startTime = Date.now();

    const index = await initializePinecone();

    // Prepare vectors for upsert
    const vectors = chunks.map((chunk, i) => ({
      id: `${chunk.metadata.videoId}-chunk-${chunk.metadata.chunkIndex}`,
      values: embeddings[i],
      metadata: {
        videoId: chunk.metadata.videoId,
        videoTitle: chunk.metadata.videoTitle,
        channelTitle: chunk.metadata.channelTitle,
        chunkIndex: chunk.metadata.chunkIndex,
        timestamp: chunk.metadata.timestamp,
        isContextChunk: chunk.metadata.isContextChunk,
        text: chunk.text.substring(0, MAX_METADATA_TEXT_LENGTH), // Pinecone metadata limit
        createdAt: chunk.metadata.createdAt,
      }
    }));

    let upsertedCount = 0;

    // Upsert in batches
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      
      console.log(`📦 Upserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(vectors.length / batchSize)}`);

      await index.upsert(batch);
      upsertedCount += batch.length;

      // Small delay between batches
      if (i + batchSize < vectors.length) {
        await sleep(100);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Upserted ${upsertedCount} vectors to Pinecone in ${duration}s`);

    return {
      success: true,
      upsertedCount,
      duration: parseFloat(duration),
      videoId: chunks[0].metadata.videoId,
    };

  } catch (error) {
    console.error('❌ Pinecone upsert error:', error);
    throw new Error(`Failed to save to Pinecone: ${error.message}`);
  }
}

/**
 * Search for relevant chunks using semantic similarity
 * Returns top-K most relevant chunks for a given query
 * 
 * @param {Array} queryEmbedding - Query vector (dimensions must match EMBEDDING_DIMENSIONS)
 * @param {string} videoId - Video ID to filter results
 * @param {number} topK - Number of results to return (default: 5)
 * @param {number} scoreThreshold - Minimum similarity score to include (default: 0.7)
 * @returns {Promise<Array>} Array of relevant chunks with scores
 */
export async function searchRelevantChunks(queryEmbedding, videoId, topK = 5, scoreThreshold = DEFAULT_SCORE_THRESHOLD) {
  try {
    if (!queryEmbedding || queryEmbedding.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(`Invalid query embedding: must be ${EMBEDDING_DIMENSIONS}-dimensional array`);
    }

    console.log(`🔍 Searching Pinecone for videoId: ${videoId}, topK: ${topK}`);
    const startTime = Date.now();

    const index = await initializePinecone();

    // Query Pinecone with filter
    const queryResponse = await index.query({
      vector: queryEmbedding,
      topK,
      filter: {
        videoId: { $eq: videoId }
      },
      includeMetadata: true,
    });

    const duration = Date.now() - startTime;
    console.log(`✅ Found ${queryResponse.matches.length} results in ${duration}ms`);

    // Format and filter results by score threshold
    const results = queryResponse.matches
      .filter(match => match.score >= scoreThreshold)
      .map(match => ({
      chunkIndex: match.metadata.chunkIndex,
      timestamp: match.metadata.timestamp,
      text: match.metadata.text,
      score: match.score,
      isContextChunk: match.metadata.isContextChunk,
      videoTitle: match.metadata.videoTitle,
      channelTitle: match.metadata.channelTitle,
    }));

    // Log filtering stats and top results
    console.log(`🔍 Filtered to ${results.length} results (threshold: ${scoreThreshold})`);
    
    if (results.length > 0) {
      console.log('📊 Top 3 results:');
      results.slice(0, 3).forEach((r, i) => {
        console.log(`   ${i + 1}. [${r.timestamp}] Score: ${r.score.toFixed(4)} - ${r.text.substring(0, 60)}...`);
      });
    } else {
      console.warn('⚠️ No results above score threshold');
    }

    return results;

  } catch (error) {
    console.error('❌ Pinecone search error:', error);
    throw new Error(`Failed to search Pinecone: ${error.message}`);
  }
}

/**
 * Delete all chunks for a specific video
 * Useful for re-indexing or cleanup
 * 
 * @param {string} videoId - Video ID to delete chunks for
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteVideoChunks(videoId) {
  try {
    console.log(`🗑️  Deleting chunks for videoId: ${videoId}`);

    const index = await initializePinecone();

    // Delete by metadata filter
    await index.deleteMany({
      filter: {
        videoId: { $eq: videoId }
      }
    });

    console.log(`✅ Deleted all chunks for video: ${videoId}`);

    return {
      success: true,
      videoId,
    };

  } catch (error) {
    console.error('❌ Pinecone delete error:', error);
    throw new Error(`Failed to delete from Pinecone: ${error.message}`);
  }
}

/**
 * Check if a video is already indexed in Pinecone
 * Queries for any chunk with the given videoId
 * 
 * @param {string} videoId - Video ID to check
 * @returns {Promise<boolean>} True if video is indexed
 */
export async function isVideoIndexed(videoId) {
  try {
    const index = await initializePinecone();

    // Query with dummy vector just to check existence
    const dummyVector = new Array(EMBEDDING_DIMENSIONS).fill(0);
    const response = await index.query({
      vector: dummyVector,
      topK: 1,
      filter: {
        videoId: { $eq: videoId }
      },
      includeMetadata: false,
    });

    return response.matches.length > 0;

  } catch (error) {
    console.error('❌ Pinecone check error:', error);
    return false;
  }
}

/**
 * Sleep helper for delays between batches
 * 
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
