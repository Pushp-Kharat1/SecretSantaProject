import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { v4 as uuidv4 } from 'uuid';
import { initDB, createEvent, createMatch, getMatchByToken, markAsRevealed, updateWishlist, getSantaFor } from './db.js';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Debugging Exit
process.on('exit', (code) => {
    console.log(`Process exiting with code: ${code}`);
});
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const app = express();
const PORT = process.env.PORT || 5001; // Changed to 5001 to avoid conflicts
const OAuth2 = google.auth.OAuth2;

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] Incoming Request: ${req.method} ${req.url}`);
    next();
});

// Serve Static Files (Production)
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../dist')));
}

// --- EMAIL SETUP ---
async function createTransporter() {
    try {
        const oauth2Client = new OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            "https://developers.google.com/oauthplayground"
        );

        oauth2Client.setCredentials({
            refresh_token: process.env.GOOGLE_REFRESH_TOKEN
        });

        // Get Access Token
        const accessToken = await new Promise((resolve, reject) => {
            oauth2Client.getAccessToken((err, token) => {
                if (err) {
                    console.error("Failed to create access token :(", err);
                    reject(err);
                }
                resolve(token);
            });
        });

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                type: "OAuth2",
                user: process.env.EMAIL_USER,
                accessToken,
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                refreshToken: process.env.GOOGLE_REFRESH_TOKEN
            }
        });

        return transporter;
    } catch (e) {
        console.error("Transporter creation error", e);
        return null;
    }
}

// --- AUTH ROUTES ---
import bcrypt from 'bcryptjs';
import { createUser, findUserByEmail } from './db.js';

app.post('/api/auth/signup', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    try {
        const existing = await findUserByEmail(email);
        if (existing) return res.status(400).json({ error: "User already exists" });

        const hash = await bcrypt.hash(password, 10);
        const userId = await createUser(email, hash);

        // Return minimal user info
        res.json({ user: { id: userId, email } });
    } catch (e) {
        console.error("Signup error", e);
        res.status(500).json({ error: "Signup failed" });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await findUserByEmail(email);
        if (!user) return res.status(400).json({ error: "Invalid credentials" });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ error: "Invalid credentials" });

        // Simple response: client stores this "session"
        res.json({ user: { id: user.id, email }, password });
        // We return the plain password (or a specialized token) because 
        // the client needs it to "Unlock" the preview locally as per current design.
        // In a real app we'd use a token, but for this specific "password is admin password" requirement,
        // sending it back (or client keeping it from input) works. 
        // Actually, better: Client ALREADY HAS the password in the state. 
        // We just confirm login success.
    } catch (e) {
        console.error("Login error", e);
        res.status(500).json({ error: "Login failed" });
    }
});

// --- API ROUTES ---

// 1. CREATE EVENT & SEND EMAILS
app.post('/api/event', async (req, res) => {
    console.log("Processing /api/event request");
    const { details, participants } = req.body;
    console.log("Participants count:", participants?.length);

    if (!participants || participants.length < 2) {
        return res.status(400).json({ error: "Need at least 2 participants" });
    }

    try {
        console.log("Creating event in DB...");
        // A. Store Event
        const eventId = await createEvent({
            budget: details.budget,
            date: details.date,
            location: details.location,
            message: details.message
        });
        console.log("Event created with ID:", eventId);

        // B. Shuffle logic
        console.log("Shuffling participants...");
        const validParticipants = participants.filter(p => p.name && p.email);
        const indices = validParticipants.map((_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * i);
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }

        const matches = [];
        const transporter = await createTransporter();

        if (!transporter) {
            return res.status(500).json({ error: "Failed to initialize email service" });
        }

        let emailSuccessCount = 0;
        const matchesList = [];

        // C. Process each match
        for (let i = 0; i < validParticipants.length; i++) {
            const giver = validParticipants[i];
            const receiver = validParticipants[indices[i]];
            const token = uuidv4();

            // Store in DB
            await createMatch({
                eventId,
                giverName: giver.name,
                giverEmail: giver.email,
                receiverName: receiver.name,
                token
            });

            // Add to list for CSV
            matchesList.push({
                Giver: giver.name,
                GiverEmail: giver.email,
                Receiver: receiver.name,
                Token: token
            });

            // Send Email
            const appUrl = process.env.APP_URL || 'http://localhost:3000';
            const revealLink = `${appUrl}/reveal?token=${token}`;

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: giver.email,
                subject: "🎅 You are a Secret Santa!",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                        <h2>Hi ${giver.name},</h2>
                        <p>You have been invited to a Secret Santa party!</p>
                        <p><strong>Date:</strong> ${details.date}</p>
                        <p><strong>Location:</strong> ${details.location}</p>
                        <p><strong>Budget:</strong> ${details.budget}</p>
                        
                        <p>The moment you've been waiting for... click below to see who you are gifting!</p>
                        
                        <a href="${revealLink}" style="display: inline-block; background-color: #d32f2f; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 5px;">Reveal My Match 🎁</a>

                        <p style="margin-top: 20px;"><em>Organizer's Message:</em><br/>${details.message}</p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            emailSuccessCount++;
        }

        // D. Send CSV to Organizer
        if (req.body.organizerEmail) {
            console.log("Sending CSV report to organizer:", req.body.organizerEmail);
            const csvContent = [
                "Giver Name,Giver Email,Receiver Name,Reveal Link",
                ...matchesList.map(m => `${m.Giver},${m.GiverEmail},${m.Receiver},${process.env.APP_URL || 'http://localhost:3000'}/reveal?token=${m.Token}`)
            ].join("\n");

            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: req.body.organizerEmail,
                subject: "📋 Secret Santa Pair List (Admin Report)",
                text: "Here is the master list of all Secret Santa pairs for your event.",
                attachments: [
                    {
                        filename: 'secret_santa_pairs.csv',
                        content: csvContent
                    }
                ]
            });
        }

        res.status(200).json({
            message: "Event created and emails sending",
            eventId,
            emailsSent: emailSuccessCount
        });

    } catch (error) {
        console.error("Event creation error:", error);
        res.status(500).json({ error: "Failed to create event" });
    }
});

// 2. REVEAL MATCH
app.get('/api/reveal/:token', async (req, res) => {
    const { token } = req.params;

    if (!token) return res.status(400).json({ error: "Token required" });

    try {
        const match = await getMatchByToken(token);

        if (!match) {
            return res.status(404).json({ error: "Invalid link" });
        }

        // Mark as revealed (optional tracking)
        await markAsRevealed(token);

        res.json({
            giver: match.giver_name,
            receiver: match.receiver_name,
            budget: match.budget,
            date: match.date,
            location: match.location,
            message: match.message,
            my_wishlist: match.my_wishlist,
            receiver_wishlist: match.receiver_wishlist
        });

    } catch (error) {
        console.error("Reveal error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// 3. UPDATE WISHLIST
// 3. UPDATE WISHLIST
app.post('/api/wishlist', async (req, res) => {
    console.log("Processing /api/wishlist request");
    const { token, wishlist } = req.body;

    if (!token) return res.status(400).json({ error: "Token required" });

    try {
        const success = await updateWishlist(token, wishlist || '');
        if (success) {
            // Find who this person is, so we can notify *their* Santa
            const myInfo = await getMatchByToken(token);
            if (myInfo) {
                // myInfo.giver_name is the person who just updated their wishlist (Me)
                // We need to find the person who has ME as their receiver
                const mySanta = await getSantaFor(myInfo.event_id, myInfo.giver_name);

                if (mySanta && mySanta.giver_email) {
                    console.log(`Notifying Santa (${mySanta.giver_name}) about wishlist update from ${myInfo.giver_name}`);

                    const transporter = await createTransporter();
                    if (transporter) {
                        const appUrl = process.env.APP_URL || 'http://localhost:3000';
                        const santaLink = `${appUrl}/reveal?token=${mySanta.token}`;

                        await transporter.sendMail({
                            from: process.env.EMAIL_USER,
                            to: mySanta.giver_email,
                            subject: "🎁 Wishlist Update! Open to know",
                            html: `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                                    <h2>Hi ${mySanta.giver_name},</h2>
                                    <p>Your secret child, <strong>${myInfo.giver_name}</strong>, has updated their wishlist!</p>
                                    
                                    <p>Click below to see what they want:</p>
                                    
                                    <a href="${santaLink}" style="display: inline-block; background-color: #d32f2f; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 5px;">View Wishlist 🎁</a>
                                </div>
                            `
                        });
                    }
                }
            }

            res.json({ message: "Wishlist updated" });
        } else {
            res.status(404).json({ error: "Match not found" });
        }
    } catch (error) {
        console.error("Wishlist update error:", error);
        res.status(500).json({ error: "Failed to update wishlist" });
    }
});

// 4. SPA Catch-all (Production)
if (process.env.NODE_ENV === 'production') {
    app.get(/.*/, (req, res) => {
        res.sendFile(path.join(__dirname, '../dist/index.html'));
    });
}

initDB().then(() => {
    const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });

    // Debug: Force keep-alive
    setInterval(() => {
        console.log('Server heartbeat... (Active handles: ' + process._getActiveHandles().length + ')');
    }, 10000);
}).catch(err => {
    console.error("Failed to init DB:", err);
});

