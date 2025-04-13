const Router = require('koa-router');
const router = new Router();

let participantsList = [];

router.post('/participants', async (ctx) => {
    let nikename = ctx.request.body.nikename
    if (participantsList.includes(nikename)) {
        return ctx.response.body = { status: "false" };
    }
    participantsList.push(nikename)
    ctx.response.body = { status: "true" }
    return ctx.response.body = { status: "true" };

});

module.exports = router;
