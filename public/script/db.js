import pkg from "pg";
const { Pool } = pkg;

let pool;

export function connectClient() {
    pool = new Pool({
        connectionString: process.env.TESTING == "true" ? process.env.TEST_DATABASE_URL : process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false,
        },
    });

    console.log("Connected");
}

export async function insertData(query, valuesArray) {
    const result = await pool.query(query, valuesArray);
    return result;
}

export async function getDataByArray(query, valueArray) {
    const result = await pool.query(query, valueArray);
    return result.rows;
}

export async function getData(query) {
    const result = await pool.query(query);
    return result.rows;
}

process.on("SIGINT", async () => {
    console.log("shutting down...");
    await pool.end();
    console.log("Disconnected from database");
    process.exit(0);
});