import fs from 'fs';
import https from 'https';

function get(url, n = 0) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'IOM' } }, (r) => {
      if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location && n < 8) {
        const next = r.headers.location.startsWith('http')
          ? r.headers.location
          : new URL(r.headers.location, url).href;
        return get(next, n + 1).then(resolve, reject);
      }
      const c = [];
      r.on('data', (d) => c.push(d));
      r.on('end', () => resolve({ status: r.statusCode, buf: Buffer.concat(c), ctype: r.headers['content-type'] || '' }));
    }).on('error', reject);
  });
}

const wiki = "Misc Celio's Hat.png";
const { status, buf, ctype } = await get('https://shminer.miraheze.org/wiki/Special:FilePath/' + encodeURIComponent(wiki));
console.log(status, buf.length, ctype);
if (status === 200 && buf.length > 200) {
  fs.writeFileSync('assets/cards/Misc_Celios_Hat.png', buf);
  console.log('saved Misc_Celios_Hat.png');
}
