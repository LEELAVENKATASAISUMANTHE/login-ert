import joi from 'joi';
import logger from '../utils/logger.js';
import { handleError } from '../utils/errors.js';
import { readBranches, addBranch, removeBranch } from '../utils/branches.js';

const addBranchSchema = joi.object({
  code: joi.string().alphanum().max(20).required(),
  name: joi.string().max(200).required(),
});

export const listBranches = (req, res) => {
  try {
    const branches = readBranches();
    return res.status(200).json({ success: true, data: branches });
  } catch (error) {
    return handleError(error, res, 'listBranches');
  }
};

export const createBranch = (req, res) => {
  const { error, value } = addBranchSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  try {
    const updated = addBranch(value.code, value.name);
    logger.info({ code: value.code, by: req.user?.user_id }, 'Branch added');
    return res.status(201).json({ success: true, data: updated });
  } catch (err) {
    return handleError(err, res, 'createBranch');
  }
};

export const deleteBranch = (req, res) => {
  const { code } = req.params;
  if (!code) {
    return res.status(400).json({ success: false, message: 'Branch code is required' });
  }

  try {
    const updated = removeBranch(code);
    logger.info({ code, by: req.user?.user_id }, 'Branch removed');
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    return handleError(err, res, 'deleteBranch');
  }
};
