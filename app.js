const API_URL =
  "/api/chat";


const chat =
  document.getElementById("chat");

const form =
  document.getElementById("form");

const input =
  document.getElementById("input");

const send =
  document.getElementById("send");


let history = [];


// =========================
// 添加消息
// =========================

function addMsg(text, cls) {

  const div =
    document.createElement("div");

  div.className =
    "msg " + cls;

  // 不使用 innerHTML
  div.textContent = text;

  chat.appendChild(div);

  chat.scrollTop =
    chat.scrollHeight;

  return div;
}


// =========================
// 发送消息
// =========================

form.addEventListener(
  "submit",
  async (e) => {

    e.preventDefault();

    const message =
      input.value.trim();

    if (!message) {
      return;
    }


    // 显示用户消息
    addMsg(
      message,
      "user"
    );


    input.value = "";

    input.disabled = true;

    send.disabled = true;


    // 保存用户消息
    history.push({
      role: "user",
      content: message
    });


    // 加载提示
    const loading =
      addMsg(
        "思考中...",
        "ai"
      );


    try {

      const res =
        await fetch(
          API_URL,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify({
                message,

                history:
                  history
                    .slice(-20, -1)
              })
          }
        );


      const data =
        await res.json();


      if (!res.ok) {

        throw new Error(
          data.error ||
          "请求失败"
        );

      }


      const reply =
        data.reply ||
        "AI 没有返回内容。";


      loading.textContent =
        reply;


      // 保存 AI 回复
      history.push({
        role: "assistant",
        content: reply
      });


    } catch (err) {

      loading.textContent =
        "请求失败：" +
        err.message;

    } finally {

      input.disabled = false;

      send.disabled = false;

      input.focus();

    }

  }
);
