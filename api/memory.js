export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST 요청만 가능합니다." });
  }

  try {
    const { previousMemory = "", messages = [] } = req.body || {};

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "API 키가 설정되지 않았습니다." });
    }

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "잘못된 메시지 형식입니다." });
    }

    const conversation = messages
      .slice(-30)
      .filter(
        (m) =>
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string"
      )
      .map(
        (m) =>
          `${m.role === "user" ? "사용자" : "캐릭터"}: ${m.content.slice(0, 2400)}`
      )
      .join("\n");

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-5.6-luna",
        instructions: `
대화의 장기 기억을 관리한다.

앞으로의 대화에 실제로 도움이 될 정보만 간결하게 정리한다.
기존 기억과 새로운 대화를 합쳐 하나의 최신 기억으로 만든다.

규칙:
- 사용자가 직접 말한 사실과 선호를 우선한다.
- 추측해서 정보를 만들어내지 않는다.
- 이미 있는 정보는 불필요하게 반복하지 않는다.
- 일시적인 잡담은 중요하지 않으면 저장하지 않는다.
- 한국어로 작성한다.
- 결과에는 기억 내용만 출력한다.
        `.trim(),
        input: `
[기존 기억]
${previousMemory || "없음"}

[최근 대화]
${conversation}
        `.trim(),
        max_output_tokens: 800,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI memory error:", data);
      return res.status(response.status).json({
        error: data?.error?.message || "기억 생성에 실패했습니다.",
      });
    }

    const memory =
      data.output_text ||
      data.output
        ?.flatMap((item) => item.content || [])
        ?.find((item) => item.type === "output_text")
        ?.text;

    if (!memory) {
      return res.status(500).json({ error: "기억 결과가 비어 있습니다." });
    }

    return res.status(200).json({ memory });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
}
