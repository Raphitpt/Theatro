const Show = require('../models/Show');
const Workshop = require('../models/Workshop');
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

exports.createWorkshop = async (req, res, next) => {
  try {
    const workshop = new Workshop({
      name: req.body.name,
      dateTimeStart: new Date(req.body.dateTimeStart),
      dateTimeEnd: new Date(req.body.dateTimeEnd),
      location: req.body.location,
      memberMax: req.body.memberMax,
      hasFollowUp: req.body.hasFollowUp || false
    });

    await workshop.save();

    const members = await Member.find({
      communicationChannels: 'MAILS'
    });

    const emailStats = await sendBulkEmails(members, async (email, workshopData) => {
      const { Resend } = require('resend');
      const resendInst = new Resend(process.env.RESEND_API_KEY);

      try {
        const result = await resendInst.emails.send({
          from: 'Theatro <theatro@rtiphonet.fr>',
          to: email,
          subject: `Nouvel atelier : ${workshopData.name}`,
          html: `
            <h2>Un nouvel atelier est disponible !</h2>
            <p><strong>${workshopData.name}</strong></p>
            <p><strong>Date :</strong> ${new Date(workshopData.dateTimeStart).toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
            <p><strong>Lieu :</strong> ${workshopData.location}</p>
            <p><strong>Places disponibles :</strong> ${workshopData.memberMax}</p>
            <p>Inscrivez-vous dès maintenant pour participer !</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/workshop/${workshopData._id}/apply">
              Voir l'atelier et s'inscrire
            </a>
          `,
        });
        return { success: true, result };
      } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'email d\'atelier:', error);
        return { success: false, error };
      }
    }, workshop);

    res.status(201).json({
      message: 'L\'atelier a été créé avec succès',
      workshop,
      emailStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
