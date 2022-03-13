'use strict';

import * as child_process from 'child_process';
import * as vscode from 'vscode';
import { DebugAdapterTracker, DebugAdapterTrackerFactory,  } from 'vscode';
import { ChildProcessWithoutNullStreams, exec } from 'child_process';
import { disconnect } from 'process';

export function activate(context: vscode.ExtensionContext) {
    const tracker_factory = new RdbRsDebugAdapterTrackerFactory();
    const descriptor_factory = new RdbRsDebugAdapterDescriptorFactory();

    context.subscriptions.push(vscode.debug.registerDebugAdapterTrackerFactory('rdb_rs', tracker_factory));
    context.subscriptions.push(vscode.debug.registerDebugAdapterDescriptorFactory('rdb_rs', descriptor_factory));
}

class RdbRsDebugAdapterTrackerFactory implements DebugAdapterTrackerFactory {
    createDebugAdapterTracker(session: vscode.DebugSession): vscode.ProviderResult<vscode.DebugAdapterTracker> {
        console.log("Creating new debug adapter tracker");

        const tracker = new RdbRsDebugAdapterTracker();

        return tracker;
    }
}

class RdbRsDebugAdapterTracker implements DebugAdapterTracker {
    onWillReceiveMessage(message: any) {
        console.log("Sending message to debug adapter:\n", message);
    }

    onDidSendMessage(message: any) {
        console.log("Received message from debug adapter:\n", message);
    }

    onError(error: Error) {
        console.log("Error in communication with debug adapter:\n", error);
    }

    onExit(code: number, signal: string) {
        if (code) {
            console.log("Debug Adapter exited with exit code", code);
        } else {
            console.log("Debug Adapter exited with signal", signal);
        }
    }
}



class RdbRsDebugAdapterDescriptorFactory implements vscode.DebugAdapterDescriptorFactory {
    async createDebugAdapterDescriptor(session: vscode.DebugSession, executable: vscode.DebugAdapterExecutable | undefined): Promise<vscode.ProviderResult<vscode.DebugAdapterDescriptor>> {
        console.log("Session: ", session);
        console.log("Configuration: ", session.configuration);
        console.log("executable: ", executable);

        if (!session.configuration.server_mode) {
            console.log("Starting new server on port %d", session.configuration.server_port);

            // Start ERDB server
            let erdb_process = child_process.spawn(
                executable?.command == undefined ? "" : executable?.command,
                executable?.args,
                executable?.options,
            );
            let erdb_process_running = false;

            // Kill ERDB process if there is some error.
            erdb_process.on('error', (exit) => {
                if (erdb_process_running) {
                    erdb_process_running = false;
                    erdb_process?.kill;
                }
            });

            erdb_process.on("close", (close) => {
                erdb_process_running = false;
                erdb_process?.kill;
            });

            // Kill ERDB process if parent process disconnects from ERDB porcess.
            erdb_process.on('disconnect', () => {
                erdb_process_running = false;
                erdb_process?.kill;
            });

            //Create output channel
            let erdbChannel = vscode.window.createOutputChannel("erdb");

            // Log that the ERDB process is stopped.
            erdb_process.on('exit', (exit) => {
                erdbChannel.appendLine("erdb server stopped");
            });

            // Log ERDB server stdout
            erdb_process.stdout.on('data', (data: string) => {
                erdbChannel.appendLine(data);

                // Check for server started message.
                if (data.includes("Starting debug")) {
                    erdb_process_running = true;
                }
            });

            // Log ERDB server stderr
            erdb_process.stderr.on('data', (data) => {
                erdbChannel.appendLine(data);

                // Check for server started message.
                // TODO: Fix so logs are sent to stdout.
                if (data.includes("Starting debug")) { 
                    erdb_process_running = true;
                }
            });


            let counter = 10;
            while (!erdb_process_running) {
                console.log("counter: ", counter);
                if (counter < 1) {
                    erdb_process?.kill;
                    erdb_process_running = false;

                    vscode.window.showErrorMessage("[ERROR] Timedout waiting for ERDB server");
                    return undefined;
                }
                await new Promise(f => setTimeout(f, 1000));
                
                counter--;
            }  

        } else {
            console.log("Using existing server on port %d", session.configuration.server_port);
        } 

        // make VS Code connect to debug server
        return new vscode.DebugAdapterServer(session.configuration.server_port);
    }

    dispose() {
    }
}
