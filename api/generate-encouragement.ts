import { handleGenerateEncouragementRequest } from '../backend/encouragementHandler.js';

type NodeRequestLike = {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
};

type NodeResponseLike = {
  status(code: number): NodeResponseLike;
  setHeader(name: string, value: string): void;
  send(body?: string): void;
  end(body?: string): void;
};

function toHeaders(headersObject: NodeRequestLike['headers']): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(headersObject)) {
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item);
    } else if (typeof value === 'string') {
      headers.set(key, value);
    }
  }
  return headers;
}

function toBody(req: NodeRequestLike): BodyInit | undefined {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return undefined;
  }

  if (req.body === undefined || req.body === null) {
    return undefined;
  }

  return typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
}

export default async function handler(req: NodeRequestLike, res: NodeResponseLike): Promise<void> {
  const headers = toHeaders(req.headers);
  const host = headers.get('host') ?? 'localhost';
  const protocol = headers.get('x-forwarded-proto') ?? 'https';
  const url = new URL(req.url ?? '/api/generate-encouragement', `${protocol}://${host}`);
  const request = new Request(url, {
    method: req.method ?? 'GET',
    headers,
    body: toBody(req),
  });

  const response = await handleGenerateEncouragementRequest(request);
  res.status(response.status);

  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  const bodyText = await response.text();
  if (bodyText.length > 0) {
    res.send(bodyText);
    return;
  }

  res.end();
}
