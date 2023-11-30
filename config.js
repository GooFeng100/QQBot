// config.js
function generateConfig(username = '') {
    const trialChannel = '634183614';//GPT4.0试用
    return {
        //频道号码
        guild_id: '10077854057727454590',
        //目标聊天频道=>     测试频道：634143536；  GPT大厅：634068801   另一侧测试频道：634302530
        homeChannel: '634068801',
        //GPT4.0身份组rols，频道组上线设置权限
        GPTRols: '16443807',
        // @机器人ID
        botID: '14915738512219231714',
        //试用超时时间
        lockTime: 24 * 7,
        //超时拒绝msg
        rejectedMsg: `你好，${username}:\n你已经试用过4.0。为了让其他小伙伴有更好的试用体验，已拒绝你再次获得进入试用频道。\n如果你想长期稳定地使用4.0，请联系管理员。谢谢。`,
        allowedMsg: `你好，${username}:\n欢迎来到本频道，你已获得权限。点击下面链接，你将进入4.0频道。\n<#${trialChannel}>`,
        trialChannel,
    };
}

// 导出生成配置的函数
module.exports = generateConfig;