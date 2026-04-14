import fs from 'fs';
import path from 'path';
import logger from './logger.js';

const DEFAULT_PATH = path.resolve('config/branches.json');

const getBranchesFilePath = () =>
  process.env.BRANCHES_CONFIG_PATH
    ? path.resolve(process.env.BRANCHES_CONFIG_PATH)
    : DEFAULT_PATH;

/**
 * Read all branches from the JSON file.
 * Returns an array of { code, name } objects.
 */
export const readBranches = () => {
  const filePath = getBranchesFilePath();
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    logger.error('Failed to read branches config', { filePath, error: err.message });
    throw new Error('Could not load branches configuration');
  }
};

/**
 * Persist the branches array back to the JSON file.
 */
const writeBranches = (branches) => {
  const filePath = getBranchesFilePath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(branches, null, 2), 'utf-8');
  } catch (err) {
    logger.error('Failed to write branches config', { filePath, error: err.message });
    throw new Error('Could not save branches configuration');
  }
};

/**
 * Return only the branch codes — used for Joi validation.
 */
export const getBranchCodes = () => readBranches().map((b) => b.code);

/**
 * Add a new branch. Throws if the code already exists.
 */
export const addBranch = (code, name) => {
  const branches = readBranches();
  const upper = code.trim().toUpperCase();

  if (branches.some((b) => b.code === upper)) {
    throw new Error(`Branch with code "${upper}" already exists`);
  }

  const updated = [...branches, { code: upper, name: name.trim() }];
  writeBranches(updated);
  return updated;
};

/**
 * Remove a branch by code. Throws if not found.
 */
export const removeBranch = (code) => {
  const branches = readBranches();
  const upper = code.trim().toUpperCase();
  const index = branches.findIndex((b) => b.code === upper);

  if (index === -1) {
    throw new Error(`Branch with code "${upper}" not found`);
  }

  const updated = branches.filter((b) => b.code !== upper);
  writeBranches(updated);
  return updated;
};
