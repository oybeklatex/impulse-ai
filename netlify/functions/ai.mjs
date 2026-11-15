
export default async (request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "GROQ_API_KEY sozlanmagan" },
        { status: 500 }
      );
    }

    const { prompt } = await request.json();

    if (typeof prompt !== "string" || !prompt.trim()) {
      return Response.json(
        { error: "Savol yuborilmadi" },
        { status: 400 }
      );
    }

    if (prompt.length > 20000) {
      return Response.json(
        { error: "Matn juda uzun" },
        { status: 400 }
      );
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [
            {
              role: "system",
              content: "Sen IMPULSE AI matematik yordamchisisan. O'zbek va rus tillarida aniq, tushunarli javob ber. Matematik masalalarni bosqichma-bosqich yech."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_completion_tokens: 2048
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        { error: data.error?.message || "AI xatoligi" },
        { status: response.status }
      );
    }

    return Response.json({
      answer: data.choices?.[0]?.message?.content || ""
    });

  } catch (error) {
    return Response.json(
      { error: "Serverda xatolik yuz berdi" },
      { status: 500 }
    );
  }
};
