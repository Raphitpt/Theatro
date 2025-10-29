const ShowApplication = require('../models/ShowApplication');
const WorkshopApplication = require('../models/WorkshopApplication');
const Show = require('../models/Show');
const { sendApplicationStatusEmail } = require('../services/emailService');

exports.processApplication = async (req, res, next) => {
  try {
    const applicationId = req.params.applicationId;
    const { status, notes } = req.body;
    const managerId = req.user.userId;

    if (!['accepted', 'refused'].includes(status)) {
      return res.status(400).json({ message: 'Le statut doit être "accepted" ou "refused"' });
    }

    let application = await ShowApplication.findById(applicationId)
      .populate('show')
      .populate('member')
      .populate('role');

    let isWorkshop = false;
    let eventKey = 'show';

    if (!application) {
      application = await WorkshopApplication.findById(applicationId)
        .populate('workshop')
        .populate('member');

      if (application) {
        isWorkshop = true;
        eventKey = 'workshop';
      }
    }

    if (!application) {
      return res.status(404).json({ message: 'La candidature n\'existe pas' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({
        message: `Cette candidature a déjà été traitée (statut: ${application.status})`,
        currentStatus: application.status
      });
    }

    if (isWorkshop && status === 'accepted' && application.availability === 'unavailable') {
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

    let autoRefusedCount = 0;
    if (!isWorkshop && status === 'accepted') {
      const otherApplications = await ShowApplication.find({
        show: application.show._id,
        member: application.member._id,
        _id: { $ne: applicationId },
        status: 'pending'
      }).populate('role');

      for (const otherApp of otherApplications) {
        otherApp.status = 'refused';
        otherApp.processedAt = new Date();
        otherApp.processedBy = managerId;
        otherApp.notes = 'Candidature automatiquement refusée car vous avez été accepté pour un autre rôle sur ce spectacle';
        await otherApp.save();

        await sendApplicationStatusEmail(application.member.mail, {
          memberName: `${application.member.firstname} ${application.member.name}`,
          showName: application.show.name,
          roleName: otherApp.role.name,
          showDate: application.show.dateTimeStart,
          status: 'refused',
          notes: otherApp.notes
        });

        autoRefusedCount++;
      }
    }

    const event = application[eventKey];
    await sendApplicationStatusEmail(application.member.mail, {
      memberName: `${application.member.firstname} ${application.member.name}`,
      showName: event.name,
      roleName: isWorkshop ? 'Participant' : application.role.name,
      showDate: event.dateTimeStart,
      status: status,
      notes: notes
    });

    res.status(200).json({
      message: `${isWorkshop ? 'Réponse' : 'Candidature'} ${status === 'accepted' ? 'acceptée' : 'refusée'} avec succès${autoRefusedCount > 0 ? `. ${autoRefusedCount} autre(s) candidature(s) automatiquement refusée(s)` : ''}`,
      application: {
        id: application._id,
        member: `${application.member.firstname} ${application.member.name}`,
        event: event.name,
        type: isWorkshop ? 'workshop' : 'show',
        role: isWorkshop ? 'Participant' : application.role.name,
        availability: isWorkshop ? application.availability : undefined,
        status: application.status,
        processedAt: application.processedAt,
        notes: application.notes
      },
      autoRefused: autoRefusedCount
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

exports.getShowApplications = async (req, res, next) => {
  try {
    const showId = req.params.showId;
    const { status } = req.query;

    const show = await Show.findById(showId);
    if (!show) {
      return res.status(404).json({ message: 'Le spectacle n\'existe pas' });
    }


    const filter = { show: showId };
    if (status && ['pending', 'accepted', 'refused'].includes(status)) {
      filter.status = status;
    }

    const applications = await ShowApplication.find(filter)
      .populate('member', 'firstname name mail')
      .populate('role', 'name')
      .populate('processedBy', 'firstname name')
      .sort({ appliedAt: -1 });

    const stats = {
      total: applications.length,
      pending: applications.filter(app => app.status === 'pending').length,
      accepted: applications.filter(app => app.status === 'accepted').length,
      refused: applications.filter(app => app.status === 'refused').length
    };

    const byRole = applications.reduce((acc, app) => {
      const roleName = app.role.name;
      if (!acc[roleName]) {
        acc[roleName] = {
          roleId: app.role._id,
          roleName: roleName,
          applications: []
        };
      }
      acc[roleName].applications.push({
        id: app._id,
        member: {
          id: app.member._id,
          name: `${app.member.firstname} ${app.member.name}`,
          mail: app.member.mail
        },
        status: app.status,
        appliedAt: app.appliedAt,
        processedAt: app.processedAt,
        processedBy: app.processedBy ? `${app.processedBy.firstname} ${app.processedBy.name}` : null,
        notes: app.notes
      });
      return acc;
    }, {});

    res.status(200).json({
      show: {
        id: show._id,
        name: show.name,
        dateTimeStart: show.dateTimeStart
      },
      stats,
      byRole: Object.values(byRole),
      applications: applications.map(app => ({
        id: app._id,
        member: {
          id: app.member._id,
          name: `${app.member.firstname} ${app.member.name}`,
          mail: app.member.mail
        },
        role: {
          id: app.role._id,
          name: app.role.name
        },
        status: app.status,
        appliedAt: app.appliedAt,
        processedAt: app.processedAt,
        processedBy: app.processedBy ? `${app.processedBy.firstname} ${app.processedBy.name}` : null,
        notes: app.notes
      }))
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}