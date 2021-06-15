/**
 * Created by Jérémy on 06/05/2017.
 * Index file used to boot up system
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const {connect} = require('./db');
const ServiceManager = require('./services');

const manager = new ServiceManager();

(async () => {
    let db = await connect();
    await manager.init();

    let services = await manager.all();

    for (let service of services) {
        await manager.install(service);

        service.installed = true;
        service.started = false;
        await service.save();
    }

    await sleep(3000);

    await db.connection.close();
    process.exit(1);
})();
