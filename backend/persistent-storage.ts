import Knex from "knex";
import * as _ from "lodash";
import {Config} from "./config";
import {IAddressLookup, IEvent} from "../types";

const knex = Knex({
    client: 'pg',
    connection: Config.PostgresConnStr,
    searchPath: ['knex', 'public'],
});

export interface IContractTracking {
    address: string,
    name: string,
    key: string,
    start_block: number,
    end_block: number
}

export class PersistentStorage {
    async addEvents(
        events: IEvent[]
    ) {
        await Promise.all(_.chunk(events, 100).map(async (chunk) => {
            const query = chunk.map(
                event => knex("events").insert(
                    {
                        event_timestamp_seconds: event.event_timestamp_seconds,
                        contract_address: event.contract_address,
                        block_number: event.block_number,
                        tx_hash: event.tx_hash,
                        tx_index: event.tx_index,
                        event_idx: event.event_idx,
                        topic: event.topic,
                        data: event.data,
                        parsed: event.parsed,
                        event_name: event.event_name,
                        parsed_data: JSON.stringify(event.parsed_data)
                    }
                ).toString() + ' ON CONFLICT DO NOTHING'
            ).join(" ; ")
            // await knex.transaction(trx => trx.raw(query.replace(/\?/g, '\\?')));
            await knex.raw(query.replace(/\?/g, '\\?'));
        }));
    }

    async setTopBlockSynced(topBlockSynced: number) {
        await knex("state")
            .update({
                top_block_synced: topBlockSynced
            })
    }

    async getTopBlockSynced(): Promise<number> {
        const row = await knex("state")
            .first();

        return row.top_block_synced;
    }

    async addContractTracking(address: string, name: string, key: string, startBlock: number, endBlock: number = 0) {
        const query = knex("contracts")
            .insert({
                address,
                name,
                key,
                start_block: startBlock,
                end_block: endBlock
            }).toString() + " ON CONFLICT DO NOTHING";
        await knex.raw(query.replace(/\?/g, '\\?'));
    }

    async endContractTracking(key: string, endBlock: number) {
        knex("contracts")
            .whereNull('end_block')
            .andWhere({key})
            .update({
                end_block: endBlock
            });
    }

    async  getContractTrackingsInRange(fromBlock: number, toBlock: number): Promise<IContractTracking[]> {
        return (await this.listContractTrackings())
            .filter(tracking => tracking.start_block <= toBlock && (tracking.end_block || toBlock) >= fromBlock)
    }

    async listContractTrackings(): Promise<IContractTracking[]> {
        return knex("contracts")
            .select();
    }

    async getEvents(offset: number, limit: number, eventName?: string, searchText?: string): Promise<{events: IEvent[], total: number}> {
        const baseQuery = () => knex("events")
            .where(qb => {
                if (eventName) {
                    qb.andWhere({event_name: eventName});
                }
                if (searchText) {
                    qb.andWhereRaw('parsed_data::text ILIKE ?', [`%${searchText.replace(/%/g, "\\%")}%`]);
                }
            });

        let countQuery = baseQuery().count();

        let eventsQuery = baseQuery()
            .orderBy(
                [
                    { column: 'block_number', order: 'desc' },
                    { column: 'tx_index', order: 'desc' },
                    { column: 'event_idx', order: 'desc' },
                ]
            )
            .offset(offset)
            .limit(limit)
            .select();

        return {
            events: await eventsQuery,
            total: parseInt((await countQuery)[0].count as string)
        }
    }

    async setAddressLookup(address: string, name: string, description: string) {
        await knex.transaction(async (txn) => {
            await txn("address_lookup")
                .where("address", address)
                .delete();
            await txn("address_lookup")
                .insert({
                    address,
                    name,
                    description
                });
        })
    }

    async getAddressLookups(): Promise<IAddressLookup[]> {
        return knex("address_lookup").select();
    }
}

export const persistentStorage = new PersistentStorage();
