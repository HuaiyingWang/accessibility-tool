/**
 * Cloudflare Worker - Claude API Proxy (Streaming)
 *
 * 部署步驟：
 * 1. 至 https://dash.cloudflare.com → Workers & Pages → Create Worker
 * 2. 貼上此檔案內容並部署
 * 3. 至 Settings → Variables → 新增 Secret：
 *    名稱：CLAUDE_API_KEY
 *    值：你的 Claude API Key（sk-ant-...）
 * 4. 複製 Worker 的網址，填入 index.html 的 WORKER_URL
 */

export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Expose-Headers': 'Content-Type',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const body = await request.json();
      body.stream = true; // 強制串流，避免 30 秒 timeout

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      });

      // Anthropic 回傳非 2xx 時，把錯誤訊息原封不動回傳給前端
      if (!response.ok) {
        const errText = await response.text();
        return new Response(errText, {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 直接管道串流，不緩衝，突破 30 秒限制
      return new Response(response.body, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};
