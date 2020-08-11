export interface IEvent {
    event_timestamp_seconds?: number,
    topic: string,
    contract_address: string,
    block_number: number,
    tx_hash: string,
    tx_index: number,
    event_idx: number,
    data: string,
    parsed: boolean,

    event_name: string,
    parsed_data: any
}

export interface IAddressLookup {
    address: string;
    name: string;
    description: string;
}