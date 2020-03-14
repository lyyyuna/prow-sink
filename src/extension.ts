import * as vscode from 'vscode';

import { ProwjobItemDataProvider } from './prowjobs_treeview_dataprovider';    

export function activate(context: vscode.ExtensionContext) {

	//let disposable = vscode.commands.registerCommand('extension.prowjobnoti', () => prowJobsNotificatons.getLatestJobsStatus());

	const prowjobItemDataProvider = new ProwjobItemDataProvider();
	vscode.window.registerTreeDataProvider('prow-jobs', prowjobItemDataProvider);
	vscode.commands.registerCommand('extension.prowjobnoti', () => prowjobItemDataProvider.refresh());

	//context.subscriptions.push(disposable);
}

export function deactivate() {}
