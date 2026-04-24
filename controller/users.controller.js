import Joi from 'joi';
import * as userDB from '../db/users.db.js';
import logger from '../utils/logger.js';
import { handleError } from '../utils/errors.js';
import bcrypt from 'bcrypt';

export const createUserSchema = Joi.object({
    username: Joi.string().trim().min(3).max(100).required(),
    password: Joi.string().min(8).max(100).required(),
    email: Joi.string().email().max(150).optional(),
    role_id: Joi.number().integer().min(1).optional(),
    is_active: Joi.boolean().default(true).optional(),
    student_id: Joi.alternatives().try(
        Joi.string().trim().min(1).max(50),
        Joi.number().integer().min(1)
    ).optional()
});

export const updateUserSchema = Joi.object({
    username: Joi.string().trim().min(3).max(100).optional(),
    email: Joi.string().email().max(150).optional().allow(''),
    role_id: Joi.number().integer().min(1).optional().allow(null),
    is_active: Joi.boolean().optional()
}).min(1);

export const createUser = async (req, res) => {
    try {
        logger.info('createUser', { username: req.body.username, role_id: req.body.role_id, student_id: req.body.student_id });
        const { error } = createUserSchema.validate(req.body);
        if (error) {
            logger.warn('createUser: validation failed', { message: error.details[0].message });
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        // If a role_id is given, resolve its name to enforce student_id requirement
        if (req.body.role_id) {
            const roleName = await userDB.getRoleNameById(req.body.role_id);
            if (roleName === 'STUDENT' && !req.body.student_id) {
                return res.status(400).json({ success: false, message: 'student_id is required when role is STUDENT' });
            }
        }

        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

        const userData = { ...req.body, password_hash: hashedPassword };
        delete userData.password;

        const result = await userDB.createUser(userData);
        logger.info('createUser: success', { id: result.data?.user_id ?? result.user_id });
        res.status(201).json(result);
    } catch (error) {
        return handleError(error, res, 'createUser');
    }
};

export const getAllUsers = async (req, res) => {
    try {
        logger.info('getAllUsers', { query: req.query });
        const result = await userDB.getAllUsers(req.query);
        res.status(200).json(result);
    } catch (error) {
        return handleError(error, res, 'getAllUsers');
    }
};

export const getUserById = async (req, res) => {
    try {
        logger.info('getUserById', { id: req.params.id });
        const result = await userDB.getUserById(parseInt(req.params.id));
        res.status(200).json(result);
    } catch (error) {
        return handleError(error, res, 'getUserById');
    }
};

export const updateUser = async (req, res) => {
    try {
        logger.info('updateUser', { id: req.params.id });
        const { error } = updateUserSchema.validate(req.body);
        if (error) {
            logger.warn('updateUser: validation failed', { message: error.details[0].message });
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        const result = await userDB.updateUser(parseInt(req.params.id), req.body);
        logger.info('updateUser: success', { id: req.params.id });
        res.status(200).json(result);
    } catch (error) {
        return handleError(error, res, 'updateUser');
    }
};

export const deleteUser = async (req, res) => {
    try {
        logger.info('deleteUser', { id: req.params.id });
        const result = await userDB.deleteUser(parseInt(req.params.id));
        logger.info('deleteUser: success', { id: req.params.id });
        res.status(200).json(result);
    } catch (error) {
        return handleError(error, res, 'deleteUser');
    }
};
