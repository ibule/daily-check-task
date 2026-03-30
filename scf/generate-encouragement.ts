import { handleGenerateEncouragementRequest } from '../backend/encouragementHandler';

type ScfEvent = {
  headers?: Record<string, string | undefined>;
  httpMethod?: string;
  requestContext?: {
    http?: {
      method?: string;
      path?: string;
    };
    path?: string;
  };
  path?: string;
  rawPath?: string;
  body?: string | null;
  isBase64Encoded?: boolean;
};

type ScfResponse = {
  isBase64Encoded: boolean;
  statusCode: number;
  headers: Record<string, string>;
  body: string;
};

function getMethod(event: ScfEvent): string {
  return event.requestContext?.http?.method ?? event.httpMethod ?? 'POST';
}

function getPath(event: ScfEvent): string {
  return event.rawPath ?? event.requestContext?.http?.path ?? event.requestContext?.path ?? event.path ?? '/api/generate-encouragement';
}

function decodeBody(event: ScfEvent): string | undefined {
  if (!event.body) return undefined;
  if (!event.isBase64Encoded) return event.body;
  return Buffer.from(event.body, 'base64').toString('utf-8');
}

export async function main_handler(event: ScfEvent): Promise<ScfResponse> {
  const url = `https://scf.local${getPath(event)}`;
  const req = new Request(url, {
    method: getMethod(event),
    headers: event.headers,
    body: decodeBody(event),
  });

  const response = await handleGenerateEncouragementRequest(req);
  return {
    isBase64Encoded: false,
    statusCode: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    body: await response.text(),
  };
}
