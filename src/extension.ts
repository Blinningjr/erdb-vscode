'use strict';

import * as child_process from 'child_process';
import * as vscode from 'vscode';
import { DebugAdapterTracker, DebugAdapterTrackerFactory,  } from 'vscode';
import { ChildProcessWithoutNullStreams, exec } from 'child_process';
import { disconnect } from 'process';

export function activate(context: vscode.ExtensionContext) {
    const trackerFactory = new ErdbDebugAdapterTrackerFactory();
    const descriptorFactory = new ErdbDebugAdapterDescriptorFactory();

    context.subscriptions.push(vscode.debug.registerDebugAdapterTrackerFactory('ERDB', trackerFactory));
    context.subscriptions.push(vscode.debug.registerDebugAdapterDescriptorFactory('ERDB', descriptorFactory));
}

class ErdbDebugAdapterTrackerFactory implements DebugAdapterTrackerFactory {
    createDebugAdapterTracker(session: vscode.DebugSession): vscode.ProviderResult<vscode.DebugAdapterTracker> {
        console.log("Creating new debug adapter tracker");

        const tracker = new ErdbDebugAdapterTracker();

        return tracker;
    }
}

class ErdbDebugAdapterTracker implements DebugAdapterTracker {
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



class ErdbDebugAdapterDescriptorFactory implements vscode.DebugAdapterDescriptorFactory {
    async createDebugAdapterDescriptor(session: vscode.DebugSession, executable: vscode.DebugAdapterExecutable | undefined): Promise<vscode.ProviderResult<vscode.DebugAdapterDescriptor>> {
        console.log("Session: ", session);
        console.log("Configuration: ", session.configuration);
        console.log("executable: ", executable);

        if (!session.configuration.remote) {
            console.log("Starting new server on port %d", session.configuration.port);

            let erdbArgs = executable?.args;
            if (session?.configuration.port !== undefined) {
                erdbArgs?.push("--port", session?.configuration.port.toString());
            }

            console.log("erdbArgs: ", erdbArgs);
            
            // Start ERDB server
            let erdbProcess = child_process.spawn(
                executable?.command === undefined ? "" : executable?.command,
                erdbArgs,
                executable?.options,
            );
            let erdbProcessRunning = false;

            // Kill ERDB process if there is some error.
            erdbProcess.on('error', (exit) => {
                if (erdbProcessRunning) {
                    erdbProcessRunning = false;
                    erdbProcess?.kill;
                }
            });

            erdbProcess.on("close", (close) => {
                erdbProcessRunning = false;
                erdbProcess?.kill;
            });

            // Kill ERDB process if parent process disconnects from ERDB process.
            erdbProcess.on('disconnect', () => {
                erdbProcessRunning = false;
                erdbProcess?.kill;
            });

            //Create output channel
            let erdbChannel = vscode.window.createOutputChannel("ERDB");

            // Log that the ERDB process is stopped.
            erdbProcess.on('exit', (exit) => {
                erdbChannel.appendLine("ERDB server stopped");
            });

            // Log ERDB server stdout
            erdbProcess.stdout.on('data', (data: string) => {
                erdbChannel.appendLine(data);

                // Check for server started message.
                if (data.includes("Starting debug")) {
                    erdbProcessRunning = true;
                }
            });

            // Log ERDB server stderr
            erdbProcess.stderr.on('data', (data) => {
                erdbChannel.appendLine(data);

                // Check for server started message.
                // TODO: Fix so logs are sent to stdout.
                if (data.includes("Starting debug")) { 
                    erdbProcessRunning = true;
                }
            });


            let counter = 5;
            while (!erdbProcessRunning) {
                console.log("counter: ", counter);
                if (counter < 1) {
                    //erdbProcessRunning = true;
                    //break;
                    erdbProcess?.kill;
                    erdbProcessRunning = false;

                    vscode.window.showErrorMessage("[ERROR] Timed out waiting for ERDB server");
                    return undefined;
                }
                await new Promise(f => setTimeout(f, 1000));
                
                counter--;
            } 
            console.log("Connected to ERDB");

        } else {
            console.log("Using existing server on port %d", session.configuration.port);
        } 

        // make VS Code connect to debug server
        return new vscode.DebugAdapterServer(session.configuration.port);
    }

    dispose() {
    }
}
