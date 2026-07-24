// backend/src/controllers/followUpController.js

const prisma = require('../config/db');
const { sendEmail } = require('../config/mailer');
const { logAudit } = require('../config/auditLogger');

/**
 * @desc    Schedule a new follow-up for a beneficiary
 * @route   POST /api/followups
 * @access  Private (NGO Staff/Admin only)
 */
const createFollowUp = async (req, res) => {
  const { scheduledDate, notes, beneficiaryId } = req.body;

  // 1. Basic validation
  if (!scheduledDate || !beneficiaryId) {
    return res.status(400).json({ message: 'Please provide scheduledDate and beneficiaryId' });
  }

  try {
    // 2. Verify beneficiary exists
    const beneficiary = await prisma.beneficiary.findUnique({
      where: { id: beneficiaryId },
    });

    if (!beneficiary) {
      return res.status(404).json({ message: 'Target beneficiary record not found' });
    }

    // 3. Create the follow-up entry
    const followUp = await prisma.followUp.create({
      data: {
        scheduledDate: new Date(scheduledDate),
        notes: notes || null,
        status: 'PENDING', // All follow-ups start as PENDING
        beneficiaryId,
      },
    });

    // 4. Create an in-app Notification log
    const formattedDate = new Date(scheduledDate).toLocaleDateString();
    await prisma.notification.create({
      data: {
        title: 'Follow-Up Scheduled',
        message: `A follow-up assessment has been scheduled for "${beneficiary.fullName}" on ${formattedDate}.`,
      },
    });

    // Write action to Audit Log
    await logAudit({
      req,
      action: 'CREATE_FOLLOW_UP',
      details: `Scheduled a follow-up assessment for beneficiary: ${beneficiary.fullName} (ID: ${beneficiary.id}) on ${formattedDate}`,
    });

    res.status(201).json(followUp);
  } catch (error) {
    console.error('Error creating follow-up:', error);
    res.status(500).json({ message: 'Server error while scheduling follow-up' });
  }
};

/**
 * @desc    Get all follow-ups with optional filters
 * @route   GET /api/followups
 * @access  Private
 */
const getFollowUps = async (req, res) => {
  const { beneficiaryId, status } = req.query;

  try {
    const where = {};
    if (beneficiaryId) where.beneficiaryId = beneficiaryId;
    if (status) where.status = status;

    const followUps = await prisma.followUp.findMany({
      where,
      orderBy: { scheduledDate: 'asc' }, // Order closest deadline first
      include: {
        beneficiary: {
          select: {
            fullName: true,
            location: true,
          },
        },
      },
    });

    res.json(followUps);
  } catch (error) {
    console.error('Error fetching follow-ups:', error);
    res.status(500).json({ message: 'Server error while fetching follow-ups' });
  }
};

/**
 * @desc    Record outcome notes and update status of a follow-up
 * @route   PUT /api/followups/:id
 * @access  Private
 */
const updateFollowUp = async (req, res) => {
  const { id } = req.params;
  const { notes, status } = req.body;

  try {
    // 1. Verify follow-up exists
    const existingFollowUp = await prisma.followUp.findUnique({
      where: { id },
      include: { beneficiary: true },
    });

    if (!existingFollowUp) {
      return res.status(404).json({ message: 'Follow-up assessment not found' });
    }

    // 2. Perform updates
    const updatedFollowUp = await prisma.followUp.update({
      where: { id },
      data: {
        notes: notes !== undefined ? notes : undefined,
        status: status || undefined, // e.g. updating PENDING -> COMPLETED
      },
    });

    // 3. Trigger In-App Notification if the follow-up is closed
    if (status === 'COMPLETED') {
      await prisma.notification.create({
        data: {
          title: 'Follow-Up Completed',
          message: `Follow-up assessment for "${existingFollowUp.beneficiary.fullName}" was completed.`,
        },
      });
    }

    // Write action to Audit Log
    const auditAction = status === 'COMPLETED' ? 'COMPLETE_FOLLOW_UP' : 'UPDATE_FOLLOW_UP';
    const auditDetails = status === 'COMPLETED'
      ? `Completed follow-up assessment for beneficiary: ${existingFollowUp.beneficiary.fullName} (ID: ${existingFollowUp.beneficiary.id})`
      : `Updated follow-up notes for beneficiary: ${existingFollowUp.beneficiary.fullName} (ID: ${existingFollowUp.beneficiary.id}) (Log ID: ${id})`;

    await logAudit({
      req,
      action: auditAction,
      details: auditDetails,
    });

    res.json(updatedFollowUp);
  } catch (error) {
    console.error('Error updating follow-up:', error);
    res.status(500).json({ message: 'Server error while updating follow-up' });
  }
};

/**
 * @desc    Scan database for overdue follow-ups, flag them, create notifications, and mail alerts
 * @route   POST /api/followups/check-overdue
 * @access  Private (NGO Staff/Admin only)
 */
const checkOverdueFollowUps = async (req, res) => {
  const now = new Date();

  try {
    // 1. Query for all PENDING follow-ups where scheduledDate has passed
    const overdueFollowUps = await prisma.followUp.findMany({
      where: {
        status: 'PENDING',
        scheduledDate: {
          lt: now, // lt = Less Than (scheduledDate is in the past)
        },
      },
      include: {
        beneficiary: true,
      },
    });

    console.log(`🔍 Scanner: Found ${overdueFollowUps.length} overdue follow-up assessments.`);

    if (overdueFollowUps.length === 0) {
      return res.json({
        message: 'No overdue follow-ups found. Everything is up to date!',
        updatedCount: 0,
      });
    }

    const emailReports = [];

    // 2. Loop through each overdue record
    for (const record of overdueFollowUps) {
      // a. Update the status in the database to OVERDUE
      await prisma.followUp.update({
        where: { id: record.id },
        data: { status: 'OVERDUE' },
      });

      // b. Log an in-app database Notification
      const formattedDate = new Date(record.scheduledDate).toLocaleDateString();
      const notificationMsg = `Urgent: The follow-up assessment for "${record.beneficiary.fullName}" scheduled for ${formattedDate} is now OVERDUE.`;
      
      await prisma.notification.create({
        data: {
          title: 'Overdue Follow-Up Alert',
          message: notificationMsg,
        },
      });

      // c. Send an email reminder via Nodemailer to the staff member's email address
      const emailSubject = `⚠️ OVERDUE ALERT: Beneficiary Follow-Up [${record.beneficiary.fullName}]`;
      const emailHtml = `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e1e8ed; border-radius: 8px; max-width: 600px;">
          <h2 style="color: #d9534f; margin-top: 0;">⚠️ Overdue Follow-Up Alert</h2>
          <p>Hello, this is an automated reminder from the <strong>NGO Beneficiary Tracking System</strong>.</p>
          <hr style="border: 0; border-top: 1px solid #e1e8ed;" />
          <p>A follow-up assessment has exceeded its scheduled date and is now flagged as <strong>OVERDUE</strong>.</p>
          
          <table style="width: 100%; text-align: left; margin: 20px 0; border-collapse: collapse;">
            <tr>
              <th style="padding: 8px 0; border-bottom: 1px solid #f1f2f6; width: 150px;">Beneficiary:</th>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f2f6;"><strong>${record.beneficiary.fullName}</strong></td>
            </tr>
            <tr>
              <th style="padding: 8px 0; border-bottom: 1px solid #f1f2f6;">Scheduled Date:</th>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f2f6;">${formattedDate}</td>
            </tr>
            <tr>
              <th style="padding: 8px 0; border-bottom: 1px solid #f1f2f6;">Location:</th>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f2f6;">${record.beneficiary.location}</td>
            </tr>
            <tr>
              <th style="padding: 8px 0; border-bottom: 1px solid #f1f2f6;">Category:</th>
              <td style="padding: 8px 0; border-bottom: 1px solid #f1f2f6;">${record.beneficiary.category}</td>
            </tr>
          </table>

          <div style="background-color: #fcf8e3; border-left: 4px solid #f0ad4e; padding: 12px; margin-bottom: 20px;">
            <strong>Scheduled Notes:</strong><br/>
            ${record.notes || 'No notes provided.'}
          </div>

          <p style="margin-bottom: 0;">Please visit the dashboard to review and complete this assessment as soon as possible.</p>
        </div>
      `;

      // We send the email directly to the logged-in staff member's email address (req.user.email)
      const mailResult = await sendEmail({
        to: req.user.email,
        subject: emailSubject,
        text: notificationMsg,
        html: emailHtml,
      });

      if (mailResult && mailResult.previewUrl) {
        emailReports.push({
          beneficiary: record.beneficiary.fullName,
          emailSentTo: req.user.email,
          previewUrl: mailResult.previewUrl,
        });
      }
    }

    res.json({
      message: `Scanner complete. Flagged ${overdueFollowUps.length} follow-up(s) as OVERDUE, generated database notifications, and dispatched email reminders.`,
      updatedCount: overdueFollowUps.length,
      emailsSent: emailReports,
    });
  } catch (error) {
    console.error('Error running overdue check:', error);
    res.status(500).json({ message: 'Server error while running follow-ups overdue check' });
  }
};

/**
 * @desc    Get all system notifications (In-app alerts)
 * @route   GET /api/notifications
 * @access  Private
 */
const getNotifications = async (req, res) => {
  try {
    const list = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(list);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error while retrieving notifications' });
  }
};

/**
 * @desc    Mark a notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
const markNotificationAsRead = async (req, res) => {
  const { id } = req.params;

  try {
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ message: 'Server error while updating notification status' });
  }
};

module.exports = {
  createFollowUp,
  getFollowUps,
  updateFollowUp,
  checkOverdueFollowUps,
  getNotifications,
  markNotificationAsRead,
};
