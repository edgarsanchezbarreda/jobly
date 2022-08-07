'use strict';

const db = require('../db.js');
const { BadRequestError, NotFoundError } = require('../expressError');
const Company = require('./company.js');
const Job = require('./job.js');
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
} = require('./_testCommon');

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe('create', function () {
    const newCompany = {
        handle: 'new',
        name: 'New',
        description: 'New Description',
        numEmployees: 1,
        logoUrl: 'http://new.img',
    };

    const newJob = {
        title: 'software engineer',
        salary: 80000,
        equity: '0',
        companyHandle: 'new',
    };

    test('works', async function () {
        let company = await Company.create(newCompany);
        let job = await Job.create(newJob);

        // expect(job).toEqual(newJob);

        const result = await db.query(
            `SELECT title, salary, equity, company_handle
			FROM jobs
			WHERE title = 'software engineer'
			`
        );

        expect(result.rows).toEqual([
            {
                title: 'software engineer',
                salary: 80000,
                equity: '0',
                company_handle: 'new',
            },
        ]);
    });

    test('bad request with duplicate job', async function () {
        try {
            await Company.create(newCompany);
            await Job.create(newJob);
            await Job.create(newJob);
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

/************************************** findAll */

describe('findAll', function () {
    const newCompany = {
        handle: 'new',
        name: 'New',
        description: 'New Description',
        numEmployees: 1,
        logoUrl: 'http://new.img',
    };

    const newJob1 = {
        title: 'software engineer',
        salary: 80000,
        equity: '0',
        companyHandle: 'new',
    };
    const newJob2 = {
        title: 'designer',
        salary: 90000,
        equity: '0',
        companyHandle: 'new',
    };
    test('works', async function () {
        let company = await Company.create(newCompany);
        let job1 = await Job.create(newJob1);
        let job2 = await Job.create(newJob2);
        let jobs = await Job.findAll();
        expect(jobs).toEqual([
            {
                title: 'designer',
                salary: 90000,
                equity: '0',
                companyHandle: 'new',
            },
            {
                title: 'software engineer',
                salary: 80000,
                equity: '0',
                companyHandle: 'new',
            },
        ]);
    });
});

/************************************** get */

describe('get', function () {
    const newJob = {
        title: 'software engineer',
        salary: 80000,
        equity: '0',
        companyHandle: 'c1',
    };

    test('works', async function () {
        let job = await Job.create(newJob);
        let jobResult = await Job.get(job.id);
        expect(jobResult).toEqual({
            id: expect.any(Number),
            title: 'software engineer',
            salary: 80000,
            equity: '0',
            companyHandle: 'c1',
        });
    });

    test('not found if no such job', async function () {
        try {
            await Job.get('nope');
            fail();
        } catch (err) {
            expect(err);
        }
    });
});

/************************************** update */

describe('update', function () {
    const newJob = {
        title: 'software engineer',
        salary: 80000,
        equity: '0',
        companyHandle: 'c1',
    };
    const updatedJobData = {
        title: 'software engineer',
        salary: 150000,
        equity: '0',
    };

    test('works', async function () {
        let job = await Job.create(newJob);
        let updatedJob = await Job.update(job.id, updatedJobData);
        expect(updatedJob).toEqual({
            id: updatedJob.id,
            title: 'software engineer',
            salary: 150000,
            equity: '0',
            companyHandle: 'c1',
        });
    });

    test('works: null fields', async function () {
        const newJob2 = {
            title: 'designer',
            salary: 100000,
            equity: '0',
            companyHandle: 'c1',
        };
        const updatedJobData2 = {
            title: 'designer',
            salary: null,
            equity: null,
        };
        let job = await Job.create(newJob2);
        let updatedJob = await Job.update(job.id, updatedJobData2);
        expect(updatedJob).toEqual({
            id: updatedJob.id,
            title: 'designer',
            salary: null,
            equity: null,
            companyHandle: 'c1',
        });
    });

    test('error if no such job or data', async function () {
        try {
            await Job.update('nope', {});
            fail();
        } catch (err) {
            expect(err);
        }
    });
});

/************************************** remove */

describe('remove', function () {
    const newJob = {
        title: 'software engineer',
        salary: 80000,
        equity: '0',
        companyHandle: 'c1',
    };
    test('works', async function () {
        let job = await Job.create(newJob);
        await Job.remove(job.id);
        const res = await db.query(
            "SELECT title FROM jobs WHERE title='software engineer'"
        );
        expect(res.rows.length).toEqual(0);
    });

    test('error if no such job', async function () {
        try {
            await Job.remove('nope');
            fail();
        } catch (err) {
            expect(err);
        }
    });
});
