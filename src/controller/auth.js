require('dotenv').config();
const Member = require('../models/Member');
const bcrypt = require('bcryptjs');
const { Resend } = require('resend');
const jwt = require('jsonwebtoken');

const resendInst = new Resend(process.env.RESEND_API_KEY);

exports.register = (req, res, next) => {
  Member
    .findOne({ mail: req.body.email })
    .then((user) => {
      if (user) {
        res.status(400).json({ message: 'Un utilisateur avec cet email existe déjà !' });
      } else {
        const member = new Member({
          name: req.body.name,
          firstname: req.body.firstname,
          mail: req.body.mail,
          resetPasswordToken: require('crypto').randomBytes(32).toString('hex'),
        });
        member
          .save()
          .then(() => {
            resendInst.emails.send({
              from: 'onboarding@resend.dev',
              to: req.body.mail,
              subject: 'Choisissez votre mot de passe dès maintenant',
              html: `
                  <h2>Bienvenue !</h2>
                  <p>Cliquez sur le lien ci-dessous pour choisir votre mot de passe :</p>
                  <a href="${process.env.FRONTEND_URL ||
              'http://localhost:3000'}/choose-password?key=${member.resetPasswordToken}&mail=${encodeURIComponent(
                req.body.mail)}">
                    Choisir mon mot de passe
                  </a>
                  <p>Ce lien expire dans 1 heure.</p>
                `,
            });
            res.status(201).json({ message: 'L\'utilisateur a été crée et son mail à été envoyé' });
          })
          .catch((error) => {res.status(500).json({ error });});
      }
    });
};

exports.login = (req, res, next) => {
  Member
    .findOne({ mail: req.body.mail })
    .then((member) => {
      if (!member) {
        return res.status(400).json({ message: 'Email/Mot de passe incorrect' });
      }
      if (!member.password) {
        return res.status(400).json({ message: 'Veuillez d\'abord définir votre mot de passe via le lien reçu par email' });
      }
      bcrypt
        .compare(req.body.password, member.password)
        .then((valid) => {
          if (!valid) {
            return res.status(400).json({ message: 'Email/Mot de passe incorrect' });
          }
          const responseData = {
            userId: member._id,
            token: jwt.sign({ userId: member._id, role: member.toObject().role }, process.env.RANDOM_PRIVATE_KEY, { expiresIn: '24h' }),
          };
          res.status(200).json(responseData);
        })
        .catch((error) => {
          res.status(500).json({ error: error.message });
        });
    })
    .catch((error) => {
      res.status(500).json({ error: error.message });
    });
};

exports.choosePassword = (req, res, next) => {
  Member
    .findOne({ mail: req.query.mail })
    .then((member) => {
      if (!member) {
        return res.status(400).json({ message: "Votre compte n'existe pas, contacter votre administrateur" });
      }
      if (member.resetPasswordToken !== req.query.key) {
        return res.status(400).json({ message: "Votre token n'est plus valide, contacter votre administrateur" });
      }

      bcrypt.hash(req.body.password, 10)
        .then((hash) => {
          member.password = hash;
          member.resetPasswordToken = undefined;

          return member.save();
        })
        .then(() => {
          res.status(200).json({ message: "Votre mot de passe a été défini avec succès. Vous pouvez maintenant vous connecter." });
        })
        .catch((error) => {
          res.status(500).json({ error: error.message });
        });
    })
    .catch((error) => {
      res.status(500).json({ error: error.message });
    });
};