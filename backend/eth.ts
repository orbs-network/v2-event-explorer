import Web3 from "web3";
import * as Eth from 'web3-eth-contract';
import * as _ from "lodash";
import {Config} from "./config";
import {compiledContracts, signatureToEvent} from "./compiled-contracts";
import {ethereumCaller} from "./eth-call";
import {IEvent} from "../types";

const web3 = new Web3(
    new Web3.providers.HttpProvider(Config.EthereumUrl)
);

const caller = ethereumCaller(Config.MaxTimeBetweenCallsMs);

export interface IContractMetadata {
    name: string,
    key: string,
    address: string,
}

const contractCache: {[addr: string]: Eth.Contract} = {};
function getContract(name: string, address: string): Eth.Contract {
    if (contractCache[address] == null) {
        const abi = compiledContracts[name].abi;
        contractCache[address] = new web3.eth.Contract(abi, address);
    }

    return contractCache[address];
}

function getContractRegistry(): Eth.Contract {
    return getContract(Config.ContractRegistryName, Config.ContractRegistryAddress)
}

export async function listContracts(): Promise<{[contractAddress: string]: IContractMetadata}> {
    const contracts: {[contractAddress: string]: IContractMetadata} = {
        [Config.ContractRegistryAddress] : {
            name: Config.ContractRegistryName,
            key: "contractRegistry",
            address: Config.ContractRegistryAddress
        }
    };

    const registry = getContractRegistry();
    for (const [name, key] of _.zip(Config.ContractNames, Config.ContractKeys)) {
        console.log('About to call registry get with key:' + key)
        const address = await caller<string>(() => registry.methods.get(key).call());
        console.log('Back from get, address:' + address);
        if (!address || !address.startsWith("0x")) {
            throw new Error(`Unable to retrieve contract address for ${key}`)
        }

        contracts[address] = {
            name: name as string,
            key: key as string,
            address
        }
    }

    return contracts;
}

export async function listEvents(contractMetadata: IContractMetadata, fromBlock: number, toBlock: number): Promise<IEvent[]> {
    const events = await caller(() => web3.eth.getPastLogs({
        address: contractMetadata.address,
        fromBlock,
        toBlock
    }));

    return events.map(event => {
        const eventAbi = signatureToEvent[event.topics[0]].abi;
        const parseData = eventAbi == null ? {
            parsed: false,
            event_name: "<unknown>",
            parsed_data: {}
        } : {
            parsed: true,
            event_name: eventAbi.name,
            parsed_data: _.pickBy(
                web3.eth.abi.decodeLog(eventAbi.inputs, event.data, event.topics.slice(1) /* assume not anonymous */),
                (v, k) => k.length && k != "__length__" && /[0-9]/.exec(k[0]) == null
            )
        }
        return {
            topic: event.topics[0],
            contract_address: event.address,
            block_number: event.blockNumber,
            tx_hash: event.transactionHash,
            tx_index: event.transactionIndex,
            event_idx: event.logIndex,
            data: event.data,
            ...parseData
        }
    });
}

export const FINALLITY = 50;

export async function getLatestBlockNumber(): Promise<number> {
    return (await caller(() => web3.eth.getBlockNumber()) - FINALLITY);
}

export async function getBlockTimestamp(blockNumber: number): Promise<number> {
    return parseInt((await caller(() => web3.eth.getBlock(blockNumber))).timestamp.toString());
}