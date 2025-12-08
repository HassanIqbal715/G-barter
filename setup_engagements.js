
import { connectClient, insertData } from "./public/script/db.js";
import dotenv from "dotenv";

dotenv.config();

async function setup() {
    connectClient();

    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS engagements (
            id TEXT PRIMARY KEY,
            advert_id TEXT REFERENCES advert(id),
            provider_id TEXT REFERENCES person(id),
            receiver_id TEXT REFERENCES person(id),
            status VARCHAR(50) DEFAULT 'active',
            provider_completed BOOLEAN DEFAULT FALSE,
            receiver_completed BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    try {
        await insertData(createTableQuery);
        console.log("Engagements table created successfully.");
    } catch (error) {
        console.error("Error creating engagements table:", error);
    }
}

setup();
