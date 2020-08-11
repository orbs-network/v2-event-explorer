import Knex from "knex";
import * as _ from "lodash";
import {Config} from "./config";
import {IAddressLookup, IEvent} from "../types";
import {IContractTracking} from "./persistent-storage";

const knex = Knex({
    client: 'pg',
    connection: Config.PostgresConnStr,
    searchPath: ['knex', 'public'],
});

export class MemoryStorage {
    events: IEvent[] = [];
    topBlockSynced: number = 0;
    contractTrackings: IContractTracking[] = [];

    eventByKey: {[key: string]: IEvent} = {};
    contractTrackingByKey: {[key: string]: IContractTracking} = {};

    addressLookup: {[address: string] : {
        address: string
        name: string,
        description: string
    }} = {};

    private eventKey(event: IEvent) {
        return `${event.block_number} ${event.tx_index} ${event.event_idx}`;
    }

    async addEvents(
        events: IEvent[]
    ) {
        for (const event of events) {
            const key = this.eventKey(event);
            if (!this.eventByKey[key]) {
                this.eventByKey[key] = event;
                this.events.push(event);
            } else {
                console.log('skipped event')
            }
        }
    }

    async setTopBlockSynced(topBlockSynced: number) {
        this.topBlockSynced = topBlockSynced;
    }

    async getTopBlockSynced(): Promise<number> {
        return this.topBlockSynced;
    }

    private contractTrackingKey(contractTracking: IContractTracking) {
        return `${contractTracking.key} ${contractTracking.start_block}`;
    }

    async addContractTracking(address: string, name: string, key: string, startBlock: number, endBlock: number = 0) {
        const ct: IContractTracking = {
            address,
            name,
            key,
            start_block: startBlock,
            end_block: endBlock
        };
        const trackingKey = this.contractTrackingKey(ct);
        if (!this.contractTrackingByKey[trackingKey]) {
            this.contractTrackingByKey[trackingKey] = ct;
            this.contractTrackings.push(ct);
        }
    }

    async endContractTracking(key: string, endBlock: number) {
        this.contractTrackings
            .filter(ct => ct.end_block == null)
            .filter(ct => ct.key == key)
            .forEach(ct => ct.end_block = endBlock);
    }

    async  getContractTrackingsInRange(fromBlock: number, toBlock: number): Promise<IContractTracking[]> {
        return this.contractTrackings.filter(tracking => tracking.start_block <= toBlock && (tracking.end_block || toBlock) >= fromBlock)
    }

    async listContractTrackings(): Promise<IContractTracking[]> {
        return this.contractTrackings.slice();
    }

    async getEvents(offset: number, limit: number, eventName?: string, searchText?: string): Promise<{events: IEvent[], total: number}> {
        const events = _.reverse(
            _.sortBy(
                this.events
                .filter(e => !eventName || e.event_name == eventName)
                .filter(e => !searchText || JSON.stringify(e.parsed_data).toLowerCase().includes(searchText.toLowerCase()))
                , ["block_number", "tx_index", "event_idx"]
            )
        );

        return {
            events: events.slice(offset, offset + limit),
            total: events.length
        }
    }

    async setAddressLookup(address: string, name: string, description: string) {
        this.addressLookup[address] = {
            address,
            name,
            description
        }
    }

    async getAddressLookups(): Promise<IAddressLookup[]> {
        return _.values(this.addressLookup);
    }
}

export const memoryStorage = new MemoryStorage();
