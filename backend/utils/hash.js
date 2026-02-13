const bcrypt = require('bcryptjs');

async function hashPassword() {
    const password = 'admin@shopera.eg';
    const hashed = await bcrypt.hash(password, 10);
    console.log(hashed);
}

hashPassword();
