import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

async function updateAnalytics() {
    console.log("Updating analytics...");
    try {
        // 1. Match Rate: successful matches / # of posted gigs
        const matchRateRes = await client.query(`
            SELECT 
                (SELECT COUNT(*)::float FROM engagements WHERE status != 'cancelled') as matches,
                (SELECT COUNT(*)::float FROM advert) as gigs
        `);
        const matches = parseFloat(matchRateRes.rows[0].matches || 0);
        const gigs = parseFloat(matchRateRes.rows[0].gigs || 0);
        const matchRate = gigs > 0 ? (matches / gigs) * 100 : 0;

        // 2. Time to Match: Average minutes/hours from posting -> someone connecting
        // We assume engagements has advert_id linking to advert.id
        const timeToMatchRes = await client.query(`
            SELECT AVG(EXTRACT(EPOCH FROM (e.created_at - a.creation_date))/60) as avg_minutes
            FROM engagements e
            JOIN advert a ON e.advert_id = a.id
        `);
        const avgTimeToMatch = parseFloat(timeToMatchRes.rows[0].avg_minutes || 0);

        // 3. Gig Completion Rate: % of agreed gigs that actually get completed
        const completionRateRes = await client.query(`
            SELECT 
                (SELECT COUNT(*)::float FROM engagements WHERE status = 'completed') as completed,
                (SELECT COUNT(*)::float FROM engagements) as total
        `);
        const completed = parseFloat(completionRateRes.rows[0].completed || 0);
        const total = parseFloat(completionRateRes.rows[0].total || 0);
        const completionRate = total > 0 ? (completed / total) * 100 : 0;

        // 4. Repeat Usage: Users completing >= 2 gigs
        const repeatUsageRes = await client.query(`
            WITH UserCompletions AS (
                SELECT provider_id as user_id FROM engagements WHERE status = 'completed'
                UNION ALL
                SELECT receiver_id as user_id FROM engagements WHERE status = 'completed'
            )
            SELECT COUNT(*) as repeat_count FROM (
                SELECT user_id FROM UserCompletions
                GROUP BY user_id
                HAVING COUNT(*) >= 2
            ) as sub
        `);
        const repeatUsageCount = parseInt(repeatUsageRes.rows[0].repeat_count || 0);

        // Insert new record
        await client.query(`
            INSERT INTO analytics (match_rate, avg_time_to_match_minutes, completion_rate, repeat_usage_count)
            VALUES ($1, $2, $3, $4)
        `, [matchRate, avgTimeToMatch, completionRate, repeatUsageCount]);

        console.log("Analytics updated successfully");
        console.log({ matchRate, avgTimeToMatch, completionRate, repeatUsageCount });

    } catch (err) {
        console.error("Error updating analytics:", err.message);
    }
}

async function setup() {
    try {
        await client.connect();

        // 1. Add created_at to engagements if not exists
        try {
            await client.query(`ALTER TABLE engagements ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
            console.log("Added created_at to engagements");
        } catch (e) {
            console.log("created_at column might already exist or error: " + e.message);
        }

        // 2. Create analytics table
        await client.query(`
            CREATE TABLE IF NOT EXISTS analytics (
                id SERIAL PRIMARY KEY,
                recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                match_rate DECIMAL(5,2),
                avg_time_to_match_minutes DECIMAL(10,2),
                completion_rate DECIMAL(5,2),
                repeat_usage_count INTEGER
            )
        `);
        console.log("Created analytics table");

        // 3. Update analytics
        await updateAnalytics();

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

setup();
