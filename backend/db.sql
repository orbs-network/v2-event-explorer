CREATE TABLE state (
    top_block_synced INTEGER,

    onerow_id bool PRIMARY KEY DEFAULT TRUE,
    CONSTRAINT onerow_uni CHECK (onerow_id)
);
INSERT INTO state (top_block_synced) VALUES (0);

CREATE TABLE contracts (
    contract_id SERIAL PRIMARY KEY,
    address varchar(42) NOT NULL,
    name varchar(100) NOT NULL,
    key varchar(100) NOT NULL,
    start_block INTEGER NOT NULL,
    end_block INTEGER NOT NULL
);
CREATE UNIQUE INDEX contracts_idx_0 ON contracts (address, start_block);

CREATE TABLE events (
    event_id SERIAL PRIMARY KEY,
    event_timestamp_seconds INTEGER NOT NULL,
    contract_address VARCHAR(42) NOT NULL,
    block_number INTEGER NOT NULL,
    tx_hash VARCHAR(66) NOT NULL,
    tx_index INTEGER NOT NULL,
    event_idx INTEGER NOT NULL,
    topic VARCHAR(66) NOT NULL,
    data TEXT NOT NULL,
    parsed BOOL NOT NULL,
    event_name VARCHAR(100) NOT NULL,
    parsed_data JSONB NOT NULL
);
CREATE UNIQUE INDEX events_idx_0 ON events (block_number, tx_index, event_idx);

CREATE TABLE address_lookup (
    address VARCHAR(42) NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL
);
CREATE UNIQUE INDEX address_lookup_idx_0 ON address_lookup (address);