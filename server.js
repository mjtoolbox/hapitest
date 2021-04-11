'use strict';

// const connectionString = 'postgres://postgres:docker@localhost:5432/postgres';
const Hapi = require('@hapi/hapi');
const db = require('./db/postgres');

const init = async () => {
  const server = Hapi.server({
    port: 3000,
    host: 'localhost',
  });

  console.log(`DB URL is ${process.env.DATABASE_URL}`);
  server.route({
    method: 'GET',
    path: '/',
    handler: async function (request, h) {
      let select =
        "SELECT * FROM expense WHERE trans_date >= '2020/01/01' and trans_date <= '2020/01/31'";
      try {
        const result = await db.query(select);
        db.end();
        return h.response(result.rows[0]);
      } catch (err) {
        console.log(err);
      }
    },
  });
  await server.start();
  console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});

init();
