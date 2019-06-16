const Mocha = require('mocha');
const fs = require('fs');
const tmp = require('tmp');
const path = require('path');

const { EventEmitter } = require('events');

const ev = new EventEmitter();

let mocha;

ev.on('added', (fc) => {
  dumpTmpFile(fc);
});

function describe() {
  const mainFile = fs.readFileSync(require.main.filename);
  const filePath = path.dirname(require.main.filename);
  const modifiedFile = mainFile
    .toString()
    //.replace("require('../../rpg-test').install();", '')
    .replace("require('rpg-test').install();", '');
  ev.emit('added', { modifiedFile, filePath });
}

function dumpTmpFile({ modifiedFile, filePath }) {
  tmp.file(function(err, pathStr, fd, cleanup) {
    if (err) throw err;

    fs.writeFileSync(pathStr, modifiedFile);
    const newPath = path.join(filePath, 'tmp.js');
    fs.copyFileSync(pathStr, newPath);
    mocha.addFile(newPath);
    mocha.run((failures) => {
      console.log(failures);
      cleanup();
      fs.unlinkSync(newPath);
    });
  });
}
module.exports = {
  install: function install() {
    console.log(process.env, '<====');
    global.describe = describe;
    mocha = new Mocha({
      ui: 'bdd',
      reporter: 'spec',
      timeout: 25000
    });
  }
};
