const MODEL = "@cf/meta/llama-4-scout-17b-16e-instruct";

export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    const body = await request.json();

    const message = body.message;

    const history =
      Array.isArray(body.history)
        ? body.history
        : [];

    // =========================
    // 检查消息
    // =========================

    if (
      typeof message !== "string" ||
      !message.trim()
    ) {
      return json(
        { error: "请输入消息。" },
        400,
        corsHeaders
      );
    }

    // =========================
    // 限制消息长度
    // =========================

    if (message.length > 4000) {
      return json(
        {
          error:
            "消息过长，最多 4000 个字符。",
        },
        400,
        corsHeaders
      );
    }

    // =========================
    // 清理历史消息
    // =========================

    const safeHistory = history
      .filter(
        (item) =>
          item &&
          (
            item.role === "user" ||
            item.role === "assistant"
          ) &&
          typeof item.content === "string"
      )
      .slice(-20)
      .map((item) => ({
        role: item.role,
        content: item.content.slice(0, 4000),
      }));

    // =========================
    // 构造消息
    // =========================

    const messages = [
      {
        role: "system",
        content:
          "你是一个乐于助人的AI助手。请直接、准确地回答用户的问题。如果用户使用中文，请使用中文回答。",
      },

      ...safeHistory,

      {
        role: "user",
        content: message.trim(),
      },
    ];

    // =========================
    // Workers AI
    // =========================

    const response = await env.AI.run(
      MODEL,
      {
        messages,

        // 暂时先提高最大输出长度
        max_tokens: 2048,
      }
    );

    // =========================
    // 解析返回结果
    // =========================

    const reply =
      response?.response ||
      response?.choices?.[0]?.message?.content ||
      response?.choices?.[0]?.text ||
      response?.result;

    if (
      !reply ||
      typeof reply !== "string"
    ) {
      console.error(
        "Unexpected AI response:",
        JSON.stringify(response)
      );

      return json(
        {
          error:
            "AI 返回了无法解析的结果。",
        },
        502,
        corsHeaders
      );
    }

    return json(
      {
        reply,
      },
      200,
      corsHeaders
    );

  } catch (err) {

    console.error(
      "AI request failed:",
      err
    );

    return json(
      {
        error:
          "AI 请求失败，请稍后再试。",
      },
      500,
      corsHeaders
    );
  }
}


// =========================
// CORS OPTIONS
// =========================

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}


// =========================
// JSON Response
// =========================

function json(
  data,
  status = 200,
  extraHeaders = {}
) {
  return new Response(
    JSON.stringify(data),
    {
      status,

      headers: {
        "Content-Type":
          "application/json; charset=utf-8",

        ...extraHeaders,
      },
    }
  );
}
