export interface WithId<T> {
	id: string;
	data: T;	
}

export interface GameAccessor<T> {
	get(id: string): Promise<WithId<T>>;
	create(game: T): Promise<WithId<T>>;
	update(id: string, game: T): Promise<T>;
	delete(id: string): Promise<void>;
}