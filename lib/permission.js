// const { logs } = require('../utils/logs')
const { errorResponse } = require('./response')

/**
 * @description Middleware to validate if the user has the required permissions
 * @param {String} permissions
 */
exports.permissionValidator = (permissions) => (req, res, next) => {
  try {
    if (!permissions) return next()
    const { sp } = req
    if (!sp)
      throw {
        message: 'User not found',
        code: 'user/not-found',
      }
    const { permissions: userPermissions } = sp
    if (userPermissions.includes(permissions)) return next()

    // logs({ req, maker: sp._id, code: 'user/permission-denied' })

    throw {
      message: 'User does not have the necessary permissions',
      code: 'user/permission-denied',
    }
  } catch (error) {
    console.log(error)
    errorResponse(res, error.message, 403, error.code)
  }
}
