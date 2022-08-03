'use strict';

/** Routes for users. */

const jsonschema = require('jsonschema');

const express = require('express');
const {
    ensureLoggedIn,
    ensureAdminLoggedIn,
    ensureAdminOrUserLoggedIn,
} = require('../middleware/auth');
const { BadRequestError, UnauthorizedError } = require('../expressError');
const User = require('../models/user');
const { createToken } = require('../helpers/tokens');
const userNewSchema = require('../schemas/userNew.json');
const userUpdateSchema = require('../schemas/userUpdate.json');
const jwt = require('jsonwebtoken');
const { decode } = require('jsonwebtoken');

const router = express.Router();

/** POST / { user }  => { user, token }
 *
 * Adds a new user. This is not the registration endpoint --- instead, this is
 * only for admin users to add new users. The new user being added can be an
 * admin.
 *
 * This returns the newly created user and an authentication token for them:
 *  {user: { username, firstName, lastName, email, isAdmin }, token }
 *
 * Authorization required: login
 **/

router.post('/', ensureAdminLoggedIn, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, userNewSchema);
        if (!validator.valid) {
            const errs = validator.errors.map((e) => e.stack);
            throw new BadRequestError(errs);
        }

        const user = await User.register(req.body);
        const token = createToken(user);
        return res.status(201).json({ user, token });
    } catch (err) {
        return next(err);
    }
});

/** GET / => { users: [ {username, firstName, lastName, email }, ... ] }
 *
 * Returns list of all users.
 *
 * Authorization required: login
 **/

router.get('/', ensureAdminLoggedIn, async function (req, res, next) {
    try {
        const users = await User.findAll();
        return res.json({ users });
    } catch (err) {
        return next(err);
    }
});

/** GET /[username] => { user }
 *
 * Returns { username, firstName, lastName, isAdmin }
 *
 * Authorization required: login
 **/

router.get('/:username', ensureLoggedIn, async function (req, res, next) {
    try {
        const token = req.headers.authorization;
        const decoded = jwt.decode(token);
        const user = await User.get(req.params.username);
        console.log(token);
        console.log(decoded);
        console.log(req.params);
        if (
            decoded.username === req.params.username ||
            decoded.isAdmin === true
        ) {
            return res.json({ user });
        }
        throw new UnauthorizedError();
    } catch (err) {
        return next(err);
    }
});

/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *   { firstName, lastName, password, email }
 *
 * Returns { username, firstName, lastName, email, isAdmin }
 *
 * Authorization required: login
 **/

router.patch('/:username', ensureLoggedIn, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, userUpdateSchema);
        if (!validator.valid) {
            const errs = validator.errors.map((e) => e.stack);
            throw new BadRequestError(errs);
        }
        const token = req.headers.authorization;
        const decoded = jwt.decode(token);
        const user = await User.update(req.params.username, req.body);
        if (
            decoded.username === req.params.username ||
            decoded.isAdmin === true
        ) {
            return res.json({ user });
        }
        throw new UnauthorizedError();
    } catch (err) {
        return next(err);
    }
});

/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: login
 **/

router.delete('/:username', ensureLoggedIn, async function (req, res, next) {
    try {
        const token = req.headers.authorization;
        const decoded = jwt.decode(token);
        if (
            decoded.username === req.params.username ||
            decoded.isAdmin === true
        ) {
            await User.remove(req.params.username);
            return res.json({ deleted: req.params.username });
        }
        throw new UnauthorizedError();
    } catch (err) {
        return next(err);
    }
});

module.exports = router;
