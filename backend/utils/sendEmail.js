const transporter = require("../config/email");

async function sendEmail(to, subject, text) {
  try {
    const mailOptions = {
      from: `"Mould Market" <${process.env.EMAIL_USER}>`, // sender name + email
      to,
      subject,
      text, // plain text only
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: ", info.response);
    return info;
  } catch (error) {
    console.error("Error sending email: ", error);
    throw error;
  }
}

module.exports = sendEmail;