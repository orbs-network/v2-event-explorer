import {observable} from "mobx";

import {FrontendConfig} from "./frontend-config";
import {IAddressLookup, IEvent} from "../../types";

export class Events {

    offset: number = 0;
    limit: number = 10;
    searchText: string = "";
    eventName: string = "";

    @observable loading: boolean = true;
    @observable error: Error = null;
    @observable events: IEvent[] = [];
    @observable totalEvents: number;
    @observable addressLookup: {[address: string]: IAddressLookup} = {};
    @observable eventNames: string[] = [];
    @observable syncStatus: {latestBlock: number, topSyncedBlock: number} = null;

    constructor() {
    }

    setQueryParams() {
        const params = new URLSearchParams(window.location.search);
        params.set("offset", this.offset.toString());
        params.set("limit", this.limit.toString());
        params.set("searchText", this.searchText.toString());
        params.set("eventName", this.eventName.toString());
        if (params.toString() != window.location.search) {
            window.history.pushState({}, null, window.location.pathname + '?' + params.toString());
        }
    }

    async load() {
        this.setQueryParams();

        this.loading = true;
        this.error = null;
        this.events = [];

        try {
            const qs = this.getQuerystring();
            await this.loadAddressLookup();
            await this.loadEventNames();
            await this.loadSyncStatus();
            const r = await fetch(FrontendConfig.ApiBaseUrl + '/events?' + qs);
            if (this.getQuerystring() == qs) {
                const data = await r.json();
                this.events = data.events;
                this.totalEvents = data.total;
            }

        } catch (e) {
            this.error = e;
        }

        this.loading = false;
    }

    async loadAddressLookup() {
        const r = await fetch(FrontendConfig.ApiBaseUrl + '/address_lookup');
        const lookups: IAddressLookup[] = await r.json();
        const lookupMap: Events["addressLookup"] = {};
        for (const l of lookups) {
            lookupMap[l.address.toLowerCase()] = l;
        }
        this.addressLookup = lookupMap;
    }

    async loadEventNames() {
        const r = await fetch(FrontendConfig.ApiBaseUrl + '/event_names');
        this.eventNames = await r.json();
    }

    async loadSyncStatus() {
        const r = await fetch(FrontendConfig.ApiBaseUrl + '/sync_status');
        this.syncStatus = await r.json();
    }

    lookupAddress(address: string): IAddressLookup {
        return this.addressLookup[address.toLowerCase()];
    }

    private getQuerystring(): string {
        const params = new URLSearchParams("");
        params.set("offset", this.offset.toString());
        params.set("limit", this.limit.toString());
        if (this.searchText) {
            params.set("searchText", this.searchText);
        }
        if (this.eventName) {
            params.set("eventName", this.eventName);
        }
        return params.toString();
    }

}