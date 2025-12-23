import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import memorystore from "memorystore";
import session from "express-session";
import cookieParser from "cookie-parser";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { 
    connectClient, 
    insertData, 
    getDataByArray,
    getData,
} from "./public/script/db.js";
import { checkCurrentUser } from "./public/middleware/middleware.js";
import dotenv from "dotenv";
dotenv.config();
import { Server } from "socket.io";
import http from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = process.env.PORT || 4000;

const MemoryStore = memorystore(session);

const sessionMiddleware = session({
    cookie: { maxAge: 86400000 },
    store: new MemoryStore({
        checkPeriod: 86400000
    }),
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET || "The Secret"
});

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(sessionMiddleware);
app.use(cookieParser());

// Share session with socket.io
io.engine.use(sessionMiddleware);

io.on("connection", (socket) => {
    const session = socket.request.session;
    
    if (session && session.user) {
        console.log(`User connected: ${session.user.email}`);
        
        socket.on("join_room", async (engagementId) => {
            // Validate user is part of engagement
            try {
                const query = "SELECT * FROM engagements WHERE id = $1";
                const response = await getDataByArray(query, [engagementId]);
                const engagement = response[0];

                if (engagement) {
                    // Get user id
                    const userQuery = "SELECT id FROM person WHERE email = $1";
                    const userRes = await getDataByArray(userQuery, [session.user.email]);
                    const userId = userRes[0].id;

                    if (engagement.provider_id === userId || engagement.receiver_id === userId) {
                        socket.join(engagementId);
                        console.log(`User ${session.user.email} joined room ${engagementId}`);
                    }
                }
            } catch (error) {
                console.error("Error joining room:", error);
            }
        });

        socket.on("send_message", async (data) => {
            const { engagementId, content } = data;
            try {
                // Get user id
                const userQuery = "SELECT id FROM person WHERE email = $1";
                const userRes = await getDataByArray(userQuery, [session.user.email]);
                const userId = userRes[0].id;

                const messageId = crypto.randomUUID();
                const query = `INSERT INTO messages (id, engagement_id, sender_id, content) 
                               VALUES ($1, $2, $3, $4)`;
                await insertData(query, [messageId, engagementId, userId, content]);

                io.to(engagementId).emit("receive_message", {
                    id: messageId,
                    sender_id: userId,
                    content: content,
                    sent_at: new Date()
                });
            } catch (error) {
                console.error("Error sending message:", error);
            }
        });
    }
});

app.get("/api/current-user", async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(404).json({ result: false, message: "User not logged in"});
        }

        const query = "SELECT * FROM person WHERE email = $1";
        let response = await getDataByArray(query, [req.session.user["email"]]);
        const person = response[0];

        if (!person)
            return res.status(500).json({ result: false, 
                message: "Person not found "});
        
        return res.status(200).json({ result: true, data: person});
    }
    catch(error) {
        return res.status(500).json({ result: false, 
            message: `Error could not check current user: ${error}`});
    }
});

app.get("/api/check-current-user", async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(404).json({ result: false, message: "User not logged in"});
        }

        return res.status(200).json({ result: true });
    }
    catch (error) {
        return res.status(500).json({ result: false, 
            message: `Error could not check current user: ${error}`});
    }
});

app.post("/api/check-login", async (req, res) => {
    let data = req.body.person;
    try {
        const query = "SELECT * FROM person WHERE email = $1";
        let response = await getDataByArray(query, [data.email]);
        const person = response[0];

        if (!person)
            return res.status(500).json({ result: false, 
                message: "Person not found "});

        response = await bcrypt.compare(data.password, person.password);

        if (!response) {
            return res.status(401).json({ 
                result: false, message: "Wrong password" });
        }
        else {
            req.session.user = {
                email: data.email
            };
            return res.status(200).json({ result: true });
        }
    }
    catch(error) {
        return res.status(500).json({ result: false, 
            message: `Error could not login: ${error}`});
    }
});

app.post("/api/create-user", async (req, res) => {
    let data = req.body.person;
    try {        
        let query = "SELECT * FROM person WHERE email = $1";
        let response = await getDataByArray(query, [data.email]);
        const person = response[0];

        console.log(person);

        if (person) {
            return res.status(401).json({ message: "User already exists "});
        }

        const hash = await bcrypt.hash(data.password, 10);
        data.hashedPassword = hash;

        console.log(data);

        query = `INSERT INTO person (id, email, password, 
        firstname, lastname, birthdate) VALUES ($1, $2, $3, $4, $5, $6)`;
        
        const valuesArray = [
            data.id,
            data.email, 
            data.hashedPassword,
            data.firstname, 
            data.lastname, 
            data.dob
        ];

        console.log(valuesArray);
        
        await insertData(query, valuesArray);
        req.session.user = {
            email: data.email
        };
        console.log("It was a success nigga!");
        return res.status(200).json({ result: true, message: "Success" });
    }
    catch(error) {
        console.log("FUCK");
        return res.status(500).json({ result: false, message: `Error could not create account: 
            ${error}`});
    }
});

app.post("/api/create-advert", async (req, res) => {
    let data = req.body.advert;
    try {
        const query = `INSERT INTO advert (id, description, skill_wanted, 
        skill_provided, creation_date, is_active, user_id) 
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5, $6)`;
        
        console.log(data);

        const valuesArray = [
            data.id,
            data.description,
            data.skillWanted,
            data.skillProvided,
            data.isActive,
            data.userID
        ];

        await insertData(query, valuesArray);

        return res.status(200).json({ message: "Success" });
    }
    catch(error) {
        return res.status(500).json({ message: `Error could not create advert: 
            ${error}`});
    }
});

app.get("/api/advert", async (req, res) => {
    try {
        const query = `SELECT advert.id as id, advert.description, 
        advert.skill_wanted, advert.skill_provided, advert.creation_date, 
        advert.is_active, person.id as user_id, person.firstname, 
        person.lastname,
        (SELECT COUNT(*) FROM engagements WHERE engagements.advert_id = advert.id AND engagements.status = 'active') as engagement_count
        FROM advert, person WHERE advert.user_id = person.id;`;

        const response = await getData(query);
        const data = response;

        if (data)
            return res.status(200).json({ result: true, data: data});
        else
            return res.status(400).json({ result: false, message: "Not found"});
    }
    catch(error) {
        return res.status(500).json({ result: false, 
            message: `Error could not fetch adverts: ${error}`});
    }
});

app.get("/api/search", async (req, res) => {
    try {
        const { term } = req.query;
        const query = `SELECT advert.id as id, advert.description, 
        advert.skill_wanted, advert.skill_provided, advert.creation_date, 
        advert.is_active, person.id as user_id, person.firstname, 
        person.lastname,
        (SELECT COUNT(*) FROM engagements WHERE engagements.advert_id = advert.id AND engagements.status = 'active') as engagement_count
        FROM advert, person 
        WHERE advert.user_id = person.id 
        AND (advert.skill_wanted ILIKE $1 OR advert.skill_provided ILIKE $1);`;

        const response = await getDataByArray(query, [`%${term}%`]);
        const data = response;

        if (data)
            return res.status(200).json({ result: true, data: data});
        else
            return res.status(400).json({ result: false, message: "Not found"});
    }
    catch(error) {
        return res.status(500).json({ result: false, 
            message: `Error could not fetch adverts: ${error}`});
    }
});

app.post("/api/create-engagement", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ result: false, message: "User not logged in" });
    }
    
    const { advertId } = req.body;
    const currentUserEmail = req.session.user.email;

    try {
        // Get current user ID
        let query = "SELECT id FROM person WHERE email = $1";
        let response = await getDataByArray(query, [currentUserEmail]);
        const currentUser = response[0];
        
        if (!currentUser) return res.status(404).json({ message: "User not found" });

        // Get advert to find receiver (owner)
        query = "SELECT user_id FROM advert WHERE id = $1";
        response = await getDataByArray(query, [advertId]);
        const advert = response[0];

        if (!advert) return res.status(404).json({ message: "Advert not found" });

        const receiverId = advert.user_id;
        const providerId = currentUser.id;

        if (receiverId === providerId) {
             return res.status(400).json({ message: "Cannot engage with your own gig" });
        }

        // Check if engagement already exists
        query = "SELECT * FROM engagements WHERE advert_id = $1 AND provider_id = $2 AND status = 'active'";
        response = await getDataByArray(query, [advertId, providerId]);
        if (response.length > 0) {
             return res.status(400).json({ message: "Engagement already exists" });
        }

        const engagementId = crypto.randomUUID();
        query = `INSERT INTO engagements (id, advert_id, provider_id, receiver_id) 
                 VALUES ($1, $2, $3, $4)`;
        
        await insertData(query, [engagementId, advertId, providerId, receiverId]);

        return res.status(200).json({ result: true, message: "Engagement created", engagementId });

    } catch (error) {
        return res.status(500).json({ result: false, message: `Error creating engagement: ${error}` });
    }
});

app.post("/api/complete-engagement", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ result: false, message: "User not logged in" });
    }

    const { engagementId } = req.body;
    const currentUserEmail = req.session.user.email;

    try {
        // Get current user ID
        let query = "SELECT id FROM person WHERE email = $1";
        let response = await getDataByArray(query, [currentUserEmail]);
        const currentUser = response[0];
        
        if (!currentUser) return res.status(404).json({ message: "User not found" });

        // Get engagement
        query = "SELECT * FROM engagements WHERE id = $1";
        response = await getDataByArray(query, [engagementId]);
        const engagement = response[0];

        if (!engagement) return res.status(404).json({ message: "Engagement not found" });

        let updateQuery = "";
        if (engagement.provider_id === currentUser.id) {
            updateQuery = "UPDATE engagements SET provider_completed = TRUE WHERE id = $1";
        } else if (engagement.receiver_id === currentUser.id) {
            updateQuery = "UPDATE engagements SET receiver_completed = TRUE WHERE id = $1";
        } else {
            return res.status(403).json({ message: "Not authorized" });
        }

        await insertData(updateQuery, [engagementId]);

        // Check if both completed
        query = "SELECT * FROM engagements WHERE id = $1";
        response = await getDataByArray(query, [engagementId]);
        const updatedEngagement = response[0];

        if (updatedEngagement.provider_completed && updatedEngagement.receiver_completed) {
            await insertData("UPDATE engagements SET status = 'completed' WHERE id = $1", [engagementId]);
            return res.status(200).json({ result: true, message: "Engagement completed fully" });
        }

        return res.status(200).json({ result: true, message: "Marked as completed" });

    } catch (error) {
        return res.status(500).json({ result: false, message: `Error completing engagement: ${error}` });
    }
});

app.get("/api/my-engagements", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ result: false, message: "User not logged in" });
    }

    const currentUserEmail = req.session.user.email;

    try {
        // Get current user ID
        let query = "SELECT id FROM person WHERE email = $1";
        let response = await getDataByArray(query, [currentUserEmail]);
        const currentUser = response[0];
        
        if (!currentUser) return res.status(404).json({ message: "User not found" });

        // Fetch engagements where user is provider or receiver
        // Join with advert to get details
        query = `
            SELECT e.*, a.description, a.skill_wanted, a.skill_provided 
            FROM engagements e
            JOIN advert a ON e.advert_id = a.id
            WHERE e.provider_id = $1 OR e.receiver_id = $1
        `;
        
        const engagements = await getDataByArray(query, [currentUser.id]);
        return res.status(200).json({ result: true, data: engagements });

    } catch (error) {
        return res.status(500).json({ result: false, message: `Error fetching engagements: ${error}` });
    }
});

app.put("/api/advert/toggle-active", () => {
    
});

app.delete("/api/advert/:id", async (req, res) => {
    if (!req.session.user) return res.status(401).json({ result: false, message: "User not logged in" });
    const advertId = req.params.id;
    const userEmail = req.session.user.email;

    try {
        // Get user id
        let query = "SELECT id FROM person WHERE email = $1";
        let response = await getDataByArray(query, [userEmail]);
        const user = response[0];
        if (!user) return res.status(404).json({ message: "User not found" });

        // Get advert
        query = "SELECT * FROM advert WHERE id = $1";
        response = await getDataByArray(query, [advertId]);
        const advert = response[0];

        if (!advert) return res.status(404).json({ message: "Advert not found" });
        if (advert.user_id !== user.id) return res.status(403).json({ message: "Not authorized" });

        // Backup
        query = `INSERT INTO deleted_adverts (id, description, skill_wanted, skill_provided, creation_date, is_active, user_id) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`;
        await insertData(query, [advert.id, advert.description, advert.skill_wanted, advert.skill_provided, advert.creation_date, advert.is_active, advert.user_id]);

        // Delete
        query = "DELETE FROM advert WHERE id = $1";
        await insertData(query, [advertId]);

        return res.status(200).json({ result: true, message: "Advert deleted" });
    } catch (error) {
        return res.status(500).json({ result: false, message: `Error deleting advert: ${error}` });
    }
});

app.post("/api/cancel-engagement", async (req, res) => {
    if (!req.session.user) return res.status(401).json({ result: false, message: "User not logged in" });
    const { engagementId } = req.body;
    const userEmail = req.session.user.email;

    try {
            // Get user id
        let query = "SELECT id FROM person WHERE email = $1";
        let response = await getDataByArray(query, [userEmail]);
        const user = response[0];
        if (!user) return res.status(404).json({ message: "User not found" });

        // Get engagement
        query = "SELECT * FROM engagements WHERE id = $1";
        response = await getDataByArray(query, [engagementId]);
        const engagement = response[0];
        if (!engagement) return res.status(404).json({ message: "Engagement not found" });

        if (engagement.provider_id !== user.id && engagement.receiver_id !== user.id) {
            return res.status(403).json({ message: "Not authorized" });
        }

        query = "UPDATE engagements SET status = 'cancelled' WHERE id = $1";
        await insertData(query, [engagementId]);

        return res.status(200).json({ result: true, message: "Engagement cancelled" });
    } catch (error) {
        return res.status(500).json({ result: false, message: `Error cancelling engagement: ${error}` });
    }
});

app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log("Error destroying session:", err);
            return res.status(500).json({ result: false, 
                error: "Logout failed" });
        }

        return res.status(200).json({ result: true});
    });
});

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "login.html"));
});

app.get("/signup", checkCurrentUser, (req, res) => {
    if (req.isUserLoggedIn)
        return res.redirect("/dash");
    
    return res.sendFile(path.join(__dirname, "views", "signup.html"));
});

app.get("/header.html", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "header.html"));
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.get("/dash", checkCurrentUser, (req, res) => {
    if (req.isUserLoggedIn)
        return res.sendFile(path.join(__dirname, "views", "dash.html"));
    
    return res.redirect("/login");
});

app.get("/search", checkCurrentUser, (req, res) => {
    if (req.isUserLoggedIn)
        return res.sendFile(path.join(__dirname, "views", "search.html"));
    
    return res.redirect("/login");
});

app.get("/chat", checkCurrentUser, (req, res) => {
    if (req.isUserLoggedIn)
        return res.sendFile(path.join(__dirname, "views", "chat.html"));
    
    return res.redirect("/login");
});

app.get("/api/user/:id", async (req, res) => {
    try {
        const query = "SELECT id, firstname, lastname, email FROM person WHERE id = $1";
        const response = await getDataByArray(query, [req.params.id]);
        const person = response[0];

        if (!person)
            return res.status(404).json({ result: false, message: "User not found"});
        
        return res.status(200).json({ result: true, data: person});
    } catch(error) {
        return res.status(500).json({ result: false, message: `Error fetching user: ${error}`});
    }
});

app.get("/api/messages/:engagementId", async (req, res) => {
    if (!req.session.user) return res.status(401).json({ result: false, message: "User not logged in" });
    
    const { engagementId } = req.params;
    const userEmail = req.session.user.email;

    try {
        // Validate access
        let query = "SELECT id FROM person WHERE email = $1";
        let response = await getDataByArray(query, [userEmail]);
        const user = response[0];
        
        query = "SELECT * FROM engagements WHERE id = $1";
        response = await getDataByArray(query, [engagementId]);
        const engagement = response[0];

        if (!engagement) return res.status(404).json({ message: "Engagement not found" });
        if (engagement.provider_id !== user.id && engagement.receiver_id !== user.id) {
            return res.status(403).json({ message: "Not authorized" });
        }

        query = "SELECT * FROM messages WHERE engagement_id = $1 ORDER BY sent_at ASC";
        const messages = await getDataByArray(query, [engagementId]);

        return res.status(200).json({ result: true, data: messages });
    } catch (error) {
        return res.status(500).json({ result: false, message: `Error fetching messages: ${error}` });
    }
});

app.get("/api/tri-trades", async (req, res) => {
    if (!req.session.user) return res.status(401).json({ result: false, message: "User not logged in" });
    const userEmail = req.session.user.email;

    try {
        // Get current user ID
        let query = "SELECT id FROM person WHERE email = $1";
        let response = await getDataByArray(query, [userEmail]);
        const user = response[0];
        
        if (!user) return res.status(404).json({ message: "User not found" });

        // Fetch tri-trades where the user is involved, including status from trade_circles
        query = `
            SELECT v.*, 
                   t.id as circle_id,
                   t.a_accepted, 
                   t.b_accepted, 
                   t.c_accepted, 
                   t.status as circle_status
            FROM view_tri_trades v
            LEFT JOIN trade_circles t 
            ON v.gig_a_id = t.advert_a_id 
            AND v.gig_b_id = t.advert_b_id 
            AND v.gig_c_id = t.advert_c_id
            WHERE v.user_a_id = $1 OR v.user_b_id = $1 OR v.user_c_id = $1
        `;
        
        const trades = await getDataByArray(query, [user.id]);
        return res.status(200).json({ result: true, data: trades });

    } catch (error) {
        return res.status(500).json({ result: false, message: `Error fetching tri-trades: ${error}` });
    }
});

app.post("/api/confirm-tri-trade", async (req, res) => {
    if (!req.session.user) return res.status(401).json({ result: false, message: "User not logged in" });
    const userEmail = req.session.user.email;
    const { gigA, gigB, gigC } = req.body;

    try {
        // Get current user ID
        let query = "SELECT id FROM person WHERE email = $1";
        let response = await getDataByArray(query, [userEmail]);
        const user = response[0];
        if (!user) return res.status(404).json({ message: "User not found" });

        // 1. Find or Create trade circle
        // Check if exists
        query = "SELECT * FROM trade_circles WHERE advert_a_id = $1 AND advert_b_id = $2 AND advert_c_id = $3";
        response = await getDataByArray(query, [gigA, gigB, gigC]);
        let circle = response[0];

        if (!circle) {
            const id = crypto.randomUUID();
            query = `INSERT INTO trade_circles (id, advert_a_id, advert_b_id, advert_c_id) 
                     VALUES ($1, $2, $3, $4) RETURNING *`;
            response = await getDataByArray(query, [id, gigA, gigB, gigC]);
            circle = response[0];
        }

        // 2. Update Acceptance
        // We need to know which user corresponds to which gig to know which accepted flag to set.
        // We can query the adverts to find out owners.
        // Or we can trust the view logic, but here we only have gig IDs.
        // Let's fetch the owners of the gigs.
        
        const advertQuery = "SELECT id, user_id FROM advert WHERE id IN ($1, $2, $3)";
        const adverts = await getDataByArray(advertQuery, [gigA, gigB, gigC]);
        
        const gigAObj = adverts.find(a => a.id === gigA);
        const gigBObj = adverts.find(a => a.id === gigB);
        const gigCObj = adverts.find(a => a.id === gigC);

        let updateField = "";
        if (gigAObj && gigAObj.user_id === user.id) updateField = "a_accepted";
        else if (gigBObj && gigBObj.user_id === user.id) updateField = "b_accepted";
        else if (gigCObj && gigCObj.user_id === user.id) updateField = "c_accepted";
        else return res.status(403).json({ message: "You are not part of this trade circle" });

        query = `UPDATE trade_circles SET ${updateField} = TRUE WHERE id = $1 RETURNING *`;
        response = await getDataByArray(query, [circle.id]);
        circle = response[0];

        // 3. Check Completion
        let message = "Waiting for others";
        if (circle.a_accepted && circle.b_accepted && circle.c_accepted) {
            query = "UPDATE trade_circles SET status = 'active' WHERE id = $1";
            await insertData(query, [circle.id]);
            message = "Trade Activated!";
        }

        return res.status(200).json({ result: true, message: message });

    } catch (error) {
        return res.status(500).json({ result: false, message: `Error confirming trade: ${error}` });
    }
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
});

server.listen(port, () => {
    console.log(`Server Running on port: ${port}`);
    connectClient();
});