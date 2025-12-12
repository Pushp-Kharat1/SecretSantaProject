import sgMail from '@sendgrid/mail';

// Alternative email service using SendGrid (more reliable on Railway)
export async function createSendGridTransporter() {
    if (!process.env.SENDGRID_API_KEY) {
        console.log('SendGrid API key not found, falling back to Gmail');
        return null;
    }
    
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    return {
        sendMail: async (mailOptions) => {
            const msg = {
                to: mailOptions.to,
                from: process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_USER,
                subject: mailOptions.subject,
                html: mailOptions.html,
                text: mailOptions.text,
                attachments: mailOptions.attachments
            };
            
            return await sgMail.send(msg);
        }
    };
}

// Fallback email service using simple SMTP (for testing)
export async function createSimpleTransporter() {
    const nodemailer = await import('nodemailer');
    
    return nodemailer.createTransporter({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_APP_PASSWORD // Use App Password instead of OAuth
        },
        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000
    });
}