const { crudMaker } = require('../lib/crudMaker')
const { disconnect } = require('../tools/mongo')
const { request, getApp } = require('../tools/testsApp')
const { initTestsServer } = require('../tools/testsServer')

before(function (done) {
  initTestsServer()
    .then(() => {
      done()
    })
    .catch((err) => {
      console.log(err)
      done()
    })
})

after(function (done) {
  disconnect()
    .then(() => {
      done()
    })
    .catch((err) => {
      console.log(err)
      done()
    })
})

describe('CRUD Maker', () => {
  it('should create a user', async () => {})
  const crud = crudMaker({
    model: require('../tools/models/userModel'),
    methods: ['create', 'list'],
  })
  const request = getApp([{ path: '/users', router: crud }])

  it('should create a user', async () => {
    const response = await request
      .post('/users')
      .send({
        name: 'John Doe',
        age: 30,
        email: '',
        password: '',
      })
      .expect(200)
  })

  it('should list users', async () => {
    const response = await request
      .get('/users/list')
      .expect(200)
      .expect('Content-Type', /json/)
  })
})
