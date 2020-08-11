import {PersistentStorage, persistentStorage} from "./persistent-storage";
import {MemoryStorage, memoryStorage} from "./memory-storage";
import {Config} from "./config";

export const db: PersistentStorage | MemoryStorage = Config.PersistentStorage ?
    require("./persistent-storage").persistentStorage
    :
    require("./memory-storage").memoryStorage;