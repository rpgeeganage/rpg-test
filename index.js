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
  console.log(filePath);
  const modifiedFile = mainFile
    .toString()
    .replace(/require\(.*\).install\(\);/, '');
  ev.emit('added', { modifiedFile });
}

function dumpTmpFile({ modifiedFile }) {
  tmp.file(function(err, pathStr, fd, cleanup) {
    if (err) {
      throw err;
    }
    module.paths.push(process.cwd(), path.resolve('node_modules'));
    fs.writeFileSync(pathStr, modifiedFile);
    mocha.addFile(pathStr);
    mocha.run(() => {
      cleanup();
    });
  });
}
module.exports = {
  install: function install() {
    global.describe = describe;
    mocha = new Mocha({
      ui: 'bdd',
      reporter: 'spec',
      timeout: 25000
    });
  }
};
