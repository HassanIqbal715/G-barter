
import { connectClient, insertData } from "./public/script/db.js";
import dotenv from "dotenv";

dotenv.config();

async function setup() {
    connectClient();

    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            engagement_id TEXT REFERENCES engagements(id) ON DELETE CASCADE,
            sender_id TEXT REFERENCES person(id),
            content TEXT NOT NULL,
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    try {
        await insertData(createTableQuery);
        console.log("Messages table created successfully.");
    } catch (error) {
        console.error("Error creating messages table:", error);
    }
}

setup();
