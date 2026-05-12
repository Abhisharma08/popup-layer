require('dotenv').config();
const createApp = require('./src/app');

const app = createApp();
app.listen(process.env.PORT || 4000, () => {
  console.log('Server running on port ' + (process.env.PORT || 4000));
});
