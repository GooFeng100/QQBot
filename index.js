const { Bot } = require('amesu');
const sensitiveWordTool = require('./src/sensitiveword.js');
const generateConfig = require('./config.js');
const operationDatabase = require('./src/database.js');
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
    events: ['GUILD_MESSAGES', 'PUBLIC_GUILD_MESSAGES'],
});

// 监听频道消息
bot
    .on('message', msgProcess)
    .online();

//定时任务
// 定义规则
const rule = new schedule.RecurrenceRule();
// rule.second = [0, 10, 20, 30, 40, 50]; // 每隔 10 秒执行一次/
// 每月1号执行任务
rule.dayOfWeek=[1]
// rule.date = 1;
rule.hour = 0;
rule.minute = 0;
rule.second = 0;

// 启动任务
const job = schedule.scheduleJob(rule, () => {
    tasks(bot);
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
    if (allowedEventTypes.includes(eventType)) {
        logger.info('撤销事件不做处理。');
        return;
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
                //数据库查询userid
                const selectSql = `SELECT userid,username,jointime FROM gpt_trials WHERE userid = ${userid};`;
                try {
                    const selectData = await operationDatabase(selectSql);
                    logger.info('数据库查询完成。');
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
                    //userid是否在数据库
                    if (selectData.length) {
                        //1-查询到数据
                        logger.info('查询到数据。');
                        //检测是否大于lockTime小时
                        const currentTime = new Date();
                        const jointimeDate = new Date(selectData[0].jointime);
                        const timeDifference = currentTime - jointimeDate;
                        if (timeDifference / (1000 * 60 * 60) >= generateConfig().lockTime) {
                            //执行sendmsg(你已经试用过，请联系管理员)
                            await bot.api.sendChannelMessage(channelid, rejectMsgParams);
                            logger.info(`${username},超时，未获得授权。`);
                        } else {
                            //执行sendmsg(恭喜你已获得权限，#试用频道)
                            await bot.api.sendChannelMessage(channelid, allowedMsgParams);
                            logger.info(`${username},获得授权。`);
                        }
                    } else {
                        //0-未查询到数据。
                        logger.info('未查询到数据。');
                        logger.info('写入数据......');
                        //增加目标信息进数据库
                        const addSql = 'INSERT INTO gpt_trials (userid, username, channelid) VALUES (?, ?, ?)';
                        const addValues = [userid, username, channelid];
                        await operationDatabase(addSql, addValues);
                        //添加身身份证
                        const { status } = await bot.api.addGuildMemberRole(generateConfig().guild_id, userid, generateConfig().GPTRols);
                        if (status === 204) {
                            logger.info(`status:${status},${username},授权成功。`);
                            //发送欢迎语
                            await bot.api.sendChannelMessage(channelid, allowedMsgParams);
                        } else {
                            logger.info(`status:${status},${username},授权失败。`);
                        }
                    }
                } catch (error) {
                    logger.error('ERROR:', error);
                }
                break;
            case 'GPT':
                //网络爬虫
                const res = await getAccount.main();
                try {
                    //用户推送
                    await bot.api.sendChannelMessage(channelid, {
                        content: `${username}，你好！\n😁以下试用账号，你可尝试，不过不保证体验效果。\n${res}`,
                        message_reference: {
                            message_id: msgid
                        },
                        msg_id: msgid
                    })
                } catch (error) {
                    logger.error('ERROR:', error);
                }
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
