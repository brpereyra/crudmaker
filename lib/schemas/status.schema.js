const Joi = require('joi')

exports.statusSchema = Joi.object({
  status: Joi.string().valid('active', 'inactive').required(),
})
