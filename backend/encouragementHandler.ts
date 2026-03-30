const STYLE_PROMPTS: Record<string, string> = {
  gentle: '温柔亲切，像妈妈说话的语气，给孩子温暖感',
  lively: '活泼开朗，可以用叠词、拟声词，语气轻松有趣',
  positive: '积极向上，简洁有力，像运动员宣言',
  poetic: '文艺清新，句式优美，带有画面感',
  humorous: '轻松幽默，可以有小玩笑，让孩子看了想笑',
};

type AllowedRateLimitResult = {
  allowed: true;
  remaining: number | null;
  rollback: () => Promise<void>;
};

type RejectedRateLimitResult = {
  allowed: false;
  status: number;
  error: string;
  message: string;
};

type RateLimitResult = AllowedRateLimitResult | RejectedRateLimitResult;

type GeneratePayload = {
  name?: string;
  count?: number;
  style?: string;
};

let redisClientPromise: Promise<RedisClientLike | null> | null = null;

interface RedisClientLike {
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  decr(key: string): Promise<number>;
}

type RedisConstructor = {
  new (url: string, options: Record<string, unknown>): RedisClientLike;
  new (options: Record<string, unknown>): RedisClientLike;
};

function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': process.env['CORS_ALLOW_ORIGIN'] ?? '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...getCorsHeaders(),
    },
  });
}

function noContentResponse(status = 204): Response {
  return new Response(null, {
    status,
    headers: getCorsHeaders(),
  });
}

function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for') ?? headers.get('X-Forwarded-For') ?? '';
  const realIp = headers.get('x-real-ip') ?? headers.get('X-Real-IP') ?? '';
  return forwarded.split(',')[0].trim() || realIp.trim() || 'unknown';
}

function getRateLimitMode(): 'off' | 'redis' {
  const mode = (process.env['RATE_LIMIT_MODE'] ?? '').trim().toLowerCase();
  if (mode === 'redis') return 'redis';
  if (mode === 'off') return 'off';
  return process.env['REDIS_URL'] || process.env['REDIS_HOST'] ? 'redis' : 'off';
}

async function getRedisClient(): Promise<RedisClientLike | null> {
  if (getRateLimitMode() !== 'redis') return null;

  if (!redisClientPromise) {
    redisClientPromise = (async () => {
      try {
        const redisModule = await import('ioredis');
        const Redis = (redisModule.default ?? redisModule) as unknown as RedisConstructor;
        const redisUrl = process.env['REDIS_URL'];

        if (redisUrl) {
          return new Redis(redisUrl, {
            lazyConnect: true,
            maxRetriesPerRequest: 1,
            enableReadyCheck: false,
          });
        }

        const host = process.env['REDIS_HOST'];
        const port = Number(process.env['REDIS_PORT'] ?? '6379');
        if (!host) return null;

        const tlsEnabled = (process.env['REDIS_TLS'] ?? 'false').toLowerCase() === 'true';
        return new Redis({
          host,
          port,
          password: process.env['REDIS_PASSWORD'],
          db: Number(process.env['REDIS_DB'] ?? '0'),
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          enableReadyCheck: false,
          tls: tlsEnabled ? {} : undefined,
        });
      } catch (error) {
        console.error('Redis init failed, rate limit disabled:', error);
        return null;
      }
    })();
  }

  return redisClientPromise;
}

function isRejectedRateLimit(result: RateLimitResult): result is RejectedRateLimitResult {
  return result.allowed === false;
}

async function applyRateLimit(ip: string): Promise<RateLimitResult> {
  const redis = await getRedisClient();
  if (!redis) {
    return {
      allowed: true,
      remaining: null,
      rollback: async () => {},
    };
  }

  try {
    const today = new Date().toISOString().slice(0, 10);
    const perIpLimit = parseInt(process.env['RATE_LIMIT_PER_IP_DAY'] ?? '5', 10);
    const globalLimit = parseInt(process.env['RATE_LIMIT_GLOBAL_DAY'] ?? '50', 10);
    const prefix = process.env['RATE_LIMIT_PREFIX'] ?? 'rate';
    const globalKey = `${prefix}:global:${today}`;
    const ipKey = `${prefix}:ip:${ip}:${today}`;

    const globalCount = await redis.incr(globalKey);
    if (globalCount === 1) await redis.expire(globalKey, 86400);

    if (globalCount > globalLimit) {
      return {
        allowed: false,
        status: 429,
        error: 'global_limit',
        message: '今日平台免费额度已用完，请明天再试或在设置中填写自己的 API Key',
      };
    }

    const ipCount = await redis.incr(ipKey);
    if (ipCount === 1) await redis.expire(ipKey, 86400);

    if (ipCount > perIpLimit) {
      await redis.decr(globalKey);
      return {
        allowed: false,
        status: 429,
        error: 'rate_limited',
        message: `今日免费生成次数已用完（每天最多 ${perIpLimit} 次），请明天再试或填写自己的 API Key`,
      };
    }

    return {
      allowed: true,
      remaining: Math.max(0, perIpLimit - ipCount),
      rollback: async () => {
        try {
          await Promise.all([redis.decr(globalKey), redis.decr(ipKey)]);
        } catch (error) {
          console.error('Redis rollback failed:', error);
        }
      },
    };
  } catch (error) {
    console.error('Redis rate limit failed open:', error);
    return {
      allowed: true,
      remaining: null,
      rollback: async () => {},
    };
  }
}

async function callDeepSeek(name: string, count: number, style: string): Promise<string[]> {
  const apiKey = process.env['DEEPSEEK_API_KEY'];
  if (!apiKey) {
    throw Object.assign(new Error('服务端未配置 DEEPSEEK_API_KEY'), { code: 'missing_api_key' });
  }

  const upstream = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      temperature: 0.9,
      messages: [
        {
          role: 'system',
          content:
            '你是一个专门为孩子生成打卡鼓励语的助手。只输出鼓励语列表，每条独占一行，不要编号，不要引号，不要任何其他内容。',
        },
        {
          role: 'user',
          content: `请为名叫「${name}」的孩子生成 ${count} 条每日打卡鼓励语。\n风格要求：${STYLE_PROMPTS[style]}\n要求：每条不超过 20 字，语气亲切自然，每条独立一行。`,
        },
      ],
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!upstream.ok) {
    throw Object.assign(new Error('AI 服务返回错误，请稍后重试'), { code: 'upstream_error' });
  }

  const data = await upstream.json();
  const content: string = data.choices?.[0]?.message?.content ?? '';
  const lines = content
    .split('\n')
    .map((line: string) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    throw Object.assign(new Error('AI 未返回有效内容，请重试'), { code: 'empty_response' });
  }

  while (lines.length < count) {
    lines.push(...lines.slice(0, count - lines.length));
  }

  return lines.slice(0, count);
}

export async function handleGenerateEncouragementRequest(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return noContentResponse();
  }

  if (req.method !== 'POST') {
    return jsonResponse({ success: false, error: 'method_not_allowed' }, 405);
  }

  let body: GeneratePayload;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ success: false, error: 'invalid_json' }, 400);
  }

  const { name, count, style } = body;
  if (!name || !count || !style || !STYLE_PROMPTS[style]) {
    return jsonResponse({ success: false, error: 'invalid_params' }, 400);
  }

  const safeCount = Math.min(Math.max(1, Number(count)), 365);
  const rateLimit = await applyRateLimit(getClientIp(req.headers));
  if (isRejectedRateLimit(rateLimit)) {
    return jsonResponse(
      {
        success: false,
        error: rateLimit.error,
        message: rateLimit.message,
      },
      rateLimit.status
    );
  }

  try {
    const lines = await callDeepSeek(name, safeCount, style);
    return jsonResponse({
      success: true,
      lines,
      ...(rateLimit.remaining !== null ? { remaining: rateLimit.remaining } : {}),
    });
  } catch (error) {
    await rateLimit.rollback();
    const message = error instanceof Error ? error.message : 'AI 服务暂时不可用，请稍后重试';
    const code =
      typeof error === 'object' && error && 'code' in error && typeof error.code === 'string'
        ? error.code
        : 'upstream_error';
    const status = code === 'missing_api_key' ? 500 : 502;
    return jsonResponse({ success: false, error: code, message }, status);
  }
}
