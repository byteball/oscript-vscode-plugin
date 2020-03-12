# Oscript extension for Visual Studio Code

Write and validate Ojson Autonomous Agent definitions for Obyte network

## Features
* Syntax highlighting
* Code completion
* Error highlighting
* Agent deployment directly from the extension

## Agent deployment
This extension provides `Deploy Autonomous Agent` command which is available in command picker.
Execute it after AA validation and you will get the link you can use to deploy the agent with your phone or another device.
Another way to do this is to click on the validation message in the status bar.

Also, you can deploy an agent in the testnet Obyte network.
For this, change extension configuration in the vscode settings:

```
Testnet: true
Oscript Editor Backend: 'https://testnet.oscript.org/api/v1'
Oscript Editor Frontend: 'https://testnet.oscript.org'
Hub: 'wss://obyte.org/bb-test'
```

## Tutorial
See the [Autonomous Agents documentation](https://developer.obyte.org/autonomous-agents) for details.
