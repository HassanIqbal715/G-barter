import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import memorystore from "memorystore";
import session from "express-session";
import cookieParser from "cookie-parser";
import bcrypt from "bcrypt";
import { 
    connectClient, 
    insertData, 
    getDataByArray,
    getData,
} from "./public/script/db.js";
import { checkCurrentUser } from "./public/middleware/middleware.js";
import dotenv from "dotenv";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 5000;

const MemoryStore = memorystore(session);

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(session({
        cookie: { maxAge: 86400000 },
        store: new MemoryStore({
            checkPeriod: 86400000
        }),
        resave: false,
        saveUninitialized: false,
        secret: process.env.SESSION_SECRET || "The Secret"
    })
);
app.use(cookieParser());

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

        if (person) {
            return res.status(401).json({ message: "User already exists "});
        }

        const hash = await bcrypt.hash(data.password, 10);
        data.hashedPassword = hash;

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

        await insertData(query, valuesArray);
        req.session.user = {
            email: data.email
        };

        return res.status(200).json({ message: "Success" });
    }
    catch(error) {
        return res.status(500).json({ message: `Error could not create account: 
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
        person.lastname FROM advert, person WHERE advert.user_id = person.id;`;

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

app.put("/api/advert/toggle-active", () => {
    
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
        return res.redirect("/gigs");
    
    return res.sendFile(path.join(__dirname, "views", "signup.html"));
});

app.get("/header.html", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "header.html"));
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.get("/gigs", checkCurrentUser, (req, res) => {
    if (req.isUserLoggedIn)
        return res.sendFile(path.join(__dirname, "views", "gigs.html"));
    
    return res.redirect("/login");
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
});

app.listen(port, () => {
    console.log(`Server Running on port: ${port}`);
    connectClient();
});