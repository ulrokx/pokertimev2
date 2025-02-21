import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb"

export const ddb = new DynamoDBClient();

export const ddbClient = DynamoDBDocument.from(ddb);