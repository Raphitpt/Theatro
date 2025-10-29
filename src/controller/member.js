const Member = require('../models/Member');
const ShowApplication = require('../models/ShowApplication');
const WorkshopApplication = require('../models/WorkshopApplication');

exports.listAllParticipations = async (req, res, next) => {
  try {
    const { memberId } = req.params;

    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({ message: 'Membre non trouvé' });
    }

    const showApplications = await ShowApplication.find({ member: memberId })
      .populate('show', 'name dateTimeStart dateTimeEnd location')
      .populate('role', 'name')
      .populate('processedBy', 'firstname name')
      .sort({ appliedAt: -1 });

    const workshopApplications = await WorkshopApplication.find({ member: memberId })
      .populate('workshop', 'name dateTimeStart dateTimeEnd location')
      .populate('processedBy', 'firstname name')
      .sort({ respondedAt: -1 });

    const showStats = {
      total: showApplications.length,
      pending: showApplications.filter(app => app.status === 'pending').length,
      accepted: showApplications.filter(app => app.status === 'accepted').length,
      refused: showApplications.filter(app => app.status === 'refused').length
    };

    const workshopStats = {
      total: workshopApplications.length,
      available: workshopApplications.filter(app => app.availability === 'available').length,
      unavailable: workshopApplications.filter(app => app.availability === 'unavailable').length,
      pending: workshopApplications.filter(app => app.status === 'pending').length,
      accepted: workshopApplications.filter(app => app.status === 'accepted').length,
      refused: workshopApplications.filter(app => app.status === 'refused').length
    };

    res.status(200).json({
      message: 'Participations du membre récupérées avec succès',
      member: {
        id: member._id,
        name: `${member.firstname} ${member.name}`,
        mail: member.mail,
        communicationChannels: member.communicationChannels
      },
      shows: {
        stats: showStats,
        applications: showApplications.map(app => ({
          id: app._id,
          show: {
            id: app.show._id,
            name: app.show.name,
            dateTimeStart: app.show.dateTimeStart,
            dateTimeEnd: app.show.dateTimeEnd,
            location: app.show.location
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
      },
      workshops: {
        stats: workshopStats,
        applications: workshopApplications.map(app => ({
          id: app._id,
          workshop: {
            id: app.workshop._id,
            name: app.workshop.name,
            dateTimeStart: app.workshop.dateTimeStart,
            dateTimeEnd: app.workshop.dateTimeEnd,
            location: app.workshop.location
          },
          availability: app.availability,
          status: app.status,
          respondedAt: app.respondedAt,
          processedAt: app.processedAt,
          processedBy: app.processedBy ? `${app.processedBy.firstname} ${app.processedBy.name}` : null,
          notes: app.notes
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}