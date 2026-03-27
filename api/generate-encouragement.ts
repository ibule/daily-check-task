import { kv } from '@vercel/kv';

const STYLE_PROMPTS: Record<string, string> = {
  gentle: '温柔亲切，像妈妈说话的语气，给孩子温暖感',
  lively: '活泼开朗，可以用叠词、拟声词，语气轻松有趣',
  positive: '积极向上，简洁有力，像运动员宣言',
  poetic: '文艺清新，句式优美，带有画面感',
  humorous: '轻松幽默，可以有小玩笑，让孩子看了想笑',
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return Response.json({ success: false, error: 'method_not_allowed' }, { status: 405 });
  }

  let body: { name?: string; count?: number; style?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ success: false, error: 'invalid_json' }, { status: 400 });
  }

  const { name, count, style } = body;
  if (!name || !count || !style || !STYLE_PROMPTS[style]) {
    return Response.json({ success: false, error: 'invalid_params' }, { status: 400 });
  }
  const safeCount = Math.min(Math.max(1, Number(count)), 60);

  // Get IP
  const ip =
    (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  const today = new Date().toISOString().slice(0, 10);

  const perIpLimit = parseInt(process.env['RATE_LIMIT_PER_IP_DAY'] ?? '5');
  const globalLimit = parseInt(process.env['RATE_LIMIT_GLOBAL_DAY'] ?? '50');

  const globalKey = `rate:global:${today}`;
  const ipKey = `rate:ip:${ip}:${today}`;

  // Check global limit first
  const globalCount = await kv.incr(globalKey);
  if (globalCount === 1) await kv.expire(globalKey, 86400);

  if (globalCount > globalLimit) {
    return Response.json(
      {
        success: false,
        error: 'global_limit',
        message: '今日平台免费额度已用完，请明天再试或在设置中填写自己的 API Key',
      },
      { status: 429 }
    );
  }

  // Check IP limit
  const ipCount = await kv.incr(ipKey);
  if (ipCount === 1) await kv.expire(ipKey, 86400);

  if (ipCount > perIpLimit) {
    await kv.decr(globalKey);
    return Response.json(
      {
        success: false,
        error: 'rate_limited',
        message: `今日免费生成次数已用完（每天最多 ${perIpLimit} 次），请明天再试或填写自己的 API Key`,
      },
      { status: 429 }
    );
  }

  // Call DeepSeek
  let upstream: Response;
  try {
    upstream = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env['DEEPSEEK_API_KEY']}`,
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
            content: `请为名叫「${name}」的孩子生成 ${safeCount} 条每日打卡鼓励语。\n风格要求：${STYLE_PROMPTS[style]}\n要求：每条不超过 20 字，语气亲切自然，每条独立一行。`,
          },
        ],
      }),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    await Promise.all([kv.decr(globalKey), kv.decr(ipKey)]);
    return Response.json(
      { success: false, error: 'upstream_error', message: 'AI 服务暂时不可用，请稍后重试' },
      { status: 502 }
    );
  }

  if (!upstream.ok) {
    await Promise.all([kv.decr(globalKey), kv.decr(ipKey)]);
    return Response.json(
      { success: false, error: 'upstream_error', message: 'AI 服务返回错误，请稍后重试' },
      { status: 502 }
    );
  }

  const data = await upstream.json();
  const content: string = data.choices?.[0]?.message?.content ?? '';
  const lines = content
    .split('\n')
    .map((l: string) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    await Promise.all([kv.decr(globalKey), kv.decr(ipKey)]);
    return Response.json(
      { success: false, error: 'empty_response', message: 'AI 未返回有效内容，请重试' },
      { status: 502 }
    );
  }

  // Pad to safeCount if needed
  while (lines.length < safeCount) {
    lines.push(...lines.slice(0, safeCount - lines.length));
  }

  return Response.json({
    success: true,
    lines: lines.slice(0, safeCount),
    remaining: Math.max(0, perIpLimit - ipCount),
  });
}
