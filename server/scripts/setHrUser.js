const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const updated = await User.findOneAndUpdate(
    { email: 'hr@nyais.com' },
    {
      $set: {
        name: 'Devanshi Sharma',
        role: 'hr',
        isActive: true,
      },
      $unset: { team: 1 },
    },
    { new: true }
  );

  if (!updated) {
    console.log('No user found with email hr@nyais.com');
  } else {
    console.log('HR user updated:');
    console.log({
      name: updated.name,
      email: updated.email,
      role: updated.role,
      team: updated.team || null,
    });
  }

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
