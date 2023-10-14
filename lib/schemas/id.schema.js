const Joi = require('joi')

exports.idSchema = Joi.object({
  id: Joi.string().required().hex().length(24),
})
