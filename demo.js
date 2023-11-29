const { Bot } = require('amesu');
const sensitiveWordTool = require('./src/sensitiveword.js');
const generateConfig = require('./config.js');
const operationDatabase = require('./src/database.js');
const schedule=require('node-schedule');

/* const bot = new Bot({
    appid: '102078084',
    token: 'zvGOeAQk9Nzj5c5H9XKAqBACYk4YZdGw',
    secret: 'h0A960kHdliT1LRJ',
    events: ['GUILD_MESSAGES', 'PUBLIC_GUILD_MESSAGES'],
});

// 监听频道消息
bot
    // .on('message', msgProcess)
    .online();

async function msgProcess() {
    const data = await bot.api.getGuildChannels(generateConfig().guild_id)
    console.log(data);
} */

// 定义规则
const rule = new schedule.RecurrenceRule();
rule.second =0; // 每隔 10 秒执行一次
// rule.minute=

// 启动任务
const job = schedule.scheduleJob(rule, () => {
  console.log(new Date());
});