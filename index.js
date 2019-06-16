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
    .replace(/(const|let) describe\s.*/, '');
  ev.emit('added', { modifiedFile, filePath });
}

function dumpTmpFile({ modifiedFile, filePath }) {
  const newPath = path.join(filePath, 'tmp.js');
  fs.writeFileSync(newPath, modifiedFile);
  mocha.addFile(newPath);
  mocha.run((failures) => {
    console.log(failures);
    fs.unlinkSync(newPath);
  });
}
module.exports = {
  install: function install() {
    mocha = new Mocha({
      ui: 'bdd',
      reporter: 'spec',
      timeout: 25000
    });

    return describe;
  }
};
