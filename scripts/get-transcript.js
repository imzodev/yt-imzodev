#!/usr/bin/env node

import https from 'https';

const VIDEO_ID = process.argv[2] || 'MOMAJ-HUMLU';

async function getYouTubeTranscript(videoId) {
  return new Promise((resolve, reject) => {
    const url = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=json3`;

    https.get(url, (res) => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          reject(new Error('Failed to parse transcript: ' + e.message));
        }
      });
    }).on('error', reject);
  });
}

getYouTubeTranscript(VIDEO_ID)
  .then(transcript => {
    console.log(JSON.stringify(transcript, null, 2));
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
