const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => init());

function init() {
  ipcRenderer.send('windowReady');
  }

function insertTransactionCard(containerId, transaction, time) {
  document.getElementById(containerId).insertAdjacentHTML('beforeend', `<div class="card mb-1"> <div class="card-header text-center font-weight-bold"> ${new Date(time).toLocaleString()} </div> <div class="card-body"> <p class="card-text"> <span class="font-weight-bold">Кадастровый номер: </span><span>${transaction.data.property}</span><br> <span class="font-weight-bold">ИНН продавца: </span><span>${transaction.data.seller}</span><br> <span class="font-weight-bold">ИНН покупателя: </span><span>${transaction.data.buyer}</span><br> <span class="font-weight-bold">Сумма: </span><span>${transaction.data.price}</span> ₽ </p> </div> <div class="card-footer small"> ${transaction.sender} </div> </div>`);
}

function insertAvailableNode(node) {
  document.getElementById('availableNodes').insertAdjacentHTML('beforeend', `<td>${node.ip}:${node.port}</td> <td>${node.height}</td> </tr>`);
}

ipcRenderer.on('newAvailableNodes', (event, availableNodes) => updateAvailableNodes(availableNodes));
function updateAvailableNodes(availableNodes) {
  document.getElementById('availableNodes').innerHTML = '';
  availableNodes.forEach(node => {
    insertAvailableNode(node);
  });
}

ipcRenderer.on('newBlock', (event, chain) => updateChain(chain));
function updateChain(chain) {
  document.getElementById('chain').innerHTML = '';
  chain.forEach(block => {
    block.transactions.forEach(transaction => {
        insertTransactionCard('chain', transaction, block.time);
    });
  });
}

ipcRenderer.on('newPendingTransactions', (event, pendingTransactions) => updatePendingTransactions(pendingTransactions));
function updatePendingTransactions(pendingTransactions) {
  document.getElementById('pendingTransactions').innerHTML = '';
  pendingTransactions.forEach(transaction => {
    insertTransactionCard('pendingTransactions', transaction, transaction.time);
  });
}