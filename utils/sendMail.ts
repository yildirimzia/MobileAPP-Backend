import nodemailer, { Transporter } from 'nodemailer';
import ejs from 'ejs';
import path from 'path';


interface EmailOptions {
    email: string;
    subject: string;
    template: string;
    data: {
        [key: string]: any
    };
}

export const sendMail = async (options: EmailOptions): Promise<void> => {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
            user: process.env.SMTP_MAIL,
            pass: process.env.SMTP_PASSWORD
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    const { email, subject, template, data } = options;

    const html: string = await ejs.renderFile(path.join(__dirname, '../mails', template), data);

    const mailOptions = {
        from: process.env.SMTP_MAIL,
        to: email,
        subject,
        html
    }

    await transporter.sendMail(mailOptions);
}

export default sendMail;