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
  if (!userEmail) return 'revathyshree464@gmail.com';
  const username = userEmail.split('@')[0];
  return `revathyshree464+${username}@gmail.com`;
};

export const sendLeaveApplicationEmail = async (managerEmail, employeeName, leaveDetails) => {
  if (!managerEmail) return;
  const to = getTestEmailAlias(managerEmail);
  const subject = `New Leave Application from ${employeeName}`;
  const text = `${employeeName} has applied for leave.

Type: ${leaveDetails.leave_type}
Dates: ${leaveDetails.start_date} to ${leaveDetails.end_date}
Reason: ${leaveDetails.reason}
Days: ${leaveDetails.days}

Please review this request in the system.`;

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
