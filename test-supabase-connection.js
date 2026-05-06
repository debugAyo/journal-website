// Filename: test-supabase-connection.js
// Run with: node test-supabase-connection.js

const https = require('https');

const options = {
  hostname: 'sgvcgdaqwegytsdkahqq.supabase.co',
  port: 443,
  path: '/',
  method: 'GET',
};

console.log(`Attempting to connect to: ${options.hostname}`);

const req = https.request(options, (res) => {
  console.log(`✅ SUCCESS!`);
  console.log(`Status Code: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Connection successful. DNS and network are working correctly for this domain.');
  });
});

req.on('error', (e) => {
  console.error(`❌ FAILED!`);
  console.error(`Error Code: ${e.code}`);
  console.error(`Error Message: ${e.message}`);
  if (e.code === 'ENOTFOUND') {
    console.error('\n---');
    console.error('This confirms a DNS resolution failure. Your machine cannot find the IP address for the Supabase domain.');
    console.error('Possible causes:');
    console.error('  1. A firewall or security software is blocking the request.');
    console.error('  2. A VPN is interfering with DNS.');
    console.error('  3. Your system\'s DNS cache is corrupted.');
    console.error('  4. Your network\'s DNS server is having issues.');
  }
});

req.end();
