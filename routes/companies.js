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
const db = require('../db');

const router = new express.Router();

/** POST / { company } =>  { company }
 *
 * company should be { handle, name, description, numEmployees, logoUrl }
 *
 * Returns { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: login
 */

router.post('/', ensureAdminLoggedIn, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, companyNewSchema);
        if (!validator.valid) {
            const errs = validator.errors.map((e) => e.stack);
            throw new BadRequestError(errs);
        }

        const company = await Company.create(req.body);
        return res.status(201).json({ company });
    } catch (err) {
        return next(err);
    }
});

/** GET /  =>
 *   { companies: [ { handle, name, description, numEmployees, logoUrl }, ...] }
 *
 * Can filter on provided search filters:
 * - minEmployees
 * - maxEmployees
 * - nameLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

router.get('/', async function (req, res, next) {
    try {
        // Finds the company with the most employees.
        const mostEmployees = await Company.findMaxEmployees();

        // Sets name to the query if present, or an empty string if not present.
        const name = req.query.name ? req.query.name.toLowerCase() : '';

        // Sets minEmployees to amount in query if present, or 0 if not present.
        const minEmployees =
            req.query.minEmployees != null ? req.query.minEmployees : 0;

        // Sets maxEmployees to amount in query if present, or mostEmployees if not present.
        const maxEmployees =
            req.query.maxEmployees > 0
                ? req.query.maxEmployees
                : mostEmployees.numEmployees;

        // Sets companies variable to the list of filtered companies.
        let companies = await Company.findByAllFilters(
            name,
            minEmployees,
            maxEmployees
        );

        return res.json({ companies: companies });
    } catch (err) {
        return next(err);
    }
});

/** GET /[handle]  =>  { company }
 *
 *  Company is { handle, name, description, numEmployees, logoUrl, jobs }
 *   where jobs is [{ id, title, salary, equity }, ...]
 *
 * Authorization required: none
 */

router.get('/:handle', async function (req, res, next) {
    try {
        const company = await Company.get(req.params.handle);
        const jobs = await Job.findByCompany(req.params.handle);
        company.jobs = jobs.map((job) => job);
        return res.json({ company: company });
    } catch (err) {
        return next(err);
    }
});

/** PATCH /[handle] { fld1, fld2, ... } => { company }
 *
 * Patches company data.
 *
 * fields can be: { name, description, numEmployees, logo_url }
 *
 * Returns { handle, name, description, numEmployees, logo_url }
 *
 * Authorization required: login
 */

router.patch('/:handle', ensureAdminLoggedIn, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, companyUpdateSchema);
        if (!validator.valid) {
            const errs = validator.errors.map((e) => e.stack);
            throw new BadRequestError(errs);
        }

        const company = await Company.update(req.params.handle, req.body);
        return res.json({ company });
    } catch (err) {
        return next(err);
    }
});

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: login
 */

router.delete('/:handle', ensureAdminLoggedIn, async function (req, res, next) {
    try {
        await Company.remove(req.params.handle);
        return res.json({ deleted: req.params.handle });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;
