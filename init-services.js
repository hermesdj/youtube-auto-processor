/**
 * Created by Jérémy on 06/05/2017.
 * Index file used to boot up system
 */
const {connect} = require('./db');
const ServiceManager = require('./services');

const manager = new ServiceManager();

(async () => {
    let db = await connect();
    await manager.init();

    await db.connection.close();
    process.exit(1);
})();
