export const Config = {
    // db
    PostgresConnStr: process.env.POSTGRES_CONN_STR || "postgresql://localhost:5432/postgres",

    // Ethereum node
    EthereumUrl: process.env.ETHEREUM_URL || "https://mainnet.infura.io/v3/9ed81f1575464b3e9db4187ee4fa1f8a",
    MaxTimeBetweenCallsMs: 300,

    // Contracts
    ContractRegistryName: "ContractRegistry",
    ContractRegistryAddress: process.env.CONTRACT_REGISTRY_ADDRESS || "0x5454223e3078Db87e55a15bE541cc925f3702eB0",
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
        "guardiansRegistration": "0xAB7F3d56Da621Cff1F5646642d7F79f6A201E4eD"
    },

    ContractsAbiDirPath: "../node_modules/@orbs-network/orbs-ethereum-contracts-v2/release/build/contracts",

    startBlock: parseInt(process.env.START_BLOCK || (11054300).toString()),

    // Server
    Port: process.env.PORT || 8123,

    PersistentStorage: process.env.STORAGE_TYPE == 'persistent'
}