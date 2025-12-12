import dotenv from 'dotenv';
import { getPendingNotifications, deletePendingNotification, incrementNotificationAttempts } from './db.js';
import sgMail from '@sendgrid/mail';

dotenv.config();

async function processPendingNotifications() {
    try {
        console.log('🔄 Checking for pending notifications...');
        
        if (!process.env.SENDGRID_API_KEY) {
            console.log('❌ No SendGrid API key found');
            return;
        }

        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        
        const pending = await getPendingNotifications();
        console.log(`📧 Found ${pending.length} pending notifications`);
        
        if (pending.length === 0) {
            console.log('✅ No pending notifications to process');
            return;
        }

        let sent = 0;
        let failed = 0;

        for (const notification of pending) {
            try {
                const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
                const santaLink = `${appUrl}/reveal?token=${notification.santa_token}`;

                const msg = {
                    to: notification.santa_email,
                    from: process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_USER,
                    subject: "🎁 Wishlist Update! Open to know",
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                            <h2>Hi ${notification.santa_name},</h2>
                            <p>Your gift recipient, <strong>${notification.receiver_name}</strong>, has updated their wishlist!</p>
                            
                            <p>Click below to see what they want:</p>
                            
                            <a href="${santaLink}" style="display: inline-block; background-color: #d32f2f; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 5px;">View Wishlist 🎁</a>
                        </div>
                    `
                };

                await sgMail.send(msg);
                console.log(`✅ Sent notification to ${notification.santa_email}`);
                await deletePendingNotification(notification.id);
                sent++;
                
                // Small delay to avoid rate limits
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.log(`❌ Failed to send to ${notification.santa_email}:`, error.message);
                await incrementNotificationAttempts(notification.id);
                failed++;
            }
        }

        console.log(`📊 Results: ${sent} sent, ${failed} failed`);
        
    } catch (error) {
        console.error('Error processing pending notifications:', error);
    }
}

// Run the script
processPendingNotifications().then(() => {
    console.log('🏁 Processing complete');
    process.exit(0);
}).catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
});