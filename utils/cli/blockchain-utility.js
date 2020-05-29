const { Keygen } = require('./keygen');
const { GenesisCreator } = require('./genesis-creator');

if (process.argv[2] == 'key') {
  const keygen = new Keygen();
  keygen.createNewKey();
}

if (process.argv[2] == 'genesis') {
  const genesisCreator = new GenesisCreator();
  genesisCreator.create();
}