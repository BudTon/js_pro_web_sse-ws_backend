const combineRouters = require('koa-combine-routers');
const index = require('./index/index.js');

const router = combineRouters(
  index,
);

module.exports = router;
