const Event = require('../models/Event');
const Show = require('../models/Show');
const Workshop = require('../models/Workshop');
const ShowApplication = require('../models/ShowApplication');
const WorkshopApplication = require('../models/WorkshopApplication');
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

exports.getAllEvents = async (req, res, next) => {
  try {
    const { type } = req.query;

    const filter = {};

    if (type === 'show') {
      filter.kind = 'Show';
    } else if (type === 'workshop') {
      filter.kind = 'Workshop';
    } else if (type) {
      return res.status(400).json({
        error: 'Type invalide. Utilisez "show" ou "workshop"'
      });
    }

    const events = await Event.find(filter)
      .populate('roles')
      .sort({ dateTimeStart: 1 });

    res.status(200).json({
      message: 'Liste des événements récupérée avec succès',
      count: events.length,
      events
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

exports.sendFollowUp = async (req, res, next) => {
  try {
    const { eventId, eventType } = req.params;

    let event;
    let applications = [];
    let membersWhoResponded = [];

    if (eventType === 'show') {
      event = await Show.findById(eventId).populate('roles');
      if (!event) {
        return res.status(404).json({ error: 'Spectacle non trouvé' });
      }

      applications = await ShowApplication.find({ show: eventId });
      membersWhoResponded = applications.map(app => app.member.toString());

    } else if (eventType === 'workshop') {
      event = await Workshop.findById(eventId);
      if (!event) {
        return res.status(404).json({ error: 'Atelier non trouvé' });
      }

      if (event.hasFollowUp) {
        return res.status(400).json({
          error: 'Une relance a déjà été envoyée pour cet atelier'
        });
      }

      applications = await WorkshopApplication.find({ workshop: eventId });
      membersWhoResponded = applications.map(app => app.member.toString());

    } else {
      return res.status(400).json({
        error: 'Type d\'événement invalide. Utilisez "show" ou "workshop"'
      });
    }

    const membersWhoDidNotRespond = await Member.find({
      _id: { $nin: membersWhoResponded },
      communicationChannels: 'MAILS'
    });

    if (membersWhoDidNotRespond.length === 0) {
      return res.status(200).json({
        message: 'Tous les membres ont déjà répondu',
        count: 0
      });
    }

    const { Resend } = require('resend');
    const resendInst = new Resend(process.env.RESEND_API_KEY);

    const emailStats = await sendBulkEmails(membersWhoDidNotRespond, async (email, eventData) => {
      try {
        const eventUrl = eventType === 'show'
          ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}/show/${eventData._id}/apply`
          : `${process.env.FRONTEND_URL || 'http://localhost:3000'}/workshop/${eventData._id}/apply`;

        const eventTypeLabel = eventType === 'show' ? 'spectacle' : 'atelier';

        const result = await resendInst.emails.send({
          from: 'Theatro <theatro@rtiphonet.fr>',
          to: email,
          subject: `Relance : ${eventData.name}`,
          html: `
            <h2>Rappel : ${eventTypeLabel} à venir</h2>
            <p>Nous remarquons que vous n'avez pas encore répondu concernant ${eventType === 'show' ? 'le spectacle' : 'l\'atelier'} suivant :</p>
            <p><strong>${eventData.name}</strong></p>
            <p><strong>Date :</strong> ${new Date(eventData.dateTimeStart).toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
            <p><strong>Lieu :</strong> ${eventData.location}</p>
            <p><strong>Places disponibles :</strong> ${eventData.memberMax}</p>
            <p>Merci de nous faire part de votre disponibilité dès que possible.</p>
            <a href="${eventUrl}">
              ${eventType === 'show' ? 'Postuler au spectacle' : 'Répondre à l\'invitation'}
            </a>
          `,
        });
        return { success: true, result };
      } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'email de relance:', error);
        return { success: false, error };
      }
    }, event);

    await event.updateOne({ hasFollowUp: true });

    res.status(200).json({
      message: 'Relance envoyée avec succès',
      memberCount: membersWhoDidNotRespond.length,
      emailStats
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
