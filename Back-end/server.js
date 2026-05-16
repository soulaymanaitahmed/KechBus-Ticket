const jwt = require("jsonwebtoken");
const express = require("express");
const mysql = require("mysql");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

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
app.use(cookieParser());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Credentials", "true");
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
        "INSERT INTO clients (c_username, c_email, c_password, c_type) VALUES (?, ?, ?, 1)",
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

// ------------------------------------------ LogIn / LogOut ------------------------------

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  db.query(
    "SELECT * FROM clients WHERE c_email = ?",
    [email],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });

      if (results.length === 0) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const user = results[0];
      const userType = user.c_type;
      
      // Checking plain text since signup doesn't hash passwords yet
      if (user.c_password !== password) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Generate JWT Token
      const token = jwt.sign(
        { id: user.c_id, type: userType },
        "KECHBUS_JWT_SECRET_KEY",
        { expiresIn: "1d" }
      );

      // Set HttpOnly Cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.status(200).json({ message: "Login successful", type: userType });
    }
  );
});

// Admin Login
app.post("/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  db.query(
    "SELECT * FROM admins WHERE a_username = ?",
    [username],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });

      if (results.length === 0 || results[0].a_password !== password) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      const admin = results[0];

      // Generate JWT Token for admin
      const token = jwt.sign(
        { id: admin.a_id, role: admin.a_role, type: 'admin' },
        "KECHBUS_JWT_SECRET_KEY",
        { expiresIn: "1d" }
      );

      // Set Admin-specific HttpOnly Cookie
      res.cookie("admin_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000,
      });

      logAction(admin.a_id, "ADMIN_LOGIN", `Admin ${admin.a_username} logged in`);

      res.status(200).json({ 
        message: "Admin login successful", 
        role: admin.a_role,
        username: admin.a_username 
      });
    }
  );
});

// ------------------------------------------ Auth Middleware ------------------------------

const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  jwt.verify(token, "KECHBUS_JWT_SECRET_KEY", (err, decoded) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.userId = decoded.id;
    req.userType = decoded.type;
    next();
  });
};

const verifyAdminToken = (req, res, next) => {
  const token = req.cookies.admin_token;
  if (!token) return res.status(401).json({ error: "Not authenticated as admin" });

  jwt.verify(token, "KECHBUS_JWT_SECRET_KEY", (err, decoded) => {
    if (err || decoded.type !== 'admin') return res.status(403).json({ error: "Invalid admin token" });
    req.adminId = decoded.id;
    req.adminRole = decoded.role;
    next();
  });
};

const logAction = (adminId, action, details) => {
  db.query(
    "INSERT INTO logs (a_id, log_action, log_details) VALUES (?, ?, ?)",
    [adminId, action, details],
    (err) => {
      if (err) console.error("Failed to record log:", err);
    }
  );
};

// ------------------------------------------ Client Routes ------------------------------

// Get current client info
app.get("/client/me", verifyToken, (req, res) => {
  db.query(
    "SELECT c_id, c_username, c_email, c_type FROM clients WHERE c_id = ?",
    [req.userId],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (results.length === 0) return res.status(404).json({ error: "Client not found" });
      res.json(results[0]);
    }
  );
});

// Update client info (including password)
app.put("/client/me", verifyToken, (req, res) => {
  const { username, email, password, currentPassword } = req.body;
  
  if (password) {
    if (!currentPassword) return res.status(400).json({ error: "Current password is required to set a new one" });
    
    // Verify current password first
    db.query("SELECT c_password FROM clients WHERE c_id = ?", [req.userId], (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (results[0].c_password !== currentPassword) {
        return res.status(401).json({ error: "Incorrect current password" });
      }

      db.query(
        "UPDATE clients SET c_username = ?, c_email = ?, c_password = ? WHERE c_id = ?",
        [username, email, password, req.userId],
        (err) => {
          if (err) return res.status(500).json({ error: "Failed to update profile" });
          res.json({ message: "Profile updated successfully" });
        }
      );
    });
  } else {
    db.query(
      "UPDATE clients SET c_username = ?, c_email = ? WHERE c_id = ?",
      [username, email, req.userId],
      (err) => {
        if (err) return res.status(500).json({ error: "Failed to update profile" });
        res.json({ message: "Profile updated successfully" });
      }
    );
  }
});

// Buy a ticket
app.post("/client/buy-ticket", verifyToken, (req, res) => {
  const { ligneId, t_nbr } = req.body;
  if (!ligneId) return res.status(400).json({ error: "Ligne ID is required" });

  const ticketCount = parseInt(t_nbr) || 1;

  db.query(
    "INSERT INTO tickets (c_id, l_id, t_nbr) VALUES (?, ?, ?)",
    [req.userId, ligneId, ticketCount],
    (err) => {
      if (err) return res.status(500).json({ error: "Failed to purchase ticket" });
      res.status(201).json({ message: "Ticket purchased successfully" });
    }
  );
});

// Get client tickets
app.get("/client/tickets", verifyToken, (req, res) => {
  db.query(
    "SELECT t.*, l.l_destination1, l.l_destination2 FROM tickets t JOIN lignes l ON t.l_id = l.l_id WHERE t.c_id = ? ORDER BY t.t_purchase_date DESC",
    [req.userId],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Failed to fetch tickets" });
      res.json(results);
    }
  );
});

// Subscribe to a plan
app.post("/client/subscribe", verifyToken, (req, res) => {
  const { plan, price } = req.body;
  if (!plan || !price) return res.status(400).json({ error: "Plan and price are required" });

  // Check for active subscription first
  db.query(
    "SELECT s_id FROM subscriptions WHERE c_id = ? AND s_status = 'active' AND s_end_date >= CURDATE() LIMIT 1",
    [req.userId],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (results.length > 0) {
        return res.status(400).json({ error: "You already have an active subscription" });
      }

      const startDate = new Date().toISOString().slice(0, 10);
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      const endDateStr = endDate.toISOString().slice(0, 10);

      db.query(
        "INSERT INTO subscriptions (c_id, s_plan, s_price, s_start_date, s_end_date) VALUES (?, ?, ?, ?, ?)",
        [req.userId, plan, price, startDate, endDateStr],
        (err) => {
          if (err) return res.status(500).json({ error: "Failed to subscribe" });
          res.status(201).json({ message: "Subscribed successfully" });
        }
      );
    }
  );
});

// Get active subscription
app.get("/client/subscription", verifyToken, (req, res) => {
  db.query(
    "SELECT * FROM subscriptions WHERE c_id = ? AND s_status = 'active' AND s_end_date >= CURDATE() ORDER BY s_start_date DESC LIMIT 1",
    [req.userId],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Failed to fetch subscription" });
      res.json(results[0] || null);
    }
  );
});

app.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

app.post("/admin/logout", verifyAdminToken, (req, res) => {
  logAction(req.adminId, "ADMIN_LOGOUT", "Admin logged out");
  res.clearCookie("admin_token");
  res.json({ message: "Admin logged out" });
});

// ------------------------------------------ Bus Scanner ------------------------------
app.post("/bus/scan", (req, res) => {
  const qrData = String(req.body?.qrData || "").trim();
  if (!qrData) {
    return res.status(400).json({ valid: false, error: "QR data is required" });
  }

  const clientMatch = qrData.match(/^CLIENT-(\d+)$/i);
  const ticketMatch = qrData.match(/^(\d+)$/);

  // --- Ticket QR flow ---
  if (ticketMatch) {
    const ticketId = Number(ticketMatch[1]);
    return db.query(
      `
        SELECT t.t_id, t.t_status, t.t_nbr, t.t_purchase_date, t.c_id,
               c.c_username,
               l.l_id, l.l_destination1, l.l_destination2
        FROM tickets t
        JOIN clients c ON c.c_id = t.c_id
        JOIN lignes l ON l.l_id = t.l_id
        WHERE t.t_id = ?
        LIMIT 1
      `,
      [ticketId],
      (err, results) => {
        if (err) return res.status(500).json({ valid: false, error: "Database error" });
        if (results.length === 0) {
          return res.status(404).json({
            qrType: "ticket",
            valid: false,
            message: "Ticket introuvable",
          });
        }

        const ticket = results[0];
        const status = String(ticket.t_status || "active").toLowerCase();

        if (status === "used") {
          return res.status(400).json({
            qrType: "ticket",
            valid: false,
            message: "Ce ticket a deja ete utilise",
            ticketId: ticket.t_id,
          });
        }

        if (status !== "active") {
          return res.status(400).json({
            qrType: "ticket",
            valid: false,
            message: `Ticket invalide (${status})`,
            ticketId: ticket.t_id,
          });
        }

        db.query(
          "UPDATE tickets SET t_status = 'used' WHERE t_id = ?",
          [ticket.t_id],
          (updateErr) => {
            if (updateErr) return res.status(500).json({ valid: false, error: "Failed to validate ticket" });

            return res.json({
              qrType: "ticket",
              valid: true,
              message: "Ticket valide et marque comme utilise",
              ticket: {
                t_id: ticket.t_id,
                c_id: ticket.c_id,
                c_username: ticket.c_username,
                l_id: ticket.l_id,
                route: `${ticket.l_destination1} ↔ ${ticket.l_destination2}`,
                t_nbr: ticket.t_nbr,
              },
            });
          }
        );
      }
    );
  }

  // --- Client QR flow (subscription check + daily limit) ---
  if (clientMatch) {
    const clientId = Number(clientMatch[1]);
    return db.query(
      `
        SELECT s_id, c_id, s_plan, s_status, s_start_date, s_end_date
        FROM subscriptions
        WHERE c_id = ?
          AND s_status = 'active'
          AND s_start_date <= CURDATE()
          AND s_end_date >= CURDATE()
        ORDER BY s_start_date DESC
        LIMIT 1
      `,
      [clientId],
      (subErr, subResults) => {
        if (subErr) return res.status(500).json({ valid: false, error: "Database error" });
        if (subResults.length === 0) {
          return res.status(404).json({
            qrType: "client",
            valid: false,
            message: "Aucun abonnement actif pour ce client",
            clientId,
          });
        }

        const sub = subResults[0];
        const dailyLimit = String(sub.s_plan).includes("4") ? 4 : 2;

        db.query(
          `
            SELECT usage_id, rides_used, daily_limit
            FROM subscription_daily_usage
            WHERE c_id = ? AND s_id = ? AND usage_date = CURDATE()
            LIMIT 1
          `,
          [clientId, sub.s_id],
          (usageErr, usageRows) => {
            if (usageErr) return res.status(500).json({ valid: false, error: "Daily usage table error" });

            const finalizeSuccess = (ridesUsed) =>
              res.json({
                qrType: "client",
                valid: true,
                message: "Pass abonnement valide",
                clientId,
                subscription: {
                  s_id: sub.s_id,
                  s_plan: sub.s_plan,
                  s_end_date: sub.s_end_date,
                },
                usage: {
                  ridesUsed,
                  dailyLimit,
                  remaining: Math.max(0, dailyLimit - ridesUsed),
                },
              });

            if (usageRows.length === 0) {
              return db.query(
                `
                  INSERT INTO subscription_daily_usage (c_id, s_id, usage_date, rides_used, daily_limit)
                  VALUES (?, ?, CURDATE(), 1, ?)
                `,
                [clientId, sub.s_id, dailyLimit],
                (insertErr) => {
                  if (insertErr) return res.status(500).json({ valid: false, error: "Failed to initialize daily usage" });
                  return finalizeSuccess(1);
                }
              );
            }

            const usage = usageRows[0];
            if (usage.rides_used >= usage.daily_limit) {
              return res.status(400).json({
                qrType: "client",
                valid: false,
                message: "Limite quotidienne d'abonnement atteinte",
                clientId,
                usage: {
                  ridesUsed: usage.rides_used,
                  dailyLimit: usage.daily_limit,
                  remaining: 0,
                },
              });
            }

            return db.query(
              `
                UPDATE subscription_daily_usage
                SET rides_used = rides_used + 1
                WHERE usage_id = ?
              `,
              [usage.usage_id],
              (updateUsageErr) => {
                if (updateUsageErr) return res.status(500).json({ valid: false, error: "Failed to update daily usage" });
                return finalizeSuccess(usage.rides_used + 1);
              }
            );
          }
        );
      }
    );
  }

  return res.status(400).json({
    valid: false,
    message: "Format QR non reconnu. Utilisez un ID ticket ou CLIENT-<id>.",
  });
});

app.get("/admin/me", verifyAdminToken, (req, res) => {
  db.query(
    "SELECT a_id, a_username, a_role FROM admins WHERE a_id = ?",
    [req.adminId],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (results.length === 0) return res.status(404).json({ error: "Admin not found" });
      res.json(results[0]);
    }
  );
});

app.get("/admin/logs", verifyAdminToken, (req, res) => {
  const query = `
    SELECT l.*, a.a_username 
    FROM logs l 
    LEFT JOIN admins a ON l.a_id = a.a_id 
    ORDER BY l.log_timestamp DESC
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch logs" });
    res.json(results);
  });
});

app.get("/admin/finances", verifyAdminToken, (req, res) => {
  const queries = {
    totalRevenue: "SELECT SUM(total_price) as total FROM (SELECT (t.t_nbr * l.l_price) as total_price FROM tickets t JOIN lignes l ON t.l_id = l.l_id UNION ALL SELECT s_price as total_price FROM subscriptions) as all_rev",
    monthlyRevenue: "SELECT SUM(total_price) as total FROM (SELECT (t.t_nbr * l.l_price) as total_price FROM tickets t JOIN lignes l ON t.l_id = l.l_id WHERE t.t_purchase_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) UNION ALL SELECT s_price as total_price FROM subscriptions WHERE s_start_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) as mon_rev",
    weeklyRevenue: "SELECT SUM(total_price) as total FROM (SELECT (t.t_nbr * l.l_price) as total_price FROM tickets t JOIN lignes l ON t.l_id = l.l_id WHERE t.t_purchase_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) UNION ALL SELECT s_price as total_price FROM subscriptions WHERE s_start_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)) as week_rev",
    topLines: "SELECT l.l_destination1, l.l_destination2, SUM(t.t_nbr * l.l_price) as revenue FROM tickets t JOIN lignes l ON t.l_id = l.l_id GROUP BY l.l_id ORDER BY revenue DESC LIMIT 5",
    breakdown: "SELECT 'Tickets' as type, SUM(t.t_nbr * l.l_price) as amount FROM tickets t JOIN lignes l ON t.l_id = l.l_id UNION ALL SELECT 'Abonnements' as type, SUM(s_price) as amount FROM subscriptions",
    prevMonthRevenue: "SELECT SUM(total_price) as total FROM (SELECT (t.t_nbr * l.l_price) as total_price FROM tickets t JOIN lignes l ON t.l_id = l.l_id WHERE t.t_purchase_date >= DATE_SUB(CURDATE(), INTERVAL 60 DAY) AND t.t_purchase_date < DATE_SUB(CURDATE(), INTERVAL 30 DAY) UNION ALL SELECT s_price as total_price FROM subscriptions WHERE s_start_date >= DATE_SUB(CURDATE(), INTERVAL 60 DAY) AND s_start_date < DATE_SUB(CURDATE(), INTERVAL 30 DAY)) as prev_mon",
    totalTicketsSold: "SELECT SUM(t_nbr) as total FROM tickets",
    monthlyTicketsSold: "SELECT SUM(t_nbr) as total FROM tickets WHERE t_purchase_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)",
    weeklyTicketsSold: "SELECT SUM(t_nbr) as total FROM tickets WHERE t_purchase_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)",
    ticketRevenue: "SELECT SUM(t.t_nbr * l.l_price) as total FROM tickets t JOIN lignes l ON t.l_id = l.l_id"
  };

  const results = {};
  let completed = 0;
  const keys = Object.keys(queries);

  keys.forEach(key => {
    db.query(queries[key], (err, data) => {
      if (err) {
        console.error(`Error in ${key}:`, err);
        return res.status(500).json({ error: "Finance data fetch failed" });
      }
      results[key] = data;
      completed++;
      if (completed === keys.length) {
        res.json({
          total: results.totalRevenue[0].total || 0,
          monthly: results.monthlyRevenue[0].total || 0,
          weekly: results.weeklyRevenue[0].total || 0,
          prevMonthly: results.prevMonthRevenue[0].total || 0,
          totalTicketsSold: results.totalTicketsSold[0].total || 0,
          monthlyTicketsSold: results.monthlyTicketsSold[0].total || 0,
          weeklyTicketsSold: results.weeklyTicketsSold[0].total || 0,
          ticketRevenue: results.ticketRevenue[0].total || 0,
          topLines: results.topLines,
          breakdown: results.breakdown
        });
      }
    });
  });
});

app.get("/admin/stats", verifyAdminToken, (req, res) => {
  const queries = {
    totalTickets: "SELECT SUM(t_nbr) as total FROM tickets",
    activeBuses: "SELECT SUM(l_bues_nbr) as total FROM lignes",
    linePerformance: `
      SELECT 
        l.l_id, 
        l.l_destination1, 
        l.l_destination2, 
        l.l_bues_nbr, 
        SUM(t.t_nbr) as total_passengers,
        CASE 
          WHEN l.l_bues_nbr = 0 THEN SUM(t.t_nbr)
          ELSE (SUM(t.t_nbr) / l.l_bues_nbr) 
        END as intensity
      FROM lignes l
      LEFT JOIN tickets t ON l.l_id = t.l_id
      GROUP BY l.l_id
      ORDER BY intensity DESC
    `
  };

  const results = {};
  let completed = 0;
  const keys = Object.keys(queries);

  keys.forEach(key => {
    db.query(queries[key], (err, data) => {
      if (err) return res.status(500).json({ error: "Stats fetch failed" });
      results[key] = data;
      completed++;
      if (completed === keys.length) {
        res.json({
          totalTickets: results.totalTickets[0].total || 0,
          activeBuses: results.activeBuses[0].total || 0,
          lines: results.linePerformance
        });
      }
    });
  });
});

app.patch("/admin/lignes/:id/buses", verifyAdminToken, (req, res) => {
  const { id } = req.params;
  const { action } = req.body;
  
  const query = action === 'increase' 
    ? "UPDATE lignes SET l_bues_nbr = l_bues_nbr + 1 WHERE l_id = ?"
    : "UPDATE lignes SET l_bues_nbr = GREATEST(0, l_bues_nbr - 1) WHERE l_id = ?";

  db.query(query, [id], (err) => {
    if (err) return res.status(500).json({ error: "Failed to adjust bus count" });
    logAction(req.adminId, "ADJUST_BUSES", `${action.toUpperCase()}D buses on line ID: ${id}`);
    res.json({ message: `Bus count ${action}d successfully` });
  });
});

// ------------------------------------------ Admin Client Management ------------------------------

// GET all clients (Admin only)
app.get("/admin/clients", verifyAdminToken, (req, res) => {
  db.query(
    "SELECT c_id, c_username, c_email, c_type FROM clients ORDER BY c_id DESC",
    (err, results) => {
      if (err) return res.status(500).json({ error: "Failed to fetch clients" });
      res.json(results);
    }
  );
});

// UPDATE client info (Admin only, no password)
app.put("/admin/clients/:id", verifyAdminToken, (req, res) => {
  const { id } = req.params;
  const { username, email, type } = req.body;
  
  db.query(
    "UPDATE clients SET c_username = ?, c_email = ?, c_type = ? WHERE c_id = ?",
    [username, email, type, id],
    (err) => {
      if (err) return res.status(500).json({ error: "Failed to update client" });
      logAction(req.adminId, "UPDATE_CLIENT", `Updated client ID ${id}: ${username}`);
      res.json({ message: "Client updated successfully" });
    }
  );
});

// GET client history (Tickets & Subscriptions)
app.get("/admin/clients/:id/history", verifyAdminToken, (req, res) => {
  const { id } = req.params;
  
  const queries = {
    tickets: "SELECT t.*, l.l_destination1, l.l_destination2 FROM tickets t JOIN lignes l ON t.l_id = l.l_id WHERE t.c_id = ? ORDER BY t.t_purchase_date DESC",
    subscriptions: "SELECT * FROM subscriptions WHERE c_id = ? ORDER BY s_start_date DESC"
  };

  const results = {};
  db.query(queries.tickets, [id], (err, tickets) => {
    if (err) return res.status(500).json({ error: "Failed to fetch tickets history" });
    results.tickets = tickets;
    
    db.query(queries.subscriptions, [id], (err, subs) => {
      if (err) return res.status(500).json({ error: "Failed to fetch subscriptions history" });
      results.subscriptions = subs;
      res.json(results);
    });
  });
});

// ------------------------------------------ API --------------------------------

// Lignes CRUD

// GET all lines
app.get("/lignes", (req, res) => {
  db.query("SELECT * FROM lignes", (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch lignes" });
    
    // Parse JSON string of stations for each row
    const lignes = results.map((row) => ({
      ...row,
      l_stations: typeof row.l_stations === 'string' ? JSON.parse(row.l_stations) : row.l_stations || []
    }));
    
    res.json(lignes);
  });
});

// POST a new line
app.post("/lignes", verifyAdminToken, (req, res) => {
  const { destination1, destination2, price, stations, busesNbr } = req.body;
  const stationsJson = JSON.stringify(stations || []);

  db.query(
    "INSERT INTO lignes (l_destination1, l_destination2, l_price, l_stations, l_bues_nbr) VALUES (?, ?, ?, ?, ?)",
    [destination1, destination2, price, stationsJson, busesNbr || 0],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Failed to create ligne" });
      
      logAction(req.adminId, "CREATE_LINE", `Created line ${result.insertId}: ${destination1} - ${destination2}`);
      
      res.status(201).json({ message: "Ligne created", id: result.insertId });
    }
  );
});

// PUT (update) a line
app.put("/lignes/:id", verifyAdminToken, (req, res) => {
  const { id } = req.params;
  const { destination1, destination2, price, stations, busesNbr } = req.body;
  const stationsJson = JSON.stringify(stations || []);

  db.query(
    "UPDATE lignes SET l_destination1 = ?, l_destination2 = ?, l_price = ?, l_stations = ?, l_bues_nbr = ? WHERE l_id = ?",
    [destination1, destination2, price, stationsJson, busesNbr || 0, id],
    (err) => {
      if (err) return res.status(500).json({ error: "Failed to update ligne" });
      
      logAction(req.adminId, "UPDATE_LINE", `Updated line ${id}: ${destination1} - ${destination2}`);
      
      res.json({ message: "Ligne updated" });
    }
  );
});

// DELETE a line
app.delete("/lignes/:id", verifyAdminToken, (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM lignes WHERE l_id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: "Failed to delete ligne" });
    
    logAction(req.adminId, "DELETE_LINE", `Deleted line ID: ${id}`);
    
    res.json({ message: "Ligne deleted" });
  });
});
// ------------------------------------------ Socket.io Realtime ------------------------------
const BusSimulation = require('./BusSimulation');

// Simulation Data / In-memory state for tracking
const activeBuses = new Map();

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("joinTracking", (routeId) => {
    socket.join(`route_${routeId}`);
    console.log(`User ${socket.id} joined tracking for route ${routeId}`);
  });

  socket.on("disconnect", caranya => {
    console.log("User disconnected:", socket.id);
  });
});

// Periodic Bus Position Simulation
setInterval(() => {
  const demoRoutes = ["5", "24"];
  const drivers = ["Ahmed", "Omar", "Yassine", "Soufiane"];

  demoRoutes.forEach((routeId, index) => {
    let bus = activeBuses.get(routeId);
    if (!bus) {
      bus = new BusSimulation(routeId, drivers[index % drivers.length]);
      activeBuses.set(routeId, bus);
    }

    const update = bus.tick();

    io.to(`route_${routeId}`).emit("busLocationUpdate", {
      busId: `BUS-${routeId}`,
      lineNumber: routeId,
      lat: update.lat,
      lng: update.lng,
      prevLat: update.prevLat,
      prevLng: update.prevLng,
      speed: bus.state === 'MOVING' ? 30 : (bus.state === 'SLOWING' ? 10 : 0),
      heading: update.heading,
      status: update.status,
      currentStation: update.currentStation,
      progress: update.progress,
      driverName: bus.driverName,
      updatedAt: new Date().toISOString()
    });

    // Randomly emit "Arriving" notifications if status changed to Arriving
    if (update.status === 'Arriving at station') {
      io.to(`route_${routeId}`).emit("smartNotification", {
        type: "approach",
        message: `Le bus ${routeId} arrive à la station ${update.currentStation || 'suivante'}.`,
        timestamp: new Date().toISOString()
      });
    }
  });
}, 3000);

const PORT = process.env.PORT || 8866;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
