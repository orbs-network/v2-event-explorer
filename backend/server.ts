import * as _ from "lodash";
import express from "express";
import {Config} from "./config";
import {eventDefinitions} from "./compiled-contracts";
import {getLatestBlockNumber} from "./eth";
import {db} from "./db";

const app = express()

const apiRouter = express.Router();

apiRouter.get("/events", async (req, res) => {
    try {
        const params: {
            offset: string,
            limit: string,
            eventName?: string,
            searchText?: string
        } = req.query as any;

        res.json(await db.getEvents(
            parseInt(params.offset),
            parseInt(params.limit),
            params.eventName,
            params.searchText
        ));
    } catch (e) {
        console.error(e);
        res.status(500).send({error: e.toString()});
    }
})

apiRouter.get("/address_lookup", async (req, res) => {
    try {
        res.json(await db.getAddressLookups());
    } catch (e) {
        console.error(e);
        res.status(500).send({error: e.toString()});
    }
})

apiRouter.get("/event_names", async (req, res) => {
    try {
        res.json(_.uniq(eventDefinitions.map(e => e.name)));
    } catch (e) {
        console.error(e);
        res.status(500).send({error: e.toString()});
    }
})

apiRouter.get("/sync_status", async (req, res) => {
    try {
        res.json({
            latestBlock: await getLatestBlockNumber(),
            topSyncedBlock: await db.getTopBlockSynced()
        });
    } catch (e) {
        console.error(e);
        res.status(500).send({error: e.toString()});
    }
})

app.use(require("cors")())
app.use('/api', apiRouter);

export function startServer() {
    app.listen(Config.Port, () => {
        console.log(`Events server listening at http://localhost:${Config.Port}`)
    })
}
