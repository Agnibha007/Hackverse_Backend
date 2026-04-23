import * as CollectibleModel from "../models/Collectible.js";
import { formatResponse } from "../utils/helpers.js";

export async function getCollectibles(req, res, next) {
  try {
    const collectibles = await CollectibleModel.getUserCollectibles(req.user.id);
    res.json(formatResponse(true, collectibles));
  } catch (error) {
    next(error);
  }
}

export async function awardCollectible(req, res, next) {
  try {
    const { memeId, reason } = req.body;
    const collectible = await CollectibleModel.awardCollectible(req.user.id, memeId, reason);
    res.json(formatResponse(true, collectible));
  } catch (error) {
    next(error);
  }
}
