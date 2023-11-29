const generateConfig = require('../config.js')
const operationDatabase = require('./database.js')

async function tasks(bot) {
    console.log('每日定时任务开始......');
    let userIds = [];
    try {
        //查询GPT身份组成员。
        const { data: { data } } = await bot.api.getGuildRoleMembers(
            generateConfig().guild_id,
            generateConfig().GPTRols,
            { start_index: 0, limit: 400 }
        );
        userIds = data.map(item => item.user.id);
        console.log('查询到身份组成员：', userIds);
    } catch (error) {
        console.log('EEOR:', error);
    }
    //数据库逐个查询jointime
    for (const element of userIds) {
        const res = await operationDatabase(`SELECT jointime FROM gpt_trials WHERE userid = ${element};`)
        //如果该userid有
        if (res.length > 0) {
            const [{ jointime = '' }] = res;
            //判断事件是否超过lock=24h时间。
            const currentTime = new Date();
            const timeDifference = currentTime - jointime;
            if (timeDifference / (1000 * 60 * 60) > 24) {
                try {
                    const { status } = await bot.api.deleteGuildMemberRole(
                        generateConfig().guild_id,
                        element,
                        generateConfig().GPTRols,
                    )
                    if (status === 204) {
                        console.log('STATUS:', status, '移除身份证成功。');
                    } else {
                        console.log('STATUS:', status, '移除身份证失败。');
                    }
                } catch (error) {
                    console.log('EEOR:', error);
                }
            } else {
                //不超过24小时的。
            }
        } else {
            //如果userid不存在
        }
    }
}
module.exports = tasks;