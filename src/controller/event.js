const Show = require('../models/Show');
const Role = require('../models/Role');
const Member = require('../models/Member');
const { sendShowNotificationEmail, sendBulkEmails } = require('../services/emailService');

exports.createShow = async (req, res, next) => {
  try {
    const roleIds = [];

    if (req.body.roles && Array.isArray(req.body.roles)) {
      for (const roleName of req.body.roles) {
        let role = await Role.findOne({ name: roleName });

        if (!role) {
          role = new Role({ name: roleName });
          await role.save();
        }

        roleIds.push(role._id);
      }
    }

    const show = new Show({
      name: req.body.name,
      dateTimeStart: new Date(req.body.dateTimeStart),
      dateTimeEnd: new Date(req.body.dateTimeEnd),
      location: req.body.location,
      memberMax: req.body.memberMax,
      roles: roleIds
    });

    await show.save();

    const members = await Member.find({
      communicationChannels: 'MAILS'
    });

    const emailStats = await sendBulkEmails(members, sendShowNotificationEmail, show);

    res.status(201).json({
      message: 'Le spectacle a été créé avec succès',
      show,
      emailStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

exports.createWorkshop = (req, res, next) => {

}

exports.assignRoleToMember = (req, res, next) => {

}

exports.valideUserForWorkshop = (req, res, next) => {

}
