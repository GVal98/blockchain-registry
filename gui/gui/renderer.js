const { ipcRenderer, dialog } = require('electron');
window.jQuery = window.$ = require('jquery');

document.addEventListener('DOMContentLoaded', () => init());
let lastBlock = 0;
let currentBlock = false;
let senderKeyFile = false;
let isSearch = false;

function init() {
  ipcRenderer.send('windowReady');
  document.getElementById('left').addEventListener('click', () => previousPage());
  document.getElementById('right').addEventListener('click', () => nextPage());
  $('#search').on('click', () => search());
  $('#sendTransaction').on('click', () => sendTransaction());
  $('#keyFile').on('change', (result) => {
    senderKeyFile = result.target.files[0].path;
    $('#keyFileLabel').html(result.target.files[0].name);
  });
  $('#cancelSearch').on('click', () => cancelSearch());
  $('#startServer').on('click', () => startServer());
}

function startServer() {
  let ip = $('#ip').val();
  let port = $('#port').val();
  ipcRenderer.send('startServer', ip, port);
}

ipcRenderer.on('serverStarted', (event) => {
  $('#configModal').hide();
  $('.modal-backdrop').fadeOut();
  $('.toast-header').removeClass('bg-danger').addClass('bg-success');
  showNotification('Сервер успешно запущен');
});

ipcRenderer.on('transactionCreated', (event, result) => {
  if (result) {
    $('#AddModal').hide();
    $('.modal-backdrop').fadeOut();
    $('.toast-header').removeClass('bg-danger').addClass('bg-success');
    showNotification('Транзакция успешно отправлена');
  } else {
    $('.toast-header').removeClass('bg-success').addClass('bg-danger');
    showNotification('Невалидная транзакция');
  }
});



function showNotification(text) {
  $('#notification').html(text);
  $('.toast').toast('show');
}

function stringToTimestampAdd(string) {
  if (string == '') return '';
  string = string.split('.');
  return new Date(string[1]+"/"+string[0]+"/"+string[2]).addDays(1).getTime();
}

function stringToTimestamp(string) {
  if (string == '') return '';
  string = string.split('.');
  return new Date(string[1]+"/"+string[0]+"/"+string[2]).getTime();
}

Date.prototype.addDays = function(days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
}


function search() {
  let property = $('#searchPropery').val();
  let anyParty = $('#searchAnyParty').val();
  let seller = $('#searchSeller').val();
  let buyer = $('#searchBuyer').val();
  let minPrice = $('#searchMinPrice').val();
  let maxPrice = $('#searchMaxPrice').val();
  let startDate = stringToTimestamp($('#searchStartDate').val());
  let endDate = stringToTimestampAdd($('#searchEndDate').val());
  ipcRenderer.send('search', property, anyParty, seller, buyer, minPrice, maxPrice, startDate, endDate);
}

ipcRenderer.on('searchDone', (event, result) => inseartSearch(result));

function inseartSearch(result) {
  document.getElementById('chainName').textContent="Результаты";
  currentBlock = false;
  isSearch = true;
  document.getElementById('left').disabled = true;
  document.getElementById('right').disabled = true;
  document.getElementById('chain').innerHTML = '';
  $('#cancelSearch').removeClass('d-none').addClass('d-inline');
  result.forEach(transaction => {
      insertTransactionCard('chain', transaction, transaction.time);
  });
}

function cancelSearch() {
  document.getElementById('chainName').textContent="Последние транзакции";
  $('#cancelSearch').removeClass('d-inline').addClass('d-none');
  isSearch = false;
  ipcRenderer.send('windowReady');
}

function sendTransaction() {
  let keyPassword = $('#keyPassword').val();
  let property = $('#property').val();
  let seller = $('#seller').val();
  let buyer = $('#buyer').val();
  let price = $('#price').val();
  ipcRenderer.send('sendTransaction', senderKeyFile, keyPassword, property, seller, buyer, price);
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
  if (isSearch) return;
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