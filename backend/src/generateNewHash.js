const bcrypt = require('bcryptjs');
bcrypt.hash('SafePass@AtomQuest!', 10).then(hash => {
  console.log('New Secure Hash:', hash);
}).catch(console.error);
