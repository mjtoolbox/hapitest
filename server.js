'use strict';

// const connectionString = 'postgres://postgres:docker@localhost:5432/postgres';
const dotenv = require('dotenv');
dotenv.config();

const Hapi = require('@hapi/hapi');
const db = require('./db/postgres');

const init = async () => {
  const server = Hapi.server({
    port: 3000,
    host: 'localhost',
  });

  console.log(`DB URL is ${process.env.DATABASE_URL}`);

  // Route
  server.route({
    method: 'GET',
    path: '/',
    handler: async function (request, h) {
      let select = 'SELECT * FROM expense';
      try {
        const result = await db.query(select);
        db.end();
        return h.response(result.rows);
      } catch (err) {
        console.log(err);
      }
    },
  });

  // fy=true&year=2021&month=4&code=BMC
  server.route({
    method: 'GET',
    path: '/all',
    handler: async function (request, h) {
      const fy = request.query.fy;
      const year = request.query.year;
      const month = request.query.month;
      const code = request.query.code;
      const orderby = request.query.orderby
        ? request.query.orderby
        : 'trans_date';
      const sort = request.query.sort ? request.query.sort : 'asc';

      // Business logic to translate to SQL
      var startDate;
      var endDate;
      var newYear;
      if (month) {
        // When month is presented, doesn't matter if fy=true or false.
        if (year) {
          startDate = year + '/' + month + '/01';
          endDate = year + '/' + month + '/31';
        } else {
          console.log('Year must not be empty when month is defined.');
        }
      } else {
        // month is empty
        if (year) {
          // year must not empty
          if (fy === 'true') {
            startDate = year + '/04/01';
            newYear = parseInt(year) + 1;
            endDate = newYear + 1 + '/03/31';
          } else if (fy === 'false') {
            startDate = year + '/01/01';
            endDate = year + '/12/31';
          } else {
            console.log('Error fy value: ' + fy);
          }
        } else {
          console.log('Year must not be empty.');
        }
      }

      let select = `SELECT * FROM expense WHERE trans_date >= '${startDate}' and trans_date <= '${endDate}'`;
      if (code) {
        select = select + " and code = '" + code + "'";
      }
      select = select + ' order by ' + orderby + ' ' + sort;

      try {
        console.log(select);
        const result = await db.query(select);
        return h.response(result.rows);
      } catch (err) {
        console.log(err);
      }
    },
  });

  server.route({
    method: 'GET',
    path: '/filter',
    handler: async function (request, h) {
      const fy = request.query.fy;
      const year = request.query.year;
      const month = request.query.month;
      const code = request.query.code;
      const orderby = request.query.orderby
        ? request.query.orderby
        : 'trans_date';
      const sort = request.query.sort ? request.query.sort : 'asc';

      // Business logic to translate to SQL
      var startDate;
      var endDate;
      var newYear;
      if (month) {
        // When month is presented, doesn't matter if fy=true or false.
        if (year) {
          startDate = year + '/' + month + '/01';
          endDate = year + '/' + month + '/31';
        } else {
          console.log('Year must not be empty when month is defined.');
        }
      } else {
        // month is empty
        if (year) {
          // year must not empty
          if (fy === 'true') {
            startDate = year + '/04/01';
            newYear = parseInt(year) + 1;
            endDate = newYear + 1 + '/03/31';
          } else if (fy === 'false') {
            startDate = year + '/01/01';
            endDate = year + '/12/31';
          } else {
            console.log('Error fy value: ' + fy);
          }
        } else {
          console.log('Year must not be empty.');
        }
      }

      let select = `SELECT * FROM expense WHERE trans_date >= '${startDate}' and trans_date <= '${endDate}' and category not like '%exclude%'`;
      if (code) {
        select = select + " and code = '" + code + "'";
      }
      select = select + ' order by ' + orderby + ' ' + sort;

      try {
        console.log(select);
        const result = await db.query(select);
        return h.response(result.rows);
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
