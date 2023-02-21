messenger.messages.onNewMailReceived.addListener(async (folder, messages) => {
	//console.log(JSON.stringify(messages, null, 4));

	for (const message of messages.messages) {
		messenger.accounts
			.get(message.folder.accountId, true)
			.then(function (acc) {
				console.log(
					"Dispatching new mail received for: " +
						acc.identities[0].email
				);
				dispatch(acc, message.id, "incoming");
			});
	}
});

messenger.folders.onFolderInfoChanged.addListener(
	async (folder, folderInfo) => {
		if (folder.type == "sent") {
			let info = new Object();
			info.folder = folder;
			info.fromMe = true;
			let dateNow = new Date();
			let date5secAgo = new Date(dateNow.getTime() - 5000);
			info.fromDate = date5secAgo;
			messenger.messages.query(info).then(function (messagelist) {
				for (const message of messagelist.messages) {
					messenger.accounts
						.get(message.folder.accountId, true)
						.then(function (acc) {
							console.log(
								"Dispatching new mail sent by: " +
									acc.identities[0].email
							);
							dispatch(acc, message.id, "outgoing");
						});
				}
			});
		}
	}
);

function move(folder, filterFolder, messageId) {
	if (folder.path == filterFolder) {
		messenger.messages.move([messageId], folder);
		console.log("filter match, moving to " + filterFolder);
		return true;
	}

	for (const subfolder of folder.subFolders) {
		if (move(subfolder, filterFolder, messageId)) {
			return true;
		}
	}

	return false;
}

function dispatch(acc, messageId, dir) {
	messenger.storage.local.get("accounts").then(function (data) {
		if (data == undefined) {
			return;
		}
		if (Object.keys(data).length == 0) {
			return;
		}
		if (data.accounts.length == 0) {
			return;
		}

		for (let account of data.accounts) {
			if (account.mail == acc.identities[0].email) {
				messenger.messages.getFull(messageId).then(function (part) {
					//console.log(JSON.stringify(part, null, 4));
					let str = "";

					if (part.headers.subject[0] == undefined) {
						console.log("undefined subject - fix this!");
					} else {
						str += part.headers.subject[0];
					}

					for (const rec of part.headers.from) {
						str += rec;
					}

					for (const filter of account.filters) {
						if (
							str
								.toLowerCase()
								.includes(filter.filter.toLowerCase())
						) {
							if (
								filter.direction == "both" ||
								filter.direction == dir
							) {
								for (let folder of acc.folders) {
									if (
										move(folder, filter.folder, messageId)
									) {
										console.log("found");
										break;
									}
								}
							}
						}
					}
				});

				break;
			}
		}
	});
}
