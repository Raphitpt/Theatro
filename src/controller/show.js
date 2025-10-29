const ShowApplication = require('../models/ShowApplication');
const Show = require('../models/Show');
const Role = require('../models/Role');
const Member = require('../models/Member');
const { sendApplicationConfirmationEmail, sendApplicationStatusEmail } = require('../services/emailService');

exports.getShow = async (req, res, next) => {
  try {
    const { showId } = req.params;

    const show = await Show.findById(showId).populate('roles');

    if (!show) {
      return res.status(404).json({ message: 'Spectacle non trouvé' });
    }

    const applications = await ShowApplication.find({ show: showId })
      .populate('member', 'name firstname mail')
      .populate('role', 'name')
      .populate('processedBy', 'name firstname');

    const applicationsGroupedByRole = {};
    show.roles.forEach(role => {
      applicationsGroupedByRole[role._id] = {
        role: {
          id: role._id,
          name: role.name
        },
        applications: [],
        stats: {
          total: 0,
          pending: 0,
          accepted: 0,
          refused: 0
        }
      };
    });

    applications.forEach(app => {
      if (applicationsGroupedByRole[app.role._id]) {
        applicationsGroupedByRole[app.role._id].applications.push({
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

        applicationsGroupedByRole[app.role._id].stats.total++;
        applicationsGroupedByRole[app.role._id].stats[app.status]++;
      }
    });

    res.status(200).json({
      message: 'Spectacle récupéré avec succès',
      show: {
        id: show._id,
        name: show.name,
        dateTimeStart: show.dateTimeStart,
        dateTimeEnd: show.dateTimeEnd,
        location: show.location,
        memberMax: show.memberMax,
        hasFollowUp: show.hasFollowUp,
        roles: Object.values(applicationsGroupedByRole)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

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

