const ShowApplication = require('../models/ShowApplication');
const Show = require('../models/Show');
const Role = require('../models/Role');
const Member = require('../models/Member');
const { sendApplicationConfirmationEmail, sendApplicationStatusEmail } = require('../services/emailService');

exports.applyToShow = async (req, res, next) => {
  try {
    const showId = req.params.showId;
    const { roleIds } = req.body;
    const memberId = req.user.userId;

    if (!Array.isArray(roleIds) || roleIds.length === 0) {
      return res.status(400).json({ message: 'Vous devez fournir au moins un rôle' });
    }

    const show = await Show.findById(showId);
    if (!show) {
      return res.status(404).json({ message: 'Le spectacle n\'existe pas' });
    }

    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }

    const createdApplications = [];
    const skippedApplications = [];
    const errors = [];

    for (const roleId of roleIds) {
      try {
        const role = await Role.findById(roleId);
        if (!role) {
          errors.push({ roleId, message: 'Le rôle n\'existe pas' });
          continue;
        }

        if (!show.roles.includes(roleId)) {
          errors.push({ roleId: roleId, roleName: role.name, message: 'Ce rôle n\'est pas disponible pour ce spectacle' });
          continue;
        }

        const existingApplication = await ShowApplication.findOne({
          show: showId,
          member: memberId,
          role: roleId
        });

        if (existingApplication) {
          skippedApplications.push({
            roleId: roleId,
            roleName: role.name,
            status: existingApplication.status,
            message: 'Vous avez déjà postulé pour ce rôle'
          });
          continue;
        }

        const application = new ShowApplication({
          show: showId,
          member: memberId,
          role: roleId,
          status: 'pending'
        });

        await application.save();

        createdApplications.push({
          id: application._id,
          roleName: role.name,
          status: application.status,
          appliedAt: application.appliedAt
        });

      } catch (error) {
        errors.push({ roleId, message: error.message });
      }
    }

    if (createdApplications.length > 0) {
      const roleNames = createdApplications.map(app => app.roleName).join(', ');
      await sendApplicationConfirmationEmail(member.mail, {
        memberName: `${member.firstname} ${member.name}`,
        showName: show.name,
        roleName: roleNames
      });
    }

    const response = {
      message: `${createdApplications.length} candidature(s) créée(s) avec succès. Vous recevrez un email à chaque changement de statut.`,
      created: createdApplications,
      skipped: skippedApplications,
      errors: errors
    };

    if (createdApplications.length === 0 && errors.length > 0) {
      return res.status(400).json(response);
    }

    res.status(201).json(response);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

exports.processApplication = async (req, res, next) => {
  try {
    const applicationId = req.params.applicationId;
    const { status, notes } = req.body;
    const managerId = req.user.userId;

    // Vérifier que le statut est valide
    if (!['accepted', 'refused'].includes(status)) {
      return res.status(400).json({ message: 'Le statut doit être "accepted" ou "refused"' });
    }

    // Récupérer la candidature
    const application = await ShowApplication.findById(applicationId)
      .populate('show')
      .populate('member')
      .populate('role');

    if (!application) {
      return res.status(404).json({ message: 'La candidature n\'existe pas' });
    }

    // Vérifier que la candidature est en attente
    if (application.status !== 'pending') {
      return res.status(400).json({
        message: `Cette candidature a déjà été traitée (statut: ${application.status})`,
        currentStatus: application.status
      });
    }

    // Mettre à jour la candidature
    application.status = status;
    application.processedAt = new Date();
    application.processedBy = managerId;
    if (notes) {
      application.notes = notes;
    }

    await application.save();

    // Envoyer l'email de notification au membre
    await sendApplicationStatusEmail(application.member.mail, {
      memberName: `${application.member.firstname} ${application.member.name}`,
      showName: application.show.name,
      roleName: application.role.name,
      showDate: application.show.dateTimeStart,
      status: status,
      notes: notes
    });

    res.status(200).json({
      message: `Candidature ${status === 'accepted' ? 'acceptée' : 'refusée'} avec succès`,
      application: {
        id: application._id,
        member: `${application.member.firstname} ${application.member.name}`,
        show: application.show.name,
        role: application.role.name,
        status: application.status,
        processedAt: application.processedAt,
        notes: application.notes
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}