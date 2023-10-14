const Joi = require('joi')
const { errorResponse } = require('../response')

/**
 *
 * @param {Joi.Schema} schema
 * @param {'body' | 'params' | 'headers' | 'query'} prop
 */
function validatorHandler(schema, prop = 'body') {
  return (req, res, next) => {
    if (!schema) return next()
    const { error } = schema.validate(req[prop])

    const valid = error == null

    if (valid) return next()

    const { details } = error
    const message = details.map((i) => i.message).join(',')

    console.log('invalid data', message)
    errorResponse(res, message, 422, 'VALIDATION_ERROR')
  }
}

module.exports = { validatorHandler }
