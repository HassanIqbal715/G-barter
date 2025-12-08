
import { connectClient, insertData } from "./public/script/db.js";
import dotenv from "dotenv";

dotenv.config();

async function setup() {
    connectClient();

    const createBackupTableQuery = `
        CREATE TABLE IF NOT EXISTS deleted_adverts (
            id TEXT PRIMARY KEY,
            description TEXT,
            skill_wanted TEXT,
            skill_provided TEXT,
            creation_date TIMESTAMP,
            is_active BOOLEAN,
            user_id TEXT,
            deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    const updateForeignKeyQuery = `
        ALTER TABLE engagements 
        DROP CONSTRAINT IF EXISTS engagements_advert_id_fkey,
        ADD CONSTRAINT engagements_advert_id_fkey 
        FOREIGN KEY (advert_id) REFERENCES advert(id) ON DELETE CASCADE;
    `;

    try {
        await insertData(createBackupTableQuery);
        console.log("Deleted adverts table created successfully.");
        
        await insertData(updateForeignKeyQuery);
        console.log("Engagements foreign key updated to CASCADE.");
    } catch (error) {
        console.error("Error updating database:", error);
    }
}

setup();
