import {getBlockTimestamp, getLatestBlockNumber, IContractMetadata, listContracts, listEvents} from "./eth";
import {
    IContractTracking,
    persistentStorage
} from "./persistent-storage";
import * as _ from "lodash";
import {Config} from "./config";
import {sleep} from "./eth-call";
import {IEvent} from "../types";
import {db} from "./db";

let latestEthBlockCache: number;

const contractKeyToName: {[key: string]: string} = {}

for (const [key, name] of _.zip(Config.ContractKeys, Config.ContractNames)) {
    contractKeyToName[key as string] = name as string;
}

async function getLatestBlockFromCache(blockUnderSync: number): Promise<number> {
    if (latestEthBlockCache == null || latestEthBlockCache <= blockUnderSync) {
        latestEthBlockCache = await getLatestBlockNumber();
    }
    return latestEthBlockCache
}

function chunkEventsByBlock(sortedEvents: IEvent[]): Array<IEvent[]> {
    const chunks: Array<IEvent[]> = [];
    for (const e of sortedEvents) {
        if (chunks.length == 0 || chunks[chunks.length - 1][0].block_number != e.block_number) {
            chunks.push([]);
        }
        chunks[chunks.length - 1].push(e);
    }
    return chunks;
}

class EventCollector {
    constructor() {};

    private calcToBlock(fromBlock: number, latestBlock: number, contractTrackings: IContractTracking[]): number {
        const minTrackingEdge = Math.min.apply(null, contractTrackings.map(t => t.end_block || latestBlock))
        return Math.min.call(null, fromBlock + 20000, latestBlock, minTrackingEdge)
    }

    private async collect(): Promise<{remainingBlocks: number}> {
        const fromBlock = Math.max(await db.getTopBlockSynced() + 1, Config.startBlock);
        const latestBlock = await getLatestBlockFromCache(fromBlock);
        const contractTrackings = await db.getContractTrackingsInRange(fromBlock, latestBlock);
        let toBlock = this.calcToBlock(fromBlock, latestBlock, contractTrackings);

        if (fromBlock > toBlock) {
            return {remainingBlocks: 0};
        }

        const uniqTrackings = _.uniqBy(contractTrackings, tracking => tracking.address);
        let events: IEvent[] = [];
        for (const tracking of uniqTrackings) {
            if (tracking.key.startsWith('_')) continue;
            events = events.concat(
                await listEvents(tracking, fromBlock, toBlock)
            )
        }

        events = _.sortBy(events, ["blockNumber", "txIndex", "eventIdx"]);

        let eventsToAdd: IEvent[] = []

        for (const blockEvents of chunkEventsByBlock(events)) {
            const timestamp = await getBlockTimestamp(blockEvents[0].block_number);
            blockEvents.forEach(event => event.event_timestamp_seconds = timestamp)
            eventsToAdd = eventsToAdd.concat(blockEvents);

            const stop = await this.handleBlockEvents(blockEvents);
            if (stop) {
                toBlock = blockEvents[0].block_number;
                break;
            }
        }

        await db.addEvents(eventsToAdd);
        console.log(`[Collector]: Added ${eventsToAdd.length} events in blocks ${fromBlock} -> ${toBlock}`);

        await db.setTopBlockSynced(toBlock);

        return {remainingBlocks: latestBlock - toBlock};
    }

    async start() {
        await db.addContractTracking(Config.ContractRegistryAddress, Config.ContractRegistryName, "contractRegistry", Config.startBlock);
        for (;;) {
            try {
                const {remainingBlocks} = await this.collect();
                if (remainingBlocks < 10) {
                    await sleep(30*1000);
                }
            } catch(e) {
                console.error(new Error(`collect function returned with error: ${e.toString()}`))
                await sleep(10*1000);
            }
        }ª
    }

    private async handleBlockEvents(blockEvents: IEvent[]): Promise<boolean> {
        let registryChangeFound = false;
        for (const event of blockEvents) {
            if (event.contract_address == Config.ContractRegistryAddress && event.event_name == 'ContractAddressUpdated') {
                console.log(`[Collector]: Contract address change ${event.parsed_data.contractName} -> ${event.parsed_data.addr}`);
                await db.endContractTracking(event.parsed_data.contractName, event.block_number - 1);
                await db.addContractTracking(event.parsed_data.addr, contractKeyToName[event.parsed_data.contractName] || "<unknown contract>", event.parsed_data.contractName, event.block_number)
                await db.setAddressLookup(event.parsed_data.addr, event.parsed_data.contractName, contractKeyToName[event.parsed_data.contractName] || "<unknown contract>");
                registryChangeFound = true;
            }

            if (event.event_name == 'GuardianDataUpdated') {
                await db.setAddressLookup(event.parsed_data.addr, `${event.parsed_data.name} [Guardian]`,  `${event.parsed_data.name} [Guardian]`)
                await db.setAddressLookup(event.parsed_data.orbsAddr, `${event.parsed_data.name} [Node]`,  `${event.parsed_data.name} [Node]`)
            }
        }

        return registryChangeFound;
    }
}

export function startCollecting() {
    new EventCollector().start()
        .then(
            () => console.error(new Error(`Collector returned unexpectedly`)),
            (e) => console.error(new Error(`Collector returned unexpectedly with error: ${e.toString()}`))
        );
}

