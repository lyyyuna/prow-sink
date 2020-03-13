import * as vscode from 'vscode';

import { ProwJobs } from './prowjobs';
import { ProwjobItemDataProvider } from './prowjobs_treeview_dataprovider';    

export function activate(context: vscode.ExtensionContext) {

    let prowJobsNotificatons = new ProwJobs();

	// let disposable = vscode.commands.registerCommand('extension.prowjobnoti', () => prowJobsNotificatons.getLatestJobsStatus());

	const prowjobItemDataProvider = new ProwjobItemDataProvider();
	vscode.window.registerTreeDataProvider('presubmit-jobs', prowjobItemDataProvider);
	vscode.commands.registerCommand('extension.prowjobnoti', () => prowjobItemDataProvider.refresh());

	// context.subscriptions.push(disposable);
}

export function deactivate() {}
