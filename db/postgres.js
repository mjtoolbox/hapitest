const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({
  connectionString,
});

module.exports = {
  query: (text, params, callback) => {
    return pool.query(text, params, callback);
  },
  end: () => {
    pool.end();
  },
};

// module.exports = {
//   query: (text, params, callback) => {
//     pool.connect().then((client) => {
//       return client
//         .query(text, params, callback)
//         .then((res) => {
//           client.release();
//         })
//         .catch((err) => {
//           client.release();
//           console.log(err.stack);
//         });
//     });
//   },
// };
