import { Pinecone } from '@pinecone-database/pinecone';

let pineconeClient = null;

export async function getPineconeClient() {
  if (pineconeClient) {
    return pineconeClient;
  }

  if (!process.env.PINECONE_API_KEY) {
    throw new Error('PINECONE_API_KEY is not defined');
  }

  pineconeClient = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });

  console.log('✅ Pinecone client initialized');
  return pineconeClient;
}

export async function getPineconeIndex() {
  const client = await getPineconeClient();
  const indexName = process.env.PINECONE_INDEX_NAME || 'your_indexName';
  
  return client.Index(indexName);
}
