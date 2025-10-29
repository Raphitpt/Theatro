require('dotenv').config();
const { Resend } = require('resend');

const resendInst = new Resend(process.env.RESEND_API_KEY);

const sendWelcomeEmail = async (email, resetPasswordToken) => {
  try {
    const result = await resendInst.emails.send({
      from: 'Theatro <theatro@rtiphonet.fr>',
      to: email,
      subject: 'Choisissez votre mot de passe dès maintenant',
      html: `
        <h2>Bienvenue !</h2>
        <p>Cliquez sur le lien ci-dessous pour choisir votre mot de passe :</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/choose-password?key=${resetPasswordToken}&mail=${encodeURIComponent(email)}">
          Choisir mon mot de passe
        </a>
        <p>Ce lien expire dans 1 heure.</p>
      `,
    });
    return { success: true, result };
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de bienvenue:', error);
    return { success: false, error };
  }
};

const sendShowNotificationEmail = async (email, show) => {
  try {
    const result = await resendInst.emails.send({
      from: 'Theatro <theatro@rtiphonet.fr>',
      to: email,
      subject: `Nouveau spectacle : ${show.name}`,
      html: `
        <h2>Un nouveau spectacle est disponible !</h2>
        <p><strong>${show.name}</strong></p>
        <p><strong>Date :</strong> ${new Date(show.dateTimeStart).toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
        <p><strong>Lieu :</strong> ${show.location}</p>
        <p><strong>Places disponibles :</strong> ${show.memberMax}</p>
        <p>Inscrivez-vous dès maintenant pour participer !</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/show/${show._id}/apply">
          Voir le spectacle et s'inscrire
        </a>
      `,
    });
    return { success: true, result };
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de notification:', error);
    return { success: false, error };
  }
};


/**
 * Envoie un email de confirmation de candidature
 */
const sendApplicationConfirmationEmail = async (email, applicationData) => {
  try {
    const result = await resendInst.emails.send({
      from: 'Theatro <theatro@rtiphonet.fr>',
      to: email,
      subject: `Candidature envoyée : ${applicationData.showName}`,
      html: `
        <h2>Votre candidature a été envoyée !</h2>
        <p>Bonjour ${applicationData.memberName},</p>
        <p>Nous avons bien reçu votre candidature pour le spectacle <strong>${applicationData.showName}</strong>.</p>
        <p><strong>Rôle demandé :</strong> ${applicationData.roleName}</p>
        <p><strong>Statut :</strong> En attente de validation</p>
        <p>Vous recevrez un email dès que votre candidature sera traitée par un manager.</p>
        <p><em>Vous recevrez un email à chaque changement de statut de votre candidature.</em></p>
      `,
    });
    return { success: true, result };
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de confirmation:', error);
    return { success: false, error };
  }
};

/**
 * Envoie un email de changement de statut de candidature
 */
const sendApplicationStatusEmail = async (email, statusData) => {
  const statusMessages = {
    accepted: {
      title: 'Félicitations ! Votre candidature a été acceptée',
      message: `Votre candidature pour le rôle de <strong>${statusData.roleName}</strong> dans le spectacle <strong>${statusData.showName}</strong> a été acceptée !`,
      color: '#4CAF50'
    },
    refused: {
      title: 'Candidature refusée',
      message: `Malheureusement, votre candidature pour le rôle de <strong>${statusData.roleName}</strong> dans le spectacle <strong>${statusData.showName}</strong> n'a pas été retenue.`,
      color: '#f44336'
    }
  };

  const status = statusMessages[statusData.status];

  try {
    const result = await resendInst.emails.send({
      from: 'Theatro <theatro@rtiphonet.fr>',
      to: email,
      subject: `${statusData.status === 'accepted' ? '✅' : '❌'} ${statusData.showName} - ${statusData.roleName}`,
      html: `
        <div style="border-left: 4px solid ${status.color}; padding-left: 20px;">
          <h2>${status.title}</h2>
          <p>Bonjour ${statusData.memberName},</p>
          <p>${status.message}</p>
          <p><strong>Spectacle :</strong> ${statusData.showName}</p>
          <p><strong>Rôle :</strong> ${statusData.roleName}</p>
          <p><strong>Date du spectacle :</strong> ${new Date(statusData.showDate).toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
          ${statusData.notes ? `<p><strong>Note du manager :</strong> ${statusData.notes}</p>` : ''}
          ${statusData.status === 'accepted' ?
            `<p>Rendez-vous le jour du spectacle ! Plus de détails vous seront communiqués prochainement.</p>` :
            `<p>N'hésitez pas à postuler pour d'autres spectacles !</p>`
          }
        </div>
      `,
    });
    return { success: true, result };
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de statut:', error);
    return { success: false, error };
  }
};

const sendBulkEmails = async (members, emailFunction, data) => {
  const emailPromises = members.map(member => emailFunction(member.mail, data));

  try {
    const results = await Promise.allSettled(emailPromises);
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.filter(r => r.status === 'rejected' || !r.value.success).length;

    console.log(`Emails envoyés: ${successful} réussis, ${failed} échoués sur ${members.length} total`);

    return { successful, failed, total: members.length };
  } catch (error) {
    console.error('Erreur lors de l\'envoi en masse:', error);
    return { successful: 0, failed: members.length, total: members.length, error };
  }
};

module.exports = {
  sendWelcomeEmail,
  sendShowNotificationEmail,
  sendApplicationConfirmationEmail,
  sendApplicationStatusEmail,
  sendBulkEmails
};