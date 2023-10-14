const mongoose = require('mongoose')

/**
 * Connects to a MongoDB database using the MONGO_URI environment variable.
 * @function
 * @returns {Promise<void>} - A Promise that resolves when the connection is successful.
 * @throws {Error} - If the connection fails, an error is thrown and the process exits with code 1.
 */
async function connect() {
  try {
    const connect = await mongoose.connect('mongodb://127.0.0.1/testsDB', {
      useNewUrlParser: true,
    })
  } catch (error) {
    console.log(error)
    process.exit(1)
  }
}

function disconnect() {
  return mongoose.disconnect()
}

exports.connect = connect
exports.disconnect = disconnect
