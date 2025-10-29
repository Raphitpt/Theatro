const WorkshopApplication = require('../models/WorkshopApplication');
const Workshop = require('../models/Workshop');
const Member = require('../models/Member');
const { sendApplicationStatusEmail } = require('../services/emailService');


exports.applyToWorkshop = async (req, res, next) => {
  try {
    const workshopId = req.params.workshopId;
    const { availability } = req.body;
    const memberId = req.user.userId;

    if (!['available', 'unavailable'].includes(availability)) {
      return res.status(400).json({ message: 'La disponibilité doit être "available" ou "unavailable"' });
    }

    const workshop = await Workshop.findById(workshopId);
    if (!workshop) {
      return res.status(404).json({ message: 'L\'atelier n\'existe pas' });
    }

    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }

    let application = await WorkshopApplication.findOne({
      workshop: workshopId,
      member: memberId
    });

    if (application) {
      application.availability = availability;
      application.respondedAt = new Date();
      application.status = 'pending';
      application.processedAt = undefined;
      application.processedBy = undefined;
      application.notes = undefined;
    } else {
      application = new WorkshopApplication({
        workshop: workshopId,
        member: memberId,
        availability: availability,
        status: 'pending'
      });
    }

    await application.save();

    res.status(200).json({
      message: `Votre réponse "${availability === 'available' ? 'disponible' : 'non disponible'}" a été enregistrée avec succés`,
      application: {
        id: application._id,
        workshop: workshop.name,
        availability: application.availability,
        status: application.status,
        respondedAt: application.respondedAt
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.processWorkshopApplication = async (req, res, next) => {
  try {
    const applicationId = req.params.applicationId;
    const { status, notes } = req.body;
    const managerId = req.user.userId;

    if (!['accepted', 'refused'].includes(status)) {
      return res.status(400).json({ message: 'Le statut doit être "accepted" ou "refused"' });
    }

    const application = await WorkshopApplication.findById(applicationId)
      .populate('workshop')
      .populate('member');

    if (!application) {
      return res.status(404).json({ message: 'La réponse n\'existe pas' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({
        message: `Cette réponse a déjà été traitée (statut: ${application.status})`,
        currentStatus: application.status
      });
    }

    if (status === 'accepted' && application.availability === 'unavailable') {
      return res.status(400).json({
        message: 'Vous ne pouvez pas accepter un membre qui a indiqué être non disponible'
      });
    }

    application.status = status;
    application.processedAt = new Date();
    application.processedBy = managerId;
    if (notes) {
      application.notes = notes;
    }

    await application.save();

    await sendApplicationStatusEmail(application.member.mail, {
      memberName: `${application.member.firstname} ${application.member.name}`,
      showName: application.workshop.name,
      roleName: 'Participant',
      showDate: application.workshop.dateTimeStart,
      status: status,
      notes: notes
    });

    res.status(200).json({
      message: `Réponse ${status === 'accepted' ? 'accept�e' : 'refus�e'} avec succés`,
      application: {
        id: application._id,
        member: `${application.member.firstname} ${application.member.name}`,
        workshop: application.workshop.name,
        availability: application.availability,
        status: application.status,
        processedAt: application.processedAt,
        notes: application.notes
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getWorkshopApplications = async (req, res, next) => {
  try {
    const workshopId = req.params.workshopId;
    const { status, availability } = req.query;

    const workshop = await Workshop.findById(workshopId);
    if (!workshop) {
      return res.status(404).json({ message: 'L\'atelier n\'existe pas' });
    }

    const filter = { workshop: workshopId };
    if (status && ['pending', 'accepted', 'refused'].includes(status)) {
      filter.status = status;
    }
    if (availability && ['available', 'unavailable'].includes(availability)) {
      filter.availability = availability;
    }

    const applications = await WorkshopApplication.find(filter)
      .populate('member', 'firstname name mail')
      .populate('processedBy', 'firstname name')
      .sort({ respondedAt: -1 });

    const stats = {
      total: applications.length,
      available: applications.filter(app => app.availability === 'available').length,
      unavailable: applications.filter(app => app.availability === 'unavailable').length,
      pending: applications.filter(app => app.status === 'pending').length,
      accepted: applications.filter(app => app.status === 'accepted').length,
      refused: applications.filter(app => app.status === 'refused').length
    };

    res.status(200).json({
      workshop: {
        id: workshop._id,
        name: workshop.name,
        dateTimeStart: workshop.dateTimeStart,
        memberMax: workshop.memberMax
      },
      stats,
      applications: applications.map(app => ({
        id: app._id,
        member: {
          id: app.member._id,
          name: `${app.member.firstname} ${app.member.name}`,
          mail: app.member.mail
        },
        availability: app.availability,
        status: app.status,
        respondedAt: app.respondedAt,
        processedAt: app.processedAt,
        processedBy: app.processedBy ? `${app.processedBy.firstname} ${app.processedBy.name}` : null,
        notes: app.notes
      }))
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};