export const Config = {
    // db
    PostgresConnStr: process.env.POSTGRES_CONN_STR || "postgresql://localhost:5432/postgres",

    // Ethereum node
    EthereumUrl: process.env.ETHEREUM_URL || "https://mainnet.infura.io/v3/13a2077319f44f2a85c0c41aaf858e25",
    MaxTimeBetweenCallsMs: 200,

    // Contracts
    ContractRegistryName: "ContractRegistry",
    ContractRegistryAddress: process.env.CONTRACT_REGISTRY_ADDRESS || "0x10bFdCc77E998Eb849a18c79b880F8b9BE06Ad83",
    ContractNames: process.env.CONTRACT_NAMES ? JSON.parse(process.env.CONTRACT_NAMES || "") : ['Protocol',
        'Rewards',
        'Committee',
        'Elections',
        'Delegations',
        'GuardiansRegistration',
        'Certification',
        'StakingContract',
        'Subscriptions',
        'ProtocolWallet',
        'ProtocolWallet',
        // 'FeesWallet',
        // 'FeesWallet'
    ]
    ,
    ContractKeys: process.env.CONTRACT_KEYS ? JSON.parse(process.env.CONTRACT_KEYS || "") : [
        "protocol",
        "rewards",
        "committee",
        "elections",
        "delegations",
        "guardiansRegistration",
        "certification",
        "staking",
        "subscriptions",
        "stakingRewardsWallet",
        "bootstrapRewardsWallet",
        // "generalFeesWallet",
        // "certifiedFeesWallet"
    ],
    ContractsAbiDirPath: "../abi",

    startBlock: parseInt(process.env.START_BLOCK || (10503643).toString()),

    // Server
    Port: process.env.PORT || 8123,

    PersistentStorage: process.env.STORAGE_TYPE == 'persistent'
}