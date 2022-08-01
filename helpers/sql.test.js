const { sqlForPartialUpdate } = require('./sql');
const { BadRequestError } = require('../expressError');

// *************************************************

describe('sqlForPartialUpdate', function () {
    test('Returns setCols with parameterized queries and values with updated values.', function () {
        const data = { firstName: 'NewFirst', lastName: 'NewLast' };
        const sqlConversion = {
            firstName: 'first_name',
            lastName: 'last_name',
        };

        const result = sqlForPartialUpdate(data, sqlConversion);
        expect(result).toEqual({
            setCols: '"first_name"=$1, "last_name"=$2',
            values: ['NewFirst', 'NewLast'],
        });
    });
});
