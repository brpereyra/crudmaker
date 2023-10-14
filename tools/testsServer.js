const { connect } = require('./mongo')

async function initTestsServer() {
  try {
    await connect()
    console.log('MongoDB connected')
  } catch (error) {
    console.log(error)
    process.exit(1)
  }
}

exports.initTestsServer = initTestsServer
