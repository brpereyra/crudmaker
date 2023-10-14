const { Schema, model, Types } = require('mongoose')

const userModel = model(
  'userTest',
  new Schema(
    {
      name: String,
      age: Number,
      email: String,
      password: String,
      status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
      },
    },
    {
      timestamps: true,
    }
  )
)

module.exports = userModel
