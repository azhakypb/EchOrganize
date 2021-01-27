var AWS = require("aws-sdk");
AWS.config.update({region: "us-east-1"});
const tableName = "calendar-table";

var calendarHelper = function () {};
var docClient = new AWS.DynamoDB.DocumentClient();

calendarHelper.prototype.saveNewSchedule = (name, startDate, endDate, userID) => {
    const dateCreated = new Date().toISOString();
    return new Promise((resolve, reject) => {
        const params = {
            TableName: tableName,
            Item: {
                'userId': userID,
                'dateCreated': dateCreated,
                'calendarName': name,
                'startDate': startDate,
                'endDate': endDate,
                'classes': {},
            }
        };
        docClient.put(params, (err, data) => {
            if (err) {
                console.log("Unable to insert =>", JSON.stringify(err))
                return reject("Unable to insert");
            }
            console.log("Saved Data, ", JSON.stringify(data));
            resolve(data);
        });
    });
}

calendarHelper.prototype.getCurrentSchedule = (userID) => {
    return new Promise((resolve, reject) => {
        var params = {
            ExpressionAttributeValues: {
                ':user_id': userID,
            },
            KeyConditionExpression: 'userId = :user_id',
            ProjectionExpression: 'calendarName, startDate, endDate',
            TableName: tableName
};
        docClient.query(params, (err, data) => {
            if (err) {
                console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                return reject(JSON.stringify(err, null, 2))
            }
            console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
            resolve(data.Items)
        })

    });
}

calendarHelper.prototype.getClassesBySchedule = (userID, scheduleName) => {
    return new Promise((resolve, reject) => {
        var params = {
            ExpressionAttributeValues: {
                ':user_id': userID,
                ':calName': scheduleName
            },
            KeyConditionExpression: 'userId = :user_id',
            FilterExpression: 'calendarName = :calName',
            ProjectionExpression: 'classes',
            TableName: tableName
        };
        docClient.query(params, (err, data) => {
            if (err) {
                console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                return reject(JSON.stringify(err, null, 2))
            }
            console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
            resolve(data.Items)
        })
        
    });
}
module.exports = new calendarHelper();