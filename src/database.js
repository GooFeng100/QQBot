const mysql = require('mysql2/promise');
const logger=require('log4js').getLogger('BOT');
// 创建数据库连接
const pool = mysql.createPool({
    host: 'sh-cdb-1i8145l0.sql.tencentcdb.com',
    port: 63510,
    user: 'root',
    password: 'root123@',
    database: 'myqqbot',
    charset: 'utf8mb4',
});

async function operationDatabase(sql, values =[]) {
    try {
        const [rows, fields] = await pool.execute(sql, values);
        logger.info('The results is: \n', rows);
        return rows;
    } catch (error) {
        logger.error('数据库模块查询错误。', error.message);
    }
};
module.exports = operationDatabase;



/*增加记录 
INSERT INTO channel (userid, username, channelid, channelname, jointime)
    VALUES ('8107563852553431940', '从头再来', '634143536', '机器人测试频道', CURRENT_TIMESTAMP); */

/* SELECT * FROM channel WHERE userid = '8107563852553431940'
   Object.keys(results).length 检查是否为空。0
   results[0].username
*/

/* 
results[0] || 0   //有值显示值，没值显示0
*/

/* 
const currentTime = new Date();
const jointimeDate = new Date(results[0].jointime);
const timeDifference = currentTime - jointimeDate;
        
// 打印时间差
console.log('当前时间：',currentTime);
console.log('jointime时间:',jointimeDate);
console.log('时间差（毫秒）:', timeDifference);
console.log('时间差（秒）:', timeDifference / 1000);
console.log('时间差（分钟）:', timeDifference / (1000 * 60));  //24小时是1440分钟
console.log('时间差（小时）:', timeDifference / (1000 * 60 * 60));
 */
