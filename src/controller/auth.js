require('dotenv').config();
const Member = require('../models/Member');
const Manager = require('../models/Manager')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendWelcomeEmail } = require('../services/emailService');

exports.register = (req, res, next) => {
  Member
    .findOne({ mail: req.body.email })
    .then((user) => {
      if (user) {
        res.status(400).json({ message: 'Un utilisateur avec cet email existe déjà !' });
      } else {
        const memberData = {
          name: req.body.name,
          firstname: req.body.firstname,
          mail: req.body.mail,
          resetPasswordToken: require('crypto').randomBytes(32).toString('hex'),
        };
        const member = req.body.role === 'Manager' ? new Manager(memberData) : new Member(memberData);
        member
          .save()
          .then(async () => {
            const emailResult = await sendWelcomeEmail(req.body.mail, member.resetPasswordToken);

            if (emailResult.success) {
              res.status(201).json({ message: 'L\'utilisateur a été créé et son mail a été envoyé' });
            } else {
              res.status(201).json({
                message: 'L\'utilisateur a été créé mais l\'envoi de l\'email a échoué',
                warning: 'Veuillez réessayer l\'envoi de l\'email'
              });
            }
          })
          .catch((error) => {
            res.status(500).json({ error: error.message });
          });
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