let db;

// Request a database instance.
const request = indexedDB.open("budgetDatabase", 1);

// Creat an object store inside the onupgradeneeded method.
request.onupgradeneeded = ({ target }) => {
	db = target.result;
	db.createObjectStore("transactions", { autoIncrement: true });
};

// Returns a result that we can then manipulate.
request.onsuccess = (event) => {

	db = event.target.result;
	// check if app is online before reading from db
	if (navigator.onLine) {
		checkDatabase();
	}
};

// Returns an error in the console on error.
request.onerror = (event) => {
	console.log("Error: " + event.target.errorCode);
};

// Saving new record to the db
function saveRecord(record) {
  const transaction = db.transaction(["transactions"], "readwrite");
	const budgetStore = transaction.objectStore("transactions");

  budgetStore.add(record);
}

function checkDatabase() {
	// giving permission for the transaction to read/write the object store.
	const transaction = db.transaction(["transactions"], "readwrite");
	const budgetStore = transaction.objectStore("transactions");
	const getAll = budgetStore.getAll();

	getAll.onsuccess = function () {
		// making sure there are transactions waiting
		if (getAll.result.length > 0) {
			// bulk push to /api/transaction/bulk
      fetch("/api/transaction/bulk", {
        type: "POST",
				data: JSON.stringify(getAll.result),
				headers: {
					Accept: "application/json, text/plain, */*",
					"Content-Type": "application/json",
        }
      })
      .then(data => data.json())
      .then(() => {
        const transaction = db.transaction(["transactions"], "readwrite");
					const budgetStore = transaction.objectStore("transactions");
					// clearing store after bulk push
					budgetStore.clear();
      })
			// $.ajax({
			// 	type: "POST",
			// 	url: "/api/transaction",
			// 	data: JSON.stringify(getAll.result),
			// 	headers: {
			// 		Accept: "application/json, text/plain, */*",
			// 		"Content-Type": "application/json",
			// 	},
			// 	success: function (msg) {
			// 		const transaction = db.transaction(["transactions"], "readwrite");
			// 		const budgetStore = transaction.objectStore("transactions");
			// 		// clearing store after bulk push
			// 		budgetStore.clear();
			// 		populateTable();
			// 	},
			// 	error: function (XMLHttpRequest, textStatus, errorThrown) {
			// 		console.log(getall.result);
			// 		console.log("Failed to Save DB");
			// 		console.log(XMLHttpRequest, textStatus, errorThrown);
			// 	},
			// });
		}
	};
}

// listening for app coming back online and checking database
window.addEventListener("online", checkDatabase);

// App is offline
// window.addEventListener("offline", isOffline, false);
