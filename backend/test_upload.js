const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const FormData = require('form-data');

const API = 'http://localhost:4000';

async function main() {
  try {
    // 1) create build
    const buildResp = await fetch(`${API}/api/builds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom: 'TestUploadScript', description: 'created by script', proprietaire: 'script' }),
    });
    const build = await buildResp.json();
    console.log('Created build:', build);

    const id = build.id;
    if (!id) throw new Error('No build id returned');

    // 2) ensure test file exists
    const testFilePath = path.join(__dirname, 'test-file.txt');
    fs.writeFileSync(testFilePath, 'This is a test file for upload.');

    // 3) upload file
    const form = new FormData();
    form.append('files', fs.createReadStream(testFilePath));

    const uploadResp = await fetch(`${API}/api/assets/upload/${id}`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
    });
    const uploadResult = await uploadResp.json();
    console.log('Upload result:', uploadResult);

    // 4) list assets
    const listResp = await fetch(`${API}/api/assets/build/${id}`);
    const assets = await listResp.json();
    console.log('Assets for build:', assets);

    if (assets.length) {
      // 5) download first asset
      const asset = assets[0];
      const dl = await fetch(`${API}/api/assets/download/${asset.id}`);
      const outPath = path.join(__dirname, 'downloaded-' + (asset.original || asset.filename));
      const dest = fs.createWriteStream(outPath);
      dl.body.pipe(dest);
      dest.on('finish', () => console.log('Downloaded to', outPath));
    }
  } catch (err) {
    console.error('Test script error:', err);
    process.exit(1);
  }
}

main();
