const yargs = require('yargs')
const express = require('express')
const fs = require('fs/promises');
const markdownIt = require('markdown-it')({breaks: true});
const ejs = require('ejs');

const TEMPLATE = __dirname + '/templates/index.html';
const MISSING = __dirname + '/templates/missing.html';

// One last motify time for two files. Yeh, whatever last wins.
let lastModifyTime = 0;

const app = express()

const argv = yargs
    .option('port', {
      alias: 'p',
      description: 'Server port',
      type: 'number',
      default: 3000
    })
    .option('file', {
      alias: 'f',
      description: 'File where the content is stored',
      default: '/Users/barakori/dev/prompter/sample.md',
    })
    .help().alias('help', 'h').argv;

const port = argv.port

app.get('/', async (req, res) => {
  const markdown = await loadFile();
  const content = markdown ? markdownIt.render(markdown) : '';
  const templateFile = markdown ? TEMPLATE : MISSING;
  const template = await fs.readFile(templateFile, { encoding: 'utf8' });
  const htmlContent = ejs.render(template, { content: content });
  res.send(htmlContent);
});

app.get('/check', async (req, res) => {
  const isTemplate = req.query.t === '1';
  const modifyTime = await getModifyTime(isTemplate ? TEMPLATE : argv.file);
  let result = '';
  if (modifyTime === 0) {
    result = 'missing';
  } else if (modifyTime > lastModifyTime) {
    lastModifyTime = modifyTime;
    result = 'new';
  } else {
    result = 'exists';
  }
  res.send(result);
});

console.log('Running in ', __dirname);
console.log(`Looking for file ${argv.file}`);
app.listen(port, () => {
  console.log(`Prompter app listening on port ${port}`);
})

async function getModifyTime(file) {
  try {
    const stats = await fs.stat(file);
    return stats.mtimeMs;
  } catch(e) {
    return 0;
  }
}

async function loadFile() {
  try {
    const data = await fs.readFile(argv.file, { encoding: 'utf8' });
    return data;
  } catch(error) {
    return null;
  }
}
