import * as SubjectModel from "../models/Subject.js";
import { formatResponse } from "../utils/helpers.js";
import { ValidationError } from "../utils/errors.js";

export async function getSubjects(req, res, next) {
  try {
    const subjects = await SubjectModel.getSubjectsByUser(req.user.id);
    res.json(formatResponse(true, subjects));
  } catch (error) {
    next(error);
  }
}

export async function createSubject(req, res, next) {
  try {
    const { name, color, icon } = req.body;
    if (!name?.trim()) throw new ValidationError("Subject name is required");
    const subject = await SubjectModel.createSubject(req.user.id, { name: name.trim(), color, icon });
    res.status(201).json(formatResponse(true, subject));
  } catch (error) {
    next(error);
  }
}

export async function updateSubject(req, res, next) {
  try {
    const subject = await SubjectModel.updateSubject(req.params.id, req.user.id, req.body);
    res.json(formatResponse(true, subject));
  } catch (error) {
    next(error);
  }
}

export async function deleteSubject(req, res, next) {
  try {
    await SubjectModel.deleteSubject(req.params.id, req.user.id);
    res.json(formatResponse(true, { deleted: true }));
  } catch (error) {
    next(error);
  }
}

export async function getSubjectStats(req, res, next) {
  try {
    const stats = await SubjectModel.getSubjectStats(req.params.id, req.user.id);
    res.json(formatResponse(true, stats));
  } catch (error) {
    next(error);
  }
}
