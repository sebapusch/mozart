const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const CONFIG = require('./config.json');
const INDEX_PATH = path.join(__dirname, 'index.html');
const MUSIC_PATH = path.join(__dirname, 'mozart.mp3');
const DATA_PATH = CONFIG.dataFilePath.startsWith('.')
  ? path.join(__dirname, CONFIG.dataFilePath)
  : CONFIG.dataFilePath;

fs.access(DATA_PATH, fs.constants.W_OK, (err) => {
  if(err){
    console.error(`Cannot write to ${DATA_PATH}`);
    process.exit(1);
  }

  serve(
    fs
      .readFileSync(INDEX_PATH, 'utf8')
      .replaceAll('___WAIT_TIME___', CONFIG.timeInterval)
      .replaceAll('___COUNTDOWN_TIME___', CONFIG.breakInterval)
  );
});

async function saveData(data) {
  const  dataString = 
`
name: ${data.name}
score: ${data.score}
time: ${(new Date()).toLocaleString()}
sequence: ${data.sequence}
guessed: ${data.userSequence}
music: ${data.music}
--------------------
`

  await fs.promises.appendFile(DATA_PATH, dataString);
}

function serve(html) {
    const app = express();

    app.use(cors());
    app.use(express.json());

    app.post('/store', async (req, res) => {
      try {
        await saveData(req.body);
      } catch (err) {
        console.error(err);
        return res.status(500).send({ message: `Failed to store score ${err.message}` });
      }
 
      res.status(200).send({ message: 'Score stored successfully' });
    });
    app.get('/', (_, res) => res.send(html));
    app.get('/mozart.mp3', (_, res) => res.sendFile(MUSIC_PATH));

    app.listen(CONFIG.port, () => console.log(`Server running on port ${CONFIG.port}`));
  }