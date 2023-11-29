//导入敏感词过滤
const { SensitiveWordTool } = require('sensitive-word-tool')
//初始化
const sensitiveWordTool = new SensitiveWordTool({
    //默认敏感词词库
    useDefaultWords: true
})


//导入数据库
const operationDatabase = require('./database.js')
//导入配置文件
const generateConfig=require('../config.js')


async function deleteMessage(client, channelid, msgid, content) {
    try {
        await client.messageApi.deleteMessage(channelid, msgid, false);
        console.log('撤回SUCCESS', content)
    } catch (error) {
        console.log('撤回ERROR:', error)
    }
};


async function msgProcess(client, data) {
    //解构data数据
    let {
        eventType,
        msg: {
            author: {
                id: userid = '',
                username = ''
            } = {},
            channel_id: channelid = '',
            content = '',
            id: msgid = ''
        } = {}
    } = data;
    content = content.replace(/<[^>]+>/g, '').trim();
    // 撤回消息，跳出程序,1-退出，0继续
    const allowedEventTypes = ['MESSAGE_DELETE', 'PUBLIC_MESSAGE_DELETE'];
    if (allowedEventTypes.includes(eventType)) {
        console.log('撤销事件不做处理。');
        return;
        //敏感词，1-退出，0继续
    } else if (sensitiveWordTool.verify(content)) {
        try {
            console.log('存在敏感词，执行撤销......');
            await deleteMessage(client, channelid, msgid, content);
            return;
        } catch (error) {
            console.log('撤销消息出错:', error);
        }
        //@事件，1-继续，0退出
    } else if (eventType !== 'AT_MESSAGE_CREATE') {
        console.log('消息不是@事件。');
        return;
        //频道，1-继续，0退出
    } else if (channelid !== generateConfig().trialChannel) {
        console.log('不是指定频道事件');
        return;
        //关键词，1-继续，0退出
    } else if (content !== 'GPT4.0') {
        console.log('不是指定关键词事件');
        return;
    }
    //数据库查询userid
    const sql = `SELECT userid,username,jointime FROM gpt_trials WHERE userid = ${userid};`;
    try {
        const selectData = await operationDatabase(sql);
        console.log('数据库查询完成。');
        // console.log(typeof(data[0]));

        //userid是否在数据库
        if (selectData.length) {
            //查询到数据
            console.log('查询到数据。');
            //检测是否大于24小时
            const currentTime = new Date();
            const jointimeDate = new Date(selectData[0].jointime);
            const timeDifference = currentTime - jointimeDate;
            if (timeDifference / (1000 * 60 * 60) >= 24) {
                //执行sendmsg(你已经试用过，请联系管理员)
                const rejectMsg={
                    //调用拒绝消息
                    msg:generateConfig(username).rejectedMsg,
                    channelid:channelid,
                    msgid:msgid
                };

                await sendMsg(client,rejectMsg);
            } else {
                //执行sendmsg(恭喜你已获得权限，#试用频道)
                //代码2
            }
        } else {
            //未查询到数据。
            console.log('未查询到数据。');
        }
    } catch (error) {
        console.log('ERROR:', error);
    }
};




// 发送消息
async function sendMsg(client, receiveMessages) {
    
    const message = {
        content: receiveMessages.msg,
        message_reference: {
            message_id: receiveMessages.msgid,
        },
        msg_id: receiveMessages.msgid,
    };
    try {
        let res = await client.messageApi.postMessage(receiveMessages.channelid, message);
        console.log('发送消息SUCCESS:', res.status)
    } catch (error) {
        console.log('发送消息ERROR:', error);
    }
}


module.exports = {
    msgProcess,
};


/* {
    eventType: 'AT_MESSAGE_CREATE',
        eventId: 'AT_MESSAGE_CREATE:dc8ee94a-4729-4c53-b412-4e0f3d3f26fc',
        msg: {
            author: {
                avatar: 'https://qqchannel-profile-1251316161.file.myqcloud.com/1700042983c86536473a6b6292?t=1700042984',
                bot: false,
                id: '8636229396208892103',
                username: '雾里看花'
            },
            channel_id: '634143536',
            content: '<@!14915738512219231714> 123',
            guild_id: '10077854057727454590',
            id: '08fedacbc8eedbeeed8b0110b086b1ae0238960148e2ae88ab06',
            member: {
                joined_at: '2023-09-20T00:38:35+08:00',
                nick: '雾里看花',
                roles: [Array]
            },
            mentions: [[Object]],
            seq: 150,
            seq_in_channel: '150',
            timestamp: '2023-11-25T23:48:50+08:00'
        }
    } 
*/