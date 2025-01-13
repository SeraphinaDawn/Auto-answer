class AutoAnswerBot {
  constructor() {
    this.API_KEY = "827cf2d9642847ed9e30b7f4a5748e11.1MYD3qKO3HYfr0iM"; // 替换为你的 GLM-4 API Key
    this.API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions"; // GLM-4 的 API URL
  }

  async getAnswers(questions) {
    try {
      const prompt = `你是一个专业的答题助手。下面是一套试题，请帮我回答，根据每道题的类型，返回相应的答案。
- 对于单选题，返回选项字母，如"1:A"
- 对于多选题，返回多个选项字母，用逗号分隔，如"21:A,B,C"
- 对于判断题，只返回"正确"或"错误"，如"26:正确"

请按照题号顺序回答，每题答案占一行。

试题内容：
${questions.map((q) => q.text).join("\n")}`;

      const response = await fetch(this.API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.API_KEY}`, // GLM-4 的认证方式
        },
        body: JSON.stringify({
          model: "glm-4", // 指定模型
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7, // 控制生成文本的随机性
          max_tokens: 1000, // 最大生成 token 数
        }),
      });

      if (!response.ok) {
        console.error("API 请求失败:", response.status, response.statusText);
        return null;
      }

      const data = await response.json();
      if (data.choices && data.choices[0]?.message?.content) {
        const answersText = data.choices[0].message.content.trim();
        console.log("API返回答案:", answersText);

        // 解析答案
        const answers = {};
        answersText.split("\n").forEach((line) => {
          const [num, ans] = line.split(":").map((s) => s.trim());
          if (num && ans) {
            answers[parseInt(num)] = ans;
          }
        });
        return answers;
      }

      console.log("API未返回答案，使用默认答案");
      return null;
    } catch (error) {
      console.error("获取答案失败:", error);
      return null;
    }
  }

  async autoAnswer() {
    try {
      const questions = document.querySelectorAll("[id^='qContent']");
      console.log("找到题目数量:", questions.length);

      // 收集所有题目
      const questionsData = Array.from(questions).map((question) => {
        const questionId = question.id.match(/\d+/)[0];
        const text = question.textContent.trim();
        return {
          id: parseInt(questionId),
          text,
          element: question,
          quesId: question.querySelector('input[name="quesId"]').value,
        };
      });

      // 一次性获取所有答案
      const answers = await this.getAnswers(questionsData);
      if (!answers) {
        console.log("未能获取答案，停止执行");
        return;
      }

      // 依次点击答案
      for (const question of questionsData) {
        const { id, element, quesId } = question;
        await this.randomDelay(300, 500);

        const answer = answers[id];
        if (!answer) {
          console.log(`未找到第 ${id} 题的答案`);
          continue;
        }

        console.log(`正在回答第 ${id} 题:`, answer);

        // 根据答案格式判断题型
        let questionType;
        if (typeof answer === "string" && /^[A-D]$/.test(answer)) {
          questionType = "single";
        } else if (
          typeof answer === "string" &&
          /^[A-D](,[A-D])*$/.test(answer)
        ) {
          questionType = "multiple";
        } else if (
          typeof answer === "string" &&
          (answer === "正确" || answer === "错误")
        ) {
          questionType = "judge";
        } else {
          console.log(`无法识别第 ${id} 题的答案格式: ${answer}`);
          continue;
        }

        if (questionType === "judge") {
          const value = answer === "正确" ? "0" : "1";
          const optionDiv = element.querySelector(
            `.q_option div[onclick*="'${value}'"]`
          );

          if (optionDiv) {
            optionDiv.click();
            console.log(`点击了判断题选项: ${answer}`);
            await this.randomDelay(100, 200);
          }
        } else if (questionType === "multiple") {
          const answersArr = answer.split(",");
          const answerMap = { A: "0", B: "1", C: "2", D: "3" };

          for (const ans of answersArr) {
            const value = answerMap[ans.trim()];
            if (value !== undefined) {
              const optionDiv = element.querySelector(
                `.q_option div[onclick*="'${value}'"]`
              );
              if (optionDiv) {
                optionDiv.click();
                console.log(`点击了多选题选项: ${ans}`);
                await this.randomDelay(100, 200);
              }
            }
          }
        } else {
          const value = { A: "0", B: "1", C: "2", D: "3" }[answer];
          if (value !== undefined) {
            const optionDiv = element.querySelector(
              `.q_option div[onclick*="'${value}'"]`
            );
            if (optionDiv) {
              optionDiv.click();
              console.log(`点击了单选题选项: ${answer}`);
              await this.randomDelay(100, 200);
            }
          }
        }

        await this.randomDelay(200, 400);
      }

      await this.randomDelay(500, 800);

      // 模拟滚动到底部
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });

      await this.randomDelay(300, 500);

      // 点击提交按钮
      const submitBtn = document.querySelector(".submit_btn");
      if (submitBtn) {
        submitBtn.click();
        console.log("点击了提交按钮");
      }
    } catch (error) {
      console.error("自动答题出错:", error);
    }
  }

  async randomDelay(min = 100, max = 300) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

// 使用方法：
const bot = new AutoAnswerBot();
bot.autoAnswer();
