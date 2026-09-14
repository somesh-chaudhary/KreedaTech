const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const hosts = [
  '_mongodb._tcp.cluster0.hnmdqgs.mongodb.net',
  'cluster0-shard-00-00.hnmdqgs.mongodb.net',
  'cluster0.hnmdqgs.mongodb.net',
  'hnmdqgs.mongodb.net'
];

hosts.forEach(host => {
  if (host.startsWith('_mongodb')) {
    dns.resolveSrv(host, (err, res) => console.log('SRV', host, err ? err.code : res));
  } else {
    dns.resolve4(host, (err, res) => console.log('A', host, err ? err.code : res));
  }
});
