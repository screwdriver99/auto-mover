messenger.storage.local.get().then(function (data) {
	console.log("storage: " + JSON.stringify(data, null, 4));
});

const addButton = document.getElementById("addButton");
const deleteButton = document.getElementById("deleteButton");
const filterList = document.getElementById("filterList");
const folderName = document.getElementById("folderName");
const mailInput = document.getElementById("mail");
const filterText = document.getElementById("filter");
const directionSelect = document.getElementById("direction");
let option = document.createElement("option");
option.text = "incoming";
directionSelect.add(option);
option = document.createElement("option");
option.text = "outgoing";
directionSelect.add(option);
option = document.createElement("option");
option.text = "both";
directionSelect.add(option);

var accounts;

messenger.accounts.list(true).then(function (emails) {
	accounts = emails;
	updateAccounts();
});

function updateAccounts() {
	for (const element of accounts) {
		if (element.identities[0] != undefined) {
			let option = document.createElement("option");
			option.text = element.identities[0].email;
			mailInput.add(option);
		}
	}

	updateFolders(mailInput.value);
}

function addSubfolders(folder) {
	let option = document.createElement("option");
	option.text = folder.name;
	option.value = folder.path;
	folderName.add(option);

	for (const subfolder of folder.subFolders) {
		addSubfolders(subfolder);
	}
}

function updateFolders(email) {
	clearFolders();
	for (const element of accounts) {
		if (element.identities[0] != undefined) {
			if (element.identities[0].email == email) {
				for (const folder of element.folders) {
					addSubfolders(folder);
				}
				break;
			}
		}
	}

	//update filter list

	messenger.storage.local.get("accounts").then(function (data) {
		clearFilters();
		let str = "";
		if (data != undefined) {
			if (Object.keys(data).length != 0) {
				if (data.accounts.length != 0) {
					for (let account of data.accounts) {
						if (account.mail == email) {
							for (let filter of account.filters) {
								let option = document.createElement("option");
								option.text =
									filter.filter + " -> " + filter.folder;
								option.value = filter.filter;
								filterList.add(option);
							}
							break;
						}
					}
				}
			}
		}
	});
}

function clearFolders() {
	for (var i = folderName.options.length - 1; i >= 0; i--) {
		folderName.remove(i);
	}
}

function clearFilters() {
	for (var i = filterList.options.length - 1; i >= 0; i--) {
		filterList.remove(i);
	}
}

addButton.onclick = function () {
	let mail = mailInput.value;
	let folder = folderName.value;
	let filter = filterText.value;
	let direction = directionSelect.value;

	if (!mail || !folder || !filter || !direction) {
		return;
	}

	console.log(
		'New filter "' +
			filter +
			'" -> ' +
			folder +
			" set for " +
			mail +
			", direction: " +
			direction
	);

	let obj = new Object();
	obj.mail = mail;
	obj.filters = new Array();
	obj.filters.push({ filter, folder, direction });
	let accounts = new Array();
	accounts.push(obj);

	messenger.storage.local.get("accounts").then(function (data) {
		//console.log("current data: " + JSON.stringify(data, null, 4));

		if (data != undefined) {
			if (Object.keys(data).length != 0) {
				if (data.accounts.length != 0) {
					let accountFound = false;

					for (let account of data.accounts) {
						if (account.mail == mail) {
							accountFound = true;
							let filterFound = false;
							for (let f of account.filters) {
								if (f.filter == filter) {
									filterFound = true;
									f.folder = folder;
									f.direction = direction;
									break;
								}
							}
							if (!filterFound) {
								account.filters.push({
									filter,
									folder,
									direction,
								});
							}
							break;
						}
					}

					if (!accountFound) {
						data.accounts.push(obj);
					}

					messenger.storage.local.set(data);
					updateFolders(mailInput.value);
					return;
				}
			}
		}

		console.log("first use, creating DB");
		messenger.storage.local.set({ accounts });
		updateFolders(mailInput.value);
	});
};

deleteButton.onclick = function () {
	messenger.storage.local.get("accounts").then(function (data) {
		if (data != undefined) {
			if (Object.keys(data).length != 0) {
				if (data.accounts.length != 0) {
					let found = false;
					for (let account of data.accounts) {
						if (account.mail == mailInput.value) {
							let index = account.filters
								.map((e) => e.filter)
								.indexOf(filterList.value);

							if (index == -1) {
								console.log("error during item deletion");
								return;
							}

							account.filters.splice(index, 1);

							messenger.storage.local.set(data);
							updateFolders(mailInput.value);
							break;
						}
					}
				}
			}
		}
	});
};

mailInput.onchange = function (event) {
	updateFolders(event.target.value);
};
