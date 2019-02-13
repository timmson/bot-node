const bytes = require("bytes");
const si = require("systeminformation");
const log = require("log4js").getLogger("system-info");

log.level = "info";

module.exports = {
    getInfo: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let data = {
                    hw: await si.system(),
                    cpu: await si.cpu(),
                    os: await si.osInfo(),
                    load: await si.currentLoad()
                };
                data.sensors = await si.cpuTemperature();

                data.memory = await si.mem();
                Object.keys(data.memory).forEach(key => data.memory[key] = bytes(data.memory[key]));

                data.process = (await si.processes()).list;
                data.process = Object.keys(data.process).map(p => new Object({
                    cpu: Math.floor(data.process[p].pcpu),
                    command: data.process[p].command
                })).filter(row => row.cpu !== 0).sort((a, b) => a.cpu <= b.cpu).slice(0, 3).reverse();

                data.storage = (await si.fsSize()).map(row => new Object({
                        size: bytes(parseInt(row.size, 10)),
                        used: bytes(row.used),
                    })
                );

                data.network = await si.networkStats();
                data.network = new Object({
                    rx: bytes(data.network.rx),
                    tx: bytes(data.network.tx)
                });
                resolve(data);
            } catch (error) {
                log.error(error);
                reject(error);
            }
        });

    }
};
