const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => init());
let lastBlock = 0;
let currentBlock = false;

function init() {
  ipcRenderer.send('windowReady');
  document.getElementById('left').addEventListener('click', () => previousPage());
  document.getElementById('right').addEventListener('click', () => nextPage());
}

function previousPage() {
  if (currentBlock >= 5) {
    document.getElementById('chainName').textContent="Транзакции";
    currentBlock -= 5;
    ipcRenderer.send('RequsetBlocks', currentBlock);
  }
  updateButtons();
}

function updateButtons() {
  if (currentBlock >= 5) {
    document.getElementById('left').disabled = false;
  } else {
    document.getElementById('left').disabled = true;
  }
  if (lastBlock === currentBlock) {
    document.getElementById('chainName').textContent="Последние транзакции";
    document.getElementById('right').disabled = true;
  } else {
    document.getElementById('right').disabled = false;
  }
}

function nextPage() {
  if (lastBlock - currentBlock >= 5) {
    currentBlock += 5;
    ipcRenderer.send('RequsetBlocks', currentBlock);
    document.getElementById('chainName').textContent="Транзакции";
  } else {
    ipcRenderer.send('windowReady');
    document.getElementById('chainName').textContent="Последние транзакции";
  }
  updateButtons();
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

ipcRenderer.on('blocksResponse', (event, result) => changePage(result));

function changePage(result) {
  document.getElementById('chain').innerHTML = '';
  result.chain.forEach(block => {
    block.transactions.forEach(transaction => {
        insertTransactionCard('chain', transaction, block.time);
    });
  });
}

ipcRenderer.on('newBlock', (event, result) => updateChain(result));
function updateChain(result) {
  lastBlock = result.height;
  if (currentBlock === false || lastBlock - currentBlock <= 5) {
    currentBlock = lastBlock;
    updateButtons();
    document.getElementById('chain').innerHTML = '';
    result.chain.forEach(block => {
      block.transactions.forEach(transaction => {
          insertTransactionCard('chain', transaction, block.time);
      });
    });
  }
}

ipcRenderer.on('newPendingTransactions', (event, pendingTransactions) => updatePendingTransactions(pendingTransactions));
function updatePendingTransactions(pendingTransactions) {
  document.getElementById('pendingTransactions').innerHTML = '';
  pendingTransactions.forEach(transaction => {
    insertTransactionCard('pendingTransactions', transaction, transaction.time);
  });
}