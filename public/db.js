let db;
let budgetVersion;

// create a new db request for a "BudgetDB" database.
const request = indexedDB.open('BudgetDB', budgetVersion || 21);

request.onupgradeneeded = function (event) {
  // create object store called "BudgetStore" and set autoIncrement to true
  console.log("Upgrading IndexDB schema...");
  db = event.target.result;

  const { oldVersion } = event;
  const newVersion = event.newVersion || db.version;

  if (db.objectStoreNames.length === 0) {
    db.createObjectStore("BudgetStore", { autoIncrement: true })
  }

};

request.onsuccess = function (event) {
  db = event.target.result;
  //Check if database is online
  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function (event) {
  // log error
  console.log(`Error: ${event.target.errorCode}`);
};

function saveRecord(record) {
  // create a transaction on the pending db with readwrite access
  const transaction = db.transaction(["BudgetStore"], "readwrite")
  // access your pending object store
  const BudgetStore = transaction.objectStore("BudgetStore");
  // add record to your store with add method.
  BudgetStore.add(record);
}

function checkDatabase() {
  // open a transaction on your pending db
  let transaction = db.transaction(["BudgetStore"], "readwrite");
  // access your pending object store
  const BudgetStore = transaction.objectStore("BudgetStore");
  // get all records from store and set to a variable
  const getAll = BudgetStore.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      })
        .then((response) => response.json())
        .then(() => {
          // if successful, open a transaction on your pending db
          let transaction = db.transaction(["BudgetStore"], "readwrite");

          // access your pending object store
          const BudgetStore = transaction.objectStore("BudgetStore");

          // clear all items in your store
          BudgetStore.clear();
        });
    }
  };
}

// listen for app coming back online
window.addEventListener('online', checkDatabase);
