const { Bot } = require('amesu');
const sensitiveWordTool = require('./src/sensitiveword.js');
const generateConfig = require('./config.js');
const DynamoDBClient = require('./src/AWSDatabase.js')
const schedule = require('node-schedule');
const tasks = require('./src/scheduledTasks.js')
const getAccount = require('./src/getAccount.js')
const log4js = require('log4js');

//加载日志全局配置
log4js.configure('./log4js.json')
//获取全局logger
const logger = log4js.getLogger('BOT');

//bot配置
const bot = new Bot({
    appid: '102078084',
    token: 'zvGOeAQk9Nzj5c5H9XKAqBACYk4YZdGw',
    secret: 'h0A960kHdliT1LRJ',
    events: ['GUILD_MESSAGES', 'MESSAGE_AUDIT', 'PUBLIC_GUILD_MESSAGES'],
});

// 监听频道消息
bot
    .on('message', msgProcess)
    .online();

//定时任务
// 定义规则
const rule1 = new schedule.RecurrenceRule();
const rule2 = new schedule.RecurrenceRule();
// rule1.second = [0, 10, 20, 30, 40, 50]; // 每隔 10 秒执行一次/
// 每天执行任务
// rule1.dayOfWeek = [1]
// rule.date = 1;
rule1.hour = 8;
rule1.minute = 0;
rule1.second = 0;
// 启动任务1
schedule.scheduleJob(rule1, () => {
    tasks.tasksCheck(bot);
});
//每天任务
// rule2.second = [0, 10, 20, 30, 40, 50]; // 每隔 10 秒执行一次/
rule2.hour = [10, 14, 19];
rule2.minute = 0;
rule2.second = 0;
// 启动任务2
schedule.scheduleJob(rule2, () => {
    tasks.dailyPins(bot);
});

//业务流程
async function msgProcess(data) {
    //解构data数据
    let {
        t: eventType,
        author: {
            id: userid = '',
            username = ''
        } = {},
        channel_id: channelid = '',
        content = '',
        id: msgid = '',
        mentions = []
    } = data;
    content = content.replace(/<[^>]+>/g, '').trim();
    // 撤回消息，跳出程序,1-退出，0继续
    const allowedEventTypes = ['MESSAGE_DELETE', 'PUBLIC_MESSAGE_DELETE'];
    if (eventType === 'MESSAGE_AUDIT_PASS') {
        logger.info('消息审核通过。');
        tasks.dailyPinsAuditPass(bot, data.message_id);
    } else if (eventType === 'MESSAGE_AUDIT_REJECT') {
        logger.info('消息审核失败。');
    } else if (allowedEventTypes.includes(eventType)) {
        logger.info('撤销事件不做处理。');
        //敏感词，1-退出，0继续
    } else if (sensitiveWordTool.verify(content)) {
        try {
            logger.info('存在敏感词，执行撤销......', '>>>', content);
            await bot.api.deleteChannelMessage(channelid, msgid);
        } catch (error) {
            logger.error('撤销消息出错:', error);
        }
        //@bot，1-继续，0退出
    } else if (!mentions.some(e => e.id === generateConfig().botID)) {
        logger.info('消息不是@BOT。');
        //频道，1-继续，0退出
    } else if (channelid !== generateConfig().homeChannel) {
        logger.info('不是指定频道事件');
        //关键词，1-继续，0退出
    } else {
        switch (content) {
            case 'GPT4.0':
                //初始化消息    
                const rejectMsgParams = {
                    //调用拒绝消息
                    content: generateConfig(username).rejectedMsg,
                    message_reference: {
                        message_id: msgid
                    },
                    msg_id: msgid,
                };
                const allowedMsgParams = {
                    //调用拒绝消息
                    content: generateConfig(username).allowedMsg,
                    message_reference: {
                        message_id: msgid
                    },
                    msg_id: msgid,
                };
                //数据库查询userid
                const result = await new DynamoDBClient().get('gpt_members', { userid: userid })
                if (result !== 'NOTFOUND') {
                    //查询到用户信息
                    //判断是否超时试用
                    if ((Math.floor(Date.now()) - result.jointime) / 1000 / 60 / 60 >= generateConfig().lockTime) {
                        //执行sendmsg(你已经试用过，请联系管理员)
                        await bot.api.sendChannelMessage(channelid, rejectMsgParams);
                        logger.info(`${username},超时，未获得授权。`);
                    } else {
                        //执行sendmsg(恭喜你已获得权限，#试用频道)
                        await bot.api.sendChannelMessage(channelid, allowedMsgParams);
                        logger.info(`${username},获得授权。`);
                    }
                } else {
                    //未查询到用户信息
                    logger.info('未查询到用户信息。');
                    logger.info('写入数据......');
                    //增加目标信息进数据库
                    const result = await new DynamoDBClient().put('gpt_members', {
                        "userid": userid,
                        "username": username,
                        "jointime": Math.floor(Date.now()),
                    })
                    if (result.code === 200) {
                        logger.info('写入数据成功：\n', result.Item)
                        //添加身身份证
                        const { status } = await bot.api.addGuildMemberRole(generateConfig().guild_id, userid, generateConfig().GPTRols);
                        if (status === 204) {
                            logger.info(`status:${status},${username},授权成功。`);
                            //发送欢迎语
                            await bot.api.sendChannelMessage(channelid, allowedMsgParams);
                        } else {
                            logger.info(`status:${status},${username},授权失败。`);
                        }
                    } else {
                        logger.error('写入数据失败。')
                    }
                }
                break;
            case 'GPT':
                logger.debug('GPT事件已移除，其他功能待测试。')
                break;
            default:
                logger.info('不是指定关键词事件');
                try {
                    const data = await getAccount.byword();
                    await bot.api.sendChannelMessage(channelid, {
                        content: `${username}，你好！有什么可以帮你？\n\n💡${data.hitokoto}\n📒${data.from}\n🙋${data.from_who}`,
                        message_reference: {
                            message_id: msgid
                        },
                        msg_id: msgid
                    })
                } catch (error) {
                    logger.error('ERROR:', error);
                }
                break;
        }
    }
};
