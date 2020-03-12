import * as vscode from 'vscode';

import {ProwJobs} from './prowjobs';

export function activate(context: vscode.ExtensionContext) {

    let prowJobsNotificatons = new ProwJobs(context);

	let disposable = vscode.commands.registerCommand('extension.prowjobnoti', () => prowJobsNotificatons.getLatestJobsStatus());

	context.subscriptions.push(disposable);
}

export function deactivate() {}
