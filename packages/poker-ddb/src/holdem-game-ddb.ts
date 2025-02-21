import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { GameAccessor, WithId } from "./holdem-game";
import {HoldemGame} from "@pokertimev2/poker"

export class HoldemGameDdb implements GameAccessor<InstanceType<typeof HoldemGame>> {
	private ddb: DynamoDBDocument;
	constructor(ddb: DynamoDB, private tableName: string = "HoldemGames") {
		this.ddb = DynamoDBDocument.from(ddb);
	}

	async get(id: string): Promise<HoldemGame> {
		const { Item } = await this.ddb.get({
			TableName: this.tableName,
			Key: { id },
		})
		if (!Item) {
			throw new Error(`Game with id ${id} not found`);
		}
		const game = Object.assign(new HoldemGame(), Item.data);
		return { id, data: Item } as WithId<HoldemGame>;
	}
}