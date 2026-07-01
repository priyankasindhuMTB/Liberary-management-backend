import nodemailer from "nodemailer";
import "dotenv/config"; 

// 1. Transporter configuration using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },

  
});
console.log("EMAIL_USER:", process.env.EMAIL_USER);
  console.log("EMAIL_PASS exists:", !!process.env.EMAIL_PASS);


/**
 * Sends System Status Update Emails to Library Admins
 */
export const sendStatusEmail = async (toEmail, adminName, status, libraryName, remarks = "") => {
  console.log("Sending email to:", toEmail, "with status:", status, "and remarks:", remarks, "for library:", libraryName);
  let subject = "";
  let htmlContent = "";

  if (status === "Approved") {
    subject = "Library Access Approved! 🎉 | LibSync";
    htmlContent = `
      <div style="font-family: sans-serif; padding: 20px; color: #334155;">
        <h2 style="color: #4f46e5;">Hello ${adminName},</h2>
        <p>Great news! Your administrative registration request for <strong>"${libraryName}"</strong> has been successfully verified and approved by the platform director.</p>
        <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #10b981; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; font-weight: bold; color: #065f46;">Account Status: Active ✅</p>
          <p style="margin: 5px 0 0 0; font-size: 13px;">You can now log in to your dashboard using the email and password you provided during registration.</p>
        </div>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">Login to Dashboard</a>
        <p style="font-size: 11px; color: #94a3b8; margin-top: 30px;">This is an automated system email from LibSync Infrastructure. Please do not reply directly.</p>
      </div>
    `;
  } else if (status === "Rejected") {
    subject = "Library Registration Update ❌ | LibSync";
    htmlContent = `
      <div style="font-family: sans-serif; padding: 20px; color: #334155;">
        <h2 style="color: #e11d48;">Hello ${adminName},</h2>
        <p>Thank you for submitting your application to manage <strong>"${libraryName}"</strong>.</p>
        <p>Regrettably, your access allocation request could not be approved at this time as it does not comply with our current platform guidelines.</p>
        <div style="background-color: #fff1f2; padding: 15px; border-left: 4px solid #f43f5e; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; font-weight: bold; color: #9f1239;">Super Admin Remarks:</p>
          <p style="margin: 5px 0 0 0; font-style: italic; color: #4c0519;">"${remarks}"</p>
        </div>
        <p>If you believe this was an error, you can submit a fresh request with rectified configuration criteria parameters.</p>
        <p style="font-size: 11px; color: #94a3b8; margin-top: 30px;">This is an automated system email from LibSync Infrastructure. Please do not reply directly.</p>
      </div>
    `;
  }

  const mailOptions = {
    from: `"LibSync System" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: subject,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Automated status email sent successfully to: ${toEmail}`);
    return info;
  } catch (error) {
    console.error("❌ Nodemailer failed to send status email:", error.message);
    throw error;
  }
};