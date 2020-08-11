import * as fs from "fs";
import * as path from "path";
import Web3 from "web3";
import {Config} from "./config";

export type CompiledContracts = {[contractName: string]: any};

const EXCLUDE = ["IElections.json"];

function loadCompiledContracts(baseDir: string): CompiledContracts {
    const artifacts: CompiledContracts = {};
    for (const fname of fs.readdirSync(baseDir)) {
        if (EXCLUDE.includes(fname)) continue;

        const name = fname.replace('.json', '');
        const abi = JSON.parse(fs.readFileSync(baseDir + '/' + fname, {encoding:'utf8'}));
        artifacts[name] = abi;
    }
    return artifacts;
}

interface EventDefinition {
    name: string,
    signature: string,
    abi: any,
    contractAbi: any
}

function listEventsDefinitions(contracts: CompiledContracts): EventDefinition[] {
    const defs: EventDefinition[] = [];

    const web3 = new Web3();
    for (const contractName in contracts) {
        const contract = contracts[contractName];
        const eventDefs: EventDefinition[] = contract.abi
            .filter((x: any) => x.type == 'event')
            .map((e: any) => ({
                contractAbi: contract,
                name: e.name,
                abi: e,
                signature: web3.eth.abi.encodeEventSignature(e)
            }));
        defs.push(...eventDefs);
    }

    return defs;
}

export const compiledContracts = loadCompiledContracts(Config.ContractsAbiDirPath);
export const eventDefinitions = listEventsDefinitions(compiledContracts);

export const signatureToEvent: {[sig: string]: EventDefinition} = {}
for (const e of eventDefinitions) {
    signatureToEvent[e.signature] = e;
}