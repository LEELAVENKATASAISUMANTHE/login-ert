import logger from '../utils/logger.js';
import * as jobRequirementsDB from '../db/job_requirements.db.js';

//contrlleer for getting  all job requirement
export const getAllJobRequirements = async (req, res) => {
    try {
        const { page, limit, sortBy, sortOrder, search } = req.query;
        const result = await jobRequirementsDB.getAllJobRequirements({
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10,
            sortBy: sortBy || 'job_requirement_id',
            sortOrder: sortOrder || 'DESC',
            search: search || ''
        });
        res.status(200).json(result);
    } catch (error) {
        logger.error(`Error in getAllJobRequirements: ${error.message}`);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const getJobRequirementById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await jobRequirementsDB.getJobRequirementById(id);
        if (!result.success) {
            return res.status(404).json(result);
        }
        res.status(200).json(result);
    } catch (error) {
        logger.error(`Error in getJobRequirementById: ${error.message}`);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const getJobRequirementByJobId = async (req, res) => {
    try {
        const { jobId } = req.params;
        const result = await jobRequirementsDB.getJobRequirementByJobId(jobId);
        if (!result.success) {
            return res.status(404).json(result);
        }
        res.status(200).json(result);
    } catch (error) {
        logger.error(`Error in getJobRequirementByJobId: ${error.message}`);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }   
};
export const deleteJobRequirementByID = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await jobRequirementsDB.deleteJobRequirementByID(id);
        if (!data.success) {
            return res.status(404).json(data);
        }
        res.status(200).json(data);
    } catch (error) {        
        logger.error(`Error in deleteJobRequirementByID: ${error.message}`);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }

};