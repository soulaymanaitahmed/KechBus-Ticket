const jwt = require("jsonwebtoken");
const express = require("express");
const mysql = require("mysql");

const app = express();

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "kech_bus",
  timezone: "Z",
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err);
    return;
  }
  console.log("Connected to SQL database");
});

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// ------------------------------------------ SignUp ------------------------------

app.post("/signup", (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ error: "Username, email and password are required" });
  }

  // Check if email already exists
  db.query(
    "SELECT c_email FROM clients WHERE c_email = ?",
    [email],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }

      if (results.length > 0) {
        return res.status(409).json({ error: "This email already exists" });
      }

      // Email is new, insert the client
      db.query(
        "INSERT INTO clients (c_username, c_email, c_password) VALUES (?, ?, ?)",
        [username, email, password],
        (err) => {
          if (err) {
            return res.status(500).json({ error: "Failed to register client" });
          }

          return res.status(201).json({ message: "Client registered" });
        },
      );
    },
  );
});

// ------------------------------------------ API --------------------------------
const PORT = process.env.PORT || 8866;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
