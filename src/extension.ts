import * as vscode from 'vscode';

import { ProwjobItemDataProvider } from './prowjobs_treeview_dataprovider';    

export function activate(context: vscode.ExtensionContext) {

	const prowjobItemDataProvider = new ProwjobItemDataProvider();
	vscode.window.registerTreeDataProvider('prow-jobs', prowjobItemDataProvider);
	let disposable = vscode.commands.registerCommand('extension.prowjobnoti', () => prowjobItemDataProvider.refresh());

	let prowStatusBarItem: vscode.StatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
	prowStatusBarItem.text = 'Notification'
	prowStatusBarItem.show()

	context.subscriptions.push(disposable);
	context.subscriptions.push(prowStatusBarItem);
}

export function deactivate() {}
