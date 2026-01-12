/**
 * HuggingFace Embeddings for RAG - Phase 2
 * Converts text chunks into 384-dimensional vectors for semantic search
 */

import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';

// Singleton instance to avoid recreating client
let embeddingsInstance = null;

/**
 * Initialize HuggingFace embeddings client
 * Uses sentence-transformers/all-MiniLM-L6-v2 (FREE, 384 dimensions)
 * 
 * @returns {HuggingFaceInferenceEmbeddings} Embeddings client instance
 */
export function initializeEmbeddings() {
  if (embeddingsInstance) {
    return embeddingsInstance;
  }

  const apiKey = process.env.HUGGINGFACE_API_KEY;
  
  if (!apiKey) {
    throw new Error('HUGGINGFACE_API_KEY not found in environment variables');
  }

  embeddingsInstance = new HuggingFaceInferenceEmbeddings({
    apiKey,
    model: 'sentence-transformers/all-MiniLM-L6-v2',
  });

  console.log('✅ HuggingFace embeddings client initialized');
  return embeddingsInstance;
}

/**
 * Embed multiple text chunks with retry logic
 * Processes in batches to avoid rate limits and timeouts
 * 
 * @param {Array} chunks - Array of chunks with text and metadata
 * @param {number} batchSize - Number of chunks to process at once (default: 10)
 * @returns {Promise<Array>} Array of 384-dimensional vectors
 */
export async function embedChunks(chunks, batchSize = 10) {
  try {
    console.log(`🔢 Starting embedding for ${chunks.length} chunks...`);
    const startTime = Date.now();

    const embeddings = initializeEmbeddings();
    const allEmbeddings = [];

    // Process in batches to avoid rate limits
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const batchTexts = batch.map(chunk => chunk.text);
      
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}`);

      // Retry logic for batch
      const batchEmbeddings = await retryWithBackoff(
        async () => await embeddings.embedDocuments(batchTexts),
        3,  // max retries
        1000  // initial delay (1s)
      );

      allEmbeddings.push(...batchEmbeddings);

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < chunks.length) {
        await sleep(100);  // 100ms delay
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Embedded ${chunks.length} chunks in ${duration}s`);
    console.log(`📊 Vector dimensions: ${allEmbeddings[0]?.length || 0}`);

    return allEmbeddings;

  } catch (error) {
    console.error('❌ Batch embedding error:', error);
    throw new Error(`Failed to embed chunks: ${error.message}`);
  }
}

/**
 * Embed a single query text for semantic search
 * Used when user asks a question to find relevant chunks
 * 
 * @param {string} queryText - User's question or search query
 * @returns {Promise<Array>} 384-dimensional vector
 */
export async function embedQuery(queryText) {
  try {
    if (!queryText || queryText.trim().length === 0) {
      throw new Error('Query text cannot be empty');
    }

    console.log(`🔍 Embedding query: "${queryText.substring(0, 50)}..."`);

    const embeddings = initializeEmbeddings();

    // Retry logic for single query
    const vector = await retryWithBackoff(
      async () => await embeddings.embedQuery(queryText),
      3,  // max retries
      500  // initial delay (0.5s)
    );

    console.log(`✅ Query embedded successfully (${vector.length} dimensions)`);
    return vector;

  } catch (error) {
    console.error('❌ Query embedding error:', error);
    throw new Error(`Failed to embed query: ${error.message}`);
  }
}

/**
 * Retry helper with exponential backoff
 * Handles transient API failures and rate limiting
 * 
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} initialDelay - Initial delay in milliseconds
 * @returns {Promise<any>} Result from successful function call
 */
async function retryWithBackoff(fn, maxRetries, initialDelay) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        break;  // No more retries
      }

      const delay = initialDelay * Math.pow(2, attempt);
      console.warn(`⚠️ Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      console.warn(`   Error: ${error.message}`);

      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Sleep helper for delays
 * 
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
