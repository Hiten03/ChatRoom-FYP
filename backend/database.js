// const mongoose = require('mongoose');
// function DbConnect() {
//     const DB_URL = process.env.DB_URL;
//     // Database connection
//     mongoose.connect(DB_URL, {
//         useNewUrlParser: true,
//         useUnifiedTopology: true,
//         useFindAndModify: false,
//     });
//     const db = mongoose.connection;
//     db.on('error', console.error.bind(console, 'connection error:'));
//     db.once('open', () => {
//         console.log('DB connected...');
//     });
// }

// module.exports = DbConnect;


const mongoose = require('mongoose');

function DbConnect() {
  const DB_URL = process.env.DB_URL;

  mongoose.connect(DB_URL)
    .then(() => {
      console.log('✅ DB Connected Successfully');
    })
    .catch((err) => {
      console.error('❌ DB Connection Error:', err);
    });
}

module.exports = DbConnect;
