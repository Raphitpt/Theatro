require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Administrator = require('../models/Administrator');

async function createAdmin() {
  await mongoose.connect(process.env.MONGO_DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const existingAdmin = await Administrator.find({});

  if (existingAdmin.length === 0) {
    const adminCredentials = {
      name: process.env.ADMIN_NAME,
      firstname: process.env.ADMIN_FIRSTNAME,
      mail: process.env.ADMIN_MAIL,
      password: process.env.ADMIN_PASSWORD,
    };

    adminCredentials.password = await bcrypt.hash(adminCredentials.password, 10);

    await Administrator.create(adminCredentials);

    console.log('Admin user created successfully');
  } else {
    console.log('Admin user already exists');
  }

  await mongoose.disconnect();

}

createAdmin().then(() => {
  console.log('Admin seeding completed');
  process.exit(0);
}).catch((err) => {
  console.error('Error seeding admin:', err);
  process.exit(1);
});