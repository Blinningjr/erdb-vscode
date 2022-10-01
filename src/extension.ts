'use strict';

import * as child_process from 'child_process';
import * as vscode from 'vscode';
import { DebugAdapterTracker, DebugAdapterTrackerFactory,  } from 'vscode';
import { ChildProcessWithoutNullStreams, exec } from 'child_process';
import { disconnect } from 'process';
import { strict } from 'assert';

export function activate(context: vscode.ExtensionContext) {
    const trackerFactory = new ErdbDebugAdapterTrackerFactory();
    const descriptorFactory = new ErdbDebugAdapterDescriptorFactory();

    context.subscriptions.push(vscode.debug.registerDebugAdapterTrackerFactory('ERDB', trackerFactory));
    context.subscriptions.push(vscode.debug.registerDebugAdapterDescriptorFactory('ERDB', descriptorFactory));
	context.subscriptions.push(descriptorFactory);
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
   private erdbProcess?: child_process.ChildProcess; 
   private erdbChannel?: vscode.OutputChannel;
    
    async createDebugAdapterDescriptor(session: vscode.DebugSession, executable: vscode.DebugAdapterExecutable | undefined): Promise<vscode.ProviderResult<vscode.DebugAdapterDescriptor>> {
        console.log("Session: ", session);
        console.log("Configuration: ", session.configuration);
        console.log("executable: ", executable);

        if (!this.erdbProcess) {
            console.log("Starting new server on port %d", session.configuration.port);

            let erdbArgs = executable?.args;
            if (session?.configuration.port !== undefined) {
                erdbArgs?.push("--port", session?.configuration.port.toString());
            }

            console.log("erdbArgs: ", erdbArgs);

            let erdbRunning = false;

            // Start ERDB server
            this.erdbProcess = child_process.spawn(
                executable?.command === undefined ? "" : executable?.command,
                erdbArgs,
                executable?.options,
            );
            
            //Create output channel
            this.erdbChannel = vscode.window.createOutputChannel("ERDB");

            this.erdbProcess.on("close", (code) => {
                this.erdbChannel?.appendLine("ERDB process closed, code: " + code);
            });

            this.erdbProcess.on("disconnect", () => {
                this.erdbChannel?.appendLine("ERDB process disconnected");
            });

            this.erdbProcess.on('error', (err) => {
                this.erdbChannel?.appendLine("ERDB process error" + err);
            });

            this.erdbProcess.on('exit', (code) => {
                this.erdbChannel?.appendLine("ERDB process exit, code: " + code);
            });

            // Log ERDB server stdout
            this.erdbProcess.stdout?.on('data', (data: string) => {
                this.erdbChannel?.appendLine(data);

                // Check for server started message.
                if (data.includes("Starting debug")) {
                    erdbRunning = true;
                }
            });

            // Log ERDB server stderr
            this.erdbProcess.stderr?.on('data', (data) => {
                this.erdbChannel?.appendLine(data);
                
                // Check for server started message.
                if (data.includes("Starting debug")) {
                    erdbRunning = true;
                }
            });

            let counter = 5;
            while (!erdbRunning) {
                console.log("counter: ", counter);
                if (counter < 1) {
                    if (this.erdbProcess) {
                        console.log("kill:", this.erdbProcess?.kill(1));
                        this.erdbProcess = undefined;
                    }

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
        if (this.erdbProcess)  {
            console.log("kill:", this.erdbProcess?.kill(1));
            this.erdbProcess = undefined;
        }
    }
}
