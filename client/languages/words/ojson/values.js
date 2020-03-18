const vscode = require('vscode')

module.exports = [
	{
		quoted: true,
		label: 'asset',
		insertText: 'asset',
		kind: vscode.CompletionItemKind.Enum,
		detail: '`asset` app type',
		documentation: {
			value:
`
\`asset\`: used to define a new asset;
`
		}
	},
	{
		quoted: true,
		label: 'data',
		insertText: 'data',
		kind: vscode.CompletionItemKind.Enum,
		detail: '`data` app type',
		documentation: {
			value:
`
\`data\`: used to send data, this includes sending data parameters to other (secondary) AAs;
`
		}
	},
	{
		quoted: true,
		label: 'payment',
		insertText: 'payment',
		kind: vscode.CompletionItemKind.Enum,
		detail: '`payment` app type',
		documentation: {
			value:
`
\`payment\`: is used to send payments in any asset back to sender or to a third party.
`
		}
	},
	{
		quoted: true,
		label: 'data_feed',
		insertText: 'data_feed',
		kind: vscode.CompletionItemKind.Enum,
		detail: '`data_feed` app type',
		documentation: {
			value:
`
\`data_feed\`: used to send data feeds.  By doing this, the AA becomes an oracle;
`
		}
	},
	{
		quoted: true,
		label: 'profile',
		insertText: 'profile',
		kind: vscode.CompletionItemKind.Enum,
		detail: '`profile` app type',
		documentation: {
			value:
`
\`profile\`: used to send one's own profile.  Maybe an AA wants to say something to the world about itself;
`
		}
	},
	{
		quoted: true,
		label: 'text',
		insertText: 'text',
		kind: vscode.CompletionItemKind.Enum,
		detail: '`text` app type',
		documentation: {
			value:
`
\`text\`: used to save arbitrary text to the DAG;
`
		}
	},
	{
		quoted: true,
		label: 'definition',
		insertText: 'definition',
		kind: vscode.CompletionItemKind.Enum,
		detail: '`definition` app type',
		documentation: {
			value:
`
\`definition\`: used to post a definition of a new AA;
`
		}
	},
	{
		quoted: true,
		label: 'asset_attestors',
		insertText: 'asset_attestors',
		kind: vscode.CompletionItemKind.Enum,
		detail: '`asset_attestors` app type',
		documentation: {
			value:
`
\`asset_attestors\`: used to change the attestor list of an asset previously defined by this AA;
`
		}
	},
	{
		quoted: true,
		label: 'attestation',
		insertText: 'attestation',
		kind: vscode.CompletionItemKind.Enum,
		detail: '`attestation` app type',
		documentation: {
			value:
`
\`attestation\`: used to post information about some other address.  By doing this, the AA becomes an attestor;
`
		}
	},
	{
		quoted: true,
		label: 'definition_template',
		insertText: 'definition_template',
		kind: vscode.CompletionItemKind.Enum,
		detail: '`definition_template` app type',
		documentation: {
			value:
`
\`definition_template\`: used to post a template for smart contract definition;
`
		}
	},
	{
		quoted: true,
		label: 'poll',
		insertText: 'poll',
		kind: vscode.CompletionItemKind.Enum,
		detail: '`poll` app type',
		documentation: {
			value:
`
\`poll\`: used to create a poll;
`
		}
	},
	{
		quoted: true,
		label: 'vote',
		insertText: 'vote',
		kind: vscode.CompletionItemKind.Enum,
		detail: '`vote` app type',
		documentation: {
			value:
`
\`vote\`: used to vote in a poll.  Every AA has voting rights after all.
`
		}
	},
	{
		quoted: true,
		label: 'state',
		insertText: 'state',
		kind: vscode.CompletionItemKind.Enum,
		detail: '`state` app type',
		documentation: {
			value:
`
Special app type, which is not possible in regular units but is used only in AAs to produce state changes. The state message must always be the last message in the \`messages\` array.
`
		}
	},
	{
		quoted: false,
		label: 'base',
		insertText: 'base',
		kind: vscode.CompletionItemKind.Enum,
		detail: '`base` asset',
		documentation: {
			value:
`
\`asset\` can be \`base\` for bytes, asset id for any other asset, or any expression that evaluates to an asset id or \`base\` string.
`
		}
	},
	{
		quoted: false,
		label: 'true',
		insertText: 'true',
		kind: vscode.CompletionItemKind.Keyword,
		detail: 'true',
		documentation: {
			value:
`
`
		}
	},
	{
		quoted: false,
		label: 'false',
		insertText: 'false',
		kind: vscode.CompletionItemKind.Keyword,
		detail: 'false',
		documentation: {
			value:
`
`
		}
	}
]
