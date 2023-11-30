const generateConfig = require('../config.js')
const operationDatabase = require('./database.js')
const logger = require('log4js').getLogger('BOT')
const getAccount = require('./getAccount.js')

//格式化日期
const currentDate = new Date();
const year = currentDate.getFullYear();
const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Month is zero-based
const day = String(currentDate.getDate()).padStart(2, '0');
const formattedDate = `${year}-${month}-${day}`;


async function tasksCheck(bot) {
    logger.info('定时任务开始......');
    let userIds = [];
    try {
        //查询GPT身份组成员。
        const { data: { data } } = await bot.api.getGuildRoleMembers(
            generateConfig().guild_id,
            generateConfig().GPTRols,
            { start_index: 0, limit: 400 }
        );
        userIds = data.map(item => item.user.id);
        logger.info('查询到身份组成员：', userIds);
    } catch (error) {
        logger.error('查询GPT身份组成员ERROR:', error);
    }
    //数据库逐个查询jointime
    for (const element of userIds) {
        const res = await operationDatabase(`SELECT jointime FROM gpt_trials WHERE userid = ${element};`)
        //如果该userid有
        if (res.length > 0) {
            const [{ jointime = '' }] = res;
            //判断事件是否超过lock时间。
            const currentTime = new Date();
            const timeDifference = currentTime - jointime;
            if (timeDifference / (1000 * 60 * 60) > generateConfig().lockTime) {
                try {
                    const { status } = await bot.api.deleteGuildMemberRole(
                        generateConfig().guild_id,
                        element,
                        generateConfig().GPTRols,
                    )
                    if (status === 204) {
                        logger.info('STATUS:', status, '移除身份证成功。');
                    } else {
                        logger.info('STATUS:', status, '移除身份证失败。');
                    }
                } catch (error) {
                    logger.error('ERROR:', error);
                }
            } else {
                //不超过24小时的。
                logger.info(`未超过指定试用时间：${generateConfig().lockTime}小时`)
            }
        } else {
            //如果userid不存在
            logger.info('userid不存在。')
        }
    }
}
let timeTag = new Date();
async function dailyPins(bot) {
    try {
        //获得精华消息
        const { data: { message_ids } } = await bot.api.getChannelPin(generateConfig().trialChannel);
        //删除精华消息
        if (message_ids.length > 0) {
            await bot.api.deleteChannelMessage(generateConfig().trialChannel, message_ids[0], true);
            logger.info('精华消息删除成功。')
        } else {
            logger.info('没有精华消息。')
        }
        //获取网络账号
        const res = await getAccount.main();
        //用户推送
        //设置发送时间。
        timeTag = new Date();
        await bot.api.sendChannelMessage(generateConfig().trialChannel, {
            content: `🎊以下试用账号，你可尝试，不过不保证体验效果。试用频道每人开发权限仅一周。如需稳定账号，请联系管理员。\n\n更新日期：${formattedDate}\n${res}`,
        });
    } catch (error) {
        logger.error('发送主动消息错误：', error)
    }
};
async function dailyPinsAuditPass(bot, message_id) {
    if ((new Date() - timeTag) / 1000 < 3) {
        try {
            await bot.api.addChannelPin(generateConfig().trialChannel, message_id);
            logger.info('精华消息设置成功。')
        } catch (error) {
            logger.error('设置精华消息错误：', error)
        }
    } else {
        logger.info('非BOT主动消息。')
    }
}


module.exports = { tasksCheck, dailyPins, dailyPinsAuditPass }
