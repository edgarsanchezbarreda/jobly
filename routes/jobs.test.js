'use strict';

const request = require('supertest');

const db = require('../db');
const app = require('../app');

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    u1Token,
    u2Token,
} = require('./_testCommon');

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe('POST /jobs', function () {
    const newJob = {
        title: 'newJob',
        salary: 100000,
        equity: '0',
        companyHandle: 'c1',
    };

    test('ok for users', async function () {
        const resp = await request(app)
            .post('/jobs')
            .send(newJob)
            .set('authorization', `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            job: {
                id: expect.any(Number),
                title: 'newJob',
                salary: 100000,
                equity: '0',
                companyHandle: 'c1',
            },
        });
    });

    test('Bad request with missing data', async function () {
        const resp = await request(app)
            .post('/jobs')
            .send({
                title: 'manager',
            })
            .set('authorization', `Bearer ${u2Token}`);

        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** GET /jobs */

describe('GET /jobs', function () {
    test('OK for anon users', async function () {
        const resp = await request(app).get('/jobs');
        console.log(resp.body);
        expect(resp.body).toEqual({
            jobs: [
                {
                    title: 'Mailman',
                    salary: 35000,
                    equity: '0',
                    companyHandle: 'c1',
                },
            ],
        });
    });
});

/************************************** GET /jobs/:id */

describe('GET /jobs/:id', function () {
    const newJob = {
        title: 'newJob',
        salary: 100000,
        equity: '0',
        companyHandle: 'c1',
    };
    test('Works for anon users.', async function () {
        const job = await request(app)
            .post('/jobs')
            .send(newJob)
            .set('authorization', `Bearer ${u2Token}`);

        const resp = await request(app).get(`/jobs/${job.body.job.id}`);
        expect(resp.body).toEqual({
            job: {
                id: job.body.job.id,
                title: 'newJob',
                salary: 100000,
                equity: '0',
                companyHandle: 'c1',
            },
        });
    });

    test('Throws error for job that is not found', async function () {
        const resp = await request(app).get(`/jobs/0`);
        expect(resp.statusCode).toEqual(404);
    });
});

/************************************** PATCH /jobs/:id */

describe('PATCH /jobs/:id', function () {
    test('Works for admins', async function () {
        const job = await db.query(
            `SELECT * FROM jobs
			WHERE title = 'Mailman'
			`
        );

        const resp = await request(app)
            .patch(`/jobs/${job.rows[0].id}`)
            .send({
                salary: 40000,
            })
            .set('authorization', `${u2Token}`);

        expect(resp.body).toEqual({
            job: {
                id: job.rows[0].id,
                title: 'Mailman',
                salary: 40000,
                equity: '0',
                companyHandle: 'c1',
            },
        });
    });

    test('Unauth for anon users', async function () {
        const job = await db.query(
            `SELECT * FROM jobs
			WHERE title = 'Mailman'
			`
        );
        const resp = await request(app).patch(`/jobs/${job.rows[0].id}`);
        expect(resp.statusCode).toEqual(401);
    });

    test('Throws error if job not found', async function () {
        const resp = await request(app)
            .patch(`/jobs/0`)
            .send({
                salary: 1000000,
            })
            .set('authorization', `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(404);
    });

    test('Bad request on companyHandle change attempt', async function () {
        const job = await db.query(
            `SELECT * FROM jobs
			WHERE title = 'Mailman'
			`
        );
        const resp = await request(app)
            .patch(`/jobs/${job.rows[0].id}`)
            .send({
                companyHandle: 'c2',
            })
            .set('authorization', `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** DELETE /jobs/:id */

describe('DELETE /jobs/:id', function () {
    test('Works for Admins', async function () {
        const job = await db.query(
            `SELECT * FROM jobs
			WHERE title = 'Mailman'
			`
        );
        const jobId = job.rows[0].id;
        const resp = await request(app)
            .delete(`/jobs/${jobId}`)
            .set('authorization', `Bearer ${u2Token}`);
        expect(resp.body).toEqual({ deleted: `Job with id of: ${jobId}` });
    });

    test('Unauth for anon', async function () {
        const job = await db.query(
            `SELECT * FROM jobs
			WHERE title = 'Mailman'
			`
        );
        const jobId = job.rows[0].id;
        const resp = await request(app).delete(`/jobs/${jobId}`);
        expect(resp.statusCode).toEqual(401);
    });

    test('Throws error if job not found', async function () {
        const resp = await request(app)
            .delete(`/jobs/0`)
            .set('authorization', `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(404);
    });
});
