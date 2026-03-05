const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
const Test = sequelize.define('Test', { name: DataTypes.STRING });
async function run() {
  await sequelize.sync();
  const d = new Date('2026-03-04T23:31:00.000Z');
  const t = await Test.create({ name: 'test', createdAt: d });
  const fetched = await Test.findOne();
  console.log('Original Date object:', d.toISOString());
  if (fetched.dataValues.createdAt instanceof Date) {
      console.log('Formatted userTz (UTC):', fetched.dataValues.createdAt.toLocaleDateString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }));
      console.log('Formatted hardcoded (Asia/Jakarta):', fetched.dataValues.createdAt.toLocaleDateString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }));
  }
}
run();
