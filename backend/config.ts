export const Config = {
    // db
    PostgresConnStr: process.env.POSTGRES_CONN_STR || "postgresql://localhost:5432/postgres",

    // Ethereum node
    EthereumUrl: process.env.ETHEREUM_URL || "https://mainnet.infura.io/v3/13a2077319f44f2a85c0c41aaf858e25",
    MaxTimeBetweenCallsMs: 300,

    // Contracts
    ContractRegistryName: "ContractRegistry",
    ContractRegistryAddress: process.env.CONTRACT_REGISTRY_ADDRESS || "0xD859701C81119aB12A1e62AF6270aD2AE05c7AB3",
    ContractNames: process.env.CONTRACT_NAMES ? JSON.parse(process.env.CONTRACT_NAMES || "") : [
        'StakingContractHandler',
        'Protocol',
        'StakingRewards',
        'FeesAndBootstrapRewards',
        'Committee',
        'Elections',
        'Delegations',
        'GuardiansRegistration',
        'Certification',
        'StakingContract',
        'Subscriptions',
        'ProtocolWallet',
        'ProtocolWallet',
        'FeesWallet',
        'FeesWallet'
    ],
    ContractKeys: process.env.CONTRACT_KEYS ? JSON.parse(process.env.CONTRACT_KEYS || "") : [
        "stakingContractHandler",
        "protocol",
        "stakingRewards",
        "feesAndBootstrapRewards",
        "committee",
        "elections",
        "delegations",
        "guardiansRegistration",
        "certification",
        "staking",
        "subscriptions",
        "stakingRewardsWallet",
        "bootstrapRewardsWallet",
        "generalFeesWallet",
        "certifiedFeesWallet"
    ],

    InitialAddresses: {
    },

    ContractsAbiDirPath: "../node_modules/@orbs-network/orbs-ethereum-contracts-v2/release/build/contracts",

    startBlock: parseInt(process.env.START_BLOCK || (11054300).toString()),

    // Server
    Port: process.env.PORT || 8123,

    PersistentStorage: process.env.STORAGE_TYPE == 'persistent'
}