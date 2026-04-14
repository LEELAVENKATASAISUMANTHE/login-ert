import joi from 'joi';
import logger from '../utils/logger.js';
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
    logger.error('listBranches failed', { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
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
    logger.info('Branch added', { code: value.code, by: req.user?.user_id });
    return res.status(201).json({ success: true, data: updated });
  } catch (err) {
    const status = err.message.includes('already exists') ? 409 : 500;
    logger.error('createBranch failed', { error: err.message });
    return res.status(status).json({ success: false, message: err.message });
  }
};

export const deleteBranch = (req, res) => {
  const { code } = req.params;
  if (!code) {
    return res.status(400).json({ success: false, message: 'Branch code is required' });
  }

  try {
    const updated = removeBranch(code);
    logger.info('Branch removed', { code, by: req.user?.user_id });
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    const status = err.message.includes('not found') ? 404 : 500;
    logger.error('deleteBranch failed', { error: err.message });
    return res.status(status).json({ success: false, message: err.message });
  }
};
