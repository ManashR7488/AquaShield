import { HumanMessage } from "@langchain/core/messages";
import { agent } from "../utils/agent.js";

export const generate = async (req, res) => {
  const { prompt } = req.body;
  // console.log(prompt);

  try {
    const responce = await agent.invoke({
      messages: [new HumanMessage(prompt)],
    });
    // console.log(responce);
    res.status(200).json({ res: responce?.messages[1]?.content });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};
