const combineRouters = require('koa-combine-routers');
const index = require('./index/index.js');
const participants = require('./participants/index.js')

const router = combineRouters(
  index,
  participants,
);

module.exports = router;
