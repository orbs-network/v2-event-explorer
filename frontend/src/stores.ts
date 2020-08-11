import {Events} from "./events";

export interface IStores {
    events: Events
}

export function createStores(): IStores {
    return {
        events: new Events()
    }
}