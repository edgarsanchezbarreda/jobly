const { BadRequestError } = require('../expressError');

// THIS NEEDS SOME GREAT DOCUMENTATION.

/** Allows for partial updates to a user's properties.
 *
 * The dataToUpdate parameter consists of the JSON that is included in the body of the request.
 *
 * The dataToUpdate parameter does not require every property of the user, but allows for some
 * or all properties to be updated.
 *
 *
 *
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
    // keys is set to an array of the keys/properties of a user that are included in the request body and are to be updated.
    const keys = Object.keys(dataToUpdate);
    if (keys.length === 0) throw new BadRequestError('No data');

    // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
    // cols is set to an array of strings, where each string contains parameterized query values and their appropriate variable values.
    const cols = keys.map(
        (colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`
    );
    // Returns an object where setCols is a string consisting of the properties and their parameterized query values to be updated.
    // ex: setCols: '"id"=$1, "name"=$2, "type"=$3'

    // And values consists of  the updated value(s)
    // ex:  values: [ 1, 'Juanita', 'admin' ]
    return {
        setCols: cols.join(', '),
        values: Object.values(dataToUpdate),
    };
}

module.exports = { sqlForPartialUpdate };
