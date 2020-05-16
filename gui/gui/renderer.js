const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => init());

function init() {
  ipcRenderer.send('windowReady');
  document.getElementById('chain').insertAdjacentHTML('beforeend', '<div class="card mb-1"> <div class="card-header text-center font-weight-bold"> 23:59:59 31.12.19 </div> <div class="card-body"> <p class="card-text"> <span class="font-weight-bold">Кадастровый номер: </span><span>47:14:1203001:814</span><br> <span class="font-weight-bold">ИНН продавца: </span><span>7707083893</span><br> <span class="font-weight-bold">ИНН покупателя: </span><span>7710140679</span><br> <span class="font-weight-bold">Сумма: </span><span>5000000</span> ₽ </p> </div> <div class="card-footer small"> 04f72b5297257e0dfae73932008f77bca0f1e523b54934af06c7498795d4de03 </div> </div>');
}

ipcRenderer.on('newAvailableNodes', (event, availableNodes) => updateAvailableNodes(availableNodes));
function updateAvailableNodes(availableNodes) {
  document.getElementById('availableNodes').innerHTML = JSON.stringify(availableNodes);
}

//ipcRenderer.on('newBlock', (event, chain) => updateChain(chain));
function updateChain(chain) {
  document.getElementById('chain').innerHTML = '';
  chain.forEach(block => {
    block.transactions.forEach(transaction => {
      let transactionElement = document.createElement('p');
      transactionElement.innerHTML = JSON.stringify({time: new Date(block.time).toLocaleString(), data: transaction.data});
      document.getElementById('chain').appendChild(transactionElement);
    });
  });
}

ipcRenderer.on('newPendingTransactions', (event, pendingTransactions) => updatePendingTransactions(pendingTransactions));
function updatePendingTransactions(pendingTransactions) {
  document.getElementById('pendingTransactions').innerHTML = JSON.stringify(pendingTransactions);
}