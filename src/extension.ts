'use strict';

import * as vscode from 'vscode';
import { DebugAdapterTracker, DebugAdapterTrackerFactory,  } from 'vscode';
import { exec } from 'child_process';

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


    createDebugAdapterDescriptor(session: vscode.DebugSession, executable: vscode.DebugAdapterExecutable | undefined): vscode.ProviderResult<vscode.DebugAdapterDescriptor> {
        console.log("Session: ", session);
        console.log("Configuration: ", session.configuration);


        if (session.configuration.server_mode) {
            console.log("Using existing server on port %d", session.configuration.server_port);
            // make VS Code connect to debug server
            return new vscode.DebugAdapterServer(session.configuration.server_port);
        } else {
            console.log("Using executable: ", executable);
            return executable;
        }
    }

    dispose() {
        // stop server?
    }
}
