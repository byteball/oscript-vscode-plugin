const vscode = require('vscode')

module.exports = [
	{
		quoted: true,
		label: 'autonomous agent',
		insertText: 'autonomous agent',
		kind: vscode.CompletionItemKind.Keyword,
		detail: `Autonomous agents definition`,
		documentation: {
			value:
`
Autonomous agent definition

Addresses of autonomous agents follow the same general rules as all other Obyte addresses: their definitions are two-element arrays and the address is a checksummed hash of the array encoded in base32.

AA address is defined as:

	["autonomous agent", {
		// here goes the AA code
	}]

The second element of the above array is an object that defines a template for future units created by the AA.  The template's structure follows the structure of a regular unit in general, with some elements dynamic and dependent upon the input and state parameters.  The dynamic elements are designated with special markup and include code in a domain specific language called Oscript:

	{address: "{trigger.address}", amount: "{trigger.output[[asset=base]] - 1000}"}
`
		}
	},
	{
		quoted: false,
		label: 'bounce_fees',
		insertText: 'bounce_fees: ',
		kind: vscode.CompletionItemKind.Field,
		detail: '`bounce_fees` field',
		documentation: {
			value:
`
This is an optional field of the unit template that specifies the fees charged from sender if the AA execution fails.  In this case, all the received money in all assets is automatically bounced back to sender, less the bounce fees.  The fees are keyed by asset ID ('base' for bytes).

The minimum and default bounce fee for bytes is 10000 bytes.  The minimum and default bounce fee for all other assets is 0.  Non-base bounce fees apply only to those assets that were actually received by the autonomous agent.

Sending to an autonomous agent anything less than the bounce fees will result in no response and the AA silently eating the coins.  However this rule applies only to money sent from regular addresses.  Bounce fees are not checked when the money is received from another AA.

'bounce_fees' field is removed from the final unit.

	{
		bounce_fees: { base: 10000, "n9y3VomFeWFeZZ2PcSEcmyBb/bI7kzZduBJigNetnkY=": 100 },
		...
	}
`
		}
	},
	{
		quoted: false,
		label: 'messages',
		insertText: 'messages: ',
		kind: vscode.CompletionItemKind.Field,
		detail: '`messages` field',
		documentation: {
			value:
`
This is the main field of autonomous agent definition.  It specifies templates for the messages to be generated, and the templates are parameterized with oscript code.

The messages can be of any type (called \`app\`) that Obyte supports.  The most common app is \`payment\`, it is used to send payments in any asset back to sender or to a third party.  Other apps are:
* \`asset\`: used to define a new asset;
* \`data\`: used to send data, this includes sending data parameters to other (secondary) AAs;
* \`data_feed\`: used to send data feeds.  By doing this, the AA becomes an oracle;
* \`profile\`: used to send one's own profile.  Maybe an AA wants to say something to the world about itself;
* \`text\`: used to save arbitrary text to the DAG;
* \`definition\`: used to post a definition of a new AA;
* \`asset_attestors\`: used to change the attestor list of an asset previously defined by this AA;
* \`attestation\`: used to post information about some other address.  By doing this, the AA becomes an attestor;
* \`definition_template\`: used to post a template for smart contract definition;
* \`poll\`: used to create a poll;
* \`vote\`: used to vote in a poll.  Every AA has voting rights after all.

There is also another, special, app called \`state\`, which is not possible in regular units but is used only in AAs to produce state changes.  More about it in a [separate chapter]().
`
		}
	},
	{
		quoted: false,
		label: 'app',
		insertText: 'app: ',
		kind: vscode.CompletionItemKind.Field,
		documentation: {
			value:
`
In Obyte, any transaction can contain one or more _messages_ of different types. These types are called _apps_.  The most common app is \`payment\`.  At least one payment is mandatory in every transaction, it is necessary to at least pay fees.  Another app is \`data\`.
`
		},
		detail: '`app` field'
	},
	{
		quoted: false,
		label: 'payload',
		insertText: 'payload: ',
		kind: vscode.CompletionItemKind.Field,
		detail: '`payload` field',
		documentation: {
			value:
`
The object in \`payload\` is the data this message delivers.
`
		}
	},
	{
		quoted: false,
		label: 'asset',
		insertText: 'asset: ',
		kind: vscode.CompletionItemKind.Field,
		detail: '`asset` field',
		documentation: {
			value:
`
Asset of the response transaction
`
		}
	},
	{
		quoted: false,
		label: 'outputs',
		insertText: 'outputs: ',
		kind: vscode.CompletionItemKind.Field,
		detail: '`outputs` field',
		documentation: {
			value:
`
Outputs of the response transaction
`
		}
	},
	{
		quoted: false,
		label: 'address',
		insertText: 'address: ',
		kind: vscode.CompletionItemKind.Field,
		detail: '`address` field',
		documentation: {
			value:
`
Output address
`
		}
	},
	{
		quoted: false,
		label: 'amount',
		insertText: 'amount: ',
		kind: vscode.CompletionItemKind.Field,
		detail: '`amount` field',
		documentation: {
			value:
`
Output amount
`
		}
	},
	{
		quoted: false,
		label: 'cases',
		insertText: 'cases: ',
		kind: vscode.CompletionItemKind.Field,
		detail: '`cases` field',
		documentation: {
			value:
`
The regular value of an object/array is replaced with an object whose single element is an array \`cases\`.  Each element of the \`cases\` array is an object with up to 3 elements:
* \`if\`: an Oscript expression.  If the result of its evaluation is truthy then this \`case\` is selected.  All other \`case\`s are not evaluated.  \`if\` is required for all \`case\`s except the last, the last one may or may not have an \`if\`.  If all previous \`case\`s evaluated to a falsy value and the last one is without an \`if\`, the last one is selected;
* \`init\`: an optional statements-only Oscript that is evaluated immediately after \`if\` if this \`case\` is selected;
* a mandatory element that is named the same as the original field (\`messages\` in the above example).  If this \`case\` is selected, the original (3 levels higher) field is replaced with the value of this element.
Cases can be nested.

Cases can be used for any non-scalar value inside \`messages\`, not just \`messages\` themselves.
`
		}
	},
	{
		quoted: false,
		label: 'if',
		insertText: 'if: ',
		kind: vscode.CompletionItemKind.Field,
		detail: '`if` field',
		documentation: {
			value:
`
Any object can have an additional \`if\` field.  It is evaluated first, and if it is falsy, the entire object is removed from the enclosing object or array.  Its internal Oscripts are not evaluated in this case.
The \`if\` field itself is removed from the object.
`
		}
	},
	{
		quoted: false,
		label: 'init',
		insertText: 'init: ',
		kind: vscode.CompletionItemKind.Field,
		detail: '`init` field',
		documentation: {
			value:
`
Any object can have an additional \`init\` field.  It is evaluated immediately after \`if\` if \`if\` is present and truthy.  If there is no \`if\`, \`init\` is unconditionally evaluated first.

	{
		messages: [
			{
				init: "{ $addr = trigger.address; }",
				app: "data",
				payload: {
					timestamp: "{timestamp}",
					subscriber: "{$addr}"
				}
			},
			{
				if: "{trigger.data.withdrawal_amount > 1000}",
				init: "{ $amount = trigger.data.withdrawal_amount - 1000; }",
				app: "payment",
				payload: {
					asset: "base",
					outputs: [
						{address: "{trigger.address}", amount: "{$amount}"}
					]
				}
			}
		]
	}

\`init\` must be a statements-only Oscript, it does not return a value.
The \`init\` field itself is removed from the object.
`
		}
	},
	{
		quoted: false,
		label: 'state',
		insertText: 'state: ',
		kind: vscode.CompletionItemKind.Field,
		detail: '`state` field',
		documentation: {
			value:
`
A state message is a special message in the \`messages\` array that performs state changes.  It is the only oscript where state variables are assigned.  Unlike regular messages that always have \`payload\`, state message has a field named \`state\` instead that contains a state changing script:

	{
		messages: [
			{
				app: "payment",
				payload: {
					asset: "base",
					outputs: [
						{address: "{trigger.address}", amount: "{trigger.output[[asset=base]] - 1000}"}
					]
				}
			},
			{
				app: "state",
				state: \`{
					var['responded'] = 1;
					var['total_balance_sent_back'] += trigger.output[[asset=base]] - 1000;
					var[trigger.address || '_response_unit'] = response_unit;
				}\`
			}
		]
	}

The state message must always be the last message in the \`messages\` array.  It is not included in the final response unit and its script (state script) is evaluated **after** the response unit is already prepared.  It is the only oscript where \`response_unit\` variable is available. State script contains only statements, it is not allowed to return any value.
`
		}
	},
	{
		quoted: false,
		label: 'base',
		insertText: 'base: ',
		kind: vscode.CompletionItemKind.Field,
		detail: '`base` field',
		documentation: {
			value:
`
\`asset\` can be \`base\` for bytes, asset id for any other asset, or any expression that evaluates to an asset id or \`base\` string.
`
		}
	},
	{
		quoted: false,
		label: 'cap',
		insertText: 'cap: ',
		kind: vscode.CompletionItemKind.Field,
		detail: '`cap` field',
		documentation: {
			value:
`
\`cap\`: number, total supply of the asset.  For uncapped assets, 0 is returned;
`
		}
	},
	{
		quoted: false,
		label: 'is_private',
		insertText: 'is_private: ',
		kind: vscode.CompletionItemKind.Field,
		detail: '`is_private` field',
		documentation: {
			value:
`
\`is_private\`: boolean, is the asset private?
`
		}
	},
	{
		quoted: false,
		label: 'is_transferrable',
		insertText: 'is_transferrable: ',
		kind: vscode.CompletionItemKind.Field,
		detail: '`is_transferrable` field',
		documentation: {
			value:
`
\`is_transferrable\`: boolean, is the asset transferrable?
`
		}
	},
	{
		quoted: false,
		label: 'auto_destroy',
		insertText: 'auto_destroy: ',
		kind: vscode.CompletionItemKind.Field,
		detail: '`auto_destroy` field',
		documentation: {
			value:
`
\`auto_destroy\`: boolean, does the asset gets autodestroyed when sent to definer address?
`
		}
	},
	{
		quoted: false,
		label: 'fixed_denominations',
		insertText: 'fixed_denominations: ',
		kind: vscode.CompletionItemKind.Field,
		detail: '`fixed_denominations` field',
		documentation: {
			value:
`
\`fixed_denominations\`: boolean, is the asset issued in fixed denominations? Currently AAs can't send fixed denomination assets, but if \`issued_by_definer_only\` is \`false\` then somebody else can issue them.
`
		}
	},
	{
		quoted: false,
		label: 'denominations',
		insertText: 'denominations: ',
		kind: vscode.CompletionItemKind.Field,
		detail: '`denominations` field',
		documentation: {
			value:
`
Currently AAs can't send fixed denomination assets, but if \`issued_by_definer_only\` is \`false\` then somebody else can issue them.

\`denominations\`: array of objects like this \`{denomination: 5, count_coins: 1e10}\` if \`fixed_denominations\` is \`true\`.
`
		}
	},
	{
		quoted: false,
		label: 'issued_by_definer_only',
		insertText: 'issued_by_definer_only: ',
		kind: vscode.CompletionItemKind.Field,
		detail: '`issued_by_definer_only` field',
		documentation: {
			value:
`
\`issued_by_definer_only\`: boolean, is the asset issued by definer only?
`
		}
	},
	{
		quoted: false,
		label: 'cosigned_by_definer',
		insertText: 'cosigned_by_definer: ',
		kind: vscode.CompletionItemKind.Field,
		detail: '`cosigned_by_definer` field',
		documentation: {
			value:
`
\`cosigned_by_definer\`: boolean, should each transfer be cosigned by definer?
`
		}
	},
	{
		quoted: false,
		label: 'spender_attested',
		insertText: 'spender_attested: ',
		kind: vscode.CompletionItemKind.Field,
		detail: '`spender_attested` field',
		documentation: {
			value:
`
\`spender_attested\`: boolean, should each holder be attested?
`
		}
	},
	{
		quoted: false,
		label: 'attestors',
		insertText: 'attestors: ',
		kind: vscode.CompletionItemKind.Field,
		detail: '`attestors` field',
		documentation: {
			value:
`
\`attestors\`: array of strings, if \`spender_attested\` \`true\`, the definition must also include the array of approved attestor addresses.
`
		}
	},
	{
		quoted: false,
		label: 'issue_condition',
		insertText: 'issue_condition: ',
		kind: vscode.CompletionItemKind.Field,
		detail: '`issue_condition` field',
		documentation: {
			value:
`
\`issue_condition\`: array of two-element arrays, optional and can specify the restrictions when the asset can be issued.
`
		}
	},
	{
		quoted: false,
		label: 'transfer_condition',
		insertText: 'transfer_condition: ',
		kind: vscode.CompletionItemKind.Field,
		detail: '`transfer_condition` field',
		documentation: {
			value:
`
\`transfer_condition\`: array of two-element arrays, optional and can specify the restrictions when the asset can be transferred.
`
		}
	},
	{
		quoted: false,
		label: 'base_aa',
		insertText: 'base_aa: ',
		kind: vscode.CompletionItemKind.Field,
		detail: '`address of base parameterized Autonomous Agent',
		documentation: {
			value:
`
address of base parameterized Autonomous Agent
`
		}
	},
	{
		quoted: false,
		label: 'params',
		insertText: 'params: ',
		kind: vscode.CompletionItemKind.Field,
		detail: '`parameters passed to base parameterized Autonomous Agent'
	},
	{
		quoted: false,
		label: 'getters',
		insertText: 'getters: ',
		kind: vscode.CompletionItemKind.Field,
		detail: 'Getters are read-only functions available to other AAs',
		documentation: {
			value:
`
Getters are meant to extract information about an AA state that is not directly available through state vars.

Getters are declared in a top-level getters section which is evaluated before everything else.

	['autonomous agent', {
		getters: \`{
			$sq = $x => $x^2;
			$g = ($x, $y) => $x + 2*$y;
			$h = ($x, $y) => $x||$y;
			$r = ($acc, $x) => $x + $acc;
		}\`,
		init: \`{
			// uncomment if the AA serves as library only
			// bounce("library only");
			...
		}\`,
		...
	}]
	
The code in getters section can contain only function declarations and constants. Request-specific information such as trigger.data, trigger.outputs, etc is not available in getters.

In the AA which declares them, getters can be accessed like normal functions.

Other AAs can call them by specifying the remote AA address before the function name using this syntax:

	\`{
		$nine = MXMEKGN37H5QO2AWHT7XRG6LHJVVTAWU.$sq(3);
	}\`

or

	\`{
		$remote_aa = "MXMEKGN37H5QO2AWHT7XRG6LHJVVTAWU";
		$nine = $remote_aa.$sq(3);
	}\`
`
		}
	}
]
