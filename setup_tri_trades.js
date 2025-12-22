import { connectClient, insertData } from "./public/script/db.js";
import dotenv from "dotenv";

dotenv.config();

const createViewQuery = `
    CREATE OR REPLACE VIEW view_tri_trades AS
    SELECT
        a1.id AS gig_a_id,
        a1.user_id AS user_a_id,
        p1.firstname AS user_a_firstname,
        p1.lastname AS user_a_lastname,
        a1.skill_provided AS skill_a_provided,
        a1.skill_wanted AS skill_a_wanted,

        a2.id AS gig_b_id,
        a2.user_id AS user_b_id,
        p2.firstname AS user_b_firstname,
        p2.lastname AS user_b_lastname,
        a2.skill_provided AS skill_b_provided,
        a2.skill_wanted AS skill_b_wanted,

        a3.id AS gig_c_id,
        a3.user_id AS user_c_id,
        p3.firstname AS user_c_firstname,
        p3.lastname AS user_c_lastname,
        a3.skill_provided AS skill_c_provided,
        a3.skill_wanted AS skill_c_wanted

    FROM advert a1
    JOIN advert a2 ON LOWER(a1.skill_wanted) = LOWER(a2.skill_provided)
    JOIN advert a3 ON LOWER(a2.skill_wanted) = LOWER(a3.skill_provided)
    JOIN person p1 ON a1.user_id = p1.id
    JOIN person p2 ON a2.user_id = p2.id
    JOIN person p3 ON a3.user_id = p3.id
    WHERE LOWER(a3.skill_wanted) = LOWER(a1.skill_provided)
      AND a1.user_id != a2.user_id
      AND a2.user_id != a3.user_id
      AND a3.user_id != a1.user_id
      AND a1.is_active = true
      AND a2.is_active = true
      AND a3.is_active = true;
`;

async function setup() {
    connectClient();
    try {
        await insertData(createViewQuery);
        console.log("View 'view_tri_trades' created successfully.");
    } catch (error) {
        console.error("Error creating view:", error);
    }
    process.exit();
}

setup();
