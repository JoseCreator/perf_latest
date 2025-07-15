import express from 'express';
import { getDb } from './db.js';

const router = express.Router();

router.get('/:projectName', async (req, res) => {
    try {
        const projectName = req.params.projectName;
        console.log('Fetching risk data for project:', projectName);
        
        // First get the project's id and total_cost (budget)
        const projectQuery = `
            SELECT project_id, total_cost
            FROM projects 
            WHERE project_name = ?
        `;
        
        const db = await getDb();
        const projectResult = await db.all(projectQuery, [projectName]);
        console.log('Project query result:', projectResult);
        
        if (!projectResult || projectResult.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const projectId = projectResult[0].project_id;
        const budget = projectResult[0].total_cost || 0;
        console.log('Project ID:', projectId, 'Budget:', budget);

        // Calculate monthly costs and risks
        const monthlyRiskQuery = `
            WITH MonthlyData AS (
                SELECT 
                    CAST(strftime('%m', start_date) AS INTEGER) as month,
                    SUM(hours) as total_hours,
                    u.rate_id
                FROM timesheet t
                JOIN utilizadores u ON t.user_id = u.user_id
                WHERE t.project_id = ?
                    AND strftime('%Y', t.start_date) = strftime('%Y', 'now')
                GROUP BY strftime('%m', start_date), u.rate_id
            )
            SELECT 
                month,
                SUM(total_hours * COALESCE(rate_id, 0)) as monthly_cost
            FROM MonthlyData
            GROUP BY month
            ORDER BY month
        `;

        const riskResults = await db.all(monthlyRiskQuery, [projectId]);
        console.log('Monthly costs results:', riskResults);

        // Create an array for all 12 months, filling in 0 for months without data
        const monthlyRisks = Array(12).fill(0);
        riskResults.forEach(row => {
            if (row.month && budget > 0) {
                const monthIndex = row.month - 1;
                const riskPercentage = (row.monthly_cost / budget) * 100;
                // Cap the risk percentage at 100%
                monthlyRisks[monthIndex] = Math.min(Math.round(riskPercentage), 100);
            }
        });

        console.log('Calculated monthly risks:', monthlyRisks);
        res.json({ monthlyRisks });
        
    } catch (error) {
        console.error('Error calculating monthly risks:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

export default router;
