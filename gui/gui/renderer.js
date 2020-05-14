const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => init());

function init() {
  ipcRenderer.send('windowReady');
}

ipcRenderer.on('newAvailableNodes', (event, availableNodes) => updateAvailableNodes(availableNodes));
function updateAvailableNodes(availableNodes) {
  document.getElementById("availableNodes").innerHTML = JSON.stringify(availableNodes);
}

ipcRenderer.on('newBlock', (event, chain) => updateChain(chain));
function updateChain(chain) {
  document.getElementById("chain").innerHTML = JSON.stringify(chain);
}

ipcRenderer.on('newPendingTransactions', (event, pendingTransactions) => updatePendingTransactions(pendingTransactions));
function updatePendingTransactions(pendingTransactions) {
  document.getElementById("pendingTransactions").innerHTML = JSON.stringify(pendingTransactions);
}