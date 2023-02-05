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
				dispatch(acc, message.id);
			});
	}
});

function dispatch(acc, messageId) {
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
				messenger.messages.getFull(messageId).then(function (parts) {
					let subj = parts.headers.subject[0];

					for (const filter of account.filters) {
						if (
							subj
								.toLowerCase()
								.includes(filter.filter.toLowerCase())
						) {
							for (let folder of acc.folders) {
								if (folder.name == filter.folder) {
									messenger.messages.move(
										[messageId],
										folder
									);
									console.log(
										'"' +
											filter.filter +
											'" matched, moved to ' +
											folder.name
									);
									break;
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
