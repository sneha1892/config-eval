import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

export type EvaluationRecord = {
  PK: string;
  SK: string;
  query: string;
  response: string;
  latencyMs: number;
  runId: string;
  // Optional metadata
  model?: string;
  role?: string;
  communicationGuideline?: string;
  contextClarificationGuideline?: string;
  handoverEscalationGuideline?: string;
};

let docClient: DynamoDBDocumentClient | null = null;

function getDocClient(): DynamoDBDocumentClient {
  if (docClient) return docClient;
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
  console.log('🔍 DynamoDB Client Config:', {
    region,
    hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
    hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
    endpoint: process.env.DYNAMO_ENDPOINT,
  });
  const client = new DynamoDBClient({
    region,
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
  model?: string;
  role?: string;
  communicationGuideline?: string;
  contextClarificationGuideline?: string;
  handoverEscalationGuideline?: string;
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
    model: data.model,
    role: data.role,
    communicationGuideline: data.communicationGuideline,
    contextClarificationGuideline: data.contextClarificationGuideline,
    handoverEscalationGuideline: data.handoverEscalationGuideline,
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

export async function getEvaluations(options?: {
  limit?: number;
  startDate?: string;
  endDate?: string;
}): Promise<{ items: EvaluationRecord[]; stats: { totalCount: number; avgLatency: number; uniqueQueries: number } }> {
  const TableName = 'LLMAgentEvaluation';
  const limit = options?.limit || 50;

  try {
    const client = getDocClient();
    const result = await client.send(
      new ScanCommand({
        TableName,
        Limit: limit,
      })
    );

    const items = (result.Items || []) as EvaluationRecord[];

    // Sort by timestamp (SK) descending
    items.sort((a, b) => b.SK.localeCompare(a.SK));

    // Calculate stats
    const totalCount = items.length;
    const avgLatency = totalCount > 0 
      ? items.reduce((sum, item) => sum + item.latencyMs, 0) / totalCount 
      : 0;
    const uniqueQueries = new Set(items.map(item => item.query)).size;

    return {
      items,
      stats: {
        totalCount,
        avgLatency: Math.round(avgLatency),
        uniqueQueries,
      },
    };
  } catch (err) {
    console.error('Failed to fetch evaluations from DynamoDB:', err);
    throw err;
  }
}


export async function getEvaluationByKeys(pk: string, sk: string): Promise<EvaluationRecord | null> {
  const TableName = 'LLMAgentEvaluation';
  try {
    const client = getDocClient();
    const res = await client.send(
      new GetCommand({
        TableName,
        Key: { PK: pk, SK: sk },
      })
    );
    return (res.Item as EvaluationRecord) || null;
  } catch (err) {
    console.error('Failed to fetch evaluation by keys:', err);
    throw err;
  }
}

