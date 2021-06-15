/**
 * Created by Jérémy on 08/05/2017.
 */
const {connect} = require('./db');
const {ServiceManager} = require('./services');

const manager = new ServiceManager();

(async () => {
    let db = await connect();
    await manager.init();

    let services = await manager.all();

    for (let service of services) {
        await manager.stop(service);
        await manager.uninstall(service);

        service.installed = false;
        service.started = false;
        await service.save();
    }

    await db.connection.close();
    process.exit(1);
})();
