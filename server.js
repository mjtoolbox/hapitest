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
        console.log(result.rowCount);
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
        console.log(result.rowCount);
        return h.response(result.rows);
      } catch (err) {
        console.log(err);
      }
    },
  });

  server.route({
    method: 'POST',
    path: '/create',
    handler: async function (request, h) {
      const expense = JSON.parse(request.payload);
      let insert = `INSERT INTO expense (trans_date, code, description, amount, gst, credit, category, confidence) VALUES (
        '${expense.trans_date}', '${expense.code}', '${expense.description}', ${expense.amount}, ${expense.gst}, '${expense.credit}', '${expense.category}', ${expense.confidence}) RETURNING *`;
      try {
        const result = await db.query(insert);
        return h.response(result.rows[0]);
      } catch (err) {
        console.log(err);
      }
    },
  });

  server.route({
    method: 'PUT',
    path: '/edit/{id}',
    handler: async function (request, h) {
      const id = parseInt(request.params.id);
      const expense = JSON.parse(request.payload);

      let update = `UPDATE expense SET trans_date = '${expense.trans_date}', code = '${expense.code}', description = '${expense.description}', amount = ${expense.amount}, gst = ${expense.gst}, credit = '${expense.credit}', category = '${expense.category}', confidence = ${expense.confidence} WHERE id=${id} RETURNING *`;
      try {
        const result = await db.query(update);
        return h.response(result.rows[0]);
      } catch (err) {
        console.log(err);
      }
    },
  });

  server.route({
    method: 'PUT',
    path: '/applygst/{id}',
    handler: async function (request, h) {
      const id = parseInt(request.params.id);
      const expense = JSON.parse(request.payload);
      const amount = parseFloat(expense.amount);
      const gst = amount - amount / 1.05;
      console.log(gst);

      let update = `UPDATE expense SET gst = ${gst} WHERE id=${id} RETURNING *`;
      try {
        const result = await db.query(update);
        return h.response(result.rows[0]);
      } catch (err) {
        console.log(err);
      }
    },
  });

  const formattedNow = () => {
    var d = new Date();
    return d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate();
  };

  // Lead by Description and Category
  server.route({
    method: 'GET',
    path: '/find',
    handler: async function (request, h) {
      const description = request.query.description
        ? request.query.description
        : '';
      const category = request.query.category
        ? ' and category=' + "'${request.query.category}'"
        : '';
      const code = request.query.code
        ? ' and code=' + "'${request.query.code}'"
        : '';
      const trans_date = request.query.trans_date
        ? ' and trans_date=' + "'${request.query.tran_date}'"
        : '';
      const orderby = request.query.orderby
        ? request.query.orderby
        : 'trans_date';
      const sort = request.query.sort ? request.query.sort : 'asc';

      let select = `SELECT * FROM expense WHERE LOWER(description) like LOWER('%${description}%')`;
      select =
        select +
        category +
        code +
        trans_date +
        ' order by ' +
        orderby +
        ' ' +
        sort;

      try {
        console.log(select);
        const result = await db.query(select);
        console.log(result.rowCount);
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
