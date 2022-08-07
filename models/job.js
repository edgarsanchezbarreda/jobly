'use strict';

const { JsonWebTokenError } = require('jsonwebtoken');
const db = require('../db');

const {
    BadRequestError,
    NotFoundError,
    BadFilterRequestError,
} = require('../expressError');
const { sqlForPartialUpdate } = require('../helpers/sql');

// ***************

class Job {
    /** Create a job (from data), update db, return new job data.
     *
     * data should be { title, salary, equity, companyHandle }
     *
     * Returns { title, salary, equity, companyHandle }
     *
     * Throws BadRequestError if job already in database.
     * */
    static async create({ title, salary, equity, companyHandle }) {
        const duplicateCheck = await db.query(
            `SELECT title 
			FROM jobs 
			WHERE title = $1
			AND company_handle = $2
			`,
            [title, companyHandle]
        );

        if (duplicateCheck.rows[0]) {
            throw new BadRequestError(`Duplicate job: ${title}`);
        }
        const result = await db.query(
            `INSERT INTO jobs
			(title, salary, equity, company_handle)
			VALUES ($1, $2, $3, $4)
			RETURNING id, title, salary, equity, company_handle AS "companyHandle"
			`,
            [title, salary, equity, companyHandle]
        );
        const job = result.rows[0];
        return job;
    }

    /** Finds all jobs.
     *
     * Returns [{title, salary, equity, companyHandle}, ...]
     *
     */
    static async findAll() {
        const jobsRes = await db.query(
            `SELECT title, salary, equity, company_handle AS "companyHandle"
			FROM jobs
			ORDER BY title
			`
        );
        return jobsRes.rows;
    }

    /**
     *
     * Given a job id, returns data about specific job.
     *
     * Returns {id, title, salary, equity, companyHandle}
     *
     * Throws NotFoundError if not found.
     */

    static async get(id) {
        const jobRes = await db.query(
            `SELECT id, title, salary, equity, company_handle AS "companyHandle"
			FROM jobs
			WHERE id = $1
			`,
            [id]
        );

        const job = jobRes.rows[0];

        if (!job) throw new NotFoundError(`No job: ${title}`);

        return job;
    }

    /** Updat job data with `data`
     *
     * This is a "partial updata" --- Update only changes provided fields and does not require all field.
     *
     *
     * Data can include: {title, salary, equity}
     *
     * Returns {id, title, salary, equity, companyHandle}
     *
     * Throw NotFoundError if not found.
     *
     */

    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(data, {
            companyHandle: 'company_handle',
        });
        if ('companyHandle' in data || 'id' in data) {
            throw new BadRequestError(`Cannot update id or companyHandle`);
        }
        const idVarIdx = '$' + (values.length + 1);

        const querySql = `UPDATE jobs
		SET ${setCols}
		WHERE id = ${idVarIdx}
		RETURNING id, title, salary, equity, company_handle AS "companyHandle"
		`;
        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job with id of: ${id}`);

        return job;
    }

    /** Delete a given job from database. Returns undefined.
     *
     * Throw NotFoundError if job not found.
     *
     */
    static async remove(id) {
        const result = await db.query(
            `DELETE FROM jobs
			WHERE id = $1
			RETURNING id
			`,
            [id]
        );
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job with id of: ${id}`);
    }
}

module.exports = Job;
