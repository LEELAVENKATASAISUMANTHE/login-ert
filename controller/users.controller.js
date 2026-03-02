import Joi from 'joi';
import * as userDB from '../db/users.db.js';
import logger from '../utils/logger.js';
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
        const { error } = createUserSchema.validate(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

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
        res.status(201).json(result);
    } catch (error) {
        logger.error(`createUser error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const result = await userDB.getAllUsers(req.query);
        res.status(200).json(result);
    } catch (error) {
        logger.error(`getAllUsers error: ${error.message}`);
        res.status(500).json({ success: false, message: 'Failed to retrieve users' });
    }
};

export const getUserById = async (req, res) => {
    try {
        const result = await userDB.getUserById(parseInt(req.params.id));
        res.status(200).json(result);
    } catch (error) {
        res.status(error.message.includes('not found') ? 404 : 500).json({ success: false, message: error.message });
    }
};

export const updateUser = async (req, res) => {
    try {
        const { error } = updateUserSchema.validate(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const result = await userDB.updateUser(parseInt(req.params.id), req.body);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const result = await userDB.deleteUser(parseInt(req.params.id));
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
