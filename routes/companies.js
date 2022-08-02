'use strict';

/** Routes for companies. */

const jsonschema = require('jsonschema');
const express = require('express');

const { BadRequestError } = require('../expressError');
const { ensureLoggedIn } = require('../middleware/auth');
const Company = require('../models/company');

const companyNewSchema = require('../schemas/companyNew.json');
const companyUpdateSchema = require('../schemas/companyUpdate.json');

const router = new express.Router();

/** POST / { company } =>  { company }
 *
 * company should be { handle, name, description, numEmployees, logoUrl }
 *
 * Returns { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: login
 */
const method1 = (arr) => [
    ...new Set(arr.filter((elm) => arr.indexOf(elm) !== arr.lastIndexOf(elm))),
];
router.post('/', ensureLoggedIn, async function (req, res, next) {
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
        const name = req.query.name.length > 0 ? req.query.name : [];
        const minEmployees =
            req.query.minEmployees > 0 ? req.query.minEmployees : [];
        const maxEmployees =
            req.query.maxEmployees > 0 ? req.query.maxEmployees : [];

        const companies = await Company.findByName(name);
        console.log(companies);
        return res.json({ hope: 'lets see' });
    } catch (err) {
        return next(err);
    }
});
// router.get('/', async function (req, res, next) {
//     // const names = ['Edgar', 'Jon', 'Eddard', 'Tyrion', 'Teddy']

//     // const ed = names.filter(name => name.toLowerCase().includes('ed'))

//     // console.log(req.query.name);
//     try {
//         // let array1 = ['a','b','c']
//         // let array2 = ['c','c','d','e'];
//         // let array3 = array1.concat(array2);
//         // array3 = [...new Set([...array1,...array2])]
//         // const name = req.query.name;
//         // const minEmployees = req.query.minEmployees;
//         // const maxEmployees = req.query.maxEmployees;

//         // const sss = fruits.filter(f => some.includes(f))l
//         const name = typeof req.query.name.length > 0 ? req.query.name : [];
//         const minEmployees =
//             req.query.minEmployees > 0 ? req.query.minEmployees : [];
//         const maxEmployees =
//             req.query.maxEmployees > 0 ? req.query.maxEmployees : [];

//         const companies = await Company.findAll();
//         const nameFilteredCompanies = await companies.filter((comp) =>
//             comp.name.toLowerCase().includes(name)
//         );
//         const minFilteredCompanies = await companies.filter(
//             (comp) => comp.numEmployees >= minEmployees
//         );
//         const maxFilteredCompanies = await companies.filter(
//             (comp) => comp.numEmployees <= maxEmployees
//         );
//         // const filteredCompanies = [
//         //     ...new Set([
//         //         ...nameFilteredCompanies,
//         //         ...minFilteredCompanies,
//         //         ...maxFilteredCompanies,
//         //     ]),
//         // ];
//         let filteredCompanies = [
//             ...nameFilteredCompanies,
//             ...minFilteredCompanies,
//             ...maxFilteredCompanies,
//         ];
//         // filteredCompanies = nameFilteredCompanies.filter((name) => {
//         //     return (
//         //         nameFilteredCompanies.includes(name) &&
//         //         minFilteredCompanies.includes(name) &&
//         //         maxFilteredCompanies.includes(name)
//         //     );
//         // });
//         const newArr = method1(filteredCompanies);

//         console.log(req.query);
//         // console.log(newArr);
//         // if (filteredCompanies.length > 0) {
//         //     return res.json({ companies: filteredCompanies });
//         // }
//         return res.json({ hope: 'lets see' });
//     } catch (err) {
//         return next(err);
//     }
// });

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
        return res.json({ company });
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

router.patch('/:handle', ensureLoggedIn, async function (req, res, next) {
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

router.delete('/:handle', ensureLoggedIn, async function (req, res, next) {
    try {
        await Company.remove(req.params.handle);
        return res.json({ deleted: req.params.handle });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;
