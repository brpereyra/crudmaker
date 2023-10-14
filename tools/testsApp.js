const express = require('express')
const superTest = require('supertest')

function getApp(routes) {
  const app = express()
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  routes.forEach((element) => {
    app.use(element.path, element.router)
  })

  return superTest(app)
}

exports.getApp = getApp
