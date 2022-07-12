const yargs = require('yargs')
const express = require('express')
const fs = require('fs/promises');
const markdownIt = require('markdown-it')({breaks: true});
const ejs = require('ejs');

const TEMPLATE = __dirname + '/templates/index.html';


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

const fileLocation = '/home'

app.get('/', async (req, res) => {
  const markdown = await loadFile();
  if (markdown) {
    const content = markdownIt.render(markdown);
    const template = await fs.readFile(TEMPLATE, { encoding: 'utf8' });
    const htmlContent = ejs.render(template, { content: content });
    res.send(htmlContent);
  } else {
    res.send('file not found');
  }
});

console.log('Running in ', __dirname);
console.log(`Looking for file ${argv.file}`);
app.listen(port, () => {
  console.log(`Prompter app listening on port ${port}`);
})

async function loadFile() {
  try {
    const data = await fs.readFile(argv.file, { encoding: 'utf8' });
    return data;
  } catch(error) {
    console.info('Could not load file: ' + error)
    return null;
  }
}
