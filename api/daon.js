export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST 요청만 가능합니다." });
  }

  try {
    const { persona, memory, messages } = req.body || {};

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "API 키가 설정되지 않았습니다." });
    }

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "잘못된 메시지 형식입니다." });
    }

    const name = persona?.name || "다온";
    const situation = persona?.situation || "";
    const background =
      persona?.background ||
      "차분하고 따뜻하게 이야기를 들어주는 대화 상대";
    const relationship =
      persona?.relationship || "편하게 이야기할 수 있는 사이";

    const instructions = `
너는 "${name}"이라는 가상의 AI 대화 캐릭터다.

[캐릭터 설정]
이름: ${name}
성격과 배경: ${background}
현재 상황: ${situation || "특별히 정해진 상황 없음"}
사용자와의 관계: ${relationship}

[대화 방식]
- 한국어로 자연스럽게 대화한다.
- 캐릭터의 성격과 현재 상황을 일관되게 유지한다.
- 사용자가 설정한 허구의 상황을 자연스럽게 반영한다.
- 답변은 대화체로 작성한다.
- 사용자가 말하지 않은 사실을 실제 기억인 것처럼 지어내지 않는다.
- 이전 대화와 장기 기억이 있으면 자연스럽게 참고한다.
- AI라는 사실을 숨기거나 실제 인간
