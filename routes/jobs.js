'use strict';

/** Routes for companies. */

const jsonschema = require('jsonschema');
const express = require('express');

const { BadRequestError, BadFilterRequestError } = require('../expressError');
const {
    ensureLoggedIn,
    ensureAdminLoggedIn,
    ensureAdminOrUserLoggedIn,
} = require('../middleware/auth');
const Company = require('../models/company');
const Job = require('../models/job');

const companyNewSchema = require('../schemas/companyNew.json');
const companyUpdateSchema = require('../schemas/companyUpdate.json');
const jobNewSchema = require('../schemas/jobNew.json');
const jobUpdateSchema = require('../schemas/jobUpdate.json');
const db = require('../db');

const router = new express.Router();

// ****************** Routes

/** POST / {job} => {job}
 *
 * job should be {title, salary, equity, companyHandle}
 *
 * Returns {id, title, salary, equity, companyHandle}
 *
 * Authorization required: Admin logged in.
 */
router.post('/', ensureAdminLoggedIn, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, jobNewSchema);
        if (!validator.valid) {
            const errs = validator.errors.map((e) => e.stack);
            throw new BadRequestError(errs);
        }

        const job = await Job.create(req.body);
        return res.status(201).json({ job });
    } catch (err) {
        return next(err);
    }
});

/** GET / => {jobs: [{title, salary, equity, companyHandle}]}
 *
 *
 * Authorization require: None.
 */
router.get('/', async function (req, res, next) {
    try {
        let jobs = await Job.findAll();
        return res.json({ jobs: jobs });
    } catch (err) {
        return next(err);
    }
});

/** GET /[id] => {job}
 *
 * Job is {id, title, salary, equity, companyHandle}
 *
 * Authorization required: None.
 */
router.get('/:id', async function (req, res, next) {
    try {
        const job = await Job.get(req.params.id);
        return res.json({ job });
    } catch (err) {
        return next(err);
    }
});

/** PATCH /[id] {optional params: title, salary, equity} => {job}
 *
 * Patches job data.
 *
 * Returns: {id, title, salary, equity, companyHandle}
 *
 * Authorization required: Admin must be logged in.
 */
router.patch('/:id', ensureAdminLoggedIn, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, jobUpdateSchema);
        if (!validator.valid) {
            const errs = validator.errors.map((e) => e.stack);
            throw new BadRequestError(errs);
        }

        const job = await Job.update(req.params.id, req.body);
        return res.json({ job });
    } catch (err) {
        return next(err);
    }
});

/** DELETE /[id] => {deleted: Job with id of: id}
 *
 * Authorization required: Admin must be logged in.
 */
router.delete('/:id', ensureAdminLoggedIn, async function (req, res, next) {
    try {
        await Job.remove(req.params.id);
        return res.json({ deleted: `Job with id of: ${req.params.id}` });
    } catch (err) {
        return next(err);
    }
});
// ****************** Exports

module.exports = router;
