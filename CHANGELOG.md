# Change Log

## v0.3.9 (2021-09-09)
1. Oscript syntax updates: `require()`, `log()`, `previous_aa_responses`, `trigger.outputs`, `trigger.initial_unit`, and calling getters from remote AAs identified by a variable.

## v0.3.8 (2020-11-05)
1. fixed uninitialized local var error highlight position

## v0.3.7 (2020-10-06)
1. `aa-testkit` upgraded to `v.0.3.12`
2. Added warning check for concat operator in `if`  in formula

## v0.3.6 (2020-08-25)
1. `aa-testkit` upgraded to `v.0.3.9`
2. `is_valid_sig` built-in oscript docs
3. `vrf_verify` built-in oscript docs
4. Fix code suggestion docs formatting

## v0.3.5 (2020-07-30)
1. `aa-testkit` upgraded to `v.0.3.8`

## v0.3.4 (2020-07-15)

### Fixes
1. Fix formula error highlights the whole file
2. Wrong caret `^` position on parsing error in the error description

## v0.3.3 (2020-07-14)
1. Upgrade `aa-testkit` to v0.3.5
2. Test cleanup procedure

## v0.3.2 (2020-07-04)
1. Upgrade `ocore` to v0.3.12
2. Upgrade `aa-testkit` to v0.3.3
3. mocha bootload updated

### Fixes
1. Fixed example agent

## v0.3.1 (2020-06-25)
1. Upgrade `ocore` to v0.3.11
2. Oscript 2.0 autocomplete and documentation

## v0.3.0
1. Upgrade `ocore` to v0.3.10 (and to oscript 2.0)
2. Add Oscript 2.0 syntax highlighting

## v0.2.9
1. Display AA address in status bar and before deployment
2. Added `definition[]` autocomplete to oscript
3. aa-testkit updated to 0.2.3

## v0.2.8

### Fixes
1. Fix duplication check error when deploying on mainnet after deploying same agent on testnet

## v0.2.7

### Fixes
1. Fixed `validUnit` mocha check
2. Added autocomplete for `params` and `unit` in formula
3. aa-testkit updated

## v0.2.6

### Fixes
1. Fixed AA test example

## v0.2.5

### Features
1. Integration with AA testing framework

## v0.2.4

### Fixes
1. Fix escaped quotes in formula
2. .ojson is valid extension for AA
3. languageId for Oscript is oscript instead of ojson

## v0.2.3

### Fixes
1. Fix duplicate check showing agent is not deployed although it is

## v0.2.2

### Features
1. Pick network for agent deployment dialog

## v0.2.1

### Features
1. Open deployment page in Oscript Editor
2. Agent duplication check command

## v0.2.0

### Features
1. AA complexity in status bar
2. AA deployment
3. Duplication check on AA deployment
4. Added extension settings for hub and testnet

## v0.1.0

### Features
1. Syntax highlight
2. Code autocompletion
3. On hover documentation
4. Agent and formula validation
