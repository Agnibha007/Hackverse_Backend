import * as AiService from "../services/AiService.js";
import { formatResponse } from "../utils/helpers.js";
import { ValidationError } from "../utils/errors.js";

export async function sendMessage(req, res, next) {
  try {
    const { message } = req.body;
    if (!message?.trim()) throw new ValidationError("Message is required");
    const reply = await AiService.chat(req.user.id, message.trim());
    res.json(formatResponse(true, { reply }));
  } catch (error) {
    next(error);
  }
}

export async function getHistory(req, res, next) {
  try {
    const history = await AiService.getHistory(req.user.id);
    res.json(formatResponse(true, history));
  } catch (error) {
    next(error);
  }
}

export async function clearHistory(req, res, next) {
  try {
    await AiService.clearHistory(req.user.id);
    res.json(formatResponse(true, { cleared: true }));
  } catch (error) {
    next(error);
  }
}
