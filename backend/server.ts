import * as _ from "lodash";
import express from "express";
import {Config} from "./config";
import {eventDefinitions} from "./compiled-contracts";
import {getLatestBlockNumber} from "./eth";
import {db} from "./db";

const app = express()

const apiRouter = express.Router();

apiRouter.get("/events", async (req, res) => {
    const params: {
        offset: number,
        limit: number,
        eventName?: string,
        searchText?: string
    } = req.query as any;

    res.json(await db.getEvents(
        params.offset,
        params.limit,
        params.eventName,
        params.searchText
    ));
})

apiRouter.get("/address_lookup", async (req, res) => {
    res.json(await db.getAddressLookups());
})

apiRouter.get("/event_names", async (req, res) => {
    res.json(_.uniq(eventDefinitions.map(e => e.name)));
})

apiRouter.get("/sync_status", async (req, res) => {
    res.json({
        latestBlock: await getLatestBlockNumber(),
        topSyncedBlock: await db.getTopBlockSynced()
    });
})

app.use(require("cors")())
app.use('/api', apiRouter);

export function startServer() {
    app.listen(Config.Port, () => {
        console.log(`Events server listening at http://localhost:${Config.Port}`)
    })
}
