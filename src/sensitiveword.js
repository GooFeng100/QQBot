//导入敏感词过滤
const { SensitiveWordTool } = require('sensitive-word-tool')
//初始化
const sensitiveWordTool = new SensitiveWordTool({
    //默认敏感词词库
    useDefaultWords: true
})

module.exports = sensitiveWordTool;