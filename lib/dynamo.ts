import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

export type EvaluationRecord = {
  PK: string;
  SK: string;
  query: string;
  response: string;
  latencyMs: number;
  runId: string;
};

let docClient: DynamoDBDocumentClient | null = null;

function getDocClient(): DynamoDBDocumentClient {
  if (docClient) return docClient;
  const client = new DynamoDBClient({
    region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1',
    endpoint: process.env.DYNAMO_ENDPOINT || undefined,
    credentials:
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined,
  });
  docClient = DynamoDBDocumentClient.from(client);
  return docClient;
}

export async function recordEvaluation(data: {
  query: string;
  response: string;
  latencyMs: number;
  runId: string;
}): Promise<void> {
  const TableName = 'LLMAgentEvaluation';
  const nowIso = new Date().toISOString();
  const item: EvaluationRecord = {
    PK: `RUN#${data.runId}`,
    SK: `TIME#${nowIso}`,
    query: data.query,
    response: data.response,
    latencyMs: data.latencyMs,
    runId: data.runId,
  };

  try {
    const client = getDocClient();
    await client.send(
      new PutCommand({
        TableName,
        Item: item,
      })
    );
  } catch (err) {
    console.error('Failed to record evaluation to DynamoDB:', err);
    throw err;
  }
}


