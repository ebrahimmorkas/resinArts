const transporter = require("../config/email");
const CompanySettings = require("../models/CompanySettings");

async function sendEmail(to, subject, text, attachments = []) {
  try {
    // Fetch company settings
    const settings = await CompanySettings.getSingleton();
    
    const mailOptions = {
      from: `"${settings.companyName}" <${settings.adminEmail}>`, // Use company name and email from settings
      to,
      subject,
      text, // plain text only
      attachments: attachments // array of attachments
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