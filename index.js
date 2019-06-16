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
  const modifiedFile = mainFile
    .toString()
    .replace(/(const|let) describe\s.*/, '');
  ev.emit('added', { modifiedFile, filePath: require.main.filename });
}

function dumpTmpFile({ modifiedFile, filePath }) {
  fs.writeFileSync(filePath, modifiedFile);
  mocha.addFile(filePath);
  mocha.run((failures) => {
    console.log(failures);
    fs.unlinkSync(filePath);
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
