import * as React from "react";
import * as _ from "lodash";
import moment from "moment";
import {inject, observer} from "mobx-react";
import {Events} from "./events";
import './events-page.css';
import {FrontendConfig} from "./frontend-config";
import {
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow
} from "@material-ui/core";
import SearchIcon from '@material-ui/icons/Search';
import {IEvent} from "../../types";
import RefreshIcon from '@material-ui/icons/Refresh';

const capitalize = (s: string) => s == "" ? s : s[0].toUpperCase() + s.slice(1);

const ErrorMsg = (props: {err: Error}) => <div className="error-msg-container">
    <div className="error-header">Error loading events</div>
    <div className="error-txt">{props.err.toString()}</div>
</div>;

const EtherscanAddressLink = (props: {addr: string, caption?: string}) => (<a target="_blank" href={"https://etherscan.io/address/" + props.addr}>{props.caption || props.addr}</a>);
const EtherscanBlockLink = (props: {block: number, caption?: string}) => (<a target="_blank" href={"https://etherscan.io/block/" + props.block.toString()}>{props.caption || '#' + props.block}</a>);
const EtherscanTxnLink = (props: {txn: string, caption?: string}) => (<a target="_blank" href={"https://etherscan.io/tx/" + props.txn.toString()}>{props.caption || props.txn}</a>);

const LoadingMsg = () => <div className={"loading-msg"}><span>Loading..</span></div>

function isTabular(event: IEvent): boolean {
    const vals = _.values(event.parsed_data);
    return vals.length != 0 &&
        vals.filter(x => !Array.isArray(x)).length == 0 &&
        vals.filter(x => x.length != vals[0].length).length == 0
}

const ADDR_PATTERN = /^0x[0-9a-fA-F]{40}$/
const isAddress = (addr: string) => ADDR_PATTERN.exec(addr);

function enrichTabular(data: any) {
    const enriched: any = {};
    for (const k of Object.keys(data)) {
        enriched[k] = data[k];
        if (k.toLowerCase() == "weights") {
            const total = _.sum(enriched[k].map((v: string) => parseInt(v)));
            enriched[k] = enriched[k].map((v: string) => `${v} (${Math.floor(parseInt(v) / total * 100)}%)`);
        }
    }
    return enriched;
}

@inject("events")
@observer
export class EventsExplorerPage extends React.Component<{events?: Events}, {}> {
    private eventNameInput: HTMLInputElement;
    private searchTextInput: HTMLInputElement;

    componentDidMount() {
        const load = () => {
            const params = new URLSearchParams(window.location.search);
            this.searchTextInput.value = params.get("searchText") || "";
            this.eventNameInput.value = params.get("eventName") || "";
            this.props.events.limit = parseInt(params.get("limit")) || 10;
            this.search(parseInt(params.get("offset")) || 0);
        }
        load();
        window.onpopstate = () => {
            load();
        };
    }

    render() {
        const eventsStore = this.props.events;
        const {syncStatus} = eventsStore;
        const remainingBlocks = syncStatus != null ? syncStatus.latestBlock - syncStatus.topSyncedBlock : 0;
        return <div>
            <div className="header">
                <img src={FrontendConfig.FrontendBaseUrl + '/orbs-logo.svg'}/>
                <span style={{fontSize: 53}}>ORBS v2</span>
                <span style={{fontSize: 53, marginLeft: 40, fontWeight: "normal"}}>Event Explorer</span>
                <div style={{flex: 1}}></div>
                {syncStatus && <span style={{fontSize: 15}}>
                    {remainingBlocks > 10 ?
                        <span>Sync status: {remainingBlocks} blocks remaining</span>
                        :
                        <span>Sync status: complete</span>
                    }
                    <IconButton aria-label="Refresh" onClick={() => this.search()}>
                        <RefreshIcon style={{color: "white"}}/>
                    </IconButton>
                </span>}
            </div>

            <div className="events-body">
                {eventsStore.loading && <LoadingMsg/>}
                {eventsStore.error && <ErrorMsg err={eventsStore.error}/>}
                <div className="search-box">
                    <form onSubmit={(e) => {e.preventDefault(); this.search()}}>
                        <span>Filter by &nbsp;</span>
                        <datalist id={"events-list"}>
                            {eventsStore.eventNames.sort().map(name => <option value={name}/>)}
                        </datalist>
                        <input ref={e => this.eventNameInput = e} placeholder={"Event Name"} list={"events-list"}/>
                        <span>&nbsp;and/or&nbsp;</span>
                        <input ref={e => this.searchTextInput = e} placeholder={"Address, Number, Text, etc.."}/>
                        <IconButton aria-label="Search" onClick={() => this.search()}>
                            <SearchIcon/>
                        </IconButton>
                        <input type="submit"
                               style={{position: "absolute", "left": -9999, width: 1, height: 1}}
                               tabIndex={-1}/>
                        <TablePagination className={"table-pagination"}
                                         rowsPerPageOptions={[5]}
                                         component="span"
                                         count={eventsStore.totalEvents || -1}
                                         rowsPerPage={eventsStore.limit}
                                         page={eventsStore.offset / eventsStore.limit}
                                         onChangePage={(e, page: number) => { eventsStore.offset = eventsStore.limit * page; eventsStore.load() }}
                                         onChangeRowsPerPage={() => {}}
                        />
                    </form>
                </div>
                <div className="events-container">
                    <TableContainer className={"events-table"}>
                        <Table stickyHeader aria-label="sticky table">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Timestamp (UTC)</TableCell>
                                    <TableCell>Contract</TableCell>
                                    <TableCell>Event</TableCell>
                                    <TableCell>Data</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                { eventsStore.events.map(event =>
                                    <TableRow hover role="checkbox" tabIndex={-1}>
                                        <TableCell>
                                            <div style={{display: "inlineBlock", paddingTop: 17}}>
                                                {moment.utc(event.event_timestamp_seconds * 1000).format("MMMM Do YYYY, HH:mm:ss")}<br/>
                                                <span className={"block-span"} style={{fontSize: 12}}> Block <EtherscanBlockLink block={event.block_number}/>&nbsp;&nbsp;&nbsp;</span><EtherscanTxnLink txn={event.tx_hash} caption={"Txn"}/>
                                            </div>
                                        </TableCell>
                                        <TableCell><EtherscanAddressLink addr={event.contract_address} caption={capitalize((eventsStore.lookupAddress(event.contract_address) || {name: "<unknown>"}).name)}/></TableCell>
                                        <TableCell><span style={{fontSize: 20, fontWeight: 500}}>{event.event_name}</span></TableCell>
                                        <TableCell>{this.renderEventData(event)}</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </div>
            </div>
        </div>
    }

    private search(offset?: number) {
        const eventsStore = this.props.events;
        eventsStore.offset = offset || 0;
        eventsStore.eventName = this.eventNameInput.value.trim();
        eventsStore.searchText = this.searchTextInput.value.trim();
        eventsStore.load();
    }

    private renderEventData(event: IEvent){
        if (!event.parsed) {
            return <pre style={{display: 'inline-block', maxWidth: 150}}>{event.data}</pre>
        }

        if (isTabular(event)) {
            const data = enrichTabular(event.parsed_data);
            const keys = Object.keys(data);
            return <Table className={"tabular-event-data"} size="small">
                <TableHead>
                    <TableRow>
                        {keys.map(k => <TableCell>{k}</TableCell>)}
                    </TableRow>
                </TableHead>
                <TableBody>
                {
                    _.zip.apply(null, keys.map(k => data[k]))
                        .map(values =>
                            <TableRow>
                                {values.map(v => <TableCell>{this.renderValue(v.toString())}</TableCell>)}
                            </TableRow>
                        )
                }
                </TableBody>
            </Table>
        }
        return <Table size="small" className={"tabular-event-data"}>
            <TableBody>{
            Object.keys(event.parsed_data).map(
                k => <TableRow>
                    <TableCell><span style={{fontWeight: 500}}>{k}</span></TableCell>
                    <TableCell>{this.renderValue(event.parsed_data[k].toString())}</TableCell>
                </TableRow>
            )}
            </TableBody>
        </Table>
    }

    private renderValue(value: string) {
        const lookup = this.props.events.lookupAddress(value);
        return <span>
            {lookup != null ?
                <span>{lookup.name} {this.ethereumAddr(value)}</span>
                :
                isAddress(value) ?
                    this.ethereumAddr(value)
                    :
                    value
            }
        </span>
    }

    private ethereumAddr(addr: string) {
        return <span>
            <EtherscanAddressLink addr={addr}/>
            <IconButton style={{padding: "0 0 0 5px"}}>
                <SearchIcon onClick={() => {
                    this.searchTextInput.value = addr;
                    this.search();
                }}/>
            </IconButton>
        </span>
    }
}