const yargs = require('yargs')
const express = require('express')
const fs = require('fs/promises');
const markdownIt = require('markdown-it')({breaks: true});
const ejs = require('ejs');

const TEMPLATE = __dirname + '/templates/index.html';
const MISSING = __dirname + '/templates/missing.html';
const CONTENT_CACHE = __dirname + '/cache/content.md';

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

// Needed so we know we need to reload (since the template file changed). Of
// course, this only happens during development time.
let templateLastModifyTime = 0;

const port = argv.port

app.get('/', async (req, res) => {
  const markdown = await loadFile();
  const content = markdown ? markdownIt.render(markdown) : '';
  const templateFile = markdown ? TEMPLATE : MISSING;
  const template = await fs.readFile(templateFile, { encoding: 'utf8' });
  const htmlContent = ejs.render(template, { content: content });
  res.send(htmlContent);
});

/**
 * Checks if the content file has been modified.
 */
app.get('/check', async (req, res) => {
  const fileName = argv.file;
  const modifyTime = await getModifyTime(fileName);
  const cacheTime = await getModifyTime(CONTENT_CACHE);
  let result = '';
  if (modifyTime === 0 && cacheTime === 0) {
    result = 'missing';
  } else if (modifyTime > cacheTime) {
    await fs.copyFile(fileName, CONTENT_CACHE);
    result = 'new';
  } else {
    result = 'exists';
  }
  res.send(result);
});

/**
 * Checks if the template file (index.html) has been modified.
 * We don't check for modifications of missing.html. It's too rare.
 */
app.get('/checkt', async (req, res) => {
  const modifyTime = await getModifyTime(TEMPLATE);
  let result = '';
  if (modifyTime === 0) {
    result = 'missing';
  } else if (modifyTime > templateLastModifyTime) {
    templateLastModifyTime = modifyTime;
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

/**
 * Loads the content file. It's always loaded from cache. There's a periodic
 * handler (`/check`) that checks if the content on the USB (argv.file) should
 * be used (so it's copied to cache).
 */
async function loadFile() {
  try {
    const data = await fs.readFile(CONTENT_CACHE, { encoding: 'utf8' });
    return data;
  } catch(error) {
    return null;
  }
}
