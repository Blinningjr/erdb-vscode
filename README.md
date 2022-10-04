# Embedded Rust Debugger (ERDB)

Extension for the debugger [Embedded Rust Debugger (ERDB)](https://github.com/Blinningjr/erdb).

ERDB is a rust debugger for embedded systems.
It currently only works on Linux, and is only tested on a `STM32F411RETx` dev board.

| :warning: WARNING          |
|:---------------------------|
| The ERDB server process is not stopped/killed when Vscode is closed. |

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

If you get the error `No such file or directory` then this path is not set correctly.

#### Examples

* `"program": "${workspaceRoot}/target/debug/<program name>"`
* `"program": "${workspaceRoot}/target/thumbv7em-none-eabi/debug/nucleo-rtic-blinking-led"`

### Chip

The MCU chip type that the debug target has.

#### Example

`"chip": "STM32F411RETx"`

## Known Issues

* The ERDB server process is not stopped when Vscode is closed.
* The launch command does not build the program, therefore always build before debugging.
* Only supports having one debug session.
* All step buttons perform the same type of step operation, that is stepping a single machine code instruction.

## Release Notes

### 0.1.2

Fixed bug in `attach` and `launch` configuration.

### 0.1.1

Added icon.

### 0.1.0

Initial release

## License

Licensed under either of

* Apache License, Version 2.0
   ([LICENSE-APACHE](LICENSE-APACHE) or [http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0))
* MIT license
   ([LICENSE-MIT](LICENSE-MIT) or [http://opensource.org/licenses/MIT](http://opensource.org/licenses/MIT))

at your option.

## Contribution

Unless you explicitly state otherwise, any contribution intentionally submitted
for inclusion in the work by you, as defined in the Apache-2.0 license, shall be
dual licensed as above, without any additional terms or conditions.
