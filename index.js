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

function describe(title, fn) {
  const modifiedFn = `
  describe('${title}', ${fn.toString()});
  `;
  ev.emit('added', { modifiedFn });
}

function dumpTmpFile({ modifiedFn }) {
  tmp.file(function(err, pathStr, fd, cleanup) {
    if (err) {
      throw err;
    }
    module.paths.push(process.cwd(), path.resolve('node_modules'));
    console.log(modifiedFn, '<==');
    fs.writeFileSync(pathStr, modifiedFn);
    mocha.addFile(pathStr);
    mocha.run(() => {
      cleanup();
    });
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
