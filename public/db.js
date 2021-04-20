let db;

// Request a database instance.
const request = indexedDB.open("budgetDatabase", 1);

// Creat an object store inside the onupgradeneeded method.
request.onupgradeneeded = function(event) {
	const db = event.target.result;
	db.createObjectStore("offline", { autoIncrement: true });
};

// Returns a result that we can then manipulate.
request.onsuccess = function(event) {
	db = event.target.result;
	// check if app is online before reading from db
	if (navigator.onLine) {
		checkDatabase();
	}
};

// Returns an error in the console on error.
request.onerror = function(event) {
	console.log("Error: " + event.target.errorCode);
};

// Saving new record to the db
function saveRecord(record) {
	const transaction = db.transaction(["offline"], "readwrite");
	const budgetStore = transaction.objectStore("offline");

	budgetStore.add(record);
}

function checkDatabase() {
	// giving permission for the transaction to read/write the object store.
	const transaction = db.transaction(["offline"], "readwrite");
	const budgetStore = transaction.objectStore("offline");
	const getAll = budgetStore.getAll();

	getAll.onsuccess = function() {
		// making sure there are transactions waiting
		if (getAll.result.length > 0) {
			// bulk post to /api/transaction/bulk
			fetch("/api/transaction/bulk",
                {
				method: "POST",
				body: JSON.stringify(getAll.result),
				headers: {
					Accept: "application/json, text/plain, */*",
					"Content-Type": "application/json",
				},
            })
            .then(response => response.json())
            .then(() => {
                const transaction = db.transaction(["offline"], "readwrite");
					const budgetStore = transaction.objectStore("offline");
					// clearing store after bulk push
					budgetStore.clear();
            })
            .catch(err => {
                console.log(err);
            })
		}
	};
}

// listening for app coming back online and checking database
window.addEventListener("online", checkDatabase);

