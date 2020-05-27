document.addEventListener('DOMContentLoaded', () => init());
let lastBlock = 0;
let currentBlock = false;
let senderKeyFile = false;
let isSearch = false;

let node = `${window.location.hostname}:${window.location.port}`;
console.log(node);  

async function init() {
  //ipcRenderer.send('windowReady');
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
  getNewChain();
  setInterval(() => getNewChain(), 2000);
}


async function getNewChain() {
  if (currentBlock === false || lastBlock - currentBlock < 5) {
    console.log('Updating');
    let pendingTransactionsResponse = await getPendingTransactions();
    updatePendingTransactions(pendingTransactionsResponse.result.pendingTransactions)
    let nodeHeight = pendingTransactionsResponse.result.height;
    console.log('Node height: ' + nodeHeight);
    if (nodeHeight > lastBlock) {
      console.log('Getting new blocks');
      lastBlock = nodeHeight;
      currentBlock = lastBlock;
      updateButtons();
      let getBlocksResponse = await getBlocks(nodeHeight-4, nodeHeight);
      insertTransactionsFromBlocks(getBlocksResponse.result.reverse());
    }
  } else console.log('Not a main page');
}

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

function insertTransactionsFromBlocks(blocks) {
  document.getElementById('chain').innerHTML = '';
  blocks.forEach(block => {
    block.transactions.forEach(transaction => {
        insertTransactionCard('chain', transaction, block.time);
    });
  });
}

async function previousPage() {
  if (currentBlock >= 5) {
    document.getElementById('chainName').textContent="Транзакции";
    currentBlock -= 5;
    let response = await getBlocks(currentBlock, currentBlock+4);
    insertTransactionsFromBlocks(response.result.reverse());
  }
  updateButtons();
}

async function nextPage() {
  if (lastBlock - currentBlock > 5) {
    console.log(lastBlock - currentBlock);
    currentBlock += 5;
    let response = await getBlocks(currentBlock, currentBlock+4);
    insertTransactionsFromBlocks(response.result.reverse());
    document.getElementById('chainName').textContent="Транзакции";
  } else {
    console.log('this');
    currentBlock = lastBlock;
    let getBlocksResponse = await getBlocks(lastBlock-4, lastBlock);
    insertTransactionsFromBlocks(getBlocksResponse.result.reverse());
  }
  updateButtons();
}

async function sendRequest(func, json) {
  let response = await fetch(`http://${node}/${func}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=utf-8'
    },
    body: JSON.stringify(json)
  });
  return response.json();
}

async function getBlocks(startBlock, endBlock) {
  return sendRequest('getBlocks', {startBlock, endBlock});
}

async function sendSearch(filters) {
  return sendRequest('search', filters);
}

async function getPendingTransactions() {
  return sendRequest('getPendingTransactions');
}


/*ipcRenderer.on('transactionCreated', (event, result) => {
  if (result) {
    $('#AddModal').hide();
    $('.modal-backdrop').fadeOut();
    $('.toast-header').removeClass('bg-danger').addClass('bg-success');
    showNotification('Транзакция успешно отправлена');
  } else {
    $('.toast-header').removeClass('bg-success').addClass('bg-danger');
    showNotification('Невалидная транзакция');
  }
});*/



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


async function search() {
  let property = $('#searchPropery').val();
  let anyParty = $('#searchAnyParty').val();
  let seller = $('#searchSeller').val();
  let buyer = $('#searchBuyer').val();
  let minPrice = $('#searchMinPrice').val();
  let maxPrice = $('#searchMaxPrice').val();
  let startDate = stringToTimestamp($('#searchStartDate').val());
  let endDate = stringToTimestampAdd($('#searchEndDate').val());
  let response = await sendSearch({property, anyParty, seller, buyer, minPrice, maxPrice, startDate, endDate});
  inseartSearch(response.result);
}

//ipcRenderer.on('searchDone', (event, result) => inseartSearch(result));

function inseartSearch(result) {
  document.getElementById('chainName').textContent="Результаты";
  currentBlock = false;
  isSearch = true;
  document.getElementById('left').disabled = true;
  document.getElementById('right').disabled = true;
  document.getElementById('chain').innerHTML = '';
  $('#cancelSearch').removeClass('d-none').addClass('d-inline');
  result.transactions.forEach(transaction => {
      insertTransactionCard('chain', transaction, transaction.time);
  });
}

async function cancelSearch() {
  document.getElementById('chainName').textContent="Последние транзакции";
  $('#cancelSearch').removeClass('d-inline').addClass('d-none');
  isSearch = false;
  currentBlock = lastBlock;
  let getBlocksResponse = await getBlocks(lastBlock-4, lastBlock);
  insertTransactionsFromBlocks(getBlocksResponse.result.reverse());
  updateButtons();
}

function sendTransaction() {
  let keyPassword = $('#keyPassword').val();
  let property = $('#property').val();
  let seller = $('#seller').val();
  let buyer = $('#buyer').val();
  let price = $('#price').val();
  ipcRenderer.send('sendTransaction', senderKeyFile, keyPassword, property, seller, buyer, price);
}

function updateButtons() {
  console.log(currentBlock, lastBlock);
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

function insertTransactionCard(containerId, transaction, time) {
  document.getElementById(containerId).insertAdjacentHTML('beforeend', `<div class="card mb-1"> <div class="card-header text-center font-weight-bold"> ${new Date(time).toLocaleString()} </div> <div class="card-body"> <p class="card-text"> <span class="font-weight-bold">Кадастровый номер: </span><span>${transaction.data.property}</span><br> <span class="font-weight-bold">ИНН продавца: </span><span>${transaction.data.seller}</span><br> <span class="font-weight-bold">ИНН покупателя: </span><span>${transaction.data.buyer}</span><br> <span class="font-weight-bold">Сумма: </span><span>${transaction.data.price}</span> ₽ </p> </div> <div class="card-footer small"> ${transaction.sender} </div> </div>`);
}


//ipcRenderer.on('blocksResponse', (event, result) => changePage(result));

function changePage(result) {
  document.getElementById('chain').innerHTML = '';
  result.chain.forEach(block => {
    block.transactions.forEach(transaction => {
        insertTransactionCard('chain', transaction, block.time);
    });
  });
}

//ipcRenderer.on('newBlock', (event, result) => updateChain(result));

function updatePendingTransactions(pendingTransactions) {
  document.getElementById('pendingTransactions').innerHTML = '';
  pendingTransactions.forEach(transaction => {
    insertTransactionCard('pendingTransactions', transaction, transaction.time);
  });
}