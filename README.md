# Embedded Rust Debugger (ERDB)

Extension for the debugger [Embedded Rust Debugger (ERDB)](https://github.com/Blinningjr/erdb).

ERDB is a rust debugger for embedded systems.
It currently only works on Linux, and is only tested on a `STM32F411RETx` dev board. 

## Features

* Flash target.
* Continue, halt, step, and reset program.
* Set and clear hardware breakpoints.
* Show variables, registers, and stack trace.

## Requirements

Check that `ERDB` is installed by running `erdb` in a terminal, if not installed then install it with the following command.

```sh
cargo install erdb
```

The debug target must be connected to the host, and the binary must contain the debug information section.

## Extension Settings

It is required to fill in some information in the `launch.json` file.
The following subsections describe some of them.

### Program

The absolute path to the program binary, which can be used to flash the target, and contains the debug information.

#### Examples
* `"program": "${workspaceRoot}/target/debug/<program name>"`
* `"program": "${workspaceRoot}/target/thumbv7em-none-eabi/debug/nucleo-rtic-blinking-led"`

### Chip

The MCU chip type that the debug target has.

#### Example
`"chip": "STM32F411RETx"`

## Known Issues

* Only supports having one debug session.
* All step buttons perform the same type of step operation, that is stepping a single machine code instruction.

## Release Notes

### 0.1.0

Initial release

<!---
-----------------------------------------------------------------------------------------------------------
## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

**Note:** You can author your README using Visual Studio Code.  Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux)
* Toggle preview (`Shift+CMD+V` on macOS or `Shift+Ctrl+V` on Windows and Linux)
* Press `Ctrl+Space` (Windows, Linux) or `Cmd+Space` (macOS) to see a list of Markdown snippets

### For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
-->