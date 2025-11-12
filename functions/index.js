const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { OpenAI } = require('openai');

try { admin.initializeApp(); } catch (_) {}

const openaiApiKey = process.env.OPENAI_API_KEY || (functions.config().openai && functions.config().openai.key);

exports.summarizeTrade = functions
  .region('asia-northeast3')
  .https.onCall(async (data, context) => {
    if (!openaiApiKey) {
      return { ok: false, error: 'OPENAI_API_KEY missing' };
    }

    const { messages, postTitle } = data || {};
    const textLines = Array.isArray(messages) ? messages
      .filter(m => m && m.type === 'text' && typeof m.text === 'string')
      .map(m => `${m.userName || m.userId || 'user'}: ${m.text}`)
      .slice(-50) : [];

    const prompt = [
      {
        role: 'system',
        content: '너는 중고거래 채팅의 요약 도우미야. 최근 대화에서 최종 합의된 거래 장소와 시간만 한국어로 간단히 추출해. 반드시 JSON만 출력. 스키마: {"place": string | null, "time": string | null}. 장소는 가장 마지막에 합의된 키워드(정문 앞/본관/OO역 2번 출구 등). 시간은 "오전/오후 HH시[ MM분]" 형태로 통일하고, 오전/오후가 없으면 문맥(메시지 전송 시각의 반나절, 또는 아침/저녁 같은 단어)을 근거로 보정해.'
      },
      {
        role: 'user',
        content: `게시글 제목: ${postTitle || ''}\n최근 메시지:\n${textLines.join('\n')}\nJSON만 출력해.`
      }
    ];

    try {
      const client = new OpenAI({ apiKey: openaiApiKey });
      const resp = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        messages: prompt
      });
      const text = resp.choices?.[0]?.message?.content || '{}';
      let json = {};
      try {
        json = JSON.parse(text);
      } catch (_) {
        // try to extract JSON blob
        const match = text.match(/\{[\s\S]*\}/);
        json = match ? JSON.parse(match[0]) : {};
      }
      const place = typeof json.place === 'string' ? json.place.trim() : null;
      const time = typeof json.time === 'string' ? json.time.trim() : null;
      return { ok: true, place: place || null, time: time || null };
    } catch (e) {
      return { ok: false, error: String(e && e.message || e) };
    }
  });


