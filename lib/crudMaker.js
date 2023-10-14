const express = require('express')
const { validatorHandler } = require('./utils/validator')
const { errorResponse, successResponse } = require('./response')
const { permissionValidator } = require('./permission')
// Schemas for validation
const { idSchema } = require('./schemas/id.schema')
const { statusSchema } = require('./schemas/status.schema')

/**
 * @typedef {object} methodsDef
 * @property {string} logSuccess
 * @property {string} logError
 * @property {string} permission
 * @property {Array<[key:string]:string>} populate

 * @typedef {Object} CrudGeneratorConfig
 * @property {any} model
 * @property {any} createSchema
 * @property {any} updateSchema
 * @property {CrudMaker.methodsDefs} methods
 * @property {boolean} paginate
 * @property {[key:CrudMaker.allowMethods ]:object} methodsDef
 *
 * @property {[key:string]:methodsDef} methodsDef
 * @param {CrudGeneratorConfig} config
 */

function crudMaker(config) {
  const router = express.Router()
  const { model, createSchema, updateSchema, methods = [] } = config
  if (!model) {
    console.log('Model is required')
    throw new Error('Model is required')
  }

  if (methods.includes('create')) {
    router.post(
      '/',
      permissionValidator(config.methodsDef?.create?.permission),
      validatorHandler(createSchema),
      async (req, res, next) => {
        try {
          const data = await model.create(req.body)
          successResponse(res, data, 201)
        } catch (error) {
          errorResponse(res, error.message, 400, error.code)
        }
      }
    )
  }

  if (methods.includes('list')) {
    router.get(
      '/list',
      permissionValidator(config.methodsDef?.list?.permission),

      async (req, res, next) => {
        try {
          const fields = config.methodsDef?.list?.fields || ''
          const data = await model.find({}, fields)
          successResponse(res, data)
        } catch (error) {
          errorResponse(res, error.message, 400, error.code)
        }
      }
    )
  }

  if (methods.includes('get')) {
    router.get(
      '/:id',
      permissionValidator(config.methodsDef?.get?.permission),
      validatorHandler(idSchema, 'params'),
      async (req, res, next) => {
        try {
          const { id } = req.params
          const ref = model.findById(id)
          if (Object.entries(config.methodsDef?.get?.populate || []).length) {
            Object.entries(config.methodsDef?.get?.populate).forEach(
              ([key, value]) => {
                ref.populate(key, value)
              }
            )
          }
          const data = await ref.exec()
          successResponse(res, data)
        } catch (error) {
          errorResponse(res, error.message, 400, error.code)
        }
      }
    )
  }
  if (methods.includes('getall')) {
    router.get(
      '/',
      permissionValidator(config.methodsDef?.getall?.permission),
      async (req, res, next) => {
        try {
          let optionals = {}
          const extraConditions = {}
          const ref = model.find()

          if (
            config.methodsDef?.getall?.populateSearch?.length &&
            req.query.search &&
            req.query.search.trim().length > 2
          ) {
            const { populateSearch } = config.methodsDef?.getall
            for (const populate of populateSearch) {
              const fields = populate.fields || []
              const result = await populate.model.find({
                $or: fields.map((field) => {
                  return {
                    [field]: { $regex: req.query.search, $options: 'i' },
                  }
                }),
              })
              const ids = result.map((item) => item._id)
              if (!ids.length) continue
              extraConditions[populate.path] = { $in: ids }
            }
            console.log({ extraConditions })
          }

          // populate
          if (
            config.methodsDef?.getall?.populate &&
            Object.entries(config.methodsDef?.getall?.populate)?.length
          ) {
            Object.entries(config.methodsDef?.getall?.populate).forEach(
              ([key, value]) => {
                ref.populate(key, value)
              }
            )
          }
          // search
          if (config.methodsDef?.getall?.search?.fields) {
            const { search } = config.methodsDef?.getall
            const { fields } = search
            const { search: q } = req.query
            if (q) {
              const searchFields = fields.map((field) => {
                return {
                  [field]: { $regex: q, $options: 'i' },
                }
              })
              if (!Object.keys(extraConditions).length) {
                ref.or([...searchFields]).where(extraConditions)
              } else {
                ref.or([...searchFields, extraConditions])
              }
            }
            // numbers equal
            const { numbers } = search
            if (numbers) {
              const value = parseFloat(q)
              if (value) {
                const searchNumbers = numbers.map((field) => {
                  return {
                    [field]: parseFloat(q),
                  }
                })
                if (!Object.keys(extraConditions).length) {
                  ref.or([...searchNumbers]).where(extraConditions)
                } else {
                  ref.or([...searchNumbers, extraConditions])
                }
              }
            }
          }
          // paginate
          if (config.paginate) {
            const { page = 1, limit = 10 } = req.query
            const options = {
              page: parseInt(page, 10),
              limit: parseInt(limit, 10),
            }
            ref.limit(options.limit).skip(options.limit * (options.page - 1))

            const count = await model.countDocuments(ref.getQuery())

            optionals = {
              ...optionals,
              page: options.page,
              limit: options.limit,
              count: count,
              pages: Math.ceil(count / options.limit),
            }
          }

          // sort
          if (config.methodsDef?.getall?.sort) {
            const { sort } = config.methodsDef?.getall
            ref.sort(sort)
          }

          // execute query
          const data = await ref.exec()
          successResponse(res, data, optionals)
        } catch (error) {
          console.log(error)
          errorResponse(res, error.message, 400, error.code)
        }
      }
    )
  }
  if (methods.includes('update')) {
    router.put(
      '/:id',
      permissionValidator(config.methodsDef?.update?.permission),
      validatorHandler(idSchema, 'params'),
      validatorHandler(updateSchema),
      async (req, res, next) => {
        try {
          const { id } = req.params
          const data = req.body
          await model.updateOne({ _id: id }, data)
          const updated = await model.findOne({ _id: id })
          successResponse(res, updated)
        } catch (error) {
          errorResponse(res, error.message, 400, error.code)
        }
      }
    )
  }

  if (methods.includes('delete')) {
    router.delete(
      '/:id',
      permissionValidator(config.methodsDef?.delete?.permission),
      validatorHandler(idSchema, 'params'),
      async (req, res, next) => {
        try {
          // preConditions
          const preConditions = config.methodsDef?.delete?.conditions
          let valid = true
          if (preConditions && preConditions.length) {
            for (const condition of preConditions) {
              const x = await condition.model.count({
                [condition.path]: req.params.id,
              })
              if (x > 0) {
                valid = false
                break
              }
            }
          }
          if (!valid) {
            return errorResponse(
              res,
              'this element has dependencies',
              412,
              'precondition/fail'
            )
          }

          const { id } = req.params
          const result = await model.findOneAndUpdate(
            { _id: id },
            { deleted: true }
          )
          successResponse(res, result)
        } catch (error) {
          errorResponse(res, error.message, 400, error.code)
        }
      }
    )
  }
  // allow change status
  if (methods.includes('status')) {
    router.patch(
      '/:id/status',
      validatorHandler(idSchema, 'params'),
      validatorHandler(statusSchema, 'body'),
      permissionValidator(config.methodsDef?.status?.permission),
      async (req, res, next) => {
        try {
          const { id } = req.params
          console.log({ id })
          const result = await model.updateOne(
            { _id: id },
            { status: req.body.status }
          )
          successResponse(res, result)
        } catch (error) {
          errorResponse(res, error.message, 400, error.code)
        }
      }
    )
  }

  if (methods.includes('count')) {
    router.get(
      '/count',
      permissionValidator(config.methodsDef?.count?.permission),

      async (req, res, next) => {
        try {
          const data = await model.countDocuments()
          successResponse(res, data)
        } catch (error) {
          errorResponse(res, error.message, 400, error.code)
        }
      }
    )
  }

  return router
}

exports.crudMaker = crudMaker
