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

    erdb_process?: ChildProcessWithoutNullStreams;
    erdb_process_exited: boolean = true;

    createDebugAdapterDescriptor(session: vscode.DebugSession, executable: vscode.DebugAdapterExecutable | undefined): vscode.ProviderResult<vscode.DebugAdapterDescriptor> {
        console.log("Session: ", session);
        console.log("Configuration: ", session.configuration);
        console.log("executable: ", executable);

        if (!session.configuration.server_mode && this.erdb_process == undefined && this.erdb_process_exited) {
            // Start ERDB server
            this.erdb_process = child_process.spawn(
                executable?.command == undefined ? "" : executable?.command,
                executable?.args,
                executable?.options,
            );
            this.erdb_process_exited = false;

            // Kill ERDB process if there is some error.
            this.erdb_process.on('error', (exit) => {
                if (!this.erdb_process_exited) {
                    this.erdb_process_exited = true;
                    this.erdb_process?.kill;
                }
            });

            this.erdb_process.on("close", (close) => {
                this.erdb_process_exited = true;
                this.erdb_process?.kill;
            });

            // Kill ERDB process if parent process disconnects from ERDB porcess.
            this.erdb_process.on('disconnect', () => {
                this.erdb_process_exited = true;
                this.erdb_process?.kill;
            });

            //Create output channel
            let erdbChannel = vscode.window.createOutputChannel("erdb");

            // Log that the ERDB process is stopped.
            this.erdb_process.on('exit', (exit) => {
                erdbChannel.appendLine("erdb server stopped");
            });

            // Log ERDB server stdout
            this.erdb_process.stdout.on('data', (data) => {
                erdbChannel.appendLine(data);
            });

            // Log ERDB server stderr
            this.erdb_process.stderr.on('data', (data) => {
                erdbChannel.appendLine(data);
            });

            (async () => { 
                // Do something before delay
                console.log('before delay')
        
                //await new Promise(f => setTimeout(f, 2000));
        
                // Do something after
                console.log('after delay')
            })();  
               

        } else {
            console.log("Using existing server on port %d", session.configuration.server_port);
            // make VS Code connect to debug server
            return new vscode.DebugAdapterServer(session.configuration.server_port);
        } 
        return new vscode.DebugAdapterServer(session.configuration.server_port);
    }

    dispose() {
        this.erdb_process_exited = true;
        this.erdb_process?.kill();
    }
}
