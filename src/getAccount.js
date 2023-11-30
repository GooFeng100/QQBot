const fs = require('fs');
const axios = require('axios');
const { promisify } = require('util');
const { AsyncLocalStorage } = require('async_hooks');
const readFileAsync = promisify(fs.readFile);
const logger=require('log4js').getLogger('BOT');


// 提取账号和密码的函数
function extractAccountsAndPasswords(webpageString) {
    const pattern = /<li>账号\d+：(.*?)<\/li>\s*<li>密码\d+：(.*?)<\/li>/g;
    const accountPasswordPairs = [];

    let matches;
    while ((matches = pattern.exec(webpageString)) !== null) {
        const account = matches[1];
        const password = matches[2];
        accountPasswordPairs.push({ account, password });
    }

    return accountPasswordPairs;
}

async function main() {
    try {
        // 发送 GET 请求获取网页内容
        const response = await axios.get('http://150.158.17.36/');
        let webpageString = response.data;

        // 将所有 .com 替换为 *com
        webpageString = webpageString.replace(/\.com/g, '*com');

        // 提取账号和密码
        const accountPasswordPairs = extractAccountsAndPasswords(webpageString);

        // 构建字符串
        const resultString = accountPasswordPairs.map(({ account, password }) => {
            return `账号: ${account}\n密码: ${password}`;
        }).join('\n'); // 使用两个换行符分隔每个账号密码对

        // 返回结果字符串
        logger.info('爬虫账号成功。')
        return resultString;
    } catch (error) {
        logger.error('发生错误:', error.message);
        // 如果出现错误，可以返回一个默认值或者抛出异常，具体根据实际需求处理
        return '发生错误，无法获取账号密码。';
    }
}

async function byword() {
    try {
        const {data} = await axios.get('https://v1.hitokoto.cn/?encode=json&c=d&c=j&c=k&c=k&c=i&lang=cn');
        logger.info('获取名言成功');
        return data;
    } catch (error) {
        logger.error('获取名言发生错误:', error.message);
        return '';
    }
}
module.exports = { main, byword }
