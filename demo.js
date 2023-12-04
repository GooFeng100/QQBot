const { DynamoDB } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocument } = require("@aws-sdk/lib-dynamodb");

class DynamoDBClient {
    constructor() {
        const client = new DynamoDB({
            region: 'ap-east-1',
            credentials: {
                accessKeyId: 'AKIA53QOBIX4MY7A3OH3',
                secretAccessKey: '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'
            }
        });
        this.ddbDocClient = DynamoDBDocument.from(client);
    }
    async scan(TableName) {
        /* 扫描整个数据表
         */
        try {
            const { Items } = await this.ddbDocClient.scan({ TableName });
            return Items;
        } catch (error) {
            console.log("Scan Error:", error);
        }
    }
    async get(TableName, Key) {
        /* 查询数据
        {
            TableName: "YourTableName",
            Key: {
                "primaryKey": value
            }
        }
        const data = await new DynamoDBClient().get('gpt_members', { userid: '810756385255431940' });
         */
        try {
            const data = await this.ddbDocClient.get({ TableName, Key });
            
            return data.Item?data.Item:'NOTFOUND';
        } catch (error) {
            console.log("Get Error:", error);
        }
    }
    async put(TableName, Item) {
        /* 增加数据
        {
            TableName: "YourTableName",
            Item: {
                "primaryKey": value,
                "attribute1": value1,
                "attribute2": value2,
                // 其他属性...
            }
        } 
        */
        try {
            await this.ddbDocClient.put({ TableName, Item });
            return Item;
        } catch (error) {
            console.log("Put Error:", error);
        }
    }
    async update(TableName, Key, UpdateExpression, ExpressionAttributeValues) {
        /* 
        TableName: 要更新数据的 DynamoDB 表名。
        Key: 要更新的项目的主键对象。
        UpdateExpression: 更新表达式，定义如何更新项目的属性。
        ExpressionAttributeValues: 与更新表达式中的占位符相关联的实际值。
        {
            TableName: "YourTableName",
            Key: {
                "primaryKey": value
            },
            UpdateExpression: "set attribute1 = :val1",
            ExpressionAttributeValues: {
                ":val1": newValue
            }
        }
         */
        try {
            const params = {
                TableName,
                Key,
                UpdateExpression,
                ExpressionAttributeValues,
                ReturnValues: "UPDATED_NEW"
            };
            const data = await this.ddbDocClient.update(params);
            return data.Attributes;
        } catch (error) {
            console.log("Update Error:", error);
        }
    }
    async delete(TableName, Key) {
        /* 删除数据
        {
            TableName: "YourTableName",
            Key: {
                "primaryKey": value
            }
        }
         */
        try {
            await this.ddbDocClient.delete({ TableName, Key });
            return Key;
        } catch (error) {
            console.log("Delete Error:", error);
        }
    }
}
module.exports = DynamoDBClient;



console.log(Math.floor((Date.now()-1701273600000)/1000/60/60));
/* 
(async () => {
    console.log(await new DynamoDBClient().scan(
        'gpt_members'
    ));
})();
 */
/* 
(async () => {
    console.log(await new DynamoDBClient().put(
        'gpt_members',{
        userid: '2747410911446727265',
        username:'Jason',
        jointime:1701271600000,
    }));
})();
 */
/* 
[
    {
        username: '迷惘',
        jointime: 1701273600000,
        userid: '14157055408545972731'
    },
    {
        username: '从头再来',
        jointime: 1701100800000,
        userid: '8107563852553431940'
    }
] */