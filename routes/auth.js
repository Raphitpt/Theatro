const express = require('express');
const router = express.Router();
const AuthController = require('../src/controller/auth');
const AdminMiddleware = require('../src/middleware/admin');

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Gestion de l'authentification
 */

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Connexion d'un utilisateur
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mail
 *               - password
 *             properties:
 *               mail:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: motdepasse123
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                   description: ID de l'utilisateur
 *                 token:
 *                   type: string
 *                   description: Token JWT
 *       400:
 *         description: Email ou mot de passe incorrect
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', AuthController.login);

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Inscription d'un nouvel utilisateur (Admin uniquement)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - firstname
 *               - mail
 *             properties:
 *               name:
 *                 type: string
 *                 example: Dupont
 *               firstname:
 *                 type: string
 *                 example: Jean
 *               mail:
 *                 type: string
 *                 format: email
 *                 example: jean.dupont@example.com
 *               role:
 *                 type: string
 *                 enum: [Member, Manager]
 *                 example: Member
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: L'utilisateur a été créé et son mail a été envoyé
 *       400:
 *         description: Un utilisateur avec cet email existe déjà
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Accès refusé - Droits administrateur requis
 */
router.post('/register', AdminMiddleware, AuthController.register);

/**
 * @swagger
 * /choose-password:
 *   patch:
 *     summary: Définir son mot de passe via le lien reçu par email
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: mail
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Email de l'utilisateur
 *       - in: query
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Token de réinitialisation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 example: nouveaumotdepasse123
 *     responses:
 *       200:
 *         description: Mot de passe défini avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Votre mot de passe a été défini avec succès
 *       400:
 *         description: Token invalide ou compte inexistant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/choose-password', AuthController.choosePassword);


module.exports = router;