import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const getTestEmailAlias = (userEmail) => {
  if (!userEmail) return 'testemail122405@gmail.com';
  const username = userEmail.split('@')[0];
  return `testemail122405+${username}@gmail.com`;
};

export const sendLeaveApplicationEmail = async (managerEmail, employeeName, leaveDetails) => {
  if (!managerEmail) return;
  const to = getTestEmailAlias(managerEmail);
  const isAutoApproved = leaveDetails.status === 'approved';
  const subject = isAutoApproved 
    ? `Notice: Sick Leave Applied by ${employeeName}` 
    : `New Leave Application from ${employeeName}`;

  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const reviewUrl = `${baseUrl}?page=leave-approvals&for=${encodeURIComponent(managerEmail)}`;

  const text = `${employeeName} has applied for leave.

Type: ${leaveDetails.leave_type}
Dates: ${leaveDetails.start_date} to ${leaveDetails.end_date}
Reason: ${leaveDetails.reason}
Days: ${leaveDetails.days}

${isAutoApproved ? 'This sick leave has been automatically approved.' : `Please review this request by clicking the link below:`}

${isAutoApproved ? '' : reviewUrl}`;

  try {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, text });
      console.log(`Email sent to ${to} (Manager)`);
    } else {
      console.log(`[Email Mock] To: ${to} (Manager) | Subject: ${subject}`);
    }
  } catch (error) {
    console.error('Error sending application email:', error);
  }
};

export const sendLeaveApprovalEmail = async (employeeEmail, managerName, status, leaveDetails) => {
  if (!employeeEmail) return;
  const to = getTestEmailAlias(employeeEmail);
  const subject = `Leave Request ${status.toUpperCase()}`;

  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const reviewUrl = `${baseUrl}?page=leaves&for=${encodeURIComponent(employeeEmail)}`;

  const text = `Your leave request has been ${status} by ${managerName}.

Type: ${leaveDetails.leave_type}
Dates: ${leaveDetails.start_date} to ${leaveDetails.end_date}
Days: ${leaveDetails.days}
Comments: ${leaveDetails.comments || 'N/A'}

View your leave status here:
${reviewUrl}`;

  try {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, text });
      console.log(`Email sent to ${to} (Employee)`);
    } else {
      console.log(`[Email Mock] To: ${to} (Employee) | Subject: ${subject}`);
    }
  } catch (error) {
    console.error('Error sending approval email:', error);
  }
};

export const sendInvitationEmail = async (email, name, token) => {
  if (!email) return;
  const to = getTestEmailAlias(email);
  const setupUrl = process.env.FRONTEND_URL 
    ? `${process.env.FRONTEND_URL}/invite/${token}`
    : `http://localhost:5173/invite/${token}`;

  const subject = `You're invited to the Leave Management System`;
  const text = `Hello ${name},

You've been invited to join the Leave Management System.
Please click the link below to set up your account and choose a password:

${setupUrl}

If you have any questions, please contact your administrator.`;

  try {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, text });
      console.log(`Invitation email sent to ${to}`);
    } else {
      console.log(`[Email Mock] To: ${to} | Subject: ${subject}`);
    }
  } catch (error) {
    console.error('Error sending invitation email:', error);
  }
};

export const sendLeaveToHrEmail = async (hrEmails, employeeName, leaveDetails) => {
  if (!hrEmails || hrEmails.length === 0) return;

  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const subject = `Leave Pending HR Approval — ${employeeName}`;

  for (const hrEmail of hrEmails) {
    const to = getTestEmailAlias(hrEmail);
    const reviewUrl = `${baseUrl}?page=hr-approvals&for=${encodeURIComponent(hrEmail)}`;
    const text = `A leave request from ${employeeName} is awaiting HR approval.

Type: ${leaveDetails.leave_type}
Dates: ${leaveDetails.start_date} to ${leaveDetails.end_date}
Days: ${leaveDetails.days}
Reason: ${leaveDetails.reason}

Review and approve/reject this request here:
${reviewUrl}`;
    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, text });
        console.log(`Email sent to ${to} (HR)`);
      } else {
        console.log(`[Email Mock] To: ${to} (HR) | Subject: ${subject}`);
      }
    } catch (error) {
      console.error(`Error sending HR notification email to ${to}:`, error);
    }
  }
};

export const sendOtpEmail = async (email, otp, purpose) => {
  if (!email) return;
  const to = getTestEmailAlias(email);
  
  const subject = purpose === 'password_reset' 
    ? 'Password Reset OTP - Leave Management System'
    : 'Login Verification OTP - Leave Management System';
    
  const text = `Hello,

Your One-Time Password (OTP) is: ${otp}

This OTP is valid for 10 minutes. Please do not share it with anyone.

If you did not request this, please ignore this email.`;

  try {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, text });
      console.log(`OTP email sent to ${to} for purpose: ${purpose}`);
    } else {
      console.log(`[Email Mock] To: ${to} | Subject: ${subject} | OTP: ${otp}`);
    }
  } catch (error) {
    console.error('Error sending OTP email:', error);
  }
};
