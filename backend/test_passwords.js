const mysql = require('mysql2/promise');

const passwords = ['', 'root', 'password', 'Bhanu@2006', 'admin', '123456', 'visitor_management_system', 'deva', 'deva@123', 'admin123', '12345678'];

async function testConnections() {
  for (let p of passwords) {
    try {
      const conn = await mysql.createConnection({ host: 'localhost', user: 'root', password: p });
      console.log(`SUCCESS with password: "${p}"`);
      await conn.end();
      return;
    } catch (e) {
      // ignore
    }
  }
  console.log('ALL FAILED');
}
testConnections();
