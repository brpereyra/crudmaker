declare namespace CrudMaker {

  export type allowMethods = 'create' | 'get' | 'getall' | 'update' | 'delete' | 'count' | 'list' | 'status'
  export type methodsDefs = Array<allowMethods>
}