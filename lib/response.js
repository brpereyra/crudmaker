const successResponse = (res, data = {}, optionals = {}) => {
  res.send({
    type: "ok",
    data,
    ...optionals,
  });
};

const errorResponse = (res, msg, status, code = undefined) => {
  res.status(status).send({
    type: "err",
    msg,
    code,
  });
};

module.exports = {
  successResponse,
  errorResponse,
};
