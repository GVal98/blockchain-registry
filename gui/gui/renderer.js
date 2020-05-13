const { ipcRenderer } = require('electron');
ipcRenderer.on('newAvailableNodes', (event, availableNodes) => updateAvailableNodes(availableNodes));

function updateAvailableNodes(availableNodes) {
  document.getElementById("availableNodes").innerHTML = JSON.stringify(availableNodes);
}