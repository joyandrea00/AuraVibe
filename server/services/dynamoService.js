
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");

const {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
} = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-south-1",
});

const dynamoDB = DynamoDBDocumentClient.from(client);

const TABLE_NAME = "AuraVibeSessions";

async function saveSession(session) {
  await dynamoDB.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: session,
    })
  );

  return session;
}

async function getSessions() {
  const result = await dynamoDB.send(
    new ScanCommand({
      TableName: TABLE_NAME,
    })
  );

  return result.Items || [];
}

module.exports = {
  saveSession,
  getSessions,
};