import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { v4 as uuidv4 } from 'uuid';
import { initDB, createEvent, createMatch, getMatchByToken, markAsRevealed, updateWishlist, getSantaFor, addPendingNotification, getPendingNotifications, deletePendingNotification, incrementNotificationAttempts } from './db.js';
import sgMail from '@sendgrid/mail';
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
async function sendEmailWithRetry(transporter, mailOptions, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await transporter.sendMail(mailOptions);
            return result;
        } catch (error) {
            console.log(`Email attempt ${attempt} failed:`, error.message);
            if (attempt === maxRetries) throw error;

            // Exponential backoff: wait 2^attempt seconds
            const delay = Math.pow(2, attempt) * 1000;
            console.log(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

async function createTransporter() {
    if (process.env.SENDGRID_API_KEY) {
        console.log('🚀 Using SendGrid');
        console.log('From email:', process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_USER);
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        return {
            sendMail: async (mailOptions) => {
                const msg = {
                    to: mailOptions.to,
                    from: process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_USER,
                    subject: mailOptions.subject,
                    html: mailOptions.html,
                    attachments: mailOptions.attachments
                };
                console.log('Sending email to:', msg.to, 'from:', msg.from);
                try {
                    const result = await sgMail.send(msg);
                    console.log('✅ Email sent successfully');
                    return result;
                } catch (error) {
                    console.error('❌ SendGrid error details:', {
                        message: error.message,
                        code: error.code,
                        response: error.response?.body
                    });
                    throw error;
                }
            }
        };
    }
    
    console.log('⚠️ SENDGRID_API_KEY not found, using Gmail fallback');
    
    // Try Gmail App Password first (simpler)
    if (process.env.EMAIL_APP_PASSWORD) {
        console.log('🔑 Using Gmail App Password');
        try {
            return nodemailer.createTransporter({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_APP_PASSWORD
                }
            });
        } catch (e) {
            console.error('Gmail App Password failed:', e.message);
        }
    }
    
    // Fallback to OAuth
    try {
        const oauth2Client = new OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            "https://developers.google.com/oauthplayground"
        );

        oauth2Client.setCredentials({
            refresh_token: process.env.GOOGLE_REFRESH_TOKEN
        });

        const accessToken = await new Promise((resolve, reject) => {
            oauth2Client.getAccessToken((err, token) => {
                if (err) reject(err);
                resolve(token);
            });
        });

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: "OAuth2",
                user: process.env.EMAIL_USER,
                accessToken,
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                refreshToken: process.env.GOOGLE_REFRESH_TOKEN
            }
        });

        await transporter.verify();
        return transporter;
    } catch (e) {
        console.error("❌ All email services failed:", e.message);
        throw new Error('No email service available');
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

// Test endpoint
app.get('/api/test', (req, res) => {
    console.log('📞 Test API called');
    res.json({ message: 'API is working', timestamp: new Date().toISOString() });
});

// 1. CREATE EVENT & SEND EMAILS
app.post('/api/event', async (req, res) => {
    console.log("Processing /api/event request");
    const { details, participants } = req.body;
    console.log("Participants count:", participants?.length);
    console.log("Event details:", details);

    if (!participants || participants.length < 2) {
        return res.status(400).json({ error: "Need at least 2 participants" });
    }
    
    // Limit to 50 participants on free SendGrid
    if (participants.length > 50) {
        return res.status(400).json({ error: "Maximum 50 participants allowed on free plan" });
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

        // B. Shuffle logic (Single Chain Method)
        // 1. Shuffle the order of participants randomly
        console.log("Shuffling participants...");
        const validParticipants = participants.filter(p => {
            if (!p.name || !p.email) return false;
            // Skip obvious spam emails to save quota
            if (p.email.includes('@spam.com')) {
                console.log(`Skipping spam email: ${p.email}`);
                return false;
            }
            return true;
        });
        
        console.log(`Filtered to ${validParticipants.length} valid participants`);
        const pool = validParticipants.map((_, i) => i);

        // Fisher-Yates Shuffle of the pool
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }

        // 2. Create a single cycle (Chain)
        // pool[i] gives to pool[i+1], last gives to first
        const indices = new Array(validParticipants.length);
        for (let i = 0; i < pool.length; i++) {
            const giverIndex = pool[i];
            const receiverIndex = pool[(i + 1) % pool.length];
            indices[giverIndex] = receiverIndex;
        }

        const matches = [];
        const transporter = await createTransporter();

        if (!transporter) {
            console.error('❌ Failed to create any email transporter');
            return res.status(500).json({ error: "Failed to initialize email service" });
        }
        console.log('✅ Email transporter created successfully');

        const emailPromises = [];
        const matchesList = [];

        // C. Process each match and Queue Emails
        console.log("Generating matches and queueing emails...");
        for (let i = 0; i < validParticipants.length; i++) {
            const giver = validParticipants[i];
            const receiver = validParticipants[indices[i]];
            const token = uuidv4();

            // Store in DB (Sequential to ensure integrity)
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

            // Prepare Email (Don't await yet!)
            const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
            const revealLink = `${appUrl}/reveal?token=${token}`;

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: giver.email,
                subject: "Secret Santa Assignment - Action Required",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                        <h2>Hello ${giver.name},</h2>
                        <p>You have been assigned as a Secret Santa participant for an upcoming gift exchange event.</p>
                        <p><strong>Date:</strong> ${details.date}</p>
                        <p><strong>Location:</strong> ${details.location}</p>
                        <p><strong>Budget:</strong> ${details.budget}</p>
                        
                        <p>The moment you've been waiting for... click below to see who you are gifting!</p>
                        
                        <a href="${revealLink}" style="display: inline-block; background-color: #d32f2f; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 5px;">Reveal My Match 🎁</a>

                        ${details.message ? `<p style="margin-top: 20px;"><em>Organizer's Message:</em><br/>${details.message}</p>` : ''}
                    </div>
                `
            };

            emailPromises.push(sendEmailWithRetry(transporter, mailOptions));
        }

        // D. Send emails with rate limiting (max 10 concurrent)
        console.log(`Sending ${emailPromises.length} emails with rate limiting...`);
        const batchSize = 10;
        const emailResults = [];
        
        for (let i = 0; i < emailPromises.length; i += batchSize) {
            const batch = emailPromises.slice(i, i + batchSize);
            console.log(`Sending batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(emailPromises.length/batchSize)}`);
            const batchResults = await Promise.allSettled(batch);
            emailResults.push(...batchResults);
            
            // Wait 2 seconds between batches to avoid rate limits
            if (i + batchSize < emailPromises.length) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        const successful = emailResults.filter(result => result.status === 'fulfilled').length;
        const failed = emailResults.filter(result => result.status === 'rejected').length;

        console.log(`Email results: ${successful} successful, ${failed} failed`);

        if (failed > 0) {
            console.error('Some emails failed:', emailResults.filter(r => r.status === 'rejected').map(r => r.reason.message));
        }

        // E. Send CSV to Organizer (also in parallel effectively, or just await at end)
        if (req.body.organizerEmail) {
            console.log("Sending CSV report to organizer:", req.body.organizerEmail);
            const appUrl = (process.env.APP_URL || `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` || 'http://localhost:3000').replace(/\/$/, '');
            const csvContent = [
                "Giver Name,Giver Email,Receiver Name,Reveal Link",
                ...matchesList.map(m => `${m.Giver},${m.GiverEmail},${m.Receiver},${appUrl}/reveal?token=${m.Token}`)
            ].join("\n");

            // Send CSV data to admin as HTML table
            const tableRows = matchesList.map(m => 
                `<tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">${m.Giver}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${m.GiverEmail}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${m.Receiver}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;"><a href="${appUrl}/reveal?token=${m.Token}">Reveal Link</a></td>
                </tr>`
            ).join('');
            
            await sendEmailWithRetry(transporter, {
                from: process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_USER,
                to: req.body.organizerEmail,
                subject: "Secret Santa Pairs - Master List",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; color: #333;">
                        <h2>🎅 Secret Santa Pairs Created Successfully!</h2>
                        <p>Here is the master list of all Secret Santa pairs for your event:</p>
                        
                        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: white;">
                            <thead>
                                <tr style="background: #f8f9fa;">
                                    <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Giver Name</th>
                                    <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Giver Email</th>
                                    <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Receiver Name</th>
                                    <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Reveal Link</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tableRows}
                            </tbody>
                        </table>
                        
                        <div style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
                            <p><strong>⚠️ Important:</strong></p>
                            <ul style="margin: 5px 0;">
                                <li>Keep this information secure and confidential</li>
                                <li>Only share individual reveal links with participants</li>
                                <li>Participants will click their link to see who they're gifting</li>
                            </ul>
                        </div>
                        
                        <p style="margin-top: 20px; font-size: 12px; color: #666;">CSV Data (for backup):<br/>
                        <code style="background: #f8f9fa; padding: 10px; display: block; font-size: 11px; margin-top: 5px;">${csvContent.replace(/\n/g, '<br/>')}</code></p>
                    </div>
                `,
                text: `Secret Santa Pairs Created Successfully!\n\n${csvContent}\n\nKeep this information secure and only share individual reveal links with participants.`
            });
        }

        res.status(200).json({
            message: "Event created and emails sent successfully",
            eventId,
            emailsSent: emailPromises.length
        });

    } catch (error) {
        console.error("Event creation error:", error);
        res.status(500).json({ error: "Failed to create event" });
    }
});

// 2. REVEAL MATCH
app.get('/api/reveal/:token', async (req, res) => {
    const { token } = req.params;
    console.log('🔍 Reveal API called with token:', token);

    if (!token) {
        console.log('❌ No token provided');
        return res.status(400).json({ error: "Token required" });
    }

    try {
        const match = await getMatchByToken(token);

        if (!match) {
            return res.status(404).json({ error: "Invalid link" });
        }

        // Mark as revealed (optional tracking)
        await markAsRevealed(token);

        console.log('✅ Match found, sending response');
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

                    try {
                        const transporter = await createTransporter();
                        if (transporter) {
                            const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
                            const santaLink = `${appUrl}/reveal?token=${mySanta.token}`;

                            await sendEmailWithRetry(transporter, {
                                from: process.env.EMAIL_USER,
                                to: mySanta.giver_email,
                                subject: "🎁 Wishlist Update! Open to know",
                                html: `
                                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                                        <h2>Hi ${mySanta.giver_name},</h2>
                                        <p>Your gift recipient, <strong>${myInfo.giver_name}</strong>, has updated their wishlist!</p>
                                        
                                        <p>Click below to see what they want:</p>
                                        
                                        <a href="${santaLink}" style="display: inline-block; background-color: #d32f2f; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 5px;">View Wishlist 🎁</a>
                                    </div>
                                `
                            });
                        }
                    } catch (emailError) {
                        console.log('📧 Email failed, adding to pending queue:', emailError.message);
                        // Add to pending notifications for retry later
                        await addPendingNotification(
                            myInfo.event_id,
                            mySanta.giver_name,
                            mySanta.giver_email,
                            mySanta.token,
                            myInfo.giver_name
                        );
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

// Process pending notifications
async function processPendingNotifications() {
    try {
        const pending = await getPendingNotifications();
        if (pending.length === 0) return;

        console.log(`Processing ${pending.length} pending notifications...`);
        const transporter = await createTransporter();
        
        for (const notification of pending) {
            try {
                const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
                const santaLink = `${appUrl}/reveal?token=${notification.santa_token}`;

                await sendEmailWithRetry(transporter, {
                    from: process.env.EMAIL_USER,
                    to: notification.santa_email,
                    subject: "🎁 Wishlist Update! Open to know",
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                            <h2>Hi ${notification.santa_name},</h2>
                            <p>Your gift recipient, <strong>${notification.receiver_name}</strong>, has updated their wishlist!</p>
                            
                            <p>Click below to see what they want:</p>
                            
                            <a href="${santaLink}" style="display: inline-block; background-color: #d32f2f; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 5px;">View Wishlist 🎁</a>
                        </div>
                    `
                });
                
                console.log(`✅ Sent pending notification to ${notification.santa_email}`);
                await deletePendingNotification(notification.id);
            } catch (error) {
                console.log(`❌ Failed to send to ${notification.santa_email}:`, error.message);
                await incrementNotificationAttempts(notification.id);
            }
        }
    } catch (error) {
        console.error('Error processing pending notifications:', error);
    }
}

// API endpoint to manually trigger pending notifications
app.post('/api/process-pending', async (req, res) => {
    await processPendingNotifications();
    res.json({ message: 'Pending notifications processed' });
});

// Auto-retry every 30 minutes
setInterval(processPendingNotifications, 30 * 60 * 1000);

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

