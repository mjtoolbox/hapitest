'use strict';
// const db = require('./db/postgres');

// Don't know how to add dependency on other module

const apiroute = {
  name: 'apiroute',
  version: '1.0.0',
  register: async function (server, options) {
    server.route({
      method: 'GET',
      path: '/',
      handler: async function (request, h) {
        let select =
          "SELECT * FROM expense WHERE trans_date >= '2020/01/01' and trans_date <= '2020/01/31'";
        try {
          const result = await db.query(select);
          // db.end();
          return h.response(result.rows[0]);
        } catch (err) {
          console.log(err);
        }
      },
    });
  },
};
module.exports = apiroute;
