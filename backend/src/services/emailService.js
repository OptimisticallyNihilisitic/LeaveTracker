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
    
  const text = `${employeeName} has applied for leave.

Type: ${leaveDetails.leave_type}
Dates: ${leaveDetails.start_date} to ${leaveDetails.end_date}
Reason: ${leaveDetails.reason}
Days: ${leaveDetails.days}

${isAutoApproved ? 'This sick leave has been automatically approved. No action is required from you.' : 'Please review this request in the system.'}`;

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
  const text = `Your leave request has been ${status} by ${managerName}.

Type: ${leaveDetails.leave_type}
Dates: ${leaveDetails.start_date} to ${leaveDetails.end_date}
Days: ${leaveDetails.days}
Comments: ${leaveDetails.comments || 'N/A'}

Check the portal for more details.`;

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
