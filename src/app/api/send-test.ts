import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'mail.iimskills.co',
  port: 465,
  secure: true,
  auth: {
    user: 'noreply@iimskills.co',
    pass: 'your_password_here',
  },
  logger: true,
  debug: true,
});

transporter.sendMail({
  from: 'IIM SKILLS <noreply@iimskills.co>',
  to: 'youremail@gmail.com',
  subject: 'Test Email from Localhost',
  html: `<p>This is a test email from VS Code</p>`,
});

