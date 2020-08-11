export function ethereumCaller(delayBetweenCalls: number) {
    let lastCalledAt = 0;
    let p: Promise<any> = Promise.resolve();
    return async function <TRet>(f: () => Promise<TRet>): Promise<TRet> {
        p = p.then(async () => {
            if (Date.now() < lastCalledAt + delayBetweenCalls) {
                await sleep(lastCalledAt + delayBetweenCalls - Date.now());
            }
            return f();
        })
        return p as Promise<TRet>;
    }
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));